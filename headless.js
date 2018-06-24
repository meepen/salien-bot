"use strict";

const args = process.argv.slice(2);
const network = require("./headless/network.js");
const fs = require("fs");
const utils = require("./headless/utils.js");

let CARE_ABOUT_PLANET = false;
let DO_LOGS = false;

const log_file = "./log.txt"

// clear log

global.log = function log(data) {
    if (!DO_LOGS)
        return;

    fs.appendFileSync(log_file, data.toString());
    fs.appendFileSync(log_file, "\n");
}

for(let arg of args) {
    switch(true) {
        case arg == "--log" || arg == "-l":
            {
                DO_LOGS = true;
                fs.writeFileSync(log_file, "");
                global.log("Logging activated.");
            }
            break;
        case arg == "--lang" && args[i + 1]:
            {
                // https://partner.steamgames.com/doc/store/localization#supported_languages
                global.log(`language: ${args[++i]}`);
                network.ChangeLanguage(args[i]);
            }
            break;
        case arg == "--care-for-planet" || arg == "-c":
            {
                CARE_ABOUT_PLANET = true;
                global.log("Caring for previous planet.");
            }
            break;
        default:
            throw new Error(`invalid command line argument ${arg}`);
    }
}

const CServerInterface = network.CServerInterface;
const k_NumMapTilesW = 12;

const SCORE_TIME = 120;
const WAIT_TIME = 110;


// TODO: get these from json
const difficulty_multipliers = [
    0, 1, 2, 4
]
const difficulty_names = [
    "???", "easy", "medium", "hard", "boss"
]

const token = JSON.parse(fs.readFileSync("./gettoken.json", "utf8"));

const Instance = new CServerInterface(token);

class Client {
    constructor(serverInterface) {
        this.sInterface = serverInterface;
        this.gPlanets = {};
    }

    async Connect() {
        await this.GetPlayerInfo();

        if (this.gPlayerInfo.active_zone_game) {
            await this.LeaveGame();
            await this.Connect();
        }
    }

    GameInfo(offset) {
        this.endGameTime = Date.now() + offset;
    }

    async LeaveGame() {
        if (this.gPlayerInfo.time_in_zone <= WAIT_TIME) {
            // we can probably just finish our thing i guess
            await this.GetPlanet(this.gPlayerInfo.active_planet);
            const time_left = 1000 * (WAIT_TIME - this.gPlayerInfo.time_in_zone);
            this.GameInfo(time_left);

            await utils.sleep(time_left);

            const planet = this.gPlanets[this.gPlayerInfo.active_planet];
            await this.ReportScore(5 * difficulty_multipliers[planet.zones[this.gPlayerInfo.active_zone_position].difficulty] * SCORE_TIME);
        } else {
            try {
                await this.sInterface.LeaveGameInstance(this.gPlayerInfo.active_zone_game);
            } catch (e) {
                await this.Connect();
            }
        }
    }

    async GetPlanets() {
        try {
            this.m_Planets = await this.sInterface.GetPlanets();
            return this.m_Planets;
        } catch (e) {
            await this.Connect();
            await this.GetPlanets();
        }
    }

    async GetPlayerInfo() {
        try {
            const data = await this.sInterface.GetPlayerInfo();

            if (!data) {
                await this.Connect();
                return;
            }

            if (!this.gPlayerInfo)
                this.gPlayerInfoOriginal = data;

            this.gPlayerInfo = data;

            return this.gPlayerInfo;
        } catch (e) {
            await this.Connect();
            await this.GetPlayerInfo();
        }
    }

    async JoinPlanet(id) {
        try {
            const data = await this.sInterface.JoinPlanet(id);
            this.gPlayerInfo.active_planet = id;
        } catch (e) {
            await this.Connect();
            await this.JoinPlanet(id);
        }
    }

    async GetPlanet(id) {
        try {
            const planets = await this.sInterface.GetPlanet(id);

            for (let i in planets) {
                const planet = planets[i];
                this.gPlanets[planet.id] = planet;
            }

            return this.gPlanets[id];
        } catch (e) {
            await this.GetPlanet(id);
        }
    }

    async JoinZone(id) {
        try {
            const data = await this.sInterface.JoinZone(id);
            this.gPlayerInfo.active_zone_position = id;
            return data.response.zone_info;
        } catch (e) {
            await this.Connect();
        }
    }

    async ReportScore(score) {
        try {
            await this.sInterface.ReportScore(score);
        } catch (e) {
            await this.GetPlayerInfo();

            if (this.gPlayerInfo.active_zone_game)
                await this.LeaveGame();
        }
    }

    async LeavePlanet() {
        try {
            await this.sInterface.LeaveGameInstance(this.gPlayerInfo.active_planet);
            this.gPlayerInfo.active_planet = undefined;
        } catch (e) {
            await this.GetPlayerInfo();

            if (this.gPlayerInfo.active_planet)
                await this.LeavePlanet();
        }
    }

    async GetBestPlanet() {
        if (CARE_ABOUT_PLANET && this.gPlayerInfo.active_planet) {
            const planet = await this.GetPlanet(this.gPlayerInfo.active_planet);

            if (!planet.state.active) {
                await this.LeavePlanet();
                await this.GetBestPlanet();
            } else {
                return this.gPlanets[this.gPlayerInfo.active_planet];
            }
        }

        const planets = await this.GetPlanets();

        let best_planet = null;
        let best_difficulty = -1;

        const zones = await Promise.all(planets.map((p) => {
            return this.GetPlanet(p.id);
        }));

        console.log(zones);

        for(let i = 0; i < planets.length; i++) {
            const planet = planets[i];
            const best_zone = utils.GetBestZone(planet);

            if (best_zone && best_zone.difficulty > best_difficulty) {
                best_planet = planet;
                best_difficulty = best_zone.difficulty;
            }
        }

        if (best_difficulty === -1)
            throw new Error("No best difficulty found");

        return best_planet;
    }

    async ForcePlanet(id) {
        if (this.gPlayerInfo.active_planet && this.gPlayerInfo.active_planet != id) {
            await this.LeavePlanet();
            await this.ForcePlanet(id);

            return;
        }

        if (this.gPlayerInfo.active_planet != id) {
            await this.JoinPlanet(id);
        }
    }

    async FinishGame() {
        await this.GetPlayerInfo();

        const planet = await this.GetBestPlanet();
        await this.ForcePlanet(planet.id);

        const zone = GetBestZone(planet);

        if (!zone) {
            await this.LeavePlanet();
            await this.Connect();
            await this.FinishGame();

            return;
        }

        const info = await this.JoinZone(zone.zone_position);

        if (!info) {
            await this.Connect();
            await this.FinishGame();

            return;
        }

        const time_left = 1000 * WAIT_TIME;
        this.GameInfo(time_left);

        await utils.sleep(time_left);

        await this.ReportScore(5 * difficulty_multipliers[info.difficulty] * SCORE_TIME);
    }
}

const cl = new Client(Instance);

async function Finish() {
    await cl.FinishGame();
    await Finish();
};

setInterval(() => {
    utils.PrintInfo(cl, WAIT_TIME);
}, 1000);

(async () => {
    await cl.Connect();
    await Finish();
})();