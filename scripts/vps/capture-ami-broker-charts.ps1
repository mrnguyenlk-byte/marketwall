[CmdletBinding()]
param(
  [string]$ConfigPath = (Join-Path $PSScriptRoot "..\..\.vps-daily-analysis.env")
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing
Add-Type @"
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;

public static class BTradingWindowCapture {
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int Left, Top, Right, Bottom; }
  public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

  [DllImport("user32.dll")] public static extern bool EnumChildWindows(IntPtr hWndParent, EnumWindowsProc callback, IntPtr lParam);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern int GetWindowTextLength(IntPtr hWnd);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int maxCount);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT rect);

  public static List<IntPtr> GetChildWindows(IntPtr parent) {
    var result = new List<IntPtr>();
    EnumChildWindows(parent, (hWnd, lParam) => { result.Add(hWnd); return true; }, IntPtr.Zero);
    return result;
  }

  public static string WindowText(IntPtr hWnd) {
    int length = GetWindowTextLength(hWnd);
    if (length == 0) return String.Empty;
    var text = new StringBuilder(length + 1);
    GetWindowText(hWnd, text, text.Capacity);
    return text.ToString();
  }
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

function Get-AmiBrokerChildWindows([string]$ProcessName) {
  $processes = @(Get-Process -Name $ProcessName -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 })
  if ($processes.Count -ne 1) {
    throw "Expected exactly one AmiBroker process '$ProcessName' with a main window; found $($processes.Count)."
  }

  return @([BTradingWindowCapture]::GetChildWindows($processes[0].MainWindowHandle) |
    Where-Object { [BTradingWindowCapture]::IsWindowVisible($_) })
}

function Find-ExactChildWindow($ChildWindows, [string]$ExpectedTitle) {
  $matches = @($ChildWindows | Where-Object { [BTradingWindowCapture]::WindowText($_) -ceq $ExpectedTitle })
  if ($matches.Count -ne 1) {
    throw "Expected exactly one visible AmiBroker child window titled '$ExpectedTitle'; found $($matches.Count)."
  }
  return $matches[0]
}

function Save-ChildWindowPng($WindowHandle, [string]$ExpectedTitle, [string]$Destination) {
  $rect = New-Object BTradingWindowCapture+RECT
  if (-not [BTradingWindowCapture]::GetWindowRect($WindowHandle, [ref]$rect)) {
    throw "Could not read bounds for AmiBroker child window '$ExpectedTitle'."
  }
  $width = $rect.Right - $rect.Left
  $height = $rect.Bottom - $rect.Top
  if ($width -lt 200 -or $height -lt 200) { throw "AmiBroker child window '$ExpectedTitle' is too small to capture." }

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
$processName = if ($config["AMIBROKER_PROCESS_NAME"]) { $config["AMIBROKER_PROCESS_NAME"] } else { "Broker" }
$vnTitle = Require-Config $config "VNINDEX_WINDOW_TITLE"
$goldTitle = Require-Config $config "GOLD_WINDOW_TITLE"
$vnPath = Require-Config $config "VNINDEX_IMAGE_PATH"
$goldPath = Require-Config $config "GOLD_IMAGE_PATH"

if ($vnTitle -ceq $goldTitle) { throw "VNINDEX_WINDOW_TITLE and GOLD_WINDOW_TITLE must be different exact titles." }
$children = Get-AmiBrokerChildWindows $processName
$vnWindow = Find-ExactChildWindow $children $vnTitle
$goldWindow = Find-ExactChildWindow $children $goldTitle

Save-ChildWindowPng $vnWindow $vnTitle $vnPath
Save-ChildWindowPng $goldWindow $goldTitle $goldPath
Write-Host "Captured AmiBroker child windows '$vnTitle' and '$goldTitle'."
