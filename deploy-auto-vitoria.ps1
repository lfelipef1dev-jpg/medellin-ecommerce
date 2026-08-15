# Deploy automatico - Loja Vitória / Cloudflare Pages (sem perguntar login se token estiver configurado)
# Configure uma vez: CLOUDFLARE_API_TOKEN e CLOUDFLARE_ACCOUNT_ID (veja CONFIGURAR-DEPLOY-AUTO.txt)
# Rode: .\deploy-auto-vitoria.ps1   ou   .\deploy-auto-vitoria.bat

$ErrorActionPreference = "Stop"
cd $PSScriptRoot

$TEMP_DIR = "_deploy_temp_pages"
$PROJECT = "roleplaymedellin"

$npxCmd = (Get-Command npx.cmd -ErrorAction SilentlyContinue).Source
if (-not $npxCmd) { $npxCmd = "npx.cmd" }

Write-Host ""
Write-Host "========================================"
Write-Host "  DEPLOY AUTOMATICO - Loja Vitória (Cloudflare Pages)"
Write-Host "========================================"
Write-Host ""

# Carregar do arquivo .env.cloudflare se existir (na mesma pasta do script)
$envFile = Join-Path $PSScriptRoot ".env.cloudflare"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([A-Za-z0-9_]+)\s*=\s*(.+)\s*$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim().Trim('"').Trim("'")
            Set-Item -Path "Env:$name" -Value $value -ErrorAction SilentlyContinue
        }
    }
}

# Usar token se existir (arquivo ou variaveis do Windows)
$token = $env:CLOUDFLARE_API_TOKEN
if (-not $token) { $token = [System.Environment]::GetEnvironmentVariable("CLOUDFLARE_API_TOKEN", "User") }
if (-not $token) { $token = [System.Environment]::GetEnvironmentVariable("CLOUDFLARE_API_TOKEN", "Process") }
$accountId = $env:CLOUDFLARE_ACCOUNT_ID
if (-not $accountId) { $accountId = [System.Environment]::GetEnvironmentVariable("CLOUDFLARE_ACCOUNT_ID", "User") }
if (-not $accountId) { $accountId = [System.Environment]::GetEnvironmentVariable("CLOUDFLARE_ACCOUNT_ID", "Process") }

if ($token -and $accountId) {
    $env:CLOUDFLARE_API_TOKEN = $token
    $env:CLOUDFLARE_ACCOUNT_ID = $accountId
    Write-Host "[1/4] Token configurado - deploy sem login."
} else {
    Write-Host "[1/4] Login no Cloudflare (abre o navegador uma vez)..."
    & $npxCmd --yes wrangler login
    if ($LASTEXITCODE -ne 0) { Write-Host "ERRO no login."; exit 1 }
}

Write-Host ""
Write-Host "[2/4] Criando pasta temporaria..."
if (Test-Path $TEMP_DIR) { Remove-Item -Recurse -Force $TEMP_DIR }
New-Item -ItemType Directory -Path $TEMP_DIR -Force | Out-Null
New-Item -ItemType Directory -Path "$TEMP_DIR\data" -Force | Out-Null

Copy-Item -Path "*.html","*.css","*.js" -Destination $TEMP_DIR -Force
if (Test-Path "robots.txt") { Copy-Item -Path "robots.txt" -Destination $TEMP_DIR -Force }
if (Test-Path "_headers") { Copy-Item -Path "_headers" -Destination $TEMP_DIR -Force }
Copy-Item -Path "data\*" -Destination "$TEMP_DIR\data" -Force -ErrorAction SilentlyContinue

$cssPath = Join-Path $TEMP_DIR "style.css"
if (Test-Path $cssPath) {
    & node (Join-Path $PSScriptRoot "scripts\purge-css.js") $TEMP_DIR 2>$null
    if ($LASTEXITCODE -eq 0) { Write-Host "  CSS purgado." }
    & node (Join-Path $PSScriptRoot "scripts\minify-css.js") $cssPath 2>$null
    if ($LASTEXITCODE -eq 0) { Write-Host "  CSS minificado." }
}
& node (Join-Path $PSScriptRoot "scripts\minify-js.js") $TEMP_DIR 2>$null
if ($LASTEXITCODE -eq 0) { Write-Host "  JS minificado." }

# Imagens: todas as URLs assets/ -> R2 (src e srcset) e .png -> .webp
$R2_BASE = "https://pub-89b867ec225e45518f185a48a96ed88e.r2.dev"
$R2_ESC = [regex]::Escape($R2_BASE)
Get-ChildItem -Path $TEMP_DIR -Filter "*.html" | ForEach-Object {
    $c = Get-Content $_.FullName -Raw -Encoding UTF8
    $c = $c -replace '"assets/', "`"$R2_BASE/assets/"
    $c = $c -replace "($R2_ESC/assets/[^""?]+)\.png", '$1.webp'
    [System.IO.File]::WriteAllText($_.FullName, $c, [System.Text.UTF8Encoding]::new($false))
}
Write-Host "  Imagens: R2 (src + srcset) + WebP."

# Cache bust: cada deploy usa ?v=UNICO para CSS/JS aparecer em producao na hora
$buildVer = Get-Date -Format "yyyyMMdd-HHmm"
Get-ChildItem -Path $TEMP_DIR -Filter "*.html" | ForEach-Object {
    $c = Get-Content $_.FullName -Raw -Encoding UTF8
    $c = $c -replace 'style\.css(\?v=[^"''\s]*)?', "style.css?v=$buildVer"
    $c = $c -replace 'app\.js(\?v=[^"''\s]*)?', "app.js?v=$buildVer"
    $c = $c -replace 'config\.js(\?v=[^"''\s]*)?', "config.js?v=$buildVer"
    [System.IO.File]::WriteAllText($_.FullName, $c, [System.Text.UTF8Encoding]::new($false))
}
Write-Host "  Cache bust: style.css + app.js + config.js v=$buildVer"

Write-Host "[3/4] Enviando para Cloudflare Pages..."
& $npxCmd --yes wrangler pages deploy $TEMP_DIR --project-name=$PROJECT --commit-dirty=true
$deployOk = $LASTEXITCODE

# Purge cache do CDN para roleplaymedellin.com.br atualizar na hora
$zoneId = $env:CLOUDFLARE_ZONE_ID
if (-not $zoneId) { $zoneId = [System.Environment]::GetEnvironmentVariable("CLOUDFLARE_ZONE_ID", "User") }
if ($deployOk -eq 0 -and $token) {
    if (-not $zoneId) {
        try {
            $zonesResp = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones?name=roleplaymedellin.com.br" -Method Get -Headers @{ Authorization = "Bearer $token" } -ErrorAction Stop
            if ($zonesResp.result -and $zonesResp.result.Count -gt 0) { $zoneId = $zonesResp.result[0].id }
        } catch { }
    }
    if ($zoneId) {
        try {
            $purgeBody = '{"purge_everything":true}'
            $purgeResp = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$zoneId/purge_cache" -Method Post -Headers @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" } -Body $purgeBody -ErrorAction Stop
            if ($purgeResp.success) { Write-Host "  Cache CDN purgado (roleplaymedellin.com.br atualizado)." } else { Write-Host "  Aviso: purge falhou." }
        } catch {
            Write-Host "  Aviso: purge cache falhou. Token precisa de permissao 'Zone - Cache Purge'. Adicione CLOUDFLARE_ZONE_ID no .env.cloudflare se o dominio for outro."
        }
    } else {
        Write-Host "  Dica: para purgar cache em producao, adicione CLOUDFLARE_ZONE_ID no .env.cloudflare (Painel Cloudflare -> dominio -> Overview -> Zone ID)."
    }
}

Write-Host ""
Write-Host "[4/4] Limpando..."
Remove-Item -Recurse -Force $TEMP_DIR -ErrorAction SilentlyContinue

if ($deployOk -eq 0) {
    Write-Host "  SUCESSO. Site: https://roleplaymedellin.pages.dev"
} else {
    Write-Host "  FALHOU. Codigo: $deployOk"
}
Write-Host ""
