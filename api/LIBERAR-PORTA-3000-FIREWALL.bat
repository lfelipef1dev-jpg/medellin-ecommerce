@echo off
title Liberar porta 3000 no Firewall
echo.
echo  Adicionando regra no Firewall do Windows para a porta 3000...
echo  (Execute como Administrador se pedir.)
echo.
netsh advfirewall firewall add rule name="Medellin API Loja 3000" dir=in action=allow protocol=TCP localport=3000
echo.
echo  Pronto. Teste de novo: https://api.roleplaymedellin.com.br/api/health
echo.
pause
