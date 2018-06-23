@echo off

:: Made by Main Fighter [mainfighter.com]
:: Simple start script for meepen's sailen-bot [https://github.com/meepen/salien-bot]
:: v1.2.1 [23-06-2018]

:: Global Configuration
:: set killrunning==true
set npminstall=true

::===============================================================================================================::

:Greeting

echo Starting Sailen Bots

::===============================================================================================================::

:: Bot Configuration Options
:: enabled; whether the instance is enabled or not
:: minimized; whether the cmd window starts minimized or not
:: name; name of the instance
:: directory; sets the bot directory, this can be set to %name% to use the name as the directory
:: color; colors in the cmd window
:: call :StartScript; this has to be there for the instance to work

:: Instance Example
:: You can leave any of these out to use the default values
:: set enabled=false
:: set minimized=false
:: set name=example
:: set directory=notconfigured
:: set color 0A
:: call :StartScript

:: Bot Instance
set enabled=false
set minimized=false
set name=example
set directory=notconfigured
set color=0A
call :StartScript

::===============================================================================================================::

:Farewell

echo All bots started

exit

::===============================================================================================================::

:StartScript

:: Opens CMD Window > Sets title and color of window > Changes to dir > runs npm install if enabled > starts bot
set commandline="title Sailen Bot - %name% & color %color% & cd %directory% & if %npminstall%==true call npm install & node headless & exit"
if %enabled%==true if %minimized%==true (start /min cmd /k  %commandline%) else (start cmd /k %commandline%)

set enabled=false
set minimized=false
set name=untitled
set directory=notconfigured
set color=0C

goto eof