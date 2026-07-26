$ErrorActionPreference = "Stop"

function ConvertFrom-SecureValue([Security.SecureString]$Value) {
  $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Value)
  try { return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer) }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
}

$secureDatabase = Read-Host "Paste Supabase Session Pooler URI on port 5432" -AsSecureString
$databaseUrl = ConvertFrom-SecureValue $secureDatabase
if ($databaseUrl -notmatch ':5432/') { throw "Use the Session Pooler URI on port 5432." }
if ($databaseUrl -match 'sslmode=[^&]+') { $databaseUrl = $databaseUrl -replace 'sslmode=[^&]+','sslmode=verify-full' }
elseif ($databaseUrl.Contains('?')) { $databaseUrl = "${databaseUrl}&sslmode=verify-full" }
else { $databaseUrl = "${databaseUrl}?sslmode=verify-full" }

$supabaseUrl = Read-Host "Supabase project URL (https://PROJECT.supabase.co)"
if ($supabaseUrl -notmatch '^https://[a-z0-9-]+\.supabase\.co/?$') { throw "Invalid Supabase project URL." }
$secureKey = Read-Host "Paste the Supabase secret/service-role key" -AsSecureString
$secretKey = ConvertFrom-SecureValue $secureKey
if ([string]::IsNullOrWhiteSpace($secretKey)) { throw "A server-only Supabase secret key is required." }

$env:DATABASE_URL = $databaseUrl
$env:DIRECT_URL = $databaseUrl
$env:SUPABASE_URL = $supabaseUrl.TrimEnd('/')
$env:SUPABASE_SECRET_KEY = $secretKey

try {
  pnpm --filter @salora/web exec prisma migrate deploy --config ../../prisma.config.ts
  if ($LASTEXITCODE -ne 0) { throw "Prisma migration failed." }

  node --experimental-strip-types scripts/import-salora-product-media.mjs
  if ($LASTEXITCODE -ne 0) { throw "117/117 media validation failed; nothing was uploaded." }

  $confirmation = Read-Host "Validation passed. Type UPLOAD to create the 117 review drafts"
  if ($confirmation -cne "UPLOAD") { Write-Host "Stopped safely before upload."; exit 0 }

  node --experimental-strip-types scripts/import-salora-product-media.mjs --apply
  if ($LASTEXITCODE -ne 0) { throw "Media upload failed." }
  Write-Host "SALORA media import completed: 117 review drafts are ready in Control Tower."
}
finally {
  Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
  Remove-Item Env:DIRECT_URL -ErrorAction SilentlyContinue
  Remove-Item Env:SUPABASE_URL -ErrorAction SilentlyContinue
  Remove-Item Env:SUPABASE_SECRET_KEY -ErrorAction SilentlyContinue
  $databaseUrl = $null
  $secretKey = $null
  $secureDatabase = $null
  $secureKey = $null
}
