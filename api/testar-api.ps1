# Testes da API (local e publica)
$ErrorActionPreference = "Continue"
Write-Host "=== 1. API LOCAL (localhost:3000) GET ==="
try {
    $r = Invoke-WebRequest -Uri "http://localhost:3000/api/create-preference" -Method GET -UseBasicParsing -TimeoutSec 5
    Write-Host "OK - Status:" $r.StatusCode
} catch {
    Write-Host "FALHOU -" $_.Exception.Message
}

Write-Host ""
Write-Host "=== 2. API LOCAL POST (create-preference) ==="
$body = '{"identifierType":"account_id","identifierValue":"1","items":[{"name":"Teste","price":1,"productId":"test","productType":"vip","quantity":1}]}'
try {
    $wc = New-Object System.Net.WebClient
    $wc.Headers.Add("Content-Type", "application/json")
    $result = $wc.UploadString("http://localhost:3000/api/create-preference", "POST", $body)
    Write-Host "OK - Body:" $result
} catch [System.Net.WebException] {
    $code = [int]$_.Exception.Response.StatusCode
    Write-Host "Status:" $code
    $sr = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $errBody = $sr.ReadToEnd()
    $sr.Close()
    Write-Host "Mensagem da API:" $errBody
}

Write-Host ""
Write-Host "=== 3. API PUBLICA (api.roleplaymedellin.com.br) OPTIONS ==="
try {
    $r = Invoke-WebRequest -Uri "https://api.roleplaymedellin.com.br/api/create-preference" -Method OPTIONS -UseBasicParsing -TimeoutSec 15
    Write-Host "OK - Status:" $r.StatusCode
} catch {
    Write-Host "FALHOU -" $_.Exception.Message
}

Write-Host ""
Write-Host "=== 4. API PUBLICA POST (Worker -> sua API) ==="
try {
    $r = Invoke-WebRequest -Uri "https://api.roleplaymedellin.com.br/api/create-preference" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing -TimeoutSec 20
    Write-Host "OK - Status:" $r.StatusCode
    Write-Host "Body (inicio):" $r.Content.Substring(0, [Math]::Min(150, $r.Content.Length))
} catch {
    Write-Host "FALHOU -" $_.Exception.Message
    if ($_.Exception.Response) {
        $code = $_.Exception.Response.StatusCode.value__
        Write-Host "StatusCode:" $code
        try {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $errBody = $reader.ReadToEnd()
            Write-Host "Response body:" $errBody
        } catch {}
    }
}
Write-Host ""
Write-Host "=== Fim dos testes ==="
