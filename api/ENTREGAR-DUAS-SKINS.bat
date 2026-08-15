@echo off
cd /d "%~dp0"
title Entregar M4 Batalha + M4 Sangue
echo.
echo ========================================
echo   Entregar as 2 skins no seu inventario
echo   (M4 Batalha + M4 Sangue)
echo ========================================
echo.

if "%~1"=="" (
  set /p IDENT="Digite sua LICENSE (ex: license:abc123...) ou seu ID da conta (so numero): "
) else (
  set IDENT=%~1
  if /i "%~1"=="account_id" if not "%~2"=="" (
    set IDENT=account_id %~2
  )
)

if "%IDENT%"=="" (
  echo Nada digitado. Abrindo instrucoes...
  echo.
  echo Use assim: ENTREGAR-DUAS-SKINS.bat SUA_LICENSE
  echo Ou:         ENTREGAR-DUAS-SKINS.bat account_id 12345
  echo.
  pause
  exit /b 1
)

echo.
echo Inserindo entregas na fila...
echo.

if "%IDENT:~0,10%"=="account_id " (
  node entregar_duas_skins.js account_id %IDENT:~10%
) else (
  node entregar_duas_skins.js %IDENT%
)

echo.
echo ========================================
echo No jogo: SAIA e ENTRE de novo no servidor
echo (ou espere ~45 segundos se ja estiver online)
echo ========================================
echo.
pause
