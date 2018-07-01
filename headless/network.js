// <script>
"use strict";

let gLanguage = "english";
const CWebAPI = require("./webapi.js").CWebAPI;
const $J = module.exports.config = require("./jquery_node.js").jQuery;
module.exports.ChangeLanguage = function ChangeLanguage(lang) {
	gLanguage = lang;
}

let CServerInterface = module.exports.CServerInterface = function( rgResult )
{
    this.m_WebAPI = new CWebAPI( rgResult.webapi_host, rgResult.webapi_host_secure, rgResult.token );
    $J.token = rgResult.token;
};

CServerInterface.prototype.Connect = function( callback )
{
	var instance = this;

	$J.ajax({
		url: 'https://steamcommunity.com/saliengame/gettoken',
		dataType: "json"
	}).success(function(rgResult){
		if( rgResult.success == 1)
		{
			instance.m_strSteamID = rgResult.steamid;
			instance.m_strWebAPIHost = rgResult.webapi_host;
			instance.m_WebAPI = new CWebAPI( rgResult.webapi_host, rgResult.webapi_host_secure, rgResult.token );
			callback(rgResult);
		}
	});
};

CServerInterface.prototype.GetPlanets = function( active_only, callback, error )
{
	var rgParams = {
		active_only: active_only,
		language: gLanguage
	};

	$J.ajax({
		url: this.m_WebAPI.BuildURL( 'ITerritoryControlMinigameService', 'GetPlanets', true ),
		method: 'GET',
		data: rgParams,
	}).success( function( results, textStatus, request ) {
		if ( request.getResponseHeader( 'x-eresult' ) == 1 )
		{
			callback( results )
		}
		else
		{
			error();
		}
	}).fail( error );
};

CServerInterface.prototype.GetPlanet = function( planetid, callback, error )
{
	var rgParams = {
		id: planetid,
		language: gLanguage
	};

	$J.ajax({
		url: this.m_WebAPI.BuildURL( 'ITerritoryControlMinigameService', 'GetPlanet', true ),
		method: 'GET',
		data: rgParams,
	}).success( function( results, textStatus, request ) {
		if ( request.getResponseHeader( 'x-eresult' ) == 1 )
		{
			callback( results )
		}
		else
		{
			error();
		}
	}).fail( error );
};

CServerInterface.prototype.GetPlayerInfo = function( callback, error )
{
		var instance = this;
		var rgParams = {
			access_token: instance.m_WebAPI.m_strOAuth2Token,
		};

		$J.ajax({
			url: this.m_WebAPI.BuildURL( 'ITerritoryControlMinigameService', 'GetPlayerInfo', true ),
			method: 'POST',
			data: rgParams,
		}).success( function( results, textStatus, request ) {
			if ( request.getResponseHeader( 'x-eresult' ) == 1 )
			{
				callback( results )
			}
			else
			{
				error();
			}
		}).fail( error );
};

CServerInterface.prototype.JoinPlanet = function( planetid, callback, error )
{
	var instance = this;
	var rgParams = {
		id: planetid,
		access_token: instance.m_WebAPI.m_strOAuth2Token
	};

	$J.ajax({
		url: this.m_WebAPI.BuildURL( 'ITerritoryControlMinigameService', 'JoinPlanet', true ),
		method: 'POST',
		data: rgParams,
	}).success( function( results, textStatus, request ) {
		if ( request.getResponseHeader( 'x-eresult' ) == 1 )
		{
			callback( results )
		}
		else
		{
			error();
		}
	}).fail( error );
};

CServerInterface.prototype.JoinZone = function( zoneid, callback, error )
{
	var instance = this;
	var rgParams = {
		zone_position: zoneid,
		access_token: instance.m_WebAPI.m_strOAuth2Token
	};

	$J.ajax({
		url: this.m_WebAPI.BuildURL( 'ITerritoryControlMinigameService', 'JoinZone', true ),
		method: 'POST',
		data: rgParams,
	}).success( function( results, textStatus, request ) {
		if ( request.getResponseHeader( 'x-eresult' ) == 1 )
		{
			callback( results )
		}
		else
		{
			error( null, request.getResponseHeader( 'x-eresult' ) );
		}
	}).fail( error );
};

CServerInterface.prototype.JoinBossZone = function( zoneid, callback, error )
{
	var instance = this;
	var rgParams = {
		zone_position: zoneid,
		access_token: instance.m_WebAPI.m_strOAuth2Token
	};

	$J.ajax({
		url: this.m_WebAPI.BuildURL( 'ITerritoryControlMinigameService', 'JoinBossZone', true ),
		method: 'POST',
		data: rgParams,
	}).success( function( results, textStatus, request ) {
		if ( request.getResponseHeader( 'x-eresult' ) == 1 )
		{
			callback( results )
		}
		else
		{
			error( null, request.getResponseHeader( 'x-eresult' ) );
		}
	}).fail( error );
};

CServerInterface.prototype.RepresentClan = function( ulClanid, callback, error )
{
	var instance = this;
	var rgParams = {
		clanid: ulClanid,
		access_token: instance.m_WebAPI.m_strOAuth2Token
	};

	$J.ajax({
		url: this.m_WebAPI.BuildURL( 'ITerritoryControlMinigameService', 'RepresentClan', true ),
		method: 'POST',
		data: rgParams,
	}).success( function( results, textStatus, request ) {
		if ( request.getResponseHeader( 'x-eresult' ) == 1 )
		{
			callback( results )
		}
		else
		{
			error();
		}
	}).fail( error );
};

CServerInterface.prototype.ReportScore = function( nScore, callback, error )
{
	var instance = this;
	var rgParams = {
		access_token: instance.m_WebAPI.m_strOAuth2Token,
		score: nScore,
		language: gLanguage
	};

	$J.ajax({
		url: this.m_WebAPI.BuildURL( 'ITerritoryControlMinigameService', 'ReportScore', true ),
		method: 'POST',
		data: rgParams,
	}).success( function( results, textStatus, request ) {
		if ( request.getResponseHeader( 'x-eresult' ) == 1 )
		{
			callback( results )
		}
		else
		{
			error();
		}
	}).fail( error );
};

CServerInterface.prototype.ReportBossDamage = function( damagedone, damagetaken, usedhealing, callback, error )
{
	var instance = this;
	var rgParams = {
		access_token: instance.m_WebAPI.m_strOAuth2Token,
		use_heal_ability: usedhealing,
		damage_to_boss: damagedone,
		damage_taken: damagetaken
	};

	$J.ajax({
		url: this.m_WebAPI.BuildURL( 'ITerritoryControlMinigameService', 'ReportBossDamage', true ),
		method: 'POST',
		data: rgParams,
	}).success( function( results, textStatus, request ) {
		if ( request.getResponseHeader( 'x-eresult' ) == 1 )
		{
			callback( results )
		}
		else
		{
			error( null, request.getResponseHeader( 'x-eresult' ) );
		}
	}).fail( error );
};

CServerInterface.prototype.LeaveGameInstance = function( instanceid, callback, error )
{
	var instance = this;
	var rgParams = {
		access_token: instance.m_WebAPI.m_strOAuth2Token,
		gameid: instanceid,
	};

	$J.ajax({
		url: this.m_WebAPI.BuildURL( 'IMiniGameService', 'LeaveGame', true ),
		method: 'POST',
		data: rgParams,
	}).success( function( results, textStatus, request ) {
		if ( request.getResponseHeader( 'x-eresult' ) == 1 )
		{
			callback( results )
		}
		else
		{
			error();
		}
	}).fail( error );
};
