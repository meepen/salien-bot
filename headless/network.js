"use strict";

const CWebAPI = require("./webapi.js").CWebAPI;
const request = require("request-promise-native");

let gLanguage = "english";

module.exports.ChangeLanguage = function ChangeLanguage(lang) {
	gLanguage = lang;
}

const CServerInterface = module.exports.CServerInterface = function( rgResult )
{
	this.m_WebAPI = new CWebAPI( rgResult.webapi_host, rgResult.webapi_host_secure, rgResult.token );

	this.request = async function(url, method = "GET", data = {}) {

		try {
			const form = Object.assign({
				access_token: this.m_WebAPI.m_strOAuth2Token
			}, data);

			const response = await request({
				url,
				method,
				form,
				json: true,
				transform: function(body, response) {
					return {"headers": response.headers, "data": body.response};
				}
			});

			if(response.headers['x-eresult'] == 1)
				return response.data;
			else
				throw new Error("x-eresult != 1");
		} catch (e) {
			throw e;
		}
	}
};

CServerInterface.prototype.Connect = async function()
{
	const result = await this.request("https://steamcommunity.com/saliengame/gettoken");

	if(result.success == 1)
	{
		this.m_strSteamID = result.steamid;
		this.m_strWebAPIHost = result.webapi_host;
		this.m_WebAPI = new CWebAPI(result.webapi_host, result.webapi_host_secure, result.token);

		return result;
	}
};

CServerInterface.prototype.GetPlanets = async function(noactive)
{
	const url = this.m_WebAPI.BuildURL( 'ITerritoryControlMinigameService', 'GetPlanets', true );
	const data = await this.request(url, 'GET', {
		active_only: noactive ? 0 : 1,
		language: gLanguage
	});
	return data.planets;
};

CServerInterface.prototype.GetPlanet = async function(planetId)
{
	const url = this.m_WebAPI.BuildURL( 'ITerritoryControlMinigameService', 'GetPlanet', true );
	const data = await this.request(url, 'GET', {
		id: planetId,
		language: gLanguage
	});
	return data.planet;
};

CServerInterface.prototype.GetPlayerInfo = async function()
{
	const url = this.m_WebAPI.BuildURL( 'ITerritoryControlMinigameService', 'GetPlayerInfo', true );

	return this.request(url, 'POST');
};

CServerInterface.prototype.JoinPlanet = async function(planetId)
{
	const url = this.m_WebAPI.BuildURL( 'ITerritoryControlMinigameService', 'JoinPlanet', true );

	return this.request(url, 'POST', {
		id: planetId
	});
};

CServerInterface.prototype.JoinZone = async function(zoneId)
{
	const url = this.m_WebAPI.BuildURL( 'ITerritoryControlMinigameService', 'JoinZone', true );

	return this.request(url, 'POST', {
		zone_position: zoneId
	});
};

CServerInterface.prototype.RepresentClan = async function(clanId)
{
	const url = this.m_WebAPI.BuildURL( 'ITerritoryControlMinigameService', 'RepresentClan', true );

	return this.request(url, 'POST', {
		clanid: clanId
	});
};

CServerInterface.prototype.ReportScore = async function(score)
{
	const url = this.m_WebAPI.BuildURL( 'ITerritoryControlMinigameService', 'ReportScore', true );

	return this.request(url, 'POST', {
		score,
		language: gLanguage
	});
};

CServerInterface.prototype.LeaveGameInstance = function(instanceId)
{
	const url = this.m_WebAPI.BuildURL( 'IMiniGameService', 'LeaveGame', true );

	return this.request(url, 'POST', {
		gameid: instanceId
	});
};