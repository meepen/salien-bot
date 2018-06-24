"use strict";

const args = process.argv.slice(2);
const network = require("./headless/network.js");
const IntlMessageFormat = require('intl-messageformat');
const fs = require("fs");

let CARE_ABOUT_PLANET = false;
let DO_LOGS = false;
let SALIEN_LOCALE = "english";

const log_file = "./log.txt"

// clear log

global.log = function log(data) {
    if (!DO_LOGS)
        return;
    fs.appendFileSync(log_file, data.toString());
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
        global.log(`Language: ${args[++i]}`);
        network.ChangeLanguage(args[i]);
		SALIEN_LOCALE = args[i];
    }
    else if (arg == "--care-for-planet" || arg == "-c") {
        CARE_ABOUT_PLANET = true;
        global.log("Caring for previous planet.");
    }
    else
        throw new Error(`invalid command line argument ${arg}`);
}

const Messages = JSON.parse(fs.readFileSync("./locales/"+SALIEN_LOCALE+".json", "utf8"));

const CServerInterface = network.CServerInterface;
const k_NumMapTilesW = 12;

const SCORE_TIME = 120;
const WAIT_TIME = 110;


// TODO: get these from json
const difficulty_multipliers = [
    0, 1, 2, 4
]
const difficulty_names = [
    Messages.DIFFICULTIES.UNKNOWN, Messages.DIFFICULTIES.EASY, Messages.DIFFICULTIES.MEDIUM, Messages.DIFFICULTIES.HARD, Messages.DIFFICULTIES.BOSS
]

const gettoken = JSON.parse(fs.readFileSync("./gettoken.json", "utf8"));

let Instance = new CServerInterface(gettoken);

const StartTimer = function StartTimer() {
    
}

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
                        cl.ReportScore(5 * difficulty_multipliers[planet.zones[this.gPlayerInfo.active_zone_position].difficulty] * SCORE_TIME).then(res);
                    }, time_left);
                });
            }
            else {
                this.int.LeaveGameInstance(this.gPlayerInfo.active_zone_game, res, () => {
                    this.Connect().then(res);
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
            }
        });
    }

    GetPlanets(shh) {
        return new Promise(res => {
            this.int.GetPlanets(data => {
                this.m_Planets = data.response.planets;
                res(this.m_Planets);
            }, () => {
                this.Connect().then(() => {
                    this.GetPlanets(shh).then(res);
                });
            }, shh);
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
                this.Connect().then(() => {
                    this.GetPlayerInfo().then(res);
                });
            });
        });
    }

    JoinPlanet(id) {
        return new Promise(res => {
            this.int.JoinPlanet(id, d => {
                this.gPlayerInfo.active_planet = id;
                res();
            }, () => {
                this.Connect().then(() => {
                    this.JoinPlanet(id).then(() => {
                        this.JoinPlanet(id).then(res);
                    });
                });
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
                this.Connect().then(res);
            });
        })
    }
    
    ReportScore(score) {
        return new Promise(res => {
            this.int.ReportScore(score, d => {
                res();
            }, () => {
                this.GetPlayerInfo(() => {
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
                    let best_planet, best_difficulty = -1;
                    for (let p of planets) {
                        let planet = this.gPlanets[p.id];
                        let best_zone = GetBestZone(planet);

                        if (best_zone && best_zone.difficulty > best_difficulty)
                            best_planet = planet, best_difficulty = best_zone.difficulty;
                    }
                    if (best_difficulty === -1)
                        throw new Error(Messages.ERR_NO_DIFFICULTY);
                    res(best_planet, best_difficulty);
                });
            })
        });
    }

    ForcePlanet(id) {
        return new Promise(res => {
            if (this.gPlayerInfo.active_planet && this.gPlayerInfo.active_planet != id) {
                this.LeavePlanet().then(() => {
                    this.ForcePlanet(id).then(res);
                })
                return;
            }
            else if (this.gPlayerInfo.active_planet != id) {
                this.JoinPlanet(id).then(res);
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
                                this.ReportScore(5 * difficulty_multipliers[zone_info.difficulty] * SCORE_TIME).then(res);
                            }, time_left);
                        });
                    });
                });
            });
        });
    }
}

let cl = new Client(Instance);

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

    let formatted = new IntlMessageFormat(Messages.TIMER_COUNTDOWN,Messages.LOCALE_CODE).format({days:days, hours:hours, minutes:minutes, seconds:seconds});

    return formatted;
}

const PrintInfo = function PrintInfo() {
    // clear screen, taken from https://stackoverflow.com/a/14976765
    let info_lines = [];
    if (cl.gPlayerInfo) {
        let info = cl.gPlayerInfo;
        info_lines.push([Messages.RUNNING_FOR_TITLE, FormatTimer(((Date.now() / 1000) | 0) - start_time)]);
        info_lines.push([Messages.CURRENT_LEVEL_TITLE, new IntlMessageFormat(Messages.CURRENT_LEVEL_DESC,Messages.LOCALE_CODE).format({level:info.level, score:info.score, next_level_score:info.next_level_score})]);
        info_lines.push([Messages.EXP_SINCE_START_TITLE, new IntlMessageFormat(Messages.EXP_SINCE_START_DESC,Messages.LOCALE_CODE).format({exp:info.score - cl.gPlayerInfoOriginal.score})]);
        let exp_per_hour = 60 * 60 * 2400 / (WAIT_TIME + 5);
        info_lines.push([Messages.ESTIMATED_EXP_PER_HOUR_TITLE, new IntlMessageFormat(Messages.ESTIMATED_EXP_PER_HOUR_DESC,Messages.LOCALE_CODE).format({exp:exp_per_hour | 0})]);
        
        let date = new Date();
        let score_bias = 0;

        if (cl.gPlanets) {
            let current = cl.gPlanets[info.active_planet];
            if (current) {
                info_lines.push([Messages.CURRENT_PLANET_TITLE, new IntlMessageFormat(Messages.CURRENT_PLANET_DESC,Messages.LOCALE_CODE).format({planet_name:current.state.name, capture_progress:current.state.capture_progress, id:current.id})]);
                if (cl.gPlayerInfo.active_zone_position) {
                    let zoneIdx = parseInt(cl.gPlayerInfo.active_zone_position);
                    let zoneX = zoneIdx % k_NumMapTilesW, zoneY = (zoneIdx / k_NumMapTilesW) | 0;
                    let zone = current.zones[zoneIdx];

                    if (zone) {
                        info_lines.push([Messages.CURRENT_ZONE_TITLE, new IntlMessageFormat(Messages.CURRENT_ZONE_DESC,Messages.LOCALE_CODE).format({zoneX:zoneX, zoneY:zoneY, zoneIdx:zoneIdx, difficulty_name:difficulty_names[zone.difficulty]})]);

                        let time_left = ((cl.endGameTime - Date.now()) / 1000) | 0;
                        date.setTime(cl.endGameTime);
                        score_bias = difficulty_multipliers[zone.difficulty] * 5 * SCORE_TIME;
                        info_lines.push([Messages.ROUND_TIME_LEFT_TITLE, FormatTimer(time_left)]);
                    }
                }
            }
        }
        date.setSeconds(date.getSeconds() + (info.next_level_score - info.score - score_bias) / exp_per_hour * 60 * 60);
        info_lines.push([Messages.NEXT_LEVEL_UP_TITLE, new IntlMessageFormat(Messages.NEXT_LEVEL_UP_DESC,Messages.LOCALE_CODE).format({timestamp:date})]);
    }


    let max_length = 0;
    for (let i = 0; i < info_lines.length; i++)
        max_length = Math.max(max_length, info_lines[i][0].length);

    for (let i = 0; i < info_lines.length; i++)
        info_lines[i] = info_lines[i].join(`: ${" ".repeat(max_length - info_lines[i][0].length)}`);

    console.log("\u001b[2J\u001b[0;0H" + info_lines.join("\n"));
}

setInterval(PrintInfo, 1000);

cl.Connect().then(() => {
    Finish();
});