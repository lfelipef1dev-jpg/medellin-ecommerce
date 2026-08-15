@echo off
title Configurar Ngrok - uma vez
cd /d "%~dp0"

echo.
echo  ========================================
echo    NGROK - Configurar authtoken (1 vez)
echo  ========================================
echo.
echo  O ngrok exige conta e token. Siga:
echo.
echo  1. Abrindo a pagina do seu token no navegador...
echo.
start "" "https://dashboard.ngrok.com/get-started/your-authtoken"

echo  2. Copie o seu authtoken na pagina.
echo  3. Cole abaixo quando pedir e pressione Enter.
echo.
set /p TOKEN="  Cole seu authtoken aqui e pressione Enter: "

if "%TOKEN%"=="" (
    echo.
    echo  Nenhum token digitado. Rode este script de novo quando tiver o token.
    pause
    exit /b 1
)

echo.
echo  Instalando o token...
call npx ngrok config add-authtoken %TOKEN%
echo.
if errorlevel 1 (
    echo  Algo deu errado. Confira o token e tente de novo.
) else (
    echo  Pronto. Da proxima vez que abrir o atalho "Medellin - Loja API e Ngrok",
    echo  o ngrok vai subir sem pedir conta.
)
echo.
pause
