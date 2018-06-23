const request = require("request");
const qs = require("querystring");

let j = module.exports.jQuery = {}

/*
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
*/

class AjaxResponse {
    constructor() {
        this._fails = 0;
    }
    success(fn) {
        this.succ = fn;
        return this;
    }
    fail(fn) {
        this.nosucc = fn;
        return this;
    }
}

class AjaxResponseObject {
    constructor(resp) {
        this._ = resp;
    }
    getResponseHeader(name) {
        return this._.headers[name];
    }
}

const jar = request.jar();


let internal_ajax = function internal_ajax(data, ajax_object) {
    let url = data.url;
    let form;
    if (data.method == "POST")
        form = data.data;
    else if (data.method == "GET" && data.data)
        url += "?" + qs.stringify(data.data);

    global.log(`url ${url} requested`);
    request({
        url: url,
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.87 Safari/537.36",
            "Referer": "https://steamcommunity.com/saliengame/play/",
            "Origin": "https://steamcommunity.com"
        },
        method: data.method,
        jar: jar,
        form: form,
        timeout: 5000
    }, function response(err, resp, body) {
        if (!ajax_object.nosucc)
            global.log(new Error("no ajax fail function"));

        if (err || resp.statusCode == 500 || resp.statusCode == 503) {
            global.log(`failed url ${url}, count ${++ajax_object._fails}`);
            if (ajax_object._fails > 1)
                ajax_object.nosucc();
            else
                internal_ajax(data, ajax_object);
            return;
        }
        
        let value = body;
        //if (data.dataType == "json")
            value = JSON.parse(value);
        
        if (ajax_object.succ)
            ajax_object.succ(value, null, new AjaxResponseObject(resp));
    })
}

j.ajax = function ajax(data) {
    jar.setCookie(request.cookie(`access_token=${j.token}`), data.url)
    let ajax_object = new AjaxResponse();

    internal_ajax(data, ajax_object);

    return ajax_object;
}