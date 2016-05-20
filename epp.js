#! /usr/bin/env node

/*
	iServer
	-----------------------------------------------

*/

'use strict';

var express = require('express')
var http = require('http')
var fs = require('fs')
var url = require('url')
var path = require('path')

var colors = require('colors')

var server = require('./bin/server')
var ifiles = require('./bin/ifiles')
var getIPs = require('./bin/getIPs')
var comStr = require('./bin/commandStr')
var _command = comStr.commandStr();
var open   = require('./bin/open');
var config = require('./config');

// 默认设置
var packageInfo = JSON.parse(fs.readFileSync(__dirname+'/package.json', 'utf8'));
var version = config.name +' '+ config.version;

if (_command.v || _command.help) {
	if (_command.v) {
		console.log(version);
	} else {
		console.log(comStr.printHelp())
	}
	return
}

// 默认端口设置
var port = _command.port || config.port;

var app = express()
var iserverRootPath = __dirname;
// var iserverRootPath = process.cwd();
console.log(process.cwd())

app.set('views', iserverRootPath)
app.set('view engine', 'ejs')

app.get('/favicon.ico', function(req, res) {
	res.end();
	return
});

app.get('*', function(req, res) {
	var _css = '/bin/css/layout.css';
	var _fIco = '/bin/img/file.png';
	var _dIco = '/bin/img/folder.png';
	var _favicon = '/bin/favicon.png';
	var _path = req.path;

	// 过滤以上文件请求提示
	if (!(_path == _css || _path == _fIco || _path == _dIco || _path == _favicon)) {
		console.log(req.method.bgGreen.white +' - ' +decodeURI(_path))
	}

	var usrRootPath = process.cwd();
	server(req, res, usrRootPath, _path);
})

// 项目工作配置目录
var projectConfig = '/bin/config.json';
// 配置数据
var configInfo = false;

app.post('*', function(req, res) {
	var _path = req.path;

	console.log(req.method.bgBlue.white +' - ' +decodeURI(_path))

	// 项目请求目录
	var _PRO_PATH = _path.match(/\/.*(?=\/)/)[0].substr(1);
	// 获取主配置文件
	var _PRO_CON  = getJSONNote(__dirname + projectConfig);


	configInfo = getJSONNote(__dirname + '/public/'+_PRO_CON[_PRO_PATH]+'/Dev/Data/config.json');

	var sendMes = {
		"form": "iServer",
		"status": true
	}

	// 请求模拟路径
	var dataPath = __dirname + '/public/'+_PRO_CON[_PRO_PATH]+'/Dev/Data/' + configInfo[decodeURI(_path)];
	sendMes.mes = getJSONNote(dataPath);

	res.json(sendMes)

})


app.listen(port, function() {
	console.log(('=================================\nWelcome to '+version+'\n=================================').rainbow)

	// 生成缓存文件
	try {
		console.log('Have Cache')
		fs.statSync(__dirname+'/.iServer-cache')
	} catch(err) {
		console.log('Mkdir Cache')
		fs.mkdirSync('.iServer-cache')
	}

	if (_command.browser) {
		openBrowser(_command.browser)
	}

	var zip = getIPs().IPv4;

	for (var i in zip) {
		console.log(zip[i] + ':' + port)
	}
})

/* 
	获取JSON
	-------------------------------------
	去除JSON中的注释 
*/
function getJSONNote (dataPath) {
	var JSONInner = {};

	try {

		JSONInner = fs.readFileSync(dataPath, 'utf8')
		// 去注释和压缩空格
		JSONInner = JSONInner.replace(/(\/{2}.+)|\s/g, '')

	} catch (err) {
		console.log('无法找到配置文件 '.bgRed.white+dataPath.bgYellow.white)
	}

	JSONInner = JSON.parse(JSONInner);

	return JSONInner
}

/*
	在浏览器中打开页面
	--------------------------------------

*/
function openBrowser(browserName) {

	var hostName = getIPs().IPv4;

	if (typeof browserName == 'boolean') browserName = ''

	for (var i in hostName) {
		if (hostName[i] == '127.0.0.1') {
			hostName.splice(i,1);
		}
	}

	console.log(hostName)

	var url = 'http://'+hostName[0]+':'+port;

	open(url, browserName)

}