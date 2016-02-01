
var fs = require('fs');
var path = require('path');
var ejs = require('ejs');

var ifiles = require('./ifiles');
var generate = require('./generate')
var colors = require('colors')

/*
	文件服务主功能
	---------------------------------------------
*/
exports.serverStatic = function(req, res, root, reqPath, callback) {
	// 中文乱码转码
	reqPath = decodeURI(reqPath);

	if (reqPath.indexOf('/bin/') !== 0) {
		reqPath = '/public'+reqPath;
	}

	// console.log('reqPath: '+reqPath);
	var _path = path.join(root, reqPath);

	// 生成静态页面
	if (/\/:[make|important]/.test(reqPath)) {

		var _dir = path.dirname(_path)
		var _type = 'make';

		// 判断是否是覆盖生成请求
		if (/important/.test(reqPath)) {
			_type = 'important';
		}
		var copyPath = _dir.replace(/public/i, 'html')

		var html = generate.generate(res, _dir, copyPath, _type);

		var _html = ejs.render(fs.readFileSync(__dirname + '/make.ejs', 'utf8'), {MArr: html});

		res.send(_html)

		return;
	}

	// 是否存在文件
	var isStat = function(_path) {

		// 文件路径参数集
		// 用来收集建议信息
		var statsArr = arguments;

		// 生成建议路径
		if (statsArr.length > 1) {
			// 修改文件名
			var extName = path.extname(_path);
			_path = _path.replace(extName, statsArr[1]);
			console.log('Suggest Path:'.white.bgYellow, _path)
		}

		fs.stat(_path, function(err, stats) {
			if (err) {
				console.log('No '.white.bgRed+' - '+_path)
				
				/* 
					如果没有找到的文件
					则为用户推荐ejs或jade的模板文件
					当然前提是在请求html的时候

					目标是为了解决 
					1.jQuery load请求时可以统一使用
					/dome/page.html 的方法
					2.导航上直接使用以html为后缀的文件跳转名
				*/

				// 文件后缀名是什么
				var fileExtName = ''

				// 当在原始请求时，参数只有地址
				// 这时长度为1，我们取文件格式
				// 判断是否满足以下建议形式的文件
				if (statsArr.length == 1) {
					fileExtName = path.extname(_path)
				} 
				// 当是建议文件时，我们会增加2个参数进去
				// 用来处理建议内容
				else {
					// 取得建议文件的原始格式
					fileExtName = statsArr[2]
				}

				switch (fileExtName) {
					// 在请求的HTML不存在时
					// 我们先去尝试请求 ejs 模板文件
					// 然后在 ejs 的模板也不存在时，尝试jade模板
					// 如果您使用 jade 的比较多，可以修改下面文件
					case '.html':

						// 添加建议格式 ejs
						var suggestExtName = '.ejs';

						// 参数大于1时，这时建议已经在处理过 ejs 的建议了
						if (statsArr.length > 1 && statsArr[1] !== '.jade') {
							suggestExtName = '.jade'
						}

						isStat(_path, suggestExtName, '.html');
						return;

				}

				// 如果没有建议文件或建议文件也不存在
				// 提示 404
				ifiles.sendError(res, 404)
				return;
			}

			// 如果请求的文件存在
			// 判断是文件还是文件夹
			// 文件则显示内容
			if (stats.isFile()) {

				// 如果文件是ejs或是jade
				// 我们渲染成页面输出，防止下载下来了
				if (path.extname(_path) === '.ejs' || 
					path.extname(_path) === '.jade') {
					res.render(_path);
				} else {

					ifiles.sendFile(req, res, _path)
				}

			} 
			// 文件夹则显示内部的文件目录
			else if(stats.isDirectory()) {
				ifiles.showDirecotry(res, root, reqPath)
			}
		})

	}

	isStat(_path)

}