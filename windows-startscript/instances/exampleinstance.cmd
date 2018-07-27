:: Instuctions
:: To create a bot instance just copy the "Bot Instance Example" below
:: Put it in a new file (make sure it ends in .cmd) inside the instances folder
:: Do that for as many bot instances as you want

:: Bot Configuration Options
:: You can leave any of them out and they will just use default settings
:: enabled; whether the instance is enabled or not
:: base64token; uses --token-json base64 token, leave this blank if you don't know what it is
:: gettoken; paste your token here
:: botargs; put any arguments you want to use for the bot [eg: --care-for-planet, --log]
:: minimized; whether the cmd window starts minimized or not
:: name; name of the instance, will determine the name of the token file
:: color; colors in the cmd window

:: Bot Instance Example
set enabled=false
set base64token=
set gettoken={"webapi_host":"https:\/\/community.steam-api.com\/","webapi_host_secure":"https:\/\/community.steam-api.com\/","token":"not_a_real_token","steamid":"not_a_real_steamid","persona_name":"example","success":1}
set botargs=
set minimized=false
set name=example
set color=0A
