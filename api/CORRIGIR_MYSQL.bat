@echo off
title Medellin - Corrigir MySQL (API)
cd /d "%~dp0"
echo Aplicando correção de autenticação MySQL...
echo.
node fix_mysql_auth.js
echo.
pause
