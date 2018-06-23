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
```
- Open https://steamcommunity.com/saliengame/gettoken in browser while logged into Steam
- Copy the entire contents of the page
- Paste into notepad and save the file as `gettoken.json`. 
  - (IMPORTANT) Immediately copy something else to avoid accidentally giving this out to someone else!
- Save and exit
- Back to command line:
```
node headless.js
```

It should be running now!

### salien-bot

Salien bot is a WIP for the Salien Minigame that came out for Steam Summer Sale 2018.

I picked this up because it reminded me of a challenge in programming I had before. I won't be manipulating any state, just injecting mouse clicks and other button presses.

To use, copy and paste index.user.js in console, or use GreaseMonkey or TamperMonkey and visit https://github.com/meepen/salien-bot/raw/master/index.user.js

Also, a note: playing this game AT ALL will not net you better rewards! It's only the time you have been on the page. No need to waste computer resources :)

## Tile selection

Currently, the tile select code focuses on levelling up to level 9 on hard tiles; after you hit level 9 it will try and target the highest progress tile
