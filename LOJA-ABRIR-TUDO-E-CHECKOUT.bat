@echo off
cd /d "%~dp0"
chcp 65001 >nul
title Loja - Iniciando tudo

echo.
echo  Loja Medellin - Abrindo checkout
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0loja-iniciar-e-abrir-checkout.ps1"

echo.
timeout /t 2 /nobreak >nul
exit /b 0
