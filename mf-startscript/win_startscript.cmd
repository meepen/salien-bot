@echo off

:: Made by Main Fighter [mainfighter.com]
:: Simple start script for meepen's sailen-bot [https://github.com/meepen/salien-bot]
:: v1.3.1 [23-06-2018]

::===============================================================================================================::

:Greeting

:: Calls configuration stuff
call configuration.cmd

echo Starting Sailen Bots

::===============================================================================================================::

:: Start all bots in config
for %%a in ("instances\*.cmd") do call "%%a" & call :StartScript

::===============================================================================================================::

:Farewell

echo All bots started

exit

::===============================================================================================================::

:StartScript

echo Starting %name%

:: Opens CMD Window > Sets title and color of window > Changes to dir > runs npm install if enabled > starts bot
set commandline="title Sailen Bot - %name% & color %color% & cd botfiles\%directory% & if %npminstall%==true call npm install & node headless & exit"
if %enabled%==true if %minimized%==true (start /min cmd /k  %commandline%) else (start cmd /k %commandline%)

set enabled=false
set minimized=false
set name=untitled
set directory=notconfigured
set color=0C

goto eof