@echo on

:: Made by Main Fighter [mainfighter.com]
:: Simple start script for meepen's sailen-bot [https://github.com/meepen/salien-bot]
:: v1.3.0 [23-06-2018]

:: Global Configuration
:: set killrunning==true not functional
:: set gitdownload==true not functional
set npminstall=true

::===============================================================================================================::

:Greeting

echo Starting Sailen Bots

::===============================================================================================================::

:: Start all bots in config
for %%a in ("config\*.cmd") do call "%%a" & call :StartScript

::===============================================================================================================::

:Farewell

echo All bots started

exit

::===============================================================================================================::

:StartScript

:: Opens CMD Window > Sets title and color of window > Changes to dir > runs npm install if enabled > starts bot
set commandline="title Sailen Bot - %name% & color %color% & cd instances\%directory% & if %npminstall%==true call npm install & node headless & exit"
if %enabled%==true if %minimized%==true (start /min cmd /k  %commandline%) else (start cmd /k %commandline%)

set enabled=false
set minimized=false
set name=untitled
set directory=notconfigured
set color=0C

goto eof