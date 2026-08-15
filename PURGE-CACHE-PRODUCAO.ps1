# Purga o cache do CDN para roleplaymedellin.com.br atualizar na hora
# Rode: .\PURGE-CACHE-PRODUCAO.ps1
# Precisa: .env.cloudflare com CLOUDFLARE_API_TOKEN e CLOUDFLARE_ZONE_ID (ou so token, o script tenta achar o zone)

$ErrorActionPreference = "Stop"
cd $PSScriptRoot

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

$token = $env:CLOUDFLARE_API_TOKEN
if (-not $token) { $token = [System.Environment]::GetEnvironmentVariable("CLOUDFLARE_API_TOKEN", "User") }
if (-not $token) {
    Write-Host "ERRO: CLOUDFLARE_API_TOKEN nao encontrado. Coloque no .env.cloudflare"
    exit 1
}

$zoneId = $env:CLOUDFLARE_ZONE_ID
if (-not $zoneId) { $zoneId = [System.Environment]::GetEnvironmentVariable("CLOUDFLARE_ZONE_ID", "User") }
if (-not $zoneId) {
    try {
        $zonesResp = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones?name=roleplaymedellin.com.br" -Method Get -Headers @{ Authorization = "Bearer $token" } -ErrorAction Stop
        if ($zonesResp.result -and $zonesResp.result.Count -gt 0) {
            $zoneId = $zonesResp.result[0].id
            Write-Host "Zone ID encontrado: $zoneId"
        }
    } catch {
        Write-Host "ERRO: Nao foi possivel achar o zone. Adicione no .env.cloudflare:"
        Write-Host "  CLOUDFLARE_ZONE_ID=seu_zone_id"
        Write-Host "  (Painel Cloudflare -> roleplaymedellin.com.br -> Overview -> Zone ID)"
        exit 1
    }
}

if (-not $zoneId) {
    Write-Host "ERRO: CLOUDFLARE_ZONE_ID nao configurado. Adicione no .env.cloudflare"
    exit 1
}

try {
    $purgeBody = '{"purge_everything":true}'
    $purgeResp = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$zoneId/purge_cache" -Method Post -Headers @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" } -Body $purgeBody -ErrorAction Stop
    if ($purgeResp.success) {
        Write-Host "OK. Cache do roleplaymedellin.com.br purgado. Abra o site (de preferencia aba anonima ou Ctrl+Shift+R)."
    } else {
        Write-Host "Falha na API:" $purgeResp.errors
        exit 1
    }
} catch {
    Write-Host "ERRO ao purgar:" $_.Exception.Message
    Write-Host "O token precisa da permissao 'Zone - Cache Purge'. Crie um novo token em My Profile -> API Tokens com essa permissao."
    exit 1
}
