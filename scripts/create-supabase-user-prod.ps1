# Cria um usuario no Supabase de PRODUCAO pela Admin API do GoTrue (service_role).
#
# Diferente do create-supabase-user.ps1 (signup com anon key), este ja deixa o usuario
# pronto para o app: e-mail confirmado e user_metadata com full_name, role e
# company_name = thamu_viajando -- o mesmo que app/usuarios/actions.ts grava.
#
# As credenciais saem de um arquivo de ambiente separado (padrao .env.prod, ignorado
# pelo git via .env*), para nao misturar com o .env.local que aponta para dev:
#
#   NEXT_PUBLIC_SUPABASE_URL=https://<projeto-prod>.supabase.co
#   SUPABASE_SERVICE_ROLE_KEY=<service_role ou sb_secret_...>
#
# Uso:
#   ./scripts/create-supabase-user-prod.ps1 -Email admin@exemplo.com -FullName "Fulano"
#   ./scripts/create-supabase-user-prod.ps1 -Email x@y.com -Role visualizador
#   ./scripts/create-supabase-user-prod.ps1            (pergunta os dados)
#
# A senha e pedida sem eco se nao for passada em -Password.

param(
    [string]$Email,
    [string]$Password,
    [string]$FullName,
    [ValidateSet("admin", "visualizador")]
    [string]$Role = "admin",
    [string]$EnvFile = ".env.prod",
    [switch]$Force
)

$ErrorActionPreference = "Stop"

$CompanyName = "thamu_viajando"

function Read-EnvFile([string]$arquivo) {
    $valores = @{}
    if (-not (Test-Path $arquivo)) { return $valores }
    Get-Content $arquivo | ForEach-Object {
        if ($_ -match '^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$') {
            $valores[$Matches[1]] = $Matches[2].Trim('"').Trim("'")
        }
    }
    return $valores
}

if (-not (Test-Path $EnvFile)) {
    throw "Arquivo $EnvFile nao encontrado. Crie-o com NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY do projeto de producao."
}

$envProd = Read-EnvFile $EnvFile
$supabaseUrl = $envProd["NEXT_PUBLIC_SUPABASE_URL"]
$serviceKey = $envProd["SUPABASE_SERVICE_ROLE_KEY"]

if (-not $supabaseUrl) { throw "NEXT_PUBLIC_SUPABASE_URL nao encontrada em $EnvFile." }
if (-not $serviceKey) { throw "SUPABASE_SERVICE_ROLE_KEY nao encontrada em $EnvFile." }
$supabaseUrl = $supabaseUrl.TrimEnd('/') -replace '/(rest|auth)/v1$', ''
if ($supabaseUrl -notmatch '^https?://[^/:]+(:\d+)?$') {
    throw "NEXT_PUBLIC_SUPABASE_URL invalida em ${EnvFile}: '$supabaseUrl'. Use so a base, ex.: https://<ref>.supabase.co"
}

# A Admin API so aceita a chave secreta; a anon/publishable daria 401 mais adiante.
$chaveEhJwt = $serviceKey -match '^[^.]+\.[^.]+\.[^.]+$'
if ($serviceKey.StartsWith("sb_publishable_")) {
    throw "SUPABASE_SERVICE_ROLE_KEY contem uma chave publishable. Use a service_role / sb_secret_."
}
if ($chaveEhJwt) {
    $payload = $serviceKey.Split('.')[1].Replace('-', '+').Replace('_', '/')
    switch ($payload.Length % 4) { 2 { $payload += "==" } 3 { $payload += "=" } }
    $claims = [System.Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($payload)) | ConvertFrom-Json
    if ($claims.role -ne "service_role") {
        throw "A chave em SUPABASE_SERVICE_ROLE_KEY tem role '$($claims.role)', nao 'service_role'."
    }
}

# Protecao contra rodar em dev por engano: compara com o .env.local.
$envLocal = Read-EnvFile ".env.local"
$urlDev = $envLocal["NEXT_PUBLIC_SUPABASE_URL"]
if ($urlDev -and $urlDev.TrimEnd('/') -eq $supabaseUrl) {
    Write-Host "`nATENCAO: $EnvFile aponta para o mesmo projeto do .env.local ($supabaseUrl)." -ForegroundColor Yellow
    Write-Host "Isso normalmente e o banco de desenvolvimento, nao o de producao." -ForegroundColor Yellow
}

Write-Host "`n=== Criando usuario no Supabase (PRODUCAO) ===" -ForegroundColor Cyan
Write-Host "Projeto: $supabaseUrl"

if (-not $Email) { $Email = Read-Host "E-mail" }
$Email = $Email.Trim().ToLower()
if ($Email -notmatch '^[^@\s]+@[^@\s]+\.[^@\s]+$') { throw "E-mail invalido: $Email" }

if (-not $FullName) { $FullName = Read-Host "Nome completo" }
$FullName = $FullName.Trim()
if (-not $FullName) { throw "Nome completo e obrigatorio." }

if (-not $Password) {
    $seguro = Read-Host "Senha" -AsSecureString
    $confirmacao = Read-Host "Confirme a senha" -AsSecureString
    $bstr1 = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($seguro)
    $bstr2 = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($confirmacao)
    try {
        $Password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr1)
        $repetida = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr2)
    }
    finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr1)
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr2)
    }
    if ($Password -ne $repetida) { throw "As senhas nao conferem." }
}
if ($Password.Length -lt 6) { throw "A senha precisa ter pelo menos 6 caracteres." }

Write-Host "`n  e-mail:  $Email"
Write-Host "  nome:    $FullName"
Write-Host "  role:    $Role"
Write-Host "  empresa: $CompanyName"

if (-not $Force) {
    $ok = Read-Host "`nCriar este usuario em PRODUCAO? Digite 'sim' para continuar"
    if ($ok -ne "sim") {
        Write-Host "Cancelado." -ForegroundColor Yellow
        exit 0
    }
}

$body = @{
    email         = $Email
    password      = $Password
    email_confirm = $true
    user_metadata = @{
        full_name    = $FullName
        role         = $Role
        company_name = $CompanyName
    }
} | ConvertTo-Json -Depth 4

# Invoke-RestMethod manda string como Latin-1 e vira "?"; enviar bytes UTF-8.
$bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($body)

# Chaves sb_secret_ vao so no apikey; o gateway rejeita elas como Bearer.
# O User-Agent padrao do PowerShell comeca com "Mozilla/5.0", e o gateway recusa
# chave secreta vinda de algo que parece navegador (401 "Forbidden use of secret
# API key in browser") -- por isso o -UserAgent proprio na chamada abaixo.
$headers = @{ apikey = $serviceKey }
if ($chaveEhJwt) { $headers["Authorization"] = "Bearer $serviceKey" }

try {
    $user = Invoke-RestMethod `
        -Uri "$supabaseUrl/auth/v1/admin/users" `
        -Method POST `
        -ContentType "application/json; charset=utf-8" `
        -Headers $headers `
        -UserAgent "thamu-viajando-script" `
        -Body $bodyBytes

    Write-Host "`nUsuario criado e confirmado!" -ForegroundColor Green
    Write-Host "  id:    $($user.id)"
    Write-Host "  email: $($user.email)"
    Write-Host "  role:  $($user.user_metadata.role)"
}
catch {
    $statusCode = $null
    if ($_.Exception.Response) { $statusCode = [int]$_.Exception.Response.StatusCode }
    $errorBody = $_.ErrorDetails.Message
    # Sem resposta HTTP (DNS, rede, URL errada) nao ha corpo; mostra a excecao.
    if (-not $errorBody) { $errorBody = $_.Exception.Message }

    if ($statusCode -eq 422 -or $errorBody -match "already been registered|email_exists") {
        Write-Host "`nEsse e-mail ja esta cadastrado em producao." -ForegroundColor Yellow
        Write-Host "Para torna-lo admin da ThaMu, rode no SQL Editor do projeto de producao:`n" -ForegroundColor Yellow
        Write-Host @"
UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb)
  || jsonb_build_object('role', '$Role', 'company_name', '$CompanyName')
WHERE email = '$Email';
"@ -ForegroundColor White
        exit 1
    }

    Write-Host "`nErro ($statusCode): $errorBody" -ForegroundColor Red
    if ($statusCode -eq 401 -or $statusCode -eq 403) {
        Write-Host "Confira se SUPABASE_SERVICE_ROLE_KEY em $EnvFile e a chave secreta do projeto de producao." -ForegroundColor Yellow
    }
    exit 1
}
