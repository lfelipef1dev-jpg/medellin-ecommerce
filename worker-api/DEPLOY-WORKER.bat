@echo off
cd /d "%~dp0"
title Deploy Worker - api.roleplaymedellin.com.br
echo.
echo  Enviando Worker medellin-api-proxy para a Cloudflare...
echo.
call npx.cmd wrangler deploy
echo.
if errorlevel 1 (
    echo  Se deu erro de autenticacao, rode antes: FAZER-LOGIN-CLOUDFLARE.bat
) else (
    echo  Pronto. api.roleplaymedellin.com.br atualizado.
)
echo.
pause
