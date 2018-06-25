"use strict";

const args = process.argv.slice(2);
const network = require("./headless/network.js");
const fs = require("fs");

let CARE_ABOUT_PLANET = false;
let DO_LOGS = false;

const log_file = "./log.txt";

let token_file = "./gettoken.json";

// clear log

global.log = function log(data) {
    if (!DO_LOGS)
        return;
    fs.appendFileSync(log_file, (new Date()).toISOString() + ": " + data.toString());
    fs.appendFileSync(log_file, "\n");
}

for (let i = 0; i < args.length; i++) {
    let arg = args[i];
    if (arg == "--log" || arg == "-l") {
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
    else if (arg == "--care-for-planet" || arg == "-c") {
        CARE_ABOUT_PLANET = true;
        global.log("Caring for previous planet.");
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

const gettoken = JSON.parse(fs.readFileSync(token_file, "utf8"));

class Client {
    constructor(int) {
        this.int = int;
        this.gPlanets = {};
    }

    Connect() {
        return new Promise(res => {
            this.GetPlayerInfo().then(() => {
                if (this.gPlayerInfo.active_zone_game) {
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

    LeaveGame() {
        return new Promise(res => {
            if (this.gPlayerInfo.time_in_zone <= WAIT_TIME) {
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
            this.int.GetPlayerInfo(d => {
                if (!d || !d.response) {
                    this.Connect().then(res);
                    return;
                }
                if (!this.gPlayerInfo)
                    this.gPlayerInfoOriginal = d.response;
                this.gPlayerInfo = d.response;
                res(this.gPlayerInfo);
            }, () => {
                this.GetPlayerInfo().then(res);
            });
        });
    }

    JoinPlanet(id) {
        return new Promise((res, rej) => {
            this.int.JoinPlanet(id, d => {
                this.gPlayerInfo.active_planet = id;
                res();
            }, () => {
                this.GetPlanets().then(planets => {
                    for (let i = 0; i < planets.length; i++) {
                        if (planets[i].id == id) {
                            this.JoinPlanet(id).then(res);
                            return;
                        }
                    }
                    rej();
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

    JoinZone(id) {
        return new Promise(res => {
            this.int.JoinZone(id, d => {
                this.gPlayerInfo.active_zone_position = id;
                res(d.response.zone_info);
            }, () => {
                this.GetPlayerInfo().then(() => {
                    if (this.gPlayerInfo.active_zone_game) {
                        res();
                    }
                    else {
                        this.JoinZone(id).then(res);
                    }
                });
            });
        })
    }

    ReportScore(score) {
        return new Promise(res => {
            this.int.ReportScore(score, d => {
                res();
            }, () => {
                this.GetPlayerInfo().then(() => {
                    if (this.gPlayerInfo.active_zone_game) {
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
                        this.LeavePlanet(() => this.GetBestPlanet().then(res));
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

    FinishGame() {
        return new Promise(res => {
            this.GetPlayerInfo().then(() => {
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
                        this.JoinZone(zone.zone_position).then(zone_info => {
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
        info_lines.push(["Running for", FormatTimer(((Date.now() / 1000) | 0) - start_time)]);
        info_lines.push(["Current level", `${info.level} (${info.score} / ${info.next_level_score})`]);
        info_lines.push(["Exp since start", info.score - cl.gPlayerInfoOriginal.score]);

        if (cl.gPlanets) {
            let current = cl.gPlanets[info.active_planet];
            if (current) {
                info_lines.push(["Current planet", `${current.state.name} [${(current.state.capture_progress * 100).toFixed(3)}%] (id ${current.id})`]);
                if (cl.gPlayerInfo.active_zone_position) {
                    let zoneIdx = parseInt(cl.gPlayerInfo.active_zone_position);
                    let zoneX = zoneIdx % k_NumMapTilesW, zoneY = (zoneIdx / k_NumMapTilesW) | 0;
                    let zone = current.zones[zoneIdx];

                    if (zone) {
                        let max_score = MaxScore(zone.difficulty);
                        let exp_per_hour = 60 * 60 * max_score / (WAIT_TIME + 5);

                        // keep in old position
                        info_lines.splice(info_lines.length - 1, 0, ["Estimated exp/hr", exp_per_hour | 0]);

                        info_lines.push(["Current zone", `(${zoneX}, ${zoneY}) ${zone.type == 4 ? "BOSS " : ""}${difficulty_color_codes[zone.difficulty]}${difficulty_names[zone.difficulty]}${reset_code} [${(zone.capture_progress * 100).toFixed(3)}%] (id: ${zoneIdx})`]);

                        let time_left = ((cl.endGameTime - Date.now()) / 1000) | 0;
                        info_lines.push(["Round time left", FormatTimer(time_left)]);

                        let date = new Date(cl.endGameTime);
                        date.setSeconds(date.getSeconds() + (info.next_level_score - info.score - max_score) / exp_per_hour * 60 * 60);
                        info_lines.push(["Next level up", date.toLocaleString()]);
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
