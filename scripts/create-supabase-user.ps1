# Cria um usuario no Supabase via endpoint de signup (GoTrue).
# Le a URL e a anon key do .env.local, entao nao precisa da service_role key.
#
# Uso:
#   ./scripts/create-supabase-user.ps1 -Email admin@exemplo.com -Password "SenhaForte123!"
#   ./scripts/create-supabase-user.ps1        (pergunta os dados)

param(
    [string]$Email,
    [string]$Password,
    [string]$FullName = "Administrador",
    [string]$EnvFile = ".env.local"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $EnvFile)) {
    throw "Arquivo $EnvFile nao encontrado."
}

$supabaseUrl = $null
$anonKey = $null

Get-Content $EnvFile | ForEach-Object {
    if ($_ -match '^\s*NEXT_PUBLIC_SUPABASE_URL\s*=\s*(.+?)\s*$') {
        $supabaseUrl = $Matches[1].Trim('"').TrimEnd('/')
    }
    elseif ($_ -match '^\s*NEXT_PUBLIC_SUPABASE_ANON_KEY\s*=\s*(.+?)\s*$') {
        $anonKey = $Matches[1].Trim('"')
    }
}

if (-not $supabaseUrl) { throw "NEXT_PUBLIC_SUPABASE_URL nao encontrada em $EnvFile." }
if (-not $anonKey) { throw "NEXT_PUBLIC_SUPABASE_ANON_KEY nao encontrada em $EnvFile." }

Write-Host "`n=== Criando usuario no Supabase ===" -ForegroundColor Cyan
Write-Host "Projeto: $supabaseUrl"

if (-not $Email) { $Email = Read-Host "E-mail" }
if (-not $Password) { $Password = Read-Host "Senha" }

$body = @{
    email    = $Email
    password = $Password
    data     = @{ full_name = $FullName }
} | ConvertTo-Json -Depth 3

# Invoke-RestMethod manda string como Latin-1 e vira "?"; enviar bytes UTF-8.
$bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($body)

try {
    $response = Invoke-RestMethod `
        -Uri "$supabaseUrl/auth/v1/signup" `
        -Method POST `
        -ContentType "application/json; charset=utf-8" `
        -Headers @{ apikey = $anonKey } `
        -Body $bodyBytes

    $user = if ($response.user) { $response.user } else { $response }

    Write-Host "`nUsuario criado!" -ForegroundColor Green
    Write-Host "  id:    $($user.id)"
    Write-Host "  email: $($user.email)"

    if ($user.email_confirmed_at -or $response.access_token) {
        Write-Host "`nE-mail ja confirmado. Pode fazer login agora." -ForegroundColor Green
    }
    else {
        Write-Host "`nE-mail AINDA NAO confirmado." -ForegroundColor Yellow
        Write-Host "Confirme pelo link enviado por e-mail, ou rode este SQL no Supabase Studio (SQL Editor):`n" -ForegroundColor Yellow
        Write-Host @"
UPDATE auth.users
SET email_confirmed_at = now()
WHERE email = '$Email';
"@ -ForegroundColor White
    }
}
catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $errorBody = $_.ErrorDetails.Message

    if ($errorBody -match "already registered" -or $statusCode -eq 422) {
        Write-Host "`nEsse e-mail ja esta cadastrado." -ForegroundColor Yellow
        Write-Host "Para recriar, apague o usuario no Dashboard (Authentication -> Users) ou rode:`n" -ForegroundColor Yellow
        Write-Host "DELETE FROM auth.users WHERE email = '$Email';" -ForegroundColor White
    }
    else {
        Write-Host "`nErro ($statusCode): $errorBody" -ForegroundColor Red
        exit 1
    }
}
