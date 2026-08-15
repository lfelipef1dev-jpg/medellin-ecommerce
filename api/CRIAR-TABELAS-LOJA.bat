@echo off
title Criar tabelas da Loja VIP
cd /d "%~dp0"

echo.
echo  Criando tabelas da loja no MySQL (usando .env)...
echo.

where node >nul 2>&1
if errorlevel 1 (
    echo  ERRO: Node.js nao encontrado. Instale em https://nodejs.org
    pause
    exit /b 1
)

if not exist ".env" (
    echo  ERRO: Arquivo .env nao encontrado. Copie .env.example para .env e preencha DB_* e MP_ACCESS_TOKEN.
    pause
    exit /b 1
)

node criar_tabelas_loja.js
echo.
pause
