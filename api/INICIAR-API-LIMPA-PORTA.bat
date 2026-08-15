@echo off
title Medellin VIP - API (Pagamento)
cd /d "%~dp0"

echo.
echo  Medellin VIP - API (Mercado Pago)
echo  --------------------------------
echo.

where node >nul 2>&1
if errorlevel 1 (
    if exist "C:\fivem-server\nodejs\node.exe" (
        set "PATH=C:\fivem-server\nodejs;%PATH%"
    ) else (
        echo  ERRO: Node.js nao encontrado.
        pause
        exit /b 1
    )
)

if not exist "node_modules" (
    echo  Instalando dependencias...
    call npm install
    echo.
)

echo  Liberando porta 3000 (se estiver em uso)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    taskkill /PID %%a /F >nul 2>&1
    timeout /t 1 /nobreak >nul
)
echo  OK.
echo.

echo  Iniciando a API na porta 3000...
echo  Deixe esta janela aberta.
echo.

node server.js
pause
exit /b 0
