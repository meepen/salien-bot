@echo off

:: Made by Main Fighter [mainfighter.com]
:: Simple start script for meepen's sailen-bot [https://github.com/meepen/salien-bot]
:: v1.7.1 [24-06-2018]

::===============================================================================================================::

:Greeting

:: Calls configuration stuff
call configuration.cmd
@echo %echo%

title "Start script for meepen's sailent-bot"
color 0A

:: Checks
:: NodeJS
node.exe --version >nul 2>nul 
if %errorlevel%==9009 (color 40 & echo [NEEDED] Node is needed for bot & start "" https://nodejs.org/en/ & pause & exit)
:: Git
git.exe --version >nul 2>nul 
if %autodownloadbot%==true if %autoupdatebot%==true if %errorlevel%==9009 (color 40 & echo [OPTIONAL] Git is required for Auto Download and Update functions & set autodownloadbot=false & set autoupdatebot=false & start "" https://git-scm.com/ & pause)

::===============================================================================================================::

:: Sets rootdir var to the currently directory of script
set rootdir=%~dp0

:: Clone botfiles
if %autodownloadbot%==true (
    cd %rootdir%
    call :DownloadBotFiles
    if %debug%==true pause
)

:: Update botfiles
if %autoupdatebot%==true (
    cd %rootdir%
    call :UpdateBotFiles
    if %debug%==true pause
)

:: npm install
if %npminstall%==true (
    cd %rootdir%
    call :npmInstall
    if %debug%==true pause
)

:: Sets up token for all bots
cls
title Bot Token Setup
echo.
echo Setting up bot tokens
cd %rootdir%
for %%a in ("instances\*.cmd") do call :SetDefaults & cd %rootdir% & call "%%a" & call :SetupToken
if %debug%==true pause

:: Start all bots in config
cls
title Bot Start
echo.
echo Starting bots
cd %rootdir%
for %%a in ("instances\*.cmd") do call :SetDefaults & cd %rootdir% & call "%%a" & call :StartScript
if %debug%==true pause

::===============================================================================================================::

:Farewell

exit

::===============================================================================================================::

:DownloadBotFiles

title Bot File Download
cls
echo.
echo Downloading bot files
echo.

:: Checks to make sure botfiles doesn't already exist > if it doesn't it clones the bot files to the botfiles directory
if not exist botfiles ( git clone --quiet https://github.com/meepen/salien-bot.git botfiles ) else ( echo Bot files already exist )

goto :eof

::===============================================================================================================::

:UpdateBotFiles

title Update Bot Files
cls
echo.
echo Updating bot files
echo.

:: Checks if botfiles exists > if it does then update botfiles using git and run npm install
if exist botfiles ( cd botfiles & git pull --quiet ) else ( echo Bot files don't exist )

goto :eof

::===============================================================================================================::

:npmInstall

title Run npm install
cls
echo.
echo Running npm install
echo.

:: Checks if botfiles exists > if exists change to directory and run npm install
if exist botfiles ( cd botfiles & call npm install ) else ( echo Bot files don't exist )

goto :eof

::===============================================================================================================::

:SetupToken

:: Probably not the best way to do it but it works
if %enabled%==false goto :eof

echo.
echo %name% - Setting up token

:: Checks
if not exist "botfiles\%name%.json" if not defined gettoken echo %name% Token not in instance config & goto :eof

:: Checks if gettoken.json exists > if it doesn't write the token from the instance config file
if not exist "botfiles\%name%.json" ( echo %gettoken% >> botfiles\%name%.json & echo %name% - Token setup ) else ( echo %name% - Token already setup )

goto :eof

::===============================================================================================================::

:StartScript

:: Probably not the best way to do it but it works
if %enabled%==false goto :eof

echo.
echo %name% - Starting bot

:: Checks
if not exist "botfiles\%name%.json" ( echo %name% - Token is missing bot not starting & pause & goto :eof )

:: Opens CMD Window > Sets title and color of window > Changes to dir > starts bot
set commandline="title Sailen Bot - %name% & color %color% & cd botfiles & node headless --token %name%.json %botargs% & if %debug%==true pause & exit"
if %minimized%==true (start /min cmd /k  %commandline%) else (start cmd /k %commandline%)

goto :eof

::===============================================================================================================::

:SetDefaults

:: Don't change these
set enabled=false
set gettoken=
set botargs=
set minimized=false
set name=untitled
set color=0C

goto :eof