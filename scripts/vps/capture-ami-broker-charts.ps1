[CmdletBinding()]
param(
  [string]$ConfigPath = (Join-Path $PSScriptRoot "..\..\.vps-daily-analysis.env")
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing
Add-Type @"
using System;
using System.Runtime.InteropServices;
public static class BTradingWindowCapture {
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int Left, Top, Right, Bottom; }
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT rect);
}
"@

function Read-Config([string]$Path) {
  if (-not (Test-Path -LiteralPath $Path)) { throw "Missing VPS config: $Path" }
  $values = @{}
  foreach ($line in Get-Content -LiteralPath $Path) {
    $trimmed = $line.Trim()
    if (-not $trimmed -or $trimmed.StartsWith("#")) { continue }
    $parts = $trimmed.Split("=", 2)
    if ($parts.Count -ne 2) { throw "Invalid config line: $line" }
    $values[$parts[0].Trim()] = $parts[1].Trim().Trim('"')
  }
  return $values
}

function Require-Config($Config, [string]$Name) {
  if (-not $Config.ContainsKey($Name) -or -not $Config[$Name]) { throw "Missing required config value: $Name" }
  return $Config[$Name]
}

function Save-WindowPng([string]$TitleFragment, [string]$Destination) {
  $windows = @(Get-Process | Where-Object { $_.MainWindowHandle -ne 0 -and $_.MainWindowTitle -like "*$TitleFragment*" })
  if ($windows.Count -ne 1) {
    throw "Expected exactly one visible AmiBroker window matching '$TitleFragment'; found $($windows.Count)."
  }
  $rect = New-Object BTradingWindowCapture+RECT
  if (-not [BTradingWindowCapture]::GetWindowRect($windows[0].MainWindowHandle, [ref]$rect)) {
    throw "Could not read window bounds for '$TitleFragment'."
  }
  $width = $rect.Right - $rect.Left
  $height = $rect.Bottom - $rect.Top
  if ($width -lt 200 -or $height -lt 200) { throw "Window '$TitleFragment' is too small to capture." }

  $directory = Split-Path -Parent $Destination
  New-Item -ItemType Directory -Path $directory -Force | Out-Null
  $bitmap = New-Object System.Drawing.Bitmap($width, $height)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  try {
    $graphics.CopyFromScreen($rect.Left, $rect.Top, 0, 0, $bitmap.Size)
    $bitmap.Save($Destination, [System.Drawing.Imaging.ImageFormat]::Png)
  } finally {
    $graphics.Dispose()
    $bitmap.Dispose()
  }
}

$config = Read-Config $ConfigPath
$vnTitle = Require-Config $config "VNINDEX_WINDOW_TITLE"
$goldTitle = Require-Config $config "GOLD_WINDOW_TITLE"
$vnPath = Require-Config $config "VNINDEX_IMAGE_PATH"
$goldPath = Require-Config $config "GOLD_IMAGE_PATH"

Save-WindowPng $vnTitle $vnPath
Save-WindowPng $goldTitle $goldPath
Write-Host "Captured AmiBroker charts to $vnPath and $goldPath"
