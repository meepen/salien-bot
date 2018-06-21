(function(context) {
const pixi = gApp;
const GAME = gGame;
const CLICKS_PER_SECOND = 10;

const InGame = function InGame() {
    return GAME.m_State.m_EnemyManager && GAME.m_State.m_EnemyManager.m_bIsInteractive; 
}

const WORST_SCORE = -1 / 0;
const START_POS = pixi.renderer.width;


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

let attacks = [
    new ClickAttack(),
]

if (context.BOT_FUNCTION) {
    pixi.ticker.remove(context.BOT_FUNCTION);
    context.BOT_FUNCTION = undefined;
}

context.BOT_FUNCTION = function ticker(delta) {
    delta /= 100;
    let state = GAME.m_State.m_EnemyManager;

    if (!InGame()) {
        return;
    }

    let enemies = state.m_rgEnemies;

    for (let attack of attacks)
        if (attack.shouldAttack(delta))
            attack.process(enemies);

}


pixi.ticker.add(context.BOT_FUNCTION);

})(window);