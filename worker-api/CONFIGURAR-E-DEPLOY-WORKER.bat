@echo off
cd /d "%~dp0"
title Worker API + Token MP

if not exist "mp-token.txt" (
    echo  Arquivo mp-token.txt nao encontrado.
    copy "mp-token.txt.example" "mp-token.txt" >nul
    echo  Criei mp-token.txt. Abra o arquivo e substitua pelo seu Access Token do Mercado Pago.
    echo  Depois rode este bat de novo.
    start notepad "mp-token.txt"
    pause
    exit /b 0
)

echo  Enviando token e fazendo deploy...
echo.
call npx.cmd wrangler secret put MP_ACCESS_TOKEN < "mp-token.txt"
if errorlevel 1 (
    echo  Se deu "Raw mode" ou erro, use: colar o token no CONFIGURAR-TOKEN-MP.bat uma vez.
    echo  Ou edite wrangler.toml e adicione na secao [vars]: MP_ACCESS_TOKEN = "seu_token"
    pause
    exit /b 1
)

call npx.cmd wrangler deploy
echo.
if errorlevel 1 (
    echo  Erro no deploy.
) else (
    echo  Pronto. api.roleplaymedellin.com.br atualizado.
)
echo.
pause
