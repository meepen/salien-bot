const network = require("./headless/network.js");

const CServerInterface = network.CServerInterface;
const config = network.config;
const k_NumMapTilesW = 12;

const MAX_LEVEL = 13;
const WAIT_TIME = 120;

const difficulty_multipliers = [
    0, 1, 2, 4
]

const gettoken = JSON.parse(require("fs").readFileSync("./gettoken.json", "utf8"));

let Instance = new CServerInterface(gettoken);


class Client {
    constructor(int) {
        this.int = int;
        this.gPlanets = {};
    }

    Connect() {
        return new Promise(res => {
            this.GetPlanet().then(data => {
                if (this.gPlayerInfo.active_zone_game) {
                    this.LeaveGame().then(() => {
                        this.Connect().then(res);
                    })
                }
                else
                    res();
            });
        });
    }

    LeaveGame() {
        // we can probably just finish our thing i guess
        return new Promise(res => {
            for (let i = 0; i < (WAIT_TIME - this.gPlayerInfo.time_in_zone); i++)
                setTimeout(() => process.title = `${WAIT_TIME - i - this.gPlayerInfo.time_in_zone} seconds remaining`, i * 1000);
            setTimeout(() => {
                let planet = this.gPlanets[this.gPlayerInfo.active_planet];
                cl.ReportScore(5 * difficulty_multipliers[planet.zones[this.gPlayerInfo.active_zone_position].difficulty] * WAIT_TIME).then((d) => {
                    res();
                });
            }, 1000 * (WAIT_TIME - this.gPlayerInfo.time_in_zone));
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
                this.gPlayerInfo = d.response;
                res(this.gPlayerInfo);
            }, () => {
                this.Connect().then(() => {
                    this.GetPlayerInfo(shh).then(res);
                });
            });
        });
    }

    JoinPlanet(id) {
        return new Promise(res => {
            this.int.GetPlayerInfo(d => {
                this.gPlayerInfo.active_planet = id;
                res();
            }, () => {
                this.Connect().then(() => {
                    this.JoinPlanet(id).then(res);
                });
            });
        });
    }

    GetPlanet() {
        return new Promise(res => {
            this.GetPlayerInfo().then(() => {
                if (!this.gPlayerInfo.active_planet) {
                    this.GetPlanets().then(planets => {
                        this.JoinPlanet(planets[0].id).then(() => 
                            this.GetPlanet().then(res)
                        );
                    })
                }
                else {
                    this.int.GetPlanet(this.gPlayerInfo.active_planet, d => {
                        for (let i in d.response.planets) {
                            let planet = d.response.planets[i];
                            this.gPlanets[planet.id] = planet;
                        }
                        res();
                    }, () => {
                        this.GetPlanet().then(res);
                    });
                }
            });
        });
    }

    JoinZone(id) {
        return new Promise(res => {
            this.int.JoinZone(id, d => {
                res(d.response.zone_info);
            }, () => {
                this.JoinZone(id).then(res);
            });
        })
    }

    ReportScore(score) {
        return new Promise(res => {
            this.int.ReportScore(score, d => {
                let r = d.response;
                console.log(`level ${r.new_level} (${r.new_score} / ${r.next_level_score})`);
                res(r);
            }, () => {
                this.ReportScore(score).then(res);
            })
        })
    }

    LeavePlanet() {
        return new Promise(res => {
            this.int.LeaveGameInstance(this.gPlayerInfo.active_planet, () => {
                res();
            });
        });
    }

    FinishGame() {
        return new Promise(res => {
            this.GetPlanet().then(() => {
                let planet = this.gPlanets[this.gPlayerInfo.active_planet];
                if (!planet)
                    return fail(this, res);
                
                let zone = GetBestZone(planet);
                if (!zone) {
                    console.log("Leaving planet");
                    this.LeavePlanet().then(() => {
                        this.Connect().then(() => {
                            this.FinishGame().then(res)
                        });
                    });
                    return;
                }
                this.JoinZone(zone.zone_position).then(zone_info => {
                    for (let i = 0; i < WAIT_TIME; i++)
                        setTimeout(() => process.title = `${WAIT_TIME - i} seconds remaining`, i * 1000);
                    setTimeout(() => {
                        this.ReportScore(5 * difficulty_multipliers[zone_info.difficulty] * WAIT_TIME).then(res);
                    }, 1000 * WAIT_TIME);
                });
            });
        });
    }
}

let cl = new Client(Instance);

const GetBestZone = function GetBestZone(planet) {
    let bestZone;
    let highestDifficulty = -1;

    let isLevelling = cl.gPlayerInfo.level < MAX_LEVEL;
    let maxProgress = isLevelling ? 10000 : 0;

    for (let idx in planet.zones) {
        let zone = planet.zones[idx];
        if (!zone.captured) {
            if (zone.boss) {
                console.log(`zone ${idx} (${bestZoneIdx % k_NumMapTilesW}, ${(bestZoneIdx / k_NumMapTilesW) | 0}) with boss`);
                return zone;
            }

            if(isLevelling) {
                if(zone.difficulty > highestDifficulty) {
                    highestDifficulty = zone.difficulty;
                    maxProgress = zone.capture_progress;
                    bestZone = zone;
                } else if(zone.difficulty < highestDifficulty) continue;

                if(zone.capture_progress < maxProgress) {
                    maxProgress = zone.capture_progress;
                    bestZone = zone;
                }
            } else {
                if(zone.capture_progress > maxProgress) {
                    maxProgress = zone.capture_progress;
                    bestZone = zone;
                }
            }

        }
    }

    let bestZoneIdx = bestZone.zone_position;

    if(bestZoneIdx !== undefined) {
        console.log(`${planet.state.name} zone ${bestZoneIdx} (${bestZoneIdx % k_NumMapTilesW}, ${(bestZoneIdx / k_NumMapTilesW) | 0}) progress: ${bestZone.capture_progress} difficulty: ${bestZone.difficulty}`);
    }

    return bestZone;
}

var Finish = () => cl.FinishGame().then(Finish);

cl.Connect().then(() => {
    Finish();
});