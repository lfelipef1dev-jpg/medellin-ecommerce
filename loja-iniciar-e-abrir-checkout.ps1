# Inicia API se precisar, inicia ngrok, obtem URL (endpoints/tunnels/arquivo) e abre checkout
$ErrorActionPreference = 'SilentlyContinue'
$base = $PSScriptRoot
$apiBat = Join-Path $base 'api\INICIAR-API-LIMPA-PORTA.bat'
if (-not (Test-Path $apiBat)) { $apiBat = Join-Path $base 'api\INICIAR-API-LOJA-PAGAMENTO.bat' }
$ngrokLog = Join-Path $base 'ngrok_saida.txt'
$ngrokErr = Join-Path $base 'ngrok_err.txt'

function Get-UrlFrom4040 {
    foreach ($host in '127.0.0.1', 'localhost') {
        try {
            # Ngrok v3: GET /api/endpoints -> endpoints[].url
            $raw = (Invoke-WebRequest -Uri "http://${host}:4040/api/endpoints" -TimeoutSec 5 -UseBasicParsing).Content
            if ($raw -match '"url"\s*:\s*"(https://[^"]+)"') { return $matches[1] }
            $r = $raw | ConvertFrom-Json -ErrorAction SilentlyContinue
            if ($r.endpoints -and $r.endpoints.Count -gt 0) {
                $u = $r.endpoints[0].url
                if ($u -match '^https') { return $u }
            }
        } catch { }
        try {
            # Ngrok v2 / fallback: GET /api/tunnels -> tunnels[].public_url
            $raw = (Invoke-WebRequest -Uri "http://${host}:4040/api/tunnels" -TimeoutSec 5 -UseBasicParsing).Content
            if ($raw -match '"public_url"\s*:\s*"(https://[^"]+)"') { return $matches[1] }
            $r = $raw | ConvertFrom-Json -ErrorAction SilentlyContinue
            if ($r.tunnels -and $r.tunnels.Count -gt 0) {
                $u = ($r.tunnels | Where-Object { $_.public_url -match '^https' } | Select-Object -First 1).public_url
                if ($u) { return $u }
            }
        } catch { }
    }
    $null
}

function Get-UrlFromFile {
    foreach ($path in $ngrokLog, $ngrokErr) {
        if (-not (Test-Path $path)) { continue }
        $t = Get-Content $path -Raw -ErrorAction SilentlyContinue
        if ($t -match 'https://[a-zA-Z0-9\-]+\.ngrok[^\s"<>\)]*') { return $matches[0].Trim() }
        if ($t -match 'Forwarding\s+(https://[^\s]+)') { return $matches[1].Trim() }
        if ($t -match '"url"\s*:\s*"(https://[^"]+)"') { return $matches[1] }
        if ($t -match '"public_url"\s*:\s*"(https://[^"]+)"') { return $matches[1] }
    }
    $null
}

# 1) Ngrok ja rodando?
$url = Get-UrlFrom4040
if ($url) {
    $checkoutUrl = "https://roleplaymedellin.com.br/checkout.html?api_url=$url"
    Write-Host 'Checkout (ngrok ja rodando):' $checkoutUrl
    Start-Process $checkoutUrl
    Write-Host 'Checkout aberto.'
    exit 0
}

# 2) API na 3000?
try {
    Invoke-WebRequest -Uri 'http://localhost:3000/api/health' -TimeoutSec 2 -UseBasicParsing | Out-Null
} catch {
    Write-Host '[1/2] Iniciando API porta 3000...'
    if (Test-Path $apiBat) {
        Start-Process -FilePath $apiBat -WorkingDirectory (Split-Path $apiBat)
        Start-Sleep -Seconds 6
    }
}

# 3) Limpar log antigo e iniciar ngrok com saida em arquivo
if (Test-Path $ngrokLog) { Remove-Item $ngrokLog -Force }
if (Test-Path $ngrokErr) { Remove-Item $ngrokErr -Force }
Write-Host '[2/2] Iniciando ngrok...'
$p = Start-Process -FilePath 'npx' -ArgumentList 'ngrok', 'http', '3000' `
    -WorkingDirectory $base `
    -RedirectStandardOutput $ngrokLog `
    -RedirectStandardError $ngrokErr `
    -PassThru -WindowStyle Normal

# 4) Esperar ngrok subir (npx pode demorar) e depois poll por ate ~2 min
Start-Sleep -Seconds 15
$max = 40
$n = 0
$url = $null
while ($n -lt $max) {
    $url = Get-UrlFromFile
    if (-not $url) { $url = Get-UrlFrom4040 }
    if ($url) {
        $checkoutUrl = "https://roleplaymedellin.com.br/checkout.html?api_url=$url"
        Write-Host ''
        Write-Host 'URL do checkout (use se o navegador nao abrir):' -ForegroundColor Cyan
        Write-Host $checkoutUrl -ForegroundColor Yellow
        Write-Host ''
        Start-Process $checkoutUrl
        Write-Host 'Checkout aberto.'
        exit 0
    }
    $n++
    Start-Sleep -Seconds 3
}

Write-Host 'ngrok nao retornou URL. Feche a janela do ngrok e rode o script de novo.'
Write-Host 'Dica: abra http://127.0.0.1:4040 no navegador para ver se o ngrok esta rodando.'
exit 1
