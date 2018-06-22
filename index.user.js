// ==UserScript==
// @name         Saliens bot
// @namespace    http://tampermonkey.net/
// @version      16
// @description  Beat all the saliens levels
// @author       https://github.com/meepen/salien-bot
// @match        https://steamcommunity.com/saliengame
// @match        https://steamcommunity.com/saliengame/
// @match        https://steamcommunity.com/saliengame/play
// @match        https://steamcommunity.com/saliengame/play/
// @downloadURL  https://github.com/meepen/salien-bot/raw/master/index.user.js
// @updateURL    https://github.com/meepen/salien-bot/raw/master/index.user.js
// @grant        none
// ==/UserScript==

const MAX_LEVEL = 13;

// Greasemonkey notice if detected, show an info popup with alternatives, stop game loading 
if (typeof GM_info !== "undefined" && (GM_info.scriptHandler || "Greasemonkey") == "Greasemonkey") {
    window.onload = function () {
        var e = document.head || document.getElementsByTagName("head")[0],
            t = document.createElement("style");
        t.type = "text/css";
        t.appendChild(document.createTextNode('.overlay{position:absolute;top:0;bottom:0;left:0;right:0;background:rgba(0,0,0,.5);transition:opacity .2s;visibility:hidden;opacity:0}.overlay .cancel{position:absolute;width:100%;height:100%;cursor:default}.overlay:target{visibility:visible;opacity:1}.popup{margin:15% auto;padding:30px;border-radius:15px;background:#fff;border:1px solid #666;width:350px;box-shadow:0 0 50px rgba(255,255,255,.2);position:relative}.popup h2{margin-top:0;}.popup .close{position:absolute;width:20px;height:20px;top:20px;right:20px;opacity:.8;transition:all .2s;font-size:24px;font-weight:700;text-decoration:none;color:#666}.popup .close:hover{opacity:1}.popup .content{max-height:450px;overflow:auto}'));
        e.appendChild(t);

        function o() {
            document.getElementById("popup2").style.visibility = "hidden";
            document.getElementById("popup2").style.opacity = "0";
            window.location.assign('https://steamcommunity.com/');
        }

        document.getElementById("salien_game_placeholder").remove();
        document.getElementsByClassName("responsive_page_content")[0].innerHTML += '<div id="popup2" class="overlay "> <a class="cancel" href="#"></a> <div class="popup"> <h2 style="margin-bottom:10px; text-align: center; color: black;">Sorry, <strong>Greasemonkey</strong> is not supported! <br> <small>Please use one of the alternatives!</small><br></h2> <div class="content" style="text-align: center;"> <a style="padding: 10px; border-radius: 10px; border: solid 1px darkgrey; color: black; font-weight: bold; text-decoration: none; background: #ccc; display: inline-block; margin: 5px;" href="http://tampermonkey.net/">Tampermonkey</a> <a style="padding: 10px; border-radius: 10px; border: solid 1px darkgrey; color: black; font-weight: bold; text-decoration: none; background: #ccc; display: inline-block; margin: 5px;" href="https://violentmonkey.github.io/">Violentmonkey</a> <a class="cancel" style="padding: 10px; border-radius: 10px; border: solid 1px darkgrey; color: black; font-weight: bold; text-decoration: none; background: #ccc; display: block; width: unset; height: unset; margin: 5px; position: initial;" href="#">Cancel</a> </div></div></div>';
        document.getElementById("popup2").style.visibility = "unset";
        document.getElementById("popup2").style.opacity = "1";
        document.getElementsByClassName("cancel")[0].addEventListener("click", o);
        document.getElementsByClassName("cancel")[1].addEventListener("click", o);
    };
    (function(context) {
        context.gApp = context.gGame = context.gServer = context.PIXI = undefined;
    })(window);
    throw new Error('Greasemonkey UserScript Manager detected. Aborting.');
}

(function(context) {
"use strict";

// reload automatically instead of clicking ok
GameLoadError = function() {
	window.location.reload();
}

// when the error is fixed we should remove the following
CSalien.prototype.UpdateCustomizations = function()
{
    this.SetBodyType(BODY_TYPES[gSalienData.body_type]);
    this.LoadAttachments();
}
const APP = context.gApp;
const GAME = context.gGame;
const SERVER = context.gServer;
const PIXI = context.PIXI;

const Option = function Option(name, def) {
    if (window.localStorage[name] === undefined) {
        context.localStorage[name] = def;
    }
    return context.localStorage[name];
}
Option("forceLevellingMode", false);
const SetMouse = function SetMouse(x, y) {
    APP.renderer.plugins.interaction.mouse.global.x = x;
    APP.renderer.plugins.interaction.mouse.global.y = y;
}
const EnemyManager = function EnemyManager() {
    return GAME.m_State.m_EnemyManager;
}
const AttackManager = function AttackManager() {
    return GAME.m_State.m_AttackManager;
}

let isJoining = false;
const TryContinue = function TryContinue() {
    let continued = false;
    if (isJoining) 
        return continued;
    if (GAME.m_State.m_VictoryScreen) {
        GAME.m_State.m_VictoryScreen.children.forEach(function(child) {
            if (child.visible && child.x == 155 && child.y == 300) {// TODO: not this
                continued = true;
                isJoining = true;
                setTimeout(() => {
                    isJoining = false
                }, 1000);
                child.click();
            }
        })
    }
    if (GAME.m_State.m_LevelUpScreen) {
        continued = false;
        GAME.m_State.m_LevelUpScreen.children.forEach(function(child) {
            if (child.visible && child.x == 155 && child.y == 300) {// TODO: not this
                continued = true;
                isJoining = true;
                child.click();
                setTimeout(() => {
                    isJoining = false
                }, 1000);
            }
        })
    }
    if (GAME.m_State instanceof CBootState) { // First screen
        GAME.m_State.button.click();
    }
    if (GAME.m_State instanceof CPlanetSelectionState && !isJoining) { // Planet Selectiong
        GAME.m_State.m_rgPlanetSprites[0].click();
        isJoining = true;
        setTimeout(() => isJoining = false, 1000);
        continued = true;
    }
    if (GAME.m_State instanceof CBattleSelectionState && !isJoining) {
        let bestZoneIdx = GetBestZone();
        if(bestZoneIdx) {
            console.log(GAME.m_State.m_SalienInfoBox.m_LevelText.text, GAME.m_State.m_SalienInfoBox.m_XPValueText.text);
            console.log("join to zone", bestZoneIdx);
            isJoining = true;
            SERVER.JoinZone(
                bestZoneIdx,
                (results) => {
                    GAME.ChangeState(new CBattleState(GAME.m_State.m_PlanetData, bestZoneIdx));
                    isJoining = false;
                    console.log(results);
                },
                () => {
                    console.log("fail");
                    isJoining = false;
                }
            );
        }
        else {
            isJoining = true;
            GAME.m_State.m_LeaveButton.click()
            console.log("Leaving planet, no zones left");
            setTimeout(() => {
                isJoining = false
            }, 1000);
        }
        console.log(bestZoneIdx);
        return;
    }
    return continued;
}
const CanAttack = function CanAttack(attackname) {
    let Manager = AttackManager().m_mapCooldowns.get(attackname);
    let lastUsed = Manager.m_rtAttackLastUsed;
    let canAttack = Manager.BAttack();
    Manager.m_rtAttackLastUsed = lastUsed;
    return canAttack;
}
const GetBestZone = function GetBestZone() {
    let bestZoneIdx;
    let highestDifficulty = -1;

    let isLevelling = context.gPlayerInfo.level < MAX_LEVEL || Option("forceLevellingMode");
    let maxProgress = isLevelling ? 10000 : 0;

    for (let idx = 0; idx < GAME.m_State.m_Grid.m_Tiles.length; idx++) {
        let zone = GAME.m_State.m_Grid.m_Tiles[idx].Info;
        if (!zone.captured) {
            if (zone.boss) {
                console.log(`zone ${idx} (${bestZoneIdx % k_NumMapTilesW}, ${(bestZoneIdx / k_NumMapTilesW) | 0}) with boss`);
                return idx;
            }

            if(isLevelling) {
                if(zone.difficulty > highestDifficulty) {
                    highestDifficulty = zone.difficulty;
                    maxProgress = zone.progress;
                    bestZoneIdx = idx;
                } else if(zone.difficulty < highestDifficulty) continue;

                if(zone.progress < maxProgress) {
                    maxProgress = zone.progress;
                    bestZoneIdx = idx;
                }
            } else {
                if(zone.progress > maxProgress) {
                    maxProgress = zone.progress;
                    bestZoneIdx = idx;
                }
            }

        }
    }

    if(bestZoneIdx !== undefined) {
        console.log(`${GAME.m_State.m_PlanetData.state.name} zone ${bestZoneIdx} (${bestZoneIdx % k_NumMapTilesW}, ${(bestZoneIdx / k_NumMapTilesW) | 0}) progress: ${GAME.m_State.m_Grid.m_Tiles[bestZoneIdx].Info.progress} difficulty: ${GAME.m_State.m_Grid.m_Tiles[bestZoneIdx].Info.difficulty}`);
    }

    return bestZoneIdx;
}
const GetBestPlanet = function GetBestPlanet() {
    let bestPlanet;
    let maxProgress = 0;

    if (!GAME.m_State.m_mapPlanets)
        return;

    for (let planetKV of GAME.m_State.m_mapPlanets) {
        let planet = planetKV[1];
        if(planet.state.active && !planet.state.captured && planet.state.capture_progress > maxProgress) {
            maxProgress = planet.state.capture_progress;
            bestPlanet = planet;
        }

    }

    if(bestPlanet) {
        console.log(`selecting planet ${bestPlanet.state.name} with progress: ${bestPlanet.state.capture_progress}`);
        return bestPlanet.id;
    }
}

// Let's challenge ourselves to be human here!
const CLICKS_PER_SECOND = 15;

const InGame = function InGame() {
    return GAME.m_State.m_bRunning;
}

const WORST_SCORE = -1 / 0;
const START_POS = APP.renderer.width;


const EnemySpeed = function EnemySpeed(enemy) {
    return enemy.m_Sprite.vx;
}
const EnemyDistance = function EnemyDistance(enemy) {
    return (enemy.m_Sprite.x - k_nDamagePointx) / (START_POS - k_nDamagePointx);
}

const EnemyCenter = function EnemyCenter(enemy) {
    return [
        enemy.m_Sprite.x + enemy.m_Sprite.width / 2,
        enemy.m_Sprite.y + enemy.m_Sprite.height / 2
    ];
}


class Attack {
    constructor() {
        this.nextAttackDelta = 0;
    }
    shouldAttack(delta, enemies) {
        throw new Error("shouldAttack not implemented");
    }
    process(enemies) {
        throw new Error("process not implemented");
    }
    getAttackName() {
        throw new Error("no current attack name");
    }
    canAttack() {
        return CanAttack(this.getAttackName());
    }
    getAttackData() {
        return AttackManager().m_AttackData[this.getAttackName()];
    }
}

// Basic clicking attack, attack closest
class ClickAttack extends Attack {
    shouldAttack(delta) {
        // Can't do basic attack when station is down
        if (GAME.m_State.m_PlayerHealth <= 0)
            return false;
        this.nextAttackDelta -= delta;
        return this.nextAttackDelta <= 0;;
    }
    score(enemy) {
        if (enemy.m_bDead)
            return WORST_SCORE;
        return 1 - EnemyDistance(enemy);
    }
    process(enemies) {
        let target, target_score = WORST_SCORE;

        enemies.forEach((enemy) => {
            if (!enemy.m_Sprite.visible)
                return;
            let now_score = this.score(enemy);
            if (now_score > target_score) {
                target = enemy, target_score = now_score;
            }
        });

        if (target)
            this.attack(target);
    }
    attack(enemy) {
        enemy.m_Sprite.click();
        this.nextAttackDelta = 1 / CLICKS_PER_SECOND;
    }
}

class ProjectileAttack extends Attack {
    shouldAttack(delta) {
        return CanAttack(this.getAttackName());
    }
    score(enemy) {
        if (enemy.m_bDead)
            return WORST_SCORE;
        return enemy.m_nHealth;
    }
    process(enemies) {
        let target, target_score = WORST_SCORE;

        enemies.forEach((enemy) => {
            if (!enemy.m_Sprite.visible)
                return;
            let now_score = this.score(enemy);
            if (now_score > target_score) {
                target = enemy, target_score = now_score;
            }
        });

        if (target)
            this.attack.apply(this, EnemyCenter(target));
    }
    attack(x, y) {
        SetMouse(x, y)
        AttackManager().m_mapKeyCodeToAttacks.get(this.getAttackData().keycode)()
    }
}

// the '1' button (SlimeAttack PsychicAttack BeastAttack - depends on body type of your salien)
class SpecialAttack extends ProjectileAttack {
    getAttackName() {
        if (gSalien.m_BodyType == "slime")
            return "slimeattack";
        else if (gSalien.m_BodyType == "beast")
            return "beastattack";
        else
            return "psychicattack";
    }
}

class BombAttack extends ProjectileAttack {
    getAttackName() {
        return "explosion";
    }
}
class BlackholeAttack extends ProjectileAttack {
    getAttackName() {
        return "blackhole";
    }
}
class MeteorAttack extends ProjectileAttack {
    getAttackName() {
        return "boulder";
    }
}

class FreezeAttack extends Attack {
    getCurrent() {
        return "flashfreeze";
    }
    shouldAttack(delta, enemies) {
        let shouldAttack = false;
        if (CanAttack(this.getCurrent())) {
            enemies.forEach((enemy) => {
                if (EnemyDistance(enemy) <= 0.05) {
                    shouldAttack = true;
                }
            });
        }
        return shouldAttack;
    }
    getData() {
        return AttackManager().m_AttackData[this.getCurrent()];
    }
    process() {
        AttackManager().m_mapKeyCodeToAttacks.get(this.getData().keycode)()
    }
}

let attacks = [
    new ClickAttack(),
    new SpecialAttack(),
    new FreezeAttack(),
    new BombAttack(),
    new MeteorAttack(),
    new BlackholeAttack()
]

if (context.BOT_FUNCTION) {
    APP.ticker.remove(context.BOT_FUNCTION);
    context.BOT_FUNCTION = undefined;
}

let reloadingPage = false;

context.BOT_FUNCTION = function ticker(delta) {
    delta /= 100;

    let difficulties = PIXI.loader.resources['level_config'];
    if (difficulties)
        for (let difficulty in difficulties.data) {
            let freq = difficulties.data[difficulty].enemies.spawn_frequency;
            freq.min = freq.max;
        }

    let buttonsOnErrorMessage = document.getElementsByClassName("btn_grey_white_innerfade btn_medium");
    if(buttonsOnErrorMessage[0] != null) {
        if (!reloadingPage) {
            setTimeout(() => buttonsOnErrorMessage[0].click(), 1000);
        }

        return;
    }

    if(GAME.m_IsStateLoading || !context.gPlayerInfo) {
        return;
    }

    if (!InGame()) {
        if (TryContinue()) {
            console.log("continued!");
        }
        return;
    }



    let state = EnemyManager();

    let enemies = state.m_rgEnemies;

    for (let attack of attacks)
        if (attack.shouldAttack(delta, enemies))
            attack.process(enemies);

}


APP.ticker.add(context.BOT_FUNCTION);

})(window);
