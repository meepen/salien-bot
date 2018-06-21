const GAME = gGame;
const CLICKS_PER_SECOND = 10;

const InGame = function InGame() {
    return GAME.m_State.m_EnemyManager && GAME.m_State.m_EnemyManager.m_bIsInteractive; 
}

const WORST_SCORE = -1 / 0;
const START_POS = gApp.renderer.width;


const EnemySpeed = function EnemySpeed(enemy) {
    return enemy.m_Sprite.vx;
}
const EnemyDistance = function EnemyDistance(enemy) {
    return (enemy.m_Sprite.x - k_nDamagePointx) / (START_POS - k_nDamagePointx);
}


class Attack {
    process(enemies) {
        throw new Error("not implemented");
    }
}

// Basic clicking attack, attack closest
class ClickAttack extends Attack {
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
    }
}

let attacks = [
    new ClickAttack(),
]

setInterval(function game_think() {
    let state = GAME.m_State.m_EnemyManager;

    if (!InGame()) {
        return;
    }

    let enemies = state.m_rgEnemies;

    for (let attack of attacks)
        attack.process(enemies);
}, 1000 / CLICKS_PER_SECOND);