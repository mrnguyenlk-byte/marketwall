#!/usr/bin/env python3
"""HTTP transport for the Windows Server 2012 R2 morning runner.

Python requests is used instead of the legacy .NET HttpClient TLS stack. Secrets
are read from the VPS-local config and are never passed on the command line.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Dict
from urllib.parse import urlsplit, urlunsplit

import requests


def read_config(path: Path) -> Dict[str, str]:
    values: Dict[str, str] = {}
    for raw in path.read_text(encoding="utf-8-sig").splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        name, separator, value = line.partition("=")
        if not separator:
            raise RuntimeError(f"Invalid config line: {raw}")
        values[name.strip()] = value.strip().strip('"')
    return values


def required(config: Dict[str, str], name: str) -> str:
    value = config.get(name, "").strip()
    if not value:
        raise RuntimeError(f"Missing required config value: {name}")
    return value


def relay_host(endpoint: str) -> str:
    """Keep the VPS ingress independent from the public btrading.org website."""
    parsed = urlsplit(endpoint)
    if parsed.netloc.lower() not in {"btrading.org", "www.btrading.org"}:
        return endpoint
    return urlunsplit(("https", "marketwall.vercel.app", parsed.path, parsed.query, parsed.fragment))


def chart_upload_endpoint(config: Dict[str, str]) -> str:
    explicit = config.get("DAILY_CHART_UPLOAD_ENDPOINT", "").strip()
    if explicit:
        return relay_host(explicit)
    legacy = required(config, "DAILY_ANALYSIS_ENDPOINT")
    if legacy.endswith("/run"):
        return relay_host(f"{legacy[:-4]}/charts")
    raise RuntimeError("Set DAILY_CHART_UPLOAD_ENDPOINT to the chart ingress URL")


def publish(args: argparse.Namespace, config: Dict[str, str]) -> None:
    endpoint = chart_upload_endpoint(config)
    secret = required(config, "DAILY_AUTOMATION_SECRET")
    vnindex_path = Path(required(config, "VNINDEX_IMAGE_PATH"))
    gold_path = Path(required(config, "GOLD_IMAGE_PATH"))

    with vnindex_path.open("rb") as vnindex, gold_path.open("rb") as gold:
        response = requests.post(
            endpoint,
            data={
                "secret": secret,
                "date": args.date,
                "vnindexSessionDate": args.vnindex_session,
                "goldSessionDate": args.gold_session,
            },
            files={
                "vnindexImage": (vnindex_path.name, vnindex, "image/png"),
                "goldImage": (gold_path.name, gold, "image/png"),
            },
            timeout=(15, 300),
        )
    response.raise_for_status()
    payload = response.json()
    if not payload.get("success") or payload.get("status") != "charts_uploaded":
        raise RuntimeError(f"Chart ingress did not confirm upload: {payload}")
    print(json.dumps(payload, ensure_ascii=False))


def report_status(args: argparse.Namespace, config: Dict[str, str]) -> None:
    endpoint = config.get("DAILY_ANALYSIS_STATUS_ENDPOINT", "").strip()
    if not endpoint:
        endpoint = required(config, "DAILY_ANALYSIS_ENDPOINT")
        if endpoint.endswith("/run"):
            endpoint = endpoint[:-4]
        endpoint += "/status"
    endpoint = relay_host(endpoint)
    secret = required(config, "DAILY_AUTOMATION_SECRET")
    payload = json.loads(Path(args.health).read_text(encoding="utf-8-sig"))
    response = requests.post(
        endpoint,
        headers={"x-btrading-secret": secret},
        json=payload,
        timeout=(15, 45),
    )
    response.raise_for_status()
    print(json.dumps(response.json(), ensure_ascii=False))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("mode", choices=("publish", "status"))
    parser.add_argument("--config", required=True)
    parser.add_argument("--health")
    parser.add_argument("--date")
    parser.add_argument("--vnindex-session")
    parser.add_argument("--gold-session")
    args = parser.parse_args()
    config = read_config(Path(args.config))

    if args.mode == "publish":
        if not all((args.date, args.vnindex_session, args.gold_session)):
            raise RuntimeError("Publish date and both session dates are required")
        publish(args, config)
    else:
        if not args.health:
            raise RuntimeError("Status health path is required")
        report_status(args, config)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"HTTP_HELPER_FAILED {type(error).__name__}: {error}", file=sys.stderr)
        raise SystemExit(1)
