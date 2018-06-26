# Salien Bot

Salien Bot is a WIP bot for the Salien Minigame that came out for the Steam Summer Sale 2018.

I picked this up because it reminded me of a challenge in programming I had before. I won't be manipulating any state, just injecting mouse clicks and other button presses.

Also, a note: playing this game AT ALL will not net you better rewards! It's only the time you have been on the page. There's no need to waste computer resources. :)


## Userscript Mode

Userscript Mode is a version of this bot that is ran as a script on top of your browser, while having a tab with the game open. It is generally easier to use.

Here are the steps to use: 

- Download and install the TamperMonkey addon for your browser of choice - https://tampermonkey.net/
- Open this link: https://github.com/meepen/salien-bot/raw/master/index.user.js with TamperMonkey installed; it should open up a tab that prompts you to install the script
- And finally, go to the Saliens game page!

It should be running now!

### Tile Selection

The tile select code, in this version, focuses on leveling up to level 13 on hard tiles; after you hit level 13 it will try and target the highest progress tile.


## Headless Mode

Headless Mode is a version of this game that is ran without a UI with the bot controlling it, in your command prompt / terminal / shell / etc.

Here are the steps to use: 

- Download and install nodejs - https://nodejs.org
- Download https://github.com/meepen/salien-bot/archive/master.zip
- Extract salien-bot-master.zip
- Open command line in salien-bot-master
- Write:
```
npm install
notepad gettoken.json
```
- Log into Steam
- Open https://steamcommunity.com/saliengame/gettoken in browser with Steam logged in
- Copy the entire contents of the page
- Paste into notepad and save the file as `gettoken.json`. 
- (IMPORTANT) Immediately copy something else to avoid accidentally giving this out to someone else!
- Save and exit
- Back to command line:
```
node headless
```

- (optional) See detailed bot options
```
node headless --help
```

It should be running now!

### Tile Selection

This version, by default, will scour all available planets and get the highest EXP rewards from difficult tiles; if you don't want this, run the bot with:
```
node headless --care-for-planet
```
This will make the bot only use the last planet which you were on and allows you to select the planet for the bot to focus on by first logging onto the Steam website and selecting a planet.

### 24/7 operation with PM2 on Linux
if you want to run the bot in background without an open terminal
- You need nodejs (anyway for the salien-bot)
- install PM2:
``` sudo npm install pm2@latest -g```
- go into the salien-bot directory
- start PM2 and create salien-bot process
``` pm2 start headless --name "SalienBot" ```
- "SalienBot" stands for the process name - you can change it
- you can write ```pm2 log``` to see all Logs or ```pm2 log $process_name``` to only get output of the SalienBot
- You have to replace $process_name with your process name (example name from above "SalienBot"): ``` pm2 log SalienBot```
```
if you kill PM2 (for example, a reboot) you have to re-create the process (see above) or run PM2 on startup
```
##### run PM2 on startup
- run ```pm2 startup```
- you get something like this:
```
[PM2] Init System found: systemd
[PM2] To setup the Startup Script, copy/paste the following command:
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -                         u pi --hp /home/pi
```
- you have to run the given command and follow the given instructions
- for example ```sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -                         u pi --hp /home/pi``` copy/paste and execute your command (what you got after ```pm2 startup```) and not this example
- if you already created a process with the salien bot run:
```pm2 save```
- pm2 saves the process and will start it again and again
- if you don't have a process, see above


