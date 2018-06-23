// ==UserScript==
// @name         Saliens bot
// @namespace    http://tampermonkey.net/
// @version      24
// @description  Beat all the saliens levels
// @author       https://github.com/meepen/salien-bot
// @match        https://steamcommunity.com/saliengame
// @match        https://steamcommunity.com/saliengame/
// @match        https://steamcommunity.com/saliengame/play
// @match        https://steamcommunity.com/saliengame/play/
// @grant        none
// ==/UserScript==


if (typeof GM_info !== "undefined" && (GM_info.scriptHandler || "Greasemonkey") == "Greasemonkey") {
    alert("It's not possible to support Greasemonkey, please try Tampermonkey or ViolentMonkey.");
}

(function(context) {
"use strict";

const MAX_LEVEL = 13;

// reload automatically instead of clicking ok
context.error = context.GameLoadError = function() {
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

SERVER._ReportScore = SERVER._ReportScore || SERVER.ReportScore;
SERVER.ReportScore = function ReportScore(nScore, callback, error) {
    return this._ReportScore(nScore, function ReportScore_callback(results) {
        let response = results.response;
        console.log(`Server reported level ${response.new_level} (${response.new_score} / ${response.next_level_score})`)
        return callback(results);
    }, function ReportScore_error() {
        console.log(arguments);
        if (error)
            error.apply(null, arguments);
    });
}

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
                }, 6000);
		setTimeout(() => {
		    child.pointertap();
                }, 5000);
            }
        })
    }
    if (GAME.m_State.m_LevelUpScreen) {
        continued = false;
        GAME.m_State.m_LevelUpScreen.children.forEach(function(child) {
            if (child.visible && child.x == 155 && child.y == 300) {// TODO: not this
                continued = true;
                isJoining = true;
                child.pointertap();
                setTimeout(() => {
                    isJoining = false
                }, 6000);
		setTimeout(() => {
		    child.pointertap();
                }, 5000);
            }
        })
    }
    if (gServer.m_WebAPI && GAME.m_State instanceof CBootState) { // First screen
        isJoining = true;
        setTimeout(() => isJoining = false, 1000);
        GAME.m_State.button.click();
    }
    if (GAME.m_State instanceof CPlanetSelectionState && !isJoining) { // Planet Selection
        GAME.m_State.m_rgPlanetSprites[0].pointertap();
        isJoining = true;
        setTimeout(() => isJoining = false, 1000);
        continued = true;
    }
    if (GAME.m_State instanceof CBattleSelectionState && !isJoining) {
        let bestZoneIdx = GetBestZone();
        if(bestZoneIdx) {
            console.log("join to zone", bestZoneIdx);
            isJoining = true;
            GAME.m_State.m_Grid.click(bestZoneIdx % k_NumMapTilesW, (bestZoneIdx / k_NumMapTilesW) | 0);
            setTimeout(() => isJoining = false, 1000);
        }
        else {
            isJoining = true;
            GAME.m_State.m_LeaveButton.click();
            console.log("Leaving planet, no zones left");
            setTimeout(() => {
                window.location.reload();
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

const BlackholeOfEnemy = function BlackholeOfEnemy(enemy) {
    for(var [_, blackhole] of AttackManager().m_mapBlackholes) {
        // Check if enemy is very close to blackhole
        if ( EnemyCenter(enemy)[0] < blackhole.x || EnemyCenter(enemy)[0] > blackhole.x ||
             EnemyCenter(enemy)[1] < blackhole.y || EnemyCenter(enemy)[1] > blackhole.y ) {
            return blackhole;
        }
    }
    return null;
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
        enemy.m_Sprite.pointertap();
        this.nextAttackDelta = 1 / CLICKS_PER_SECOND;
    }
}

class ProjectileAttack extends Attack {
    targetPosition(target) {
        return EnemyCenter(target);
    }
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

        if (target) {
            this.attack.apply(this, this.targetPosition(target));
        }
    }
    attack(x, y) {
        SetMouse(x, y)
        AttackManager().m_mapKeyCodeToAttacks.get(this.getAttackData().keycode)()
    }
}

// the '1' button (SlimeAttack PsychicAttack BeastAttack - depends on body type of your salien)
class SpecialAttack extends ProjectileAttack {

    targetPosition(target) {
        var finalTargetPosition = EnemyCenter(target);

        // SpecialAttack's projectile is quite slow, so we need to aim ahead of the target
        finalTargetPosition[0] += 50*EnemySpeed(target);

        // If target is stuck in blackhole, shoot at black hole instead
        var blackhole = BlackholeOfEnemy(target);
        if(blackhole != null) {
            finalTargetPosition = [blackhole.x, blackhole.y];
        }

        return finalTargetPosition;
    }

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

    if (GAME.m_IsStateLoading) {
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
