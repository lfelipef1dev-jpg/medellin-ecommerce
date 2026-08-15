@echo off
chcp 65001 >nul
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"

set "BUCKET=medellin-imagens"
set "ASSETS_DIR=assets"
set "CACHE_CONTROL=public, max-age=31536000, immutable"

echo.
echo ========================================
echo   UPLOAD R2 - assets/ (imagens da loja)
echo ========================================
echo.
echo Bucket: %BUCKET%
echo Pasta:  %ASSETS_DIR%\
echo.

if not exist "%ASSETS_DIR%\" (
  echo ERRO: pasta "%ASSETS_DIR%\" nao existe neste projeto.
  echo Rode este .bat dentro de: vip-store-web
  echo.
  pause
  exit /b 1
)

echo [1/2] Enviando assets/ para o R2 (usa .env.cloudflare - sem login)...
echo       Pode demorar varios minutos. Aguarde.
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0_upload-r2-temp.ps1"
if %ERRORLEVEL% NEQ 0 (
  echo.
  echo ERRO no upload. Confira .env.cloudflare e o bucket no Cloudflare.
  pause
  exit /b 1
)

echo.
echo [2/2] R2 atualizado. Para o site no ar: deploy-auto-vitoria.bat
echo.
pause
