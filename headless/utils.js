const start_time = (Date.now() / 1000) | 0;

function FormatTimer(timeInSeconds) {
    if (parseInt(timeInSeconds) <= 0) {
        return '';
    }

    const SECONDS_IN_MINUTE = 60;
    const MINUTES_IN_HOUR = 60;
    const HOURS_IN_DAY = 24;
    const SECONDS_IN_HOUR = SECONDS_IN_MINUTE * MINUTES_IN_HOUR;
    const SECONDS_IN_DAY = SECONDS_IN_HOUR * HOURS_IN_DAY;

    const days = Math.floor(timeInSeconds / SECONDS_IN_DAY);
    const hours = Math.floor(timeInSeconds / SECONDS_IN_HOUR % HOURS_IN_DAY);
    const minutes = Math.floor(timeInSeconds / SECONDS_IN_MINUTE % MINUTES_IN_HOUR);
    const seconds = timeInSeconds % SECONDS_IN_MINUTE;

    let formatted = '';

    formatted += days ? `${days}d ` : '';
    formatted += hours ? `${hours}h ` : '';
    formatted += minutes ? `${minutes}m `: '';
    formatted += seconds ? `${seconds}s ` : '';

    return formatted;
}

function PrintInfo(client, waitTime, scoreTime, mapTiles, difficultyNames, difficultyMultipliers) {
    // clear screen, taken from https://stackoverflow.com/a/14976765
    let info_lines = [];

    if (client.gPlayerInfo) {
        let info = client.gPlayerInfo;
        info_lines.push(["Running for", FormatTimer(((Date.now() / 1000) | 0) - start_time)]);
        info_lines.push(["Current level", `${info.level} (${info.score} / ${info.next_level_score})`]);
        info_lines.push(["Exp since start", info.score - client.gPlayerInfoOriginal.score]);
        let exp_per_hour = 60 * 60 * 2400 / (waitTime + 5);
        info_lines.push(["Estimated exp/hr", exp_per_hour | 0]);

        let date = new Date();
        let score_bias = 0;

        if (client.gPlanets) {
            let current = client.gPlanets[info.active_planet];
            if (current) {
                info_lines.push(["Current planet", `${current.state.name} [${(current.state.capture_progress * 100).toFixed(2)}%] (id ${current.id})`]);
                if (client.gPlayerInfo.active_zone_position) {
                    let zoneIdx = parseInt(client.gPlayerInfo.active_zone_position);
                    let zoneX = zoneIdx % mapTiles, zoneY = (zoneIdx / mapTiles) | 0;
                    let zone = current.zones[zoneIdx];

                    if (zone) {
                        info_lines.push(["Current zone", `(${zoneX}, ${zoneY}) (id: ${zoneIdx}) difficulty: ${difficultyNames[zone.difficulty]}`]);

                        let time_left = ((client.endGameTime - Date.now()) / 1000) | 0;
                        date.setTime(client.endGameTime);
                        score_bias = difficultyMultipliers[zone.difficulty] * 5 * scoreTime;
                        info_lines.push(["Round time left", FormatTimer(time_left)]);
                    }
                }
            }
        }
        date.setSeconds(date.getSeconds() + (info.next_level_score - info.score - score_bias) / exp_per_hour * 60 * 60);
        info_lines.push(["Next level up", date.toLocaleString()]);
    }

    let max_length = 0;

    for (let i = 0; i < info_lines.length; i++)
        max_length = Math.max(max_length, info_lines[i][0].length);

    for (let i = 0; i < info_lines.length; i++)
        info_lines[i] = info_lines[i].join(`: ${" ".repeat(max_length - info_lines[i][0].length)}`);

    console.log("\u001b[2J\u001b[0;0H" + info_lines.join("\n"));
}

function GetBestZone(planet) {
    let bestZone;
    let highestDifficulty = -1;

    let maxProgress = 10000;

    for (let idx in planet.zones) {
        let zone = planet.zones[idx];

        if (!zone.captured) {
            if (zone.type == 4) // boss
                return zone;
            if (zone.difficulty > highestDifficulty) {
                highestDifficulty = zone.difficulty;
                maxProgress = zone.capture_progress;
                bestZone = zone;
            }
            else if (zone.difficulty < highestDifficulty)
                continue;

            if (zone.capture_progress < maxProgress) {
                maxProgress = zone.capture_progress;
                bestZone = zone;
            }
        }
    }

    return bestZone;
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports.PrintInfo = PrintInfo;
module.exports.GetBestZone = GetBestZone;
module.exports.sleep = sleep;