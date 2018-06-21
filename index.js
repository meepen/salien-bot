(function(context) {
const pixi = gApp;
const GAME = gGame;
const SERVER = gServer;
const PLAYER = gPlayerInfo;
const SetMouse = function SetMouse(x, y) {
    pixi.renderer.plugins.interaction.mouse.global.x = x;
    pixi.renderer.plugins.interaction.mouse.global.y = y;
}
const EnemyManager = function EnemyManager() {
    return GAME.m_State.m_EnemyManager;
}
const AttackManager = function AttackManager() {
    return GAME.m_State.m_AttackManager;
}
const TryContinue = function Continue() {
    let continued = false;
    if (GAME.m_State.m_VictoryScreen) {
        GAME.m_State.m_VictoryScreen.children.forEach(function(child) {
            if (child.visible && child.x == 155 && child.y == 300) {// TODO: not this
                continued = true;
                child.click();
            }
        })
    }
    if (GAME.m_State.m_LevelUpScreen) {
        continued = false;
        GAME.m_State.m_LevelUpScreen.children.forEach(function(child) {
            if (child.visible && child.x == 155 && child.y == 300) {// TODO: not this
                continued = true;
                child.click();
            }
        })
    }
    if(GAME.m_State instanceof CBootState) { //First screen
        GAME.ChangeState( new CBattleSelectionState( PLAYER.active_planet ) );
        continued = true;
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
    let bestZoneIdx = -1;
    let maxProgress = 0;

    for (let idx = 0; idx < GAME.m_State.m_Grid.m_Tiles.length; idx++) { 
        let zone = GAME.m_State.m_Grid.m_Tiles[idx].Info;
        if(!zone.captured) {
            if(zone.boss) {
                return idx;
            }

            if(zone.progress > maxProgress) {
                maxProgress = zone.progress;
                bestZoneIdx = idx;
            }

        }
    }

    if(bestZoneIdx > -1) {
        console.log(`zone ${bestZoneIdx} progress: ${GAME.m_State.m_Grid.m_Tiles[bestZoneIdx].Info.progress}`);
    }

    return bestZoneIdx;
}

// Let's challenge ourselves to be human here!
const CLICKS_PER_SECOND = 10;

const InGame = function InGame() {
    return GAME.m_State.m_bRunning;
}

const InZoneSelect = function InZoneSelect() {
    return GAME.m_State instanceof CBattleSelectionState;
}

const WORST_SCORE = -1 / 0;
const START_POS = pixi.renderer.width;

// context.lastZoneIndex;
let isJoining = false;

const EnemySpeed = function EnemySpeed(enemy) {
    return enemy.m_Sprite.vx;
}
const EnemyDistance = function EnemyDistance(enemy) {
    return (enemy.m_Sprite.x - k_nDamagePointx) / (START_POS - k_nDamagePointx);
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

// the '1' button (SlimeAttack PsychicAttack BeastAttack - depends on body type of your salien)
class SpecialAttack extends Attack {
    getCurrent() {
        if (gSalien.m_BodyType == "slime")
            return "slimeattack";
        else if (gSalien.m_BodyType == "beast")
            return "beastattack";
        else
            return "psychicattack";
    }
    getData() {
        return AttackManager().m_AttackData[this.getCurrent()];
    }
    shouldAttack(delta) {
        return CanAttack(this.getCurrent());
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
            this.attack(target.m_Sprite.x, target.m_Sprite.y);
    }
    attack(x, y) {
        SetMouse(x, y)
        AttackManager().m_mapKeyCodeToAttacks.get(this.getData().keycode)()
    }
}

class BombAttack extends SpecialAttack {
    getCurrent() {
        return "explosion";
    }
}
class BlackholeAttack extends SpecialAttack {
    getCurrent() {
        return "blackhole";
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
    new BlackholeAttack()
]

if (context.BOT_FUNCTION) {
    pixi.ticker.remove(context.BOT_FUNCTION);
    context.BOT_FUNCTION = undefined;
}

context.BOT_FUNCTION = function ticker(delta) {
    delta /= 100;

    if(GAME.m_IsStateLoading) {
        return;
    }

    if (InZoneSelect() && !isJoining) {
        let bestZoneIdx = GetBestZone();
        if(bestZoneIdx > -1) {
            isJoining = true;
            console.log("join to zone", bestZoneIdx);
             SERVER.JoinZone(
                bestZoneIdx,
                function (results) {
                    GAME.ChangeState(new CBattleState(GAME.m_State.m_PlanetData, bestZoneIdx));
                },
                GameLoadError
            );    

            return;    
        }
    }

    if (!InGame()) {
        if (TryContinue()) {
            console.log("continued!");
        }
        return;
    }

    isJoining = false;

    let state = EnemyManager();

    let enemies = state.m_rgEnemies;

    for (let attack of attacks)
        if (attack.shouldAttack(delta, enemies))
            attack.process(enemies);

    let buttonsOnErrorMessage = document.getElementsByClassName("btn_grey_white_innerfade btn_medium");
    if(buttonsOnErrorMessage.length > 0) {
        buttonsOnErrorMessage[0].click();
    }

}


pixi.ticker.add(context.BOT_FUNCTION);

})(window);