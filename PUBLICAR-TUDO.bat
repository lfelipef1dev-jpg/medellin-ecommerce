@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo ========================================
echo   PUBLICAR TUDO - R2 + Site (Pages)
echo ========================================
echo.
echo [1/2] Enviando imagens para o R2...
powershell -ExecutionPolicy Bypass -File "%~dp0_upload-r2-temp.ps1"
if %ERRORLEVEL% NEQ 0 (
  echo R2 falhou. Abortando.
  pause
  exit /b 1
)
echo.
echo [2/2] Deploy do site...
powershell -ExecutionPolicy Bypass -File "%~dp0deploy-auto-vitoria.ps1"
echo.
echo Pronto. Imagens no R2 + site no ar.
pause
