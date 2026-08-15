@echo off
cd /d "%~dp0"
echo Se der erro de autenticacao, rode antes: CONFIGURAR-NGROK-UM-VEZ.bat (nesta pasta)
echo.
npx ngrok http 3000
pause
