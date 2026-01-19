$ErrorActionPreference = "Stop"

$ChecksumFile = "governance/checksums.yml"
$RepoRoot = Resolve-Path "."

if (-not (Test-Path $ChecksumFile)) {
  Write-Error "Missing checksum authority: $ChecksumFile"
}

# Files that are explicitly NON-authoritative
$ExcludedFiles = @(
  "canon/INDEX.md"
)

function Get-Sha256($Path) {
  return (Get-FileHash -Algorithm SHA256 -Path $Path).Hash.ToLower()
}

$yaml = Get-Content $ChecksumFile -Raw

if ($yaml -notmatch "documents:") {
  Write-Error "Invalid checksum file structure"
}

$entries = ($yaml -split "`n") | Where-Object { $_ -match "file:" }

foreach ($line in $entries) {
  $file = ($line -replace ".*file:\s*", "").Trim()

  if ($ExcludedFiles -contains $file) {
    Write-Host "⏭️  Skipping non-authoritative file: $file"
    continue
  }

  $fullPath = Join-Path $RepoRoot $file

  if (-not (Test-Path $fullPath)) {
    Write-Error "Missing canonical file: $file"
  }

  $expected = ($yaml -split "`n") |
    Where-Object { $_ -match "file:\s*$file" } |
    ForEach-Object {
      $i = [array]::IndexOf($yaml -split "`n", $_)
      ($yaml -split "`n")[$i + 2] -replace "checksum:\s*", ""
    }

  $actual = Get-Sha256 $fullPath

  if ($expected -ne $actual) {
    Write-Error "❌ Canon checksum mismatch: $file`nExpected: $expected`nActual:   $actual"
  }

  Write-Host "✅ Verified: $file"
}

Write-Host "`n🎯 Canon integrity verified (single authority enforced)"
