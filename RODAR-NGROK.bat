@echo off
title Ngrok - Porta 3000
cd /d "%~dp0"

echo.
echo  ========================================
echo    NGROK - Expor a API (porta 3000)
echo  ========================================
echo.
echo  Deixe a API rodando em outra janela (INICIAR-API-LOJA-PAGAMENTO.bat).
echo  Quando o ngrok subir, copie a URL HTTPS que aparecer abaixo.
echo  Abra no navegador:
echo    https://roleplaymedellin.com.br/checkout.html?api_url=COLE_A_URL_AQUI
echo.
echo  ========================================
echo.

npx ngrok http 3000

pause
