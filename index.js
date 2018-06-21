(function(context) {
const pixi = gApp;
const GAME = gGame;
const SERVER = gServer;
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
    if (GAME.m_State.m_LevelUpScreen)
        continued = false;
        GAME.m_State.m_LevelUpScreen.children.forEach(function(child) {
            if (child.visible && child.x == 155 && child.y == 300) {// TODO: not this
                continued = true;
                child.click();
            }
        })
    }
    return continued;
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

let lastZoneIndex;
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
    shouldAttack(delta) {
        throw new Error("shouldAttack not implemented");
    }
    process(enemies) {
        throw new Error("process not implemented");
    }
}

// Basic clicking attack, attack closest
class ClickAttack extends Attack {
    shouldAttack(delta) {
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
        let Manager = AttackManager().m_mapCooldowns.get(this.getCurrent());
        let lastUsed = Manager.m_rtAttackLastUsed;
        let canAttack = Manager.BAttack();
        Manager.m_rtAttackLastUsed = lastUsed;
        return canAttack
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

let attacks = [
    new ClickAttack(),
    new SpecialAttack()
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

    if(GAME.m_State.m_bRunning === false) {
        GAME.ChangeState( new CBattleSelectionState( gGame.m_State.m_PlanetData.id ));
    }

    if(InZoneSelect() && lastZoneIndex > 0 && !isJoining) {
        isJoining = true;
        SERVER.JoinZone(
            lastZoneIndex,
            function ( results ) {
                gGame.ChangeState( new CBattleState( GAME.m_State.m_PlanetData, lastZoneIndex ) );
            },
            GameLoadError
            );
        
        return;  
    }

    if (!InGame()) {
        if (TryContinue()) {
            console.log("continued!");
        }
        return;
    }

    isJoining = false;
    lastZoneIndex = GAME.m_State.m_unZoneIndex;    

    let state = EnemyManager();

    let enemies = state.m_rgEnemies;

    if(GAME.m_State.m_PlayerHealth > 0) {
        for (let attack of attacks)
            if (attack.shouldAttack(delta))
                attack.process(enemies);
    }

}


pixi.ticker.add(context.BOT_FUNCTION);

})(window);