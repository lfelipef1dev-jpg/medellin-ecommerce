# Tenta ler URL do arquivo (se existir) ou da API 4040 do ngrok
param([string]$LogPath)
$max = 60
$n = 0
$url = $null
while ($n -lt $max) {
    if ($LogPath -and (Test-Path $LogPath)) {
        $t = Get-Content $LogPath -Raw -ErrorAction SilentlyContinue
        if ($t -match 'https://[^\s"<>]+') {
            foreach ($u in [regex]::Matches($t, 'https://[^\s"<>]+')) {
                if ($u.Value -match 'ngrok') {
                    $url = $u.Value.Trim()
                    break
                }
            }
        }
    }
    if (-not $url) {
        try {
            $r = Invoke-RestMethod -Uri 'http://127.0.0.1:4040/api/tunnels' -TimeoutSec 3 -ErrorAction Stop
            $url = ($r.tunnels | Where-Object { $_.public_url -match '^https' } | Select-Object -First 1).public_url
        } catch { }
    }
    if ($url) {
        Start-Process "https://roleplaymedellin.com.br/checkout.html?api_url=$url"
        Write-Host 'Checkout aberto.'
        exit 0
    }
    $n++
    Start-Sleep -Seconds 3
}
Write-Host 'ngrok nao retornou URL. Feche tudo e rode o script de novo.'
exit 1
