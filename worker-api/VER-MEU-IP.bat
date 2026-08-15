@echo off
title Meu IP publico
echo.
echo  Seu IP publico (use no Worker como http://ESTE_IP:3000):
echo.
powershell -NoProfile -Command "(Invoke-WebRequest -Uri 'https://api.ipify.org' -UseBasicParsing).Content"
echo.
pause
