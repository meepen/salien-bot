@echo off

:: Made by Main Fighter [mainfighter.com]
:: Simple start script for meepen's sailen-bot [https://github.com/meepen/salien-bot]
:: v1.4.1 [23-06-2018]

::===============================================================================================================::

:Greeting

:: Calls configuration stuff
call configuration.cmd

echo Starting Sailen Bots

::===============================================================================================================::

:: Debug
if %debug%==true @echo on


:: Sets rootdir var to the currently directory of script
set rootdir=%~dp0

:: Clone botfiles
echo Downloading bot files
for %%a in ("instances\*.cmd") do call "%%a" & call :DownloadBotFiles
if %debug%==true pause

:: Update botfiles
echo Updating bot files
for %%a in ("instances\*.cmd") do call "%%a" & call :UpdateBotFiles
if %debug%==true pause

:: Start all bots in config
for %%a in ("instances\*.cmd") do call "%%a" & call :StartScript
if %debug%==true pause

::===============================================================================================================::

:Farewell

echo All bots started

exit

::===============================================================================================================::

:DownloadBotFiles

echo.
echo %name% - Downloading Bot Files

:: Sets the directory back to the root
cd "%rootdir%"

:: Sets directory to be the same as name if not defined
if not defined directory set directory=%name%

:: Using this to skip as a workaround for issue I was having
if %enabled%==false goto :eof
if %autodownloadbot%==false goto :eof

:: Checks if bot files don't already exist > if they don't creates folder > if they don't clones bot to directory
if not exist botfiles\%directory% ( mkdir botfiles\%directory% & git clone --quiet https://github.com/meepen/salien-bot.git botfiles\%directory% & echo %name% - Bot files downloaded ) else ( echo %name% - Bot files already exist )

call :SetDefaults

goto :eof

::===============================================================================================================::

:UpdateBotFiles

echo.
echo %name% - Updating Bot Files

:: Sets the directory back to the root
cd "%rootdir%"

:: Sets directory to be the same as name if not defined
if not defined directory set directory=%name%

:: Using this to skip as a workaround for issue I was having
if %enabled%==false goto :eof
if %autoupdatebot%==false goto :eof

if exist botfiles\%directory% ( cd botfiles\%directory% & git pull --quiet & echo %name% - Bot files updated ) else ( echo %name% - Bot files don't exist )

call :SetDefaults

goto :eof

::===============================================================================================================::

:StartScript

echo.
echo %name% - Starting bot

:: Sets the directory back to the root
cd "%rootdir%"

:: Sets directory to be the same as name if not defined
if not defined directory set directory=%name%

:: Opens CMD Window > Sets title and color of window > Changes to dir > runs npm install if enabled > starts bot
set commandline="title Sailen Bot - %name% & color %color% & cd botfiles\%directory% & if %npminstall%==true call npm install & node headless & exit"
if %enabled%==true if %minimized%==true (start /min cmd /k  %commandline%) else (start cmd /k %commandline%)

call :SetDefaults

goto :eof

::===============================================================================================================::

:SetDefaults

:: Don't change these
set enabled=false
set minimized=false
set name=untitled
set directory=
set color=0C

goto :eof