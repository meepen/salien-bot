@echo off

:: Made by Main Fighter [mainfighter.com]
:: Simple start script for meepen's sailen-bot [https://github.com/meepen/salien-bot]
:: v1.7.6 [24-06-2018]

::===============================================================================================================::

:Greeting

call configuration.cmd 
@echo %echo%

title Start script for meepen's sailens-bot
color %cmdcolor%

:: Checks
:: NodeJS
node.exe --version >nul 2>nul 
if %errorlevel%==9009 ( set error=NodeJS not found & set fatal=true & start "" https://nodejs.org/en/ & call :ErrorScreen )
:: Git
git.exe --version >nul 2>nul 
if %autodownloadbot%==true if %autoupdatebot%==true if %errorlevel%==9009 ( set error=Git not found & set autodownloadbot=false & set autoupdatebot=false & start "" https://git-scm.com/ & call :ErrorScreen )

::===============================================================================================================::

:: Sets rootdir var to the currently directory of script
set rootdir=%~dp0

:: Kill running bots
if %killrunning%==true (
    color %cmdcolor%
    title Start Script for meepen's sailens-bot - Kill Running Bots
    echo.
    echo Killing running bots
    echo.
    cd "%rootdir%"
    call :KillRunning
    if %debug%==true pause
    cls 
)

:: Clone botfiles
if %autodownloadbot%==true (
    color %cmdcolor%
    title Start Script for meepen's sailens-bot - Download Files
    echo.
    echo Downloading bot files
    echo.
    cd "%rootdir%"
    call :DownloadBotFiles
    if %debug%==true pause
    cls
)

:: Checks if bot files exist, if they don't the script will throw fatal error
if not exist "%botdirectory%" ( 
    set error=%botdirectory% not found 
    set fatal=true
    
    if not exist "%botdirectory%\headless.js" ( 
        set error2=%botdirectory%\headless.js not found 
        set fatal=true 
    )
    
    call :ErrorScreen
    if %debug%==true pause
    cls
)

:: Update botfiles
if %autoupdatebot%==true (
    color %cmdcolor%
    title Start Script for meepen's sailens-bot - Update Files
    echo.
    echo Updating bot files
    echo.
    cd "%rootdir%"
    call :UpdateBotFiles
    if %debug%==true pause
    cls
)

:: npm install
if %npminstall%==true (
    color %cmdcolor%
    title Start Script for meepen's sailens-bot - NPM Install
    echo.
    echo Running npm install
    echo.
    cd "%rootdir%"
    call :npmInstall
    if %debug%==true pause
    cls
)

:: Sets up token for all bots
color %cmdcolor%
title Start Script for meepen's sailens-bot - Token Setup
echo.
echo Setting up bot tokens
cd "%rootdir%"
for %%a in ("instances\*.cmd") do call :SetDefaults & cd "%rootdir%" & call "%%a" & call :SetupToken
echo.
echo All bot tokens setup
if %debug%==true pause
cls

:: Start all bots in config
color %cmdcolor%
title Start Script for meepen's sailens-bot - Start Bots
echo.
echo Starting bots
cd "%rootdir%"
for %%a in ("instances\*.cmd") do call :SetDefaults & cd "%rootdir%" & call "%%a" & call :StartScript
echo.
echo All bots started
if %debug%==true pause
cls

::===============================================================================================================::

:Farewell

exit

::===============================================================================================================::

:KillRunning

:: Actual script stuff
:: Should only kill Sailen Bot instances
:: Might improve later, only really adding it for myself
taskkill /f /im cmd.exe /fi "WINDOWTITLE eq Sailen Bot*" & taskkill /f /im node.exe /fi "WINDOWTITLE eq Sailen Bot*" & echo Bots killed

goto :eof

::===============================================================================================================::

:DownloadBotFiles

:: Actual script stuff
:: Checks to make sure botfiles doesn't already exist > if it doesn't it clones the bot files to the botfiles directory
if not exist "%botdirectory%" ( git clone --quiet https://github.com/meepen/salien-bot.git "%botdirectory%" & echo Bot files downloaded ) else ( echo Bot files already exist )

goto :eof

::===============================================================================================================::

:UpdateBotFiles

:: Actual script stuff
:: Checks if botfiles exists > if it does then update botfiles using git
if exist "%botdirectory%" ( cd "%botdirectory%" & git pull --quiet & echo Bot files updated ) else ( echo Bot files don't exist )

goto :eof

::===============================================================================================================::

:npmInstall

:: Actual script stuff
:: Checks if botfiles exists > if exists change to directory and run npm install
if exist "%botdirectory%" ( cd "%botdirectory%" & call npm install & @echo %echo% & echo NPM install finished ) else ( echo Bot files don't exist )

goto :eof

::===============================================================================================================::

:SetupToken

echo.

:: Probably not the best way to do it but it works
if %name%==untitled ( goto :eof )
if %enabled%==false ( echo %name% - Disabled & goto :eof )

echo %name% - Setting up token

:: Checks
:: If base64token is defined it will skip setting up the token
if defined base64token ( echo %name% - Using Base64 token & goto :eof )
if not exist "%tokendirectory%\%name%.json" if not defined gettoken ( echo %name% - Token not configured & goto :eof )

:: Actual script stuff
:: Creates tokens directory if it doesn't exist
if not exist "%tokendirectory%" ( mkdir "%tokendirectory%" )
:: Checks if gettoken.json exists for instance > if it doesn't write the token from the instance config file
if not exist "%tokendirectory%\%name%.json" ( echo %gettoken% >> "%tokendirectory%\%name%.json" & echo %name% - Token setup ) else ( echo %name% - Token already setup )

goto :eof

::===============================================================================================================::

:StartScript

echo.

:: Probably not the best way to do it but it works
if %name%==untitled ( goto :eof )
if %enabled%==false ( echo %name% - Disabled & goto :eof )

echo %name% - Starting bot

:: Checks
:: Skips starting bot if base64token or no token file configured
if not defined base64token if not exist "%tokendirectory%\%name%.json" ( echo %name% - Token not configured & pause & goto :eof )

:: Actual script stuff
:: Opens CMD Window > Sets title and color of window > Changes to dir > starts bot
if defined base64token ( set botcommandline=--token-json %base64token% %botargs% ) else ( set botcommandline=--token ..\%tokendirectory%\%name%.json %botargs% )
set commandline="title Sailen Bot - %name% & color %color% & cd %botdirectory% & node headless %botcommandline% & if %debug%==true pause & exit"
if %minimized%==true (start /min cmd /k  %commandline%) else (start cmd /k %commandline%)

goto :eof

::===============================================================================================================::

:ErrorScreen

cls
color 47
if %fatal%==true ( title %name% - ERROR ) else ( title %name% - FATAL ERROR )
echo.
if %fatal%==true ( echo FATAL ERROR & echo %error% & if defined error2 echo %error2% ) else ( echo ERROR & echo %error% & if defined error2 echo %error2% )
echo.

pause
if %fatal%==true exit

set error=unknown
set error2=
set fatal=false

goto :eof

::===============================================================================================================::

:SetDefaults

:: Don't change these
set enabled=false
set base64token=
set gettoken=
set botargs=
set minimized=false
set name=untitled
set color=0C

goto :eof