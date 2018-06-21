if (typeof timerId !== 'undefined') {
    console.log('Stop timer');
    clearInterval(timerId);
}
else {
    const GAME = gGame;
    const CLICKS_PER_SECOND = 10;
    const WORST_SCORE = -1 / 0;
}


function ScoreEnemy(enemy) {
    if (enemy.m_bDead)
        return WORST_SCORE;
    return 0;
}

var prevTarget = null;

var timerId = setInterval(function game_think() {
    let state = GAME.m_State.m_EnemyManager;

    if (!state) {
        console.log(`Not in game currently!`);
        return;
    }

    if (!state.m_bIsInteractive) {
        console.log(`Not interactive currently!`);
        return;
    }


    let enemies = state.m_rgEnemies;
    let target, target_score = WORST_SCORE;
    enemies.forEach(function FindBest(enemy) {
        let now_score = ScoreEnemy(enemy);
        if (now_score > target_score) {
            target = enemy, target_score = now_score;
        }
    });


    if (target) {
        target.m_Sprite.click();
    } 


    if(prevTarget !== target) {
        if (target) {  
            console.log(`New target: ${target.toString()}" (${target_score})`);
            console.log(target);            
        }
        else {
            console.log("No target");
        }
        prevTarget = target;
    }

}, 1000 / CLICKS_PER_SECOND);