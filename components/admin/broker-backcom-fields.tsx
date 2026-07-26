"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BACKCOM_PERCENT_PRESETS } from "@/lib/brokers/offer-policy"

export type BrokerBackcomFormFields = {
  backcomMode: "none" | "percent_preset" | "percent_custom" | "fixed"
  backcomPreset: string
  backcomValue: string
}

export const EMPTY_BACKCOM_FORM: BrokerBackcomFormFields = {
  backcomMode: "none",
  backcomPreset: "50%",
  backcomValue: "",
}

export function backcomFormToPolicy(fields: BrokerBackcomFormFields): {
  backcomType: string | null
  backcomValue: string | null
} {
  switch (fields.backcomMode) {
    case "percent_preset":
      return { backcomType: fields.backcomPreset, backcomValue: null }
    case "percent_custom": {
      const raw = fields.backcomValue.trim()
      const value = raw.endsWith("%") ? raw : raw ? `${raw}%` : ""
      return value ? { backcomType: "custom", backcomValue: value } : { backcomType: "none", backcomValue: null }
    }
    case "fixed": {
      const value = fields.backcomValue.trim()
      return value ? { backcomType: "fixed", backcomValue: value } : { backcomType: "none", backcomValue: null }
    }
    default:
      return { backcomType: "none", backcomValue: null }
  }
}

export function policyToBackcomForm(
  backcomType: string | null | undefined,
  backcomValue: string | null | undefined,
): BrokerBackcomFormFields {
  if (!backcomType || backcomType === "none") return EMPTY_BACKCOM_FORM

  if (backcomType === "fixed") {
    return {
      backcomMode: "fixed",
      backcomPreset: "50%",
      backcomValue: backcomValue?.trim() ?? "",
    }
  }

  if (backcomType === "custom") {
    return {
      backcomMode: "percent_custom",
      backcomPreset: "50%",
      backcomValue: backcomValue?.trim() ?? "",
    }
  }

  if (BACKCOM_PERCENT_PRESETS.includes(backcomType as (typeof BACKCOM_PERCENT_PRESETS)[number])) {
    return {
      backcomMode: "percent_preset",
      backcomPreset: backcomType,
      backcomValue: "",
    }
  }

  return {
    backcomMode: "percent_custom",
    backcomPreset: "50%",
    backcomValue: backcomType,
  }
}

type Props = {
  value: BrokerBackcomFormFields
  onChange: (next: BrokerBackcomFormFields) => void
}

export function BrokerBackcomFields({ value, onChange }: Props) {
  function set<K extends keyof BrokerBackcomFormFields>(key: K, next: BrokerBackcomFormFields[K]) {
    onChange({ ...value, [key]: next })
  }

  return (
    <div className="space-y-4 rounded-lg border border-border/60 bg-muted/20 p-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Backcom (Global)</h3>
        <p className="text-xs text-muted-foreground">
          Hiển thị dưới logo trên trang broker quốc tế — theo % hoặc số tiền cố định.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="backcomMode">Loại backcom</Label>
        <select
          id="backcomMode"
          className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
          value={value.backcomMode}
          onChange={(e) =>
            set("backcomMode", e.target.value as BrokerBackcomFormFields["backcomMode"])
          }
        >
          <option value="none">Không có</option>
          <option value="percent_preset">Theo % (preset)</option>
          <option value="percent_custom">Theo % (tùy chỉnh)</option>
          <option value="fixed">Theo số tiền</option>
        </select>
      </div>

      {value.backcomMode === "percent_preset" ? (
        <div className="space-y-2">
          <Label htmlFor="backcomPreset">Mức %</Label>
          <select
            id="backcomPreset"
            className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
            value={value.backcomPreset}
            onChange={(e) => set("backcomPreset", e.target.value)}
          >
            {BACKCOM_PERCENT_PRESETS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {value.backcomMode === "percent_custom" ? (
        <div className="space-y-2">
          <Label htmlFor="backcomValuePercent">% tùy chỉnh</Label>
          <Input
            id="backcomValuePercent"
            placeholder="e.g. 65 hoặc 65%"
            value={value.backcomValue}
            onChange={(e) => set("backcomValue", e.target.value)}
          />
        </div>
      ) : null}

      {value.backcomMode === "fixed" ? (
        <div className="space-y-2">
          <Label htmlFor="backcomValueFixed">Số tiền / điều kiện</Label>
          <Input
            id="backcomValueFixed"
            placeholder="e.g. $5/lot, 500.000 VND/tháng"
            value={value.backcomValue}
            onChange={(e) => set("backcomValue", e.target.value)}
          />
        </div>
      ) : null}
    </div>
  )
}
