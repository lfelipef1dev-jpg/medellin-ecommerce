# Roda API + Ngrok, pega a URL do Ngrok e abre o checkout com api_url
$ErrorActionPreference = 'Stop'
$pastaMedellin = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
if (-not $pastaMedellin) { $pastaMedellin = (Get-Item $PSScriptRoot).Parent.Parent.FullName }
$pastaApi = Join-Path $PSScriptRoot "api"
$pastaWeb = $PSScriptRoot

Write-Host ""
Write-Host "  [1/4] Iniciando API..."
Start-Process -FilePath (Join-Path $pastaApi "INICIAR-API-LIMPA-PORTA.bat") -WorkingDirectory $pastaApi -WindowStyle Normal
Start-Sleep -Seconds 5

Write-Host "  [2/4] Iniciando Ngrok..."
$ngrokBat = Join-Path $pastaWeb "_abrir-ngrok.bat"
Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "cd /d `"$pastaWeb`" && npx ngrok http 3000" -WindowStyle Normal
Start-Sleep -Seconds 12

Write-Host "  [3/4] Obtendo URL do Ngrok..."
$url = $null
try {
    $r = Invoke-RestMethod -Uri 'http://127.0.0.1:4040/api/tunnels' -TimeoutSec 5
    $url = ($r.tunnels | Where-Object { $_.public_url -match '^https' } | Select-Object -First 1).public_url
} catch {
    Write-Host "  Ngrok ainda nao respondeu. Aguarde a janela do Ngrok e use testar-pagamento.html."
}

if ($url) {
    Write-Host "  URL: $url"
    Write-Host "  [4/4] Abrindo checkout com api_url..."
    $checkoutUrl = "https://roleplaymedellin.com.br/checkout.html?api_url=" + [Uri]::EscapeDataString($url)
    Start-Process $checkoutUrl
    Write-Host ""
    Write-Host "  Pronto. Checkout aberto. Adicione item, preencha ID do painel e clique em Pagar com Mercado Pago."
} else {
    Write-Host "  Abrindo pagina de teste - cole a URL do Ngrok manualmente."
    Start-Process "https://roleplaymedellin.com.br/testar-pagamento.html"
}
Write-Host ""
