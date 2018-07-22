"use strict";

const args = process.argv.slice(2);
const network = require("./headless/network.js");
const fs = require("fs");
let uint64;
try {
    uint64 = require("./uint64.js");
}
catch (e) {
    console.log("Dependencies outdated - run `npm install` again");
    process.exit();
}

const help_page = `
Meeden's headless Salien bot
https://github.com/meepen/salien-bot

Usage: node headless.js [options]
Options:
  -h, --help                    Display this information.
  -l, --log                     Writes log output to "log.txt".
  --lang LANG                   Enable changing the language of the steam API.
                                See https://partner.steamgames.com/doc/store/localization#supported_languages.
  -t, --token TOKENFILE         Allow specifying a custom token file.
  -tj, --token-json TOKEN_JSON  Allow inlining gettoken.json contents as base64 string.
  -c, --care-for-planet         Bot tries to stay on the same planet and does not change the
                                planet even if difficulty would be better somewhere else.
`;


let CARE_ABOUT_PLANET = false;
let DO_LOGS = false;

const log_file = "./log.txt";

let token_file = "./gettoken.json";
let token_json_base64 = "";
let EXPERIMENTAL = false;

// clear log

global.log = function log(data) {
    if (!DO_LOGS)
        return;
    let offset = new Date().getTimezoneOffset() / -60;
    fs.appendFileSync(log_file, (new Date()).toLocaleString() + " GMT" + (offset >= 0 ? "+" + offset : offset) + " " + data.toString());
    fs.appendFileSync(log_file, "\n");
}

for (let i = 0; i < args.length; i++) {
    let arg = args[i];
    if (arg == "--experimental" || arg == "-e") {
        EXPERIMENTAL = true;
        global.log("EXPERIMENTAL MODE ACTIVATED");
    }
    else if (arg == "--log" || arg == "-l") {
        DO_LOGS = true;
        fs.writeFileSync(log_file, "");
        global.log("Logging activated.");
    }
    else if (arg == "--lang" && args[i + 1]) {
        // https://partner.steamgames.com/doc/store/localization#supported_languages
        global.log(`language: ${args[++i]}`);
        network.ChangeLanguage(args[i]);
    }
    else if (arg == "--token" || arg == "-t") {
        global.log(`token file: ${args[++i]}`);
        token_file = args[i];
    }
    else if (arg == "--token-json" || arg == "-tj") {
        global.log(`Inline token json used.`);
        token_json_base64 = args[++i];
    }
    else if (arg == "--care-for-planet" || arg == "-c") {
        CARE_ABOUT_PLANET = true;
        global.log("Caring for previous planet.");
    }
    else if (arg == "--help" || arg == "-h") {
        console.log(help_page);
        process.exit();
    }
    else
        throw new Error(`invalid command line argument ${arg}`);
}

const CServerInterface = network.CServerInterface;
const k_NumMapTilesW = 12;

const SCORE_TIME = 120;
const WAIT_TIME = 110;


// TODO: get these from json
const difficulty_multipliers = [
    0, 1, 2, 4
];

const difficulty_names = [
    "???", "easy", "medium", "hard"
];

const MaxScore = function MaxScore(difficulty) {
    return SCORE_TIME * 5 * difficulty_multipliers[difficulty];
}

let gettoken;
if (token_json_base64.length < 1) {
    gettoken = JSON.parse(fs.readFileSync(token_file, "utf8"));
} else {
    gettoken = JSON.parse(Buffer.from(token_json_base64, 'base64').toString('ascii'));
}

const accountid = uint64(gettoken.steamid).toNumber();

const GetSelf = function GetSelf(players) {
    for (let i = 0; i < players.length; i++){
        let ply = players[i];
        if (ply.accountid == accountid)
            return ply;
    }
}

class Client {
    constructor(int) {
        this.int = int;
        this.gPlanets = {};
    }

    Connect() {
        return new Promise(res => {
            this.GetPlayerInfo().then(() => {
                if (this.gPlayerInfo.active_zone_game || this.gPlayerInfo.active_boss_game) {
                    this.LeaveGame().then(() => {
                        this.Connect().then(res);
                    })
                }
                else {
                    res();
                }
            })
        });
    }

    GameInfo(offset) {
        this.endGameTime = Date.now() + offset;
    }

    FinishBossGame() {
        return new Promise(res => {
            global.log("boss active");
            this.m_nConsecutiveFailures = 0;
            let per_tick = 5000;
            let per_heal = 120000;
            let next_heal = per_heal;
            let waiting = true;
            this.m_BossDamage = 0;
            this.m_BossInterval = setInterval(() => {
                let healed = false;
                if (!waiting && next_heal <= 0) {
                    next_heal = per_heal;
                    healed = true;
                }
                else {
                    next_heal -= per_tick;
                }
                this.ReportBossDamage(waiting ? 0 : 1, healed).then(data => {
                    if (!data) {
                        global.log("FAILED");
                        return; // failed
                    }
                    if (data.game_over) {
                        global.log("BOSS OVER");
                        clearInterval(this.m_BossInterval);
                        res();
                        return;
                    }
                    waiting = data.waiting_for_players;
                    if (waiting) {
                        global.log("still waiting for players");
                    }
                    this.bossStatus = data.boss_status;
                }).catch(() => {
                    clearInterval(this.m_BossInterval);
                    res();
                });
            }, per_tick);
        });
    }

    LeaveGame() {
        return new Promise(res => {
            if (this.gPlayerInfo.active_zone_game) {
                if (this.gPlayerInfo.time_in_zone <= (SCORE_TIME + 20)) {
                    // we can probably just finish our thing i guess
                    this.GetPlanet(this.gPlayerInfo.active_planet).then(() => {
                        let time_left = 1000 * (WAIT_TIME - this.gPlayerInfo.time_in_zone)
                        this.GameInfo(time_left);
                        setTimeout(() => {
                            let planet = this.gPlanets[this.gPlayerInfo.active_planet];
                            let zone = planet.zones[this.gPlayerInfo.active_zone_position];
                            cl.ReportScore(MaxScore(zone.difficulty)).then(res);
                        }, time_left);
                    });
                }
                else {
                    this.int.LeaveGameInstance(this.gPlayerInfo.active_zone_game, res, () => {
                        this.GetPlayerInfo().then(() => {
                            if (this.gPlayerInfo.active_zone_game) {
                                this.LeaveGame().then(res);
                            }
                            else {
                                res();
                            }
                        })
                    })
                }
            }
            else if (this.gPlayerInfo.active_boss_game) {
                this.FinishBossGame().then(res);
            }
            else {
                res();
            }
        });
    }

    GetPlanets(active_only) {
        if (active_only === undefined)
            active_only = 1;
        return new Promise(res => {
            this.int.GetPlanets(active_only, data => {
                this.m_Planets = data.response.planets;
                res(this.m_Planets);
            }, () => {
                this.GetPlanets(active_only).then(res);
            });
        });
    }

    GetPlayerInfo() {
        return new Promise(res => {
            setTimeout(() => {
                this.int.GetPlayerInfo(d => {
                    if (!d || !d.response) {
                        this.GetPlayerInfo().then(res);
                        return;
                    }
                    if (!this.gPlayerInfo)
                        this.gPlayerInfoOriginal = d.response;
                    this.gPlayerInfo = d.response;
                    res(this.gPlayerInfo);
                }, () => {
                    this.GetPlayerInfo().then(res);
                });
            }, 100);
        });
    }

    JoinPlanet(id) {
        return new Promise((res, rej) => {
            this.int.JoinPlanet(id, d => {
                this.gPlayerInfo.active_planet = id;
                res();
            }, () => {
                this.GetPlanet(id).then(planet => {
                    this.GetPlayerInfo().then(() => {
                        if (planet.state.active && !this.gPlayerInfo.active_planet) {
                            this.JoinPlanet(id).then(res).catch(rej);
                        }
                        else {
                            rej();
                        }
                    });
                })
            });
        });
    }

    GetPlanet(id) {
        return new Promise(res => {
            this.int.GetPlanet(id, d => {
                for (let i in d.response.planets) {
                    let planet = d.response.planets[i];
                    this.gPlanets[planet.id] = planet;
                }
                res(this.gPlanets[id]);
            }, () => {
                this.GetPlanet(id).then(res);
            });
        });
    }

    JoinZone(zone) {
        return new Promise((res, rej) => {
            global.log(`joining zone ${zone.zone_position} with ${zone.difficulty} difficulty and ${zone.capture_progress} progress`);
            if (zone.boss_active) {
                this.int.JoinBossZone(zone.zone_position, results => {
                    this.gPlayerInfo.active_zone_position = zone.zone_position;
                    res(results.response);
                }, rej);
            }
            else {
                this.int.JoinZone(zone.zone_position, d => {
                    this.gPlayerInfo.active_zone_position = zone.zone_position;
                    res(d.response.zone_info);
                }, rej);
            }
        });
    }

    ReportScore(score) {
        return new Promise(res => {
            this.int.ReportScore(score, d => {
                res();
            }, () => {
                this.GetPlayerInfo().then(() => {
                    if (this.gPlayerInfo.active_zone_game && this.gPlayerInfo.time_in_zone < SCORE_TIME + 20) {
                        this.LeaveGame().then(res);
                    }
                    else {
                        res();
                    }
                })
            })
        })
    }

    LeavePlanet() {
        return new Promise(res => {
            this.int.LeaveGameInstance(this.gPlayerInfo.active_planet, () => {
                this.gPlayerInfo.active_planet = undefined;
                res();
            }, () => {
                this.GetPlayerInfo().then(() => {
                    if (this.gPlayerInfo.active_planet) {
                        this.LeavePlanet().then(res);
                    }
                    else {
                        res();
                    }
                })
            });
        });
    }

    GetBestPlanet() {
        return new Promise(res => {
            if (CARE_ABOUT_PLANET && this.gPlayerInfo.active_planet) {
                this.GetPlanet(this.gPlayerInfo.active_planet).then(planet => {
                    if (!planet.state.active)
                        this.LeavePlanet().then(() => this.GetBestPlanet().then(res));
                    else
                        res(this.gPlanets[this.gPlayerInfo.active_planet]);
                });
                return;
            }
            this.GetPlanets().then(planets => {
                let i = 0;
                var GetPlanetIterator = (cb) => {
                    let planet = planets[i++];
                    this.GetPlanet(planet.id).then(planets[i] ? () => GetPlanetIterator(cb) : cb);
                }
                GetPlanetIterator(() => {
                    let best_planet = planets[0], best_difficulty = -1;
                    for (let p of planets) {
                        let planet = this.gPlanets[p.id];
                        let best_zone = GetBestZone(planet);

                        if (best_zone && best_zone.boss_active)
                            return res(planet, 3); // boss is always the best

                        if (best_zone && best_zone.difficulty > best_difficulty)
                            best_planet = planet, best_difficulty = best_zone.difficulty;
                    }
                    if (best_difficulty === -1)
                        throw new Error("no difficulty?!");
                    if (!best_planet) {
                        this.GetBestPlanet().then(res);
                        return;
                    }
                    res(best_planet, best_difficulty);
                });
            }, () => {
                this.GetBestPlanet().then(res);
            })
        });
    }

    ForcePlanet(id) {
        return new Promise((res, rej) => {
            if (this.gPlayerInfo.active_planet && this.gPlayerInfo.active_planet != id) {
                this.LeavePlanet().then(() => {
                    this.ForcePlanet(id).then(res).catch(rej);
                })
                return;
            }
            else if (this.gPlayerInfo.active_planet != id) {
                this.JoinPlanet(id).then(res).catch(rej);
            }
            else {
                res();
            }
        })
    }

    ReportBossDamage(damage, healed) {
        return new Promise((res, rej) => {
            // can we get away with 0 damage taken and no healing?
            this.int.ReportBossDamage(damage, 0, healed ? 1 : 0, results => {
                res(results.response);
            }, (_, eresult) => {
                if (++this.m_nConsecutiveFailures > 5) {
                    rej();
                }
            });
        });
    }

    FinishGame() {
        return new Promise(res => {
            this.GetPlayerInfo().then(() => {
                if (this.gPlayerInfo.active_boss_game || this.gPlayerInfo.active_zone_game) {
                    this.LeaveGame().then(res);
                    return;
                }
                this.GetBestPlanet().then(planet => {
                    this.ForcePlanet(planet.id).then(() => {
                        let zone = GetBestZone(planet);
                        if (!zone) {
                            this.LeavePlanet().then(() => {
                                this.Connect().then(() => {
                                    this.FinishGame().then(res)
                                });
                            });
                            return;
                        }
                        this.JoinZone(zone).then(zone_info => {
                            if (zone.boss_active) {
                                this.FinishBossGame().then(res);
                            }
                            else {
                                if (!zone_info) {
                                    this.Connect().then(() => {
                                        this.FinishGame().then(res);
                                    });
                                    return;
                                }
                                let time_left = 1000 * WAIT_TIME;
                                this.GameInfo(time_left);
                                setTimeout(() => {
                                    this.ReportScore(MaxScore(zone_info.difficulty)).then(res);
                                }, time_left);
                            }
                        }).catch(() => {
                            this.FinishGame().then(res);
                        });
                    }).catch(() => {
                        this.FinishGame().then(res);
                    });
                });
            });
        });
    }
}

const cl = new Client(new CServerInterface(gettoken));

const GetBestZone = function GetBestZone(planet) {
    let bestZone;
    let highestDifficulty = -1;

    let maxProgress = 10000;

    for (let idx in planet.zones) {
        let zone = planet.zones[idx];

        if (!zone.captured) {
            if (zone.boss_active) // boss
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

var Finish = () => cl.FinishGame().then(Finish);

let start_time = (Date.now() / 1000) | 0

const FormatTimer = function FormatTimer(timeInSeconds) {
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

// https://stackoverflow.com/a/41407246
const difficulty_color_codes = [
    "", "\x1b[1m\x1b[32m", "\x1b[1m\x1b[33m", "\x1b[1m\x1b[31m"
];
const reset_code = "\x1b[0m";

const PrintInfo = function PrintInfo() {
    // clear screen, taken from https://stackoverflow.com/a/14976765
    let info_lines = [];
    if (cl.gPlayerInfo) {
        let info = cl.gPlayerInfo;
        info_lines.push(["Playing as", gettoken.persona_name]);
        info_lines.push(["Running for", FormatTimer(((Date.now() / 1000) | 0) - start_time)]);
        info_lines.push(["Current level", `${info.level} (${info.score} / ${info.next_level_score})`]);
        info_lines.push(["Exp since start", info.score - cl.gPlayerInfoOriginal.score]);

        if (cl.gPlanets) {
            let current = cl.gPlanets[info.active_planet];
            if (current) {
                info_lines.push(["Current planet", `${current.state.name} [${(current.state.capture_progress * 100).toFixed(3)}%] (id ${current.id})`]);
                if (cl.gPlayerInfo.active_zone_position) {
                    let zoneIdx = parseInt(cl.gPlayerInfo.active_zone_position) || parseInt(cl.gPlayerInfo.active_boss_position);
                    let zoneX = zoneIdx % k_NumMapTilesW, zoneY = (zoneIdx / k_NumMapTilesW) | 0;
                    let zone = current.zones[zoneIdx];

                    if (zone) {
                        let max_score = MaxScore(zone.difficulty);
                        let exp_per_hour = 60 * 60 * max_score / (WAIT_TIME + 5);

                        // keep in old position
                        info_lines.splice(info_lines.length - 1, 0, ["Estimated exp/hr", exp_per_hour | 0]);

                        info_lines.push(["Current zone", `(${zoneX}, ${zoneY}) ${zone.boss_active ? "BOSS " : ""}${difficulty_color_codes[zone.difficulty]}${difficulty_names[zone.difficulty]}${reset_code} [${(zone.capture_progress * 100).toFixed(3)}%] (id: ${zoneIdx})`]);

                        if (!zone.boss_active) {
                            let time_left = ((cl.endGameTime - Date.now()) / 1000) | 0;
                            info_lines.push(["Round time left", FormatTimer(time_left)]);

                            let offset = (new Date().getTimezoneOffset() / 60) * -1;
                            let date = new Date(cl.endGameTime + offset);
                            date.setSeconds(date.getSeconds() + (info.next_level_score - info.score - max_score) / exp_per_hour * 60 * 60);
                            info_lines.push(["Next level up", date.toLocaleString()]);
                        }
                        else if (cl.bossStatus) {
                            info_lines.push(["Boss HP", `${cl.bossStatus.boss_hp} / ${cl.bossStatus.boss_max_hp} [${(cl.bossStatus.boss_hp / cl.bossStatus.boss_max_hp * 100).toFixed(2)}%]`]);
                            let self = GetSelf(cl.bossStatus.boss_players);
                            if (self) {
                                info_lines.push(["Boss EXP", self.xp_earned.toString()]);
                            }
                            else {
                                info_lines.push(["No self", "error"]);
                            }
                        }
                    }
                }
            }
        }
    }


    let max_length = 0;
    for (let i = 0; i < info_lines.length; i++)
        max_length = Math.max(max_length, info_lines[i][0].length);


    // https://stackoverflow.com/a/41407246

    for (let i = 0; i < info_lines.length; i++)
        info_lines[i] = "\x1b[33m" + info_lines[i].join(`${reset_code}: ${" ".repeat(max_length - info_lines[i][0].length)}`);

    console.log("\x1b[2J\x1b[0;0H" + info_lines.join("\n"));
}

setInterval(PrintInfo, 1000);

cl.Connect().then(() => {
    Finish();
});
