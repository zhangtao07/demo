


var https = require('https');
var url = require('url');
var request = require('request');
var xml2json = require("xmlparser");

/**
 * cas认证类
 * @param  {[type]} cas参数，必须参cas认证url和service
 * @return {[type]}
 */
var CAS = module.exports = function CAS(options) {  
    options = options || {};

    //cas服务认证API地址
    if (!options.base_url) {
      throw new Error('Required CAS option `base_url` missing.');
    }
    //此参数控制需要验证的url和验证成功后返回的url，必填
    if (!options.service) {
      throw new Error('Required CAS option `service` missing.');
    }
    this.base_url = options.base_url;
    this.service = options.service;
    this.version = '0.0.1';
};

/**
 * cas单点登录认证方法，通过ticket参数去cas服务器认证，返回xml
 * @param  {[type]}   ticket
 * @param  {Function} callback
 * @return {[type]}
 */
CAS.prototype.validate = function(ticket, callback) {
    
    //默认为cas 2.0协议地址
    //如果是cas 1.0 ,验证地址为base_url+ /validate 
    var url = this.base_url + "/serviceValidate?ticket=" 
                  + ticket + '&service=' + this.service;
    request.get({
        uri: url
    }, function(err, response, body) {
        //请求出错
        if (err) {
            callback(err, null, null);
            return;
        }
        //返回的xml需去掉:cas 或者cas:,否则解析出错
        var str = body.replace(/:?cas:?/g, '');
        var json = {},status = "success";
        try{
            json = xml2json.parser(str);
        }catch(e){
            status = "fail";
        }
        //获取用户名
        if(json['serviceResponse'] && json['serviceResponse']['authenticationSuccess']){
            callback(null,'success',json['serviceResponse']['authenticationSuccess']['user']);
        }else{
            callback('validate fail!','error',null);
        }
        
    });
};


//express  cas认证中间件，从session中判断是否登录
module.exports = function(base_url,service){
    

    return function(req, res, next) { 
        //去除url后面可能的/
        base_url = base_url.replace(/(\/+)$/,""); 
        
        var cas = new CAS({'base_url': base_url, 'service': service});
            if (!req.session.username) {
                  var ticket = req.param('ticket');
            if (ticket) {
                cas.validate(ticket, function(err, status, username) {
                    if (err) {
                        //认证失败,do something
                        console.log('CAS Validate error! detail:' + err);
                    } else {
                        req.session.username = username;
                        next();
                    }
                });
            }else{
                res.redirect( base_url +'/login?service='+ service);
            }
            }else{
                 next();
            }
    }
}
