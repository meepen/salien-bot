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

- Download nodejs - https://nodejs.org
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

It should be running now!

### Tile Selection

This version, by default, will scour all available planets and get the highest EXP rewards from difficult tiles; if you don't want this, run the bot with:
```
node headless --care-for-planet
```
This will make the bot only use the last planet which you were on and allows you to select the planet for the bot to focus on by first logging onto the Steam website and selecting a planet.
