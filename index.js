const network = require("./headless/network.js");

const CServerInterface = network.CServerInterface;
const config = network.config;

const gettoken = JSON.parse(require("fs").readFileSync("./gettoken.json", "utf8"));

let Instance = new CServerInterface(gettoken);

Instance.GetPlanets(console.log,console.log)