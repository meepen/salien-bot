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
    success(fn) {
        this.succ = fn;
        return this;
    }
    fail(fn) {
        this.nosucc = fn;
        return this;
    }
}

const jar = request.jar();


j.ajax = function ajax(data) {
    jar.setCookie(request.cookie(`access_token=${j.token}`), data.url)
    let ajax_object = new AjaxResponse();

    let url = data.url;
    let form;
    if (data.method == "POST")
        form = data.data;
    else if (data.method == "GET" && data.data)
        url += "?" + qs.stringify(data.data);

    request({
        url: url,
        method: data.method,
        jar: jar,
        form: form
    }, function response(err, resp, body) {
        console.log(err,body)
        if (err) {
            if (ajax_object.nosucc)
                ajax_object.nosucc();
            return;
        }
        
        let value = body;
        if (data.dataType == "json")
            value = JSON.parse(value);
        
        if (ajax.succ)
            ajax.succ(value);
    })

    return ajax_object;
}