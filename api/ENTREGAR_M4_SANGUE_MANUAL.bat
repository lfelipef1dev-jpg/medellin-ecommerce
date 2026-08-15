@echo off
cd /d "%~dp0"
echo.
echo Verificando compras e fila de entrega...
echo.
node check_compra_m4_sangue.js
echo.
echo ----------------------------------------
echo Para INSERIR a entrega da skin M4 Sangue (e receber no proximo login),
echo edite este .bat e na ultima linha coloque sua license depois do node check_compra_m4_sangue.js
echo Exemplo: node check_compra_m4_sangue.js license:abc123...
echo ----------------------------------------
pause
