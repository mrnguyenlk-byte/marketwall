[CmdletBinding()]
param(
  [string]$RepositoryPath = "C:\btrading-code",
  [string]$Branch = "main"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath (Join-Path $RepositoryPath ".git"))) {
  throw "Not a Git working tree: $RepositoryPath"
}

Set-Location -LiteralPath $RepositoryPath

# Never overwrite VPS-local configuration or an operator's uncommitted work.
$changes = git status --porcelain
if ($LASTEXITCODE -ne 0) { throw "Could not inspect Git working tree." }
if ($changes) {
  throw "Refusing update: the VPS working tree has local changes. Resolve them manually before retrying."
}

git fetch --prune origin $Branch
if ($LASTEXITCODE -ne 0) { throw "git fetch failed." }

git merge --ff-only "origin/$Branch"
if ($LASTEXITCODE -ne 0) { throw "Fast-forward update failed." }

Write-Host "Updated BTrading runner to $(git rev-parse --short HEAD)"
