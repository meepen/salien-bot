## Headless mode

Headless mode is a version of this game that is ran without a ui, in your command prompt / terminal

Here are the steps to use: 
- Download nodejs - https://nodejs.org
- Download https://github.com/meepen/salien-bot/archive/master.zip
- Extract salien-bot-master.zip
- Open command line in salien-bot-master
- Write 
```
npm install
notepad gettoken.json
```
- Log into Steam
- Open https://steamcommunity.com/saliengame/gettoken in browser with steam logged in
- Copy the entire contents of the page
- Paste into notepad and save the file as `gettoken.json`. 
- (IMPORTANT) Immediately copy something else to avoid accidentally giving this out to someone else!
- Save and exit
- Back to command line:
```
node headless
```
##### If you want automatic restart in case of crash:

Open command line/terminal and write:
```
npm i -g pm2
```
To start bot:
```
pm2 start headless.js
```
![alt-text](https://i.imgur.com/CPTz57y.png)
Now the bot is running. If there is a crash, it restarts itself. You can close command line/terminal (yes, it doesn't require a running cmd window or anything else).

To view the log open the terminal and write:
```
pm2 log
```
To close log use `Ctrl + C`

To stop bot:
```
pm2 delete id/all
```
For fisrt app id is 0, for second - 1... Also, you can see ID in the list of running applications:
To see a list of all running bots:
```
pm2 list
```

### Tile selection

By default it will scour all available planets and get the highest exp rewards from difficult tiles, if you don't want this, run the bot with
```
node headless --care-for-planet
```


## Userscript mode

Salien bot is a WIP for the Salien Minigame that came out for Steam Summer Sale 2018.

I picked this up because it reminded me of a challenge in programming I had before. I won't be manipulating any state, just injecting mouse clicks and other button presses.

To use, copy and paste index.user.js in console, or use GreaseMonkey or TamperMonkey and visit https://github.com/meepen/salien-bot/raw/master/index.user.js

Also, a note: playing this game AT ALL will not net you better rewards! It's only the time you have been on the page. No need to waste computer resources :)

### Tile selection

The tile select code focuses on levelling up to level 13 on hard tiles; after you hit level 9 it will try and target the highest progress tile
