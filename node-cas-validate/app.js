
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var cas = require('./lib/cas');

var app = express();

// all environments
app.set('port', process.env.PORT || 8012);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.static(path.join(__dirname, 'public')));

//基于cookie的session,安全性较弱
app.use(express.cookieParser('cas-test'));
app.use(express.cookieSession());
//cas url 和认证service
app.use(cas('https://itebeta.baidu.com','http://fedev.baidu.com:8012'));

app.use(app.router);


// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
