var TIDYUPWHITE = new RegExp(String.fromCharCode(160), 'g');

FUNC.parsefields = function(value) {

	var sql = (/"\s(varchar|int|float|numeric|text)/i).test(value);
	var fields = [];

	if (sql) {

		var arr = value.match(/".*?"\s(\w+)(\(\d+|\s|)/g);
		if (arr) {

			for (var i = 0; i < arr.length; i++) {
				var item = arr[i].trim();
				var index = item.lastIndexOf(' ');
				var name = item.substring(0, index).replace(/"|'/g, '').trim();
				var type = item.substring(index + 1).trim().toLowerCase().replace(/\(,/g, '');

				var length = item.match(/\d+/);
				if (length)
					type = type.replace(/\(/g, '').replace(length + '', '');

				switch (type) {
					case 'int2':
					case 'int4':
					case 'int8':
					case 'int':
					case 'float2':
					case 'float4':
					case 'float8':
					case 'number':
					case 'numeric':
					case 'decimal':
						type = 'number';
						break;
					case 'varchar':
					case 'text':
						type = 'string' + (length ? ('(' + length + ')') : '');
						break;
					case 'bool':
					case 'boolean':
					case 'bit':
						type = 'boolean';
						break;
					case 'timestamp':
					case 'date':
						type = 'date';
						break;
					case 'json':
						type = 'object';
						break;
					default:
						type = '';
						break;
				}

				if (name && type) {
					var path = name;
					name = name.substring(0, 1).toUpperCase() + name.substring(1);

					if (name.substring(name.length - 2) === 'id')
						name = name.substring(0, name.length - 2) + ' ID';

					fields.push({ type: type, path: path, name: name });
				}
			}
		}

	} else {
		var lines = value.split('\n');
		for (var i = 0; i < lines.length; i++) {
			var line = lines[i];
			var beg = line.indexOf('(');
			if (beg === -1)
				continue;

			var end = line.lastIndexOf(')');
			if (end === -1)
				continue;

			var arr = line.substring(beg + 1, end).split(',');
			var path = arr[0].replace(/"|'/g, '').trim();
			var name = path;
			var type = arr[1].replace(/"|'|\(\d+\)/g, '').trim().toLowerCase();
			var def = undefined;

			end = type.indexOf(')');
			if (end !== -1)
				type = type.substring(0, end);

			switch (type) {
				case 'email':
					def = '@';
					break;
				case 'zip':
					type = 'string';
					break;
				case 'uid':
					type = 'id';
					break;
			}

			name = name.substring(0, 1).toUpperCase() + name.substring(1);

			if (name.substring(name.length - 2) === 'id')
				name = name.substring(0, name.length - 2) + ' ID';

			fields.push({ type: type, path: path, name: name, def: def });
		}
	}

	return fields;
};

FUNC.tidyup = function(val) {
	var lines = val.split('\n');
	for (var i = 0, length = lines.length; i < length; i++)
		lines[i] = lines[i].replace(/\s+$/, '');
	return lines.join('\n').trim().replace(TIDYUPWHITE, ' ');
};

FUNC.guid = function() {
	function s4() {
		return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
	}
	return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
};

FUNC.getext = function(syntax) {
	switch (syntax) {
		case 'totaljs':
		case 'text/html':
		case 'html':
			return 'html';
		case 'application/x-httpd-php':
		case 'php':
			return 'php';
		case 'javascript':
		case 'js':
			return 'js';
		case 'text/css':
		case 'css':
			return 'css';
		case 'text/x-csrc':
		case 'text/x-c++src':
		case 'cpp':
			return 'cpp';
		case 'text/x-sql':
		case 'sql':
			return 'sql';
		case 'application/ld+json':
		case 'application/json':
		case 'text/json':
		case 'json':
			return 'json';
		case 'text/x-cython':
		case 'python':
		case 'py':
			return 'python';
		case 'text/x-sh':
		case 'bash':
		case 'sh':
			return 'bash';
		case 'text/x-sass':
		case 'sass':
			return 'sass';
		case 'text/x-yaml':
		case 'yaml':
			return 'yaml';
		case 'application/xml':
		case 'text/xml':
		case 'xml':
			return 'xml';
	}
	return 'plain';
};

FUNC.comment = function(ext, sel) {
	for (var j = 0; j < sel.length; j++) {

		var line = sel[j].trimRight();
		if (!line)
			continue;

		var index = line.lastIndexOf('\t');
		switch (ext) {
			case 'js':
				if (line.indexOf('//') === -1) {
					if (index !== -1)
						index++;
					line = line.substring(0, index) + '// ' + line.substring(index);
				} else
					line = line.replace(/\/\/(\s)/g, '');
				break;

			case 'html':
				if (line.indexOf('<!--') === -1) {
					if (index !== -1)
						index++;
					line = line.substring(0, index) + '<!-- ' + line.substring(index) + ' -->';
				} else
					line = line.replace(/<!--(\s)|(\s)-->/g, '');
				break;
			case 'css':
				if (line.indexOf('/*') === -1) {
					if (index !== -1)
						index++;
					line = line.substring(0, index) + '/* ' + line.substring(index) + ' */';
				} else
					line = line.replace(/\/\*(\s)|(\s)\*\//g, '');
				break;
		}
		sel[j] = line;
	}
	return sel;
};

FUNC.alignsitemap = function(sel) {

	var data = [];
	var max1 = 0;
	var max2 = 0;
	var max3 = 0;

	for (var j = 0; j < sel.length; j++) {
		var line = sel[j];
		var index = line.indexOf(':');
		if (index === -1 || line.charAt(0) === '/') {
			data.push(line);
			continue;
		}

		var obj = {};
		obj.key = line.substring(0, index).trim();
		var arr = line.substring(index + 1).split('-->');
		obj.title = (arr[0] || '').trim();
		obj.url = (arr[1] || '').trim();
		obj.parent = (arr[2] || '').trim();

		max1 = Math.max(max1, obj.key.length);
		max2 = Math.max(max2, obj.title.length);
		max3 = Math.max(max3, obj.url.length);

		data.push(obj);
	}

	var padding = 10;

	for (var j = 0; j < sel.length; j++) {
		var obj = data[j];
		if (typeof(obj) === 'string')
			sel[j] = obj;
		else
			sel[j] = obj.key.padRight(max1 + padding, ' ') + ': ' + obj.title.padRight(max2 + padding, ' ') + ' --> ' + obj.url.padRight(max3 + padding, ' ') + (obj.parent ? (' --> ' + obj.parent) : '');
	}

	return sel;
};

FUNC.aligntext = function(sel) {

	var align = { ':': 1, '|': 1, '=': 1, '\'': 1, '"': 1, '{': 1 };
	var max = 0;
	var line, c, p;

	for (var j = 0; j < sel.length; j++) {
		var line = sel[j];
		for (var i = 1; i < line.length; i++) {
			c = line.charAt(i);
			p = line.charAt(i - 1);
			if (align[c] && (p === '\t' || p === ' ')) {
				var count = line.substring(0, i - 1).trim().length + 1;
				max = Math.max(count, max);
				break;
			}
		}
	}

	for (var j = 0; j < sel.length; j++) {
		var line = sel[j];
		for (var i = 1; i < line.length; i++) {
			c = line.charAt(i);
			p = line.charAt(i - 1);
			if (align[c] && (p === '\t' || p === ' ')) {
				var current = sel[j].substring(0, i - 1).trim();
				var plus = ''.padLeft(max - current.length, p);
				sel[j] = current + sel[j].substring(i - 1, i) + plus + sel[j].substring(i);
			}
		}
	}

	return sel;
};

FUNC.hex2rgba = function(hex) {
	var c = (hex.charAt(0) === '#' ? hex.substring(1) : hex).split('');
	if(c.length === 3)
		c = [c[0], c[0], c[1], c[1], c[2], c[2]];

	var a = c.splice(6);
	if (a.length)
		a = parseFloat(parseInt((parseInt(a.join(''), 16) / 255) * 1000) / 1000);
	else
		a = '1';

	c = '0x' + c.join('');
	return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',' + a + ')';
};

FUNC.rgba2hex = function(rgba) {
	var m = rgba.match(/\d+,(\s)?\d+,(\s)?\d+,(\s)?[.0-9]+/);
	if (m) {
		m = m[0].split(',').trim();

		var a = m[3];
		if (a) {
			if (a.charAt(0) === '.')
				a = '0' + a;
			a = a.parseFloat();
			a = ((a * 255) | 1 << 8).toString(16).slice(1);
		} else
			a = '';

		return '#' + ((m[0] | 1 << 8).toString(16).slice(1) + (m[1] | 1 << 8).toString(16).slice(1) + (m[2] | 1 << 8).toString(16).slice(1) + a).toUpperCase();

	} else
		return rgba;
};

FUNC.alignrouting = function(text) {

	var lines = text.split('\n');
	var maxmethod = 0;
	var maxurl = 0;
	var maxschema = 0;
	var maxid = 0;

	for (var i = 0; i < lines.length; i++) {
		var line = lines[i];

		if (!line || line.indexOf('ROUTE(\'') === -1)
			continue;

		var beg = line.indexOf('\'');
		var end = line.indexOf('\'', beg + 2);
		var str = line.substring(beg + 1, end);
		var data = str.split(/\s{1,}|\t/);

		if (data[0].length > maxmethod)
			maxmethod = data[0].length;

		if (data[1].length > maxurl)
			maxurl = data[1].length;

		if (line.indexOf('API') === -1) {

			if (data[2] && data[2].length > maxschema)
				maxschema = data[2].length;

		} else {

			if (data[2] && data[2].length > maxid)
				maxid = data[2].length;

			if (data[3] && data[3].length > maxschema)
				maxschema = data[3].length;

		}


		beg = line.indexOf(',');
	}

	maxmethod += 4;
	maxurl += 4;
	maxschema += 2;

	if (maxid)
		maxid += 4;

	for (var i = 0; i < lines.length; i++) {
		var line = lines[i];

		if (!line || line.indexOf('ROUTE(\'') === -1)
			continue;

		var beg = line.indexOf('\'');
		var end = line.indexOf('\'', beg + 2);
		var str = line.substring(beg + 1, end);
		var data = str.split(/\s{1,}|\t/);
		var builder = [];

		for (var j = 0; j < data.length; j++) {

			var c = data[j].charAt(0);

			// method
			switch (j) {

				case 0: // method
					builder.push(data[j].padRight(maxmethod, ' '));
					break;

				case 1: // url
					builder.push(data[j].padRight(maxurl, ' '));
					break;

				case 2: // schema

					if (c === '-' || c === '+' || c === '#') {
						builder.push(data[j].padRight(maxid, ' '));
					} else {
						maxid && builder.push(''.padRight(maxid, ' '));
						builder.push(data[j].padRight(maxschema, ' '));
					}

					break;

				case 3: // schema
					if (c === '-' || c === '+' || c === '#')
						builder.push(' ' + data[j]);
					else
						builder.push(data[j].padRight(maxschema, ' '));
					break;

				default: // operations
					builder.push(' ' + data[j]);
					break;

			}
		}

		var clean = line.substring(end).replace(/\s{2,}/, ' ');
		lines[i] = line.substring(0, beg) + '\'' + builder.join('').trim() + clean;
	}

	return lines.join('\n');
};

FUNC.cleanduplicatedlines = function(val) {

	var output = [];
	var cache = [];

	val = val.split('\n');

	for (var i = 0; i < val.length; i++) {
		var line = val[i];
		if (!line) {
			output.push('');
			continue;
		}

		var k = line.trim();
		if (cache.indexOf(k) !== -1) {
			output.push(line);
			cache.push(k);
		}
	}

	return output.join('\n');
};

FUNC.colorize = function(css, cls) {
	var lines = css.split('\n');
	var builder = [];

	var findcolor = function(val) {
		var color = val.match(/#[0-9A-F]{1,6}/i);
		if (color)
			return color + '';
		var beg = val.indexOf('rgba(');
		if (beg === -1)
			return;
		return val.substring(beg, val.indexOf(')', beg) + 1);
	};

	for (var i = 0; i < lines.length; i++) {

		var line = lines[i];

		if (!line) {
			builder.push('');
			continue;
		}

		var beg = line.indexOf('{');
		if (beg === -1)
			continue;

		var end = line.lastIndexOf('}');
		if (end === -1)
			continue;

		var cmd = line.substring(beg + 1, end).split(';');
		var cmdnew = [];

		for (var j = 0; j < cmd.length; j++) {
			var c = cmd[j].trim().split(':').trim();
			switch (c[0]) {
				case 'border':
				case 'border-left':
				case 'border-top':
				case 'border-right':
				case 'border-bottom':
				case 'outline':
					var color = findcolor(c[1]);
					if (color)
						cmdnew.push(c[0] + '-color: ' + color);
					break;
				case 'background':
				case 'border-left-color':
				case 'border-right-color':
				case 'border-top-color':
				case 'border-bottom-color':
				case 'border-color':
				case 'background-color':
				case 'outline-color':
				case 'color':
				case 'stroke':
				case 'fill':
					cmdnew.push(c[0] + ': ' + c[1]);
					break;
			}
		}
		if (cmdnew.length) {
			var selector = line.substring(0, beg).trim();
			var sel = selector.split(',').trim();
			for (var k = 0; k < sel.length; k++)
				sel[k] = (cls ? (cls + ' ') : '') + sel[k].trim().replace(/\s{2,}/g, ' ');
			builder.push(sel.join(', ') + ' { ' + cmdnew.join('; ') + '; }');
		}
	}

	var arr = [];
	var prev = '';
	for (var i = 0; i < builder.length; i++) {
		var line = builder[i];
		if (prev === line)
			continue;
		prev = line;
		arr.push(line);
	}

	return arr.join('\n');
};

FUNC.responsive = function(css) {

	var lines = css.split('\n');
	var builder = [];

	for (var i = 0; i < lines.length; i++) {

		var line = lines[i];

		if (!line) {
			builder.push('');
			continue;
		}

		var beg = line.indexOf('{');
		if (beg === -1)
			continue;

		var end = line.lastIndexOf('}');
		if (end === -1)
			continue;

		var cmd = line.substring(beg + 1, end).split(';');
		var cmdnew = [];

		for (var j = 0; j < cmd.length; j++) {
			var c = cmd[j].trim().split(':').trim();
			switch (c[0]) {
				case 'margin':
				case 'left':
				case 'top':
				case 'right':
				case 'bottom':
				case 'padding':
				case 'max-width':
				case 'max-height':
				case 'position':
				case 'z-index':
				case 'min-width':
				case 'min-height':
				case 'margin-left':
				case 'margin-top':
				case 'margin-right':
				case 'margin-bottom':
				case 'padding-left':
				case 'padding-top':
				case 'padding-right':
				case 'padding-bottom':
				case 'width':
				case 'font':
				case 'font-size':
				case 'line-height':
				case 'height':
					cmdnew.push(c[0] + ': ' + c[1]);
					break;
			}
		}
		if (cmdnew.length) {
			var selector = line.substring(0, beg).trim();
			var sel = selector.split(',').trim();
			for (var k = 0; k < sel.length; k++)
				sel[k] = sel[k].trim().replace(/\s{2,}/g, ' ');
			builder.push(sel.join(', ') + ' { ' + cmdnew.join('; ') + '; }');
		}
	}

	var arr = [];
	var prev = '';
	for (var i = 0; i < builder.length; i++) {
		var line = builder[i];
		if (prev === line)
			continue;
		prev = line;
		arr.push(line);
	}

	return arr.join('\n');
};

FUNC.makejsonfromschema = function(val) {

	var model = [];
	var lines = val.split('\n');

	for (var i = 0; i < lines.length; i++) {
		var line = lines[i].trim();
		var beg = line.indexOf('\'');
		if (beg === -1)
			continue;

		var end = line.indexOf('\'', beg + 1);
		if (end === -1)
			continue;

		var key = line.substring(beg + 1, end).trim();

		beg = end + 3;
		end = line.lastIndexOf(',');

		if (end === -1 || end <= beg) {
			end = line.indexOf(')');
			if (end !== -1)
				end++;
		}

		if (end === -1)
			continue;

		var val = line.substring(beg, end).trim().replace(/^('|")|('|")$/g, '');

		if (val.charAt(val.length - 1) === ')' && val.lastIndexOf('(', val.length - 1) === -1)
			val = val.substring(0, val.length - 1);

		if (val.charAt(val.length - 1) === '\'')
			val = val.substring(0, val.length - 1);

		if (model[model.length - 1])
			model[model.length - 1] += ',';

		model.push('\t"' + key + '": ' + val.replace(/'/g, '"'));
	}

	return '{\n' + model.join('\n') + '\n}';
};

FUNC.formatjson = function(obj) {
	var reguid2 = /"\d{14,}[a-z]{3}[01]{1}|"\d{9,14}[a-z]{2}[01]{1}a|"\d{4,18}[a-z]{2}\d{1}[01]{1}b|"[0-9a-f]{4,18}[a-z]{2}\d{1}[01]{1}c"/g;
	obj.HTML = undefined;
	return JSON.stringify(obj, null, '\t').replace(/\t.*?:\s/g, function(text) {
		return '<span class="db-object">' + text + '</span>';
	}).replace(/\/span>false/g, function() {
		return '/span><span class="db-string">false</span>';
	}).replace(/\/span>null/g, function() {
		return '/span><span class="db-null">null</span>';
	}).replace(reguid2, function(text) {
		return '<span class="db-uid">' + text + '</span>';
	});
};

FUNC.strim = function(value) {
	var c = value.charAt(0);
	if (c !== ' ' && c !== '\t')
		return value;

	for (var i = 0; i < value.length; i++) {
		c = value.charAt(i);
		if (c !== ' ' && c !== '\t')
			break;
	}

	var count = i;
	var lines = value.split('\n');

	for (var i = 0; i < lines.length; i++) {
		var line = lines[i];
		if (line.length > count)
			lines[i] = line.substring(count);
	}

	return lines.join('\n');
};

FUNC.rtrim = function(value) {
	var lines = value.split('\n');
	var reg = /\s+$/;
	for (var i = 0; i < lines.length; i++)
		lines[i] = lines[i].replace(reg, '');
	return lines.join('\n').replace(TIDYUPWHITE, ' ');
};

(function() {

	function analyze(body) {

		body = body.trim();

		var matches;
		var queries = [];
		var params = [];
		var filters = [];
		var isid = body.indexOf('$.id') !== -1;
		var autofill;
		var autoquery;
		var dbfields;
		var tmp;
		var arr;
		var issuccess = body.indexOf('$.success(') !== -1 || body.indexOf('$.done(') !== -1;

		matches = body.match(/query\.[a-z0-9_]+/gi);

		if (matches) {
			for (var i = 0; i < matches.length; i++) {
				tmp = matches[i].trim();
				var index = tmp.lastIndexOf('.');
				tmp = tmp.substring(index + 1);
				if (tmp && queries.indexOf(tmp) === -1)
					queries.push(tmp);
			}
		}

		matches = body.match(/filter\.[a-z0-9_]+/gi);
		if (matches) {
			for (var i = 0; i < matches.length; i++) {
				tmp = matches[i].trim();
				var index = tmp.lastIndexOf('.');
				tmp = tmp.substring(index + 1);
				if (tmp && filters.indexOf(tmp) == -1)
					filters.push(tmp);
			}
		}

		matches = body.match(/params\.[a-z0-9_]+/gi);
		if (matches) {
			for (var i = 0; i < matches.length; i++) {
				tmp = matches[i].trim();
				var index = tmp.lastIndexOf('.');
				tmp = tmp.substring(index + 1);
				if (tmp && params.indexOf(tmp) == -1)
					params.push(tmp);
			}
		}

		var index = body.indexOf('.fields(');
		if (index !== -1) {

			tmp = body.substring(index + 9, body.indexOf(')', index)).split(/'|"/);

			dbfields = [];

			if (tmp[0])
				dbfields = tmp[0].split(',').trim();

			dbfields = dbfields.remove(function(item) {
				return item.charAt(0) === '-';
			});

			if (tmp[3])
				autofill.skip = tmp[3].split(',').trim();

			if (tmp[5] && tmp[5].length > 2)
				autofill.sort = tmp[5];
		}

		var index = body.indexOf('.autofill(');
		if (index !== -1) {
			tmp = body.substring(index + 9, body.indexOf(')', index)).split(/'|"/);

			autofill = {};

			if (tmp[1]) {
				arr = tmp[1].split(',').trim();
				autofill.fields = [];
				for (var i = 0; i < arr.length; i++) {
					var item = arr[i].split(':');
					autofill.fields.push({ name: item[0], type: item[1] });
				}
			}

			if (tmp[3])
				autofill.skip = tmp[3].split(',').trim();

			if (tmp[5] && tmp[5].length > 2)
				autofill.sort = tmp[5];
		}

		var index = body.indexOf('.autoquery(');
		if (index !== -1) {
			tmp = body.substring(index + 10, body.indexOf(')', index)).split(/'|"/);

			autoquery = {};

			if (tmp[1]) {
				arr = tmp[1].split(',').trim();
				autoquery.fields = [];
				for (var i = 0; i < arr.length; i++) {
					var item = arr[i].split(':');
					autoquery.fields.push({ name: item[0], type: item[1] || 'String' });
				}
			}

			if (tmp[2] && tmp[2].length > 2)
				autoquery.sort = tmp[2];
		}

		var fields = {};

		if (autofill) {
			for (var i = 0; i < autofill.fields.length; i++) {
				var item = autofill.fields[i];
				if (item.name && item.name.charAt(0) !== '-' && !fields[item.name])
					fields[item.name] = item;
			}
		}

		if (autoquery) {
			for (var i = 0; i < autoquery.fields.length; i++) {
				var item = autoquery.fields[i];
				if (item.name && item.name.charAt(0) !== '-' && !fields[item.name])
					fields[item.name] = item;
			}
		}

		if (autofill && autofill.skip) {
			for (var i = 0; i < autofill.skip.length; i++) {
				var item = autofill.skip[i];
				delete fields[item];
			}
		}

		if (autoquery && autoquery.skip) {
			for (var i = 0; i < autoquery.skip.length; i++) {
				var item = autoquery.skip[i];
				delete fields[item];
			}
		}

		var model = {};
		model.query = [];
		model.params = params;
		model.success = issuccess;

		for (var i = 0; i < queries.length; i++) {
			if (model.query.indexOf(queries[i]) === -1)
				model.query.push(queries[i]);
		}

		for (var i = 0; i < filters.length; i++) {
			if (model.query.indexOf(filters[i]) === -1)
				model.query.push(filters[i]);
		}

		if (dbfields) {
			for (var i = 0; i < dbfields.length; i++) {
				if (!fields[dbfields[i]])
					fields[dbfields[i]] = { name: dbfields[i], type: 'String' };
			}
		}

		var keys = Object.keys(fields);
		model.fields = [];
		for (var i = 0; i < keys.length; i++) {
			model.fields.push(fields[keys[i]]);
		}

		model.id = isid;
		model.autofill = !!autofill;

		return model;
	}

	function findname(line) {
		var index = line.indexOf('(');
		return line.substring(index + 1, line.indexOf(',', index)).replace(/"|'/g, '');
	}

	function findscope(beg, lines) {

		var output = [];
		var count = 0;

		beg++;

		for (var i = beg; i < lines.length; i++) {

			var line = lines[i];

			output.push(line);
			for (var j = 0; j < line.length; j++) {

				if (line.charAt(j) === '{') {
					count++;
					continue;
				}

				if (line.charAt(j) === '}') {
					count--;
					if (count === -1)
						return { body: output.join('\n'), end: i };
					continue;
				}
			}
		}

		return { body: output.join('\n'), end: i };
	}

	function parse(text) {

		var lines = text.split('\n');
		var builder = [];
		var schema = null;
		var tmp;

		for (var i = 0; i < lines.length; i++) {
			var line = lines[i];

			if (line.indexOf('ROUTE(') !== -1) {

				if (line.indexOf('*') === -1)
					continue;

				var route = {};
				var arr = line.trim().substring(7, line.lastIndexOf(')') - 1).replace(/(\s|\t){2,}|['"]/g, ' ').split(' ').trim();

				route.TYPE = 'route';
				route.method = arr[0].replace(/-|\+/g, '').toUpperCase();
				route.auth = arr[0].indexOf('+') !== -1;
				route.url = arr[1].trim();
				route.schema = ((route.method === 'API' ? arr[3] : arr[2]) || '').replace(/\*/g, '');

				var index = arr.findIndex('-->');
				if (index === -1)
					index = arr.findIndex('->');

				if (index) {
					for (var j = index; j < arr.length; j++) {
						if (arr[j] && arr[j].charAt(0) === '(') {
							// response
							route.action = arr[j - 1];
						}
					}
					if (!route.action)
						route.action = arr.splice(index + 1).join(' ');
				}

				if (route.action)
					route.action = route.action.replace(/@/g, '');

				if (route.method === 'API') {
					tmp = arr[2].split('/');
					for (var j = 1; j < tmp.length; j++) {
						if (tmp[j])
							tmp[j] = '{' + tmp[j] + '}';
					}
					arr[2] = tmp.join('/');
					route.operation = (arr[2] || '').replace(/\[|\]|,|\./g, '');
					var c = route.operation.charAt(0);
					route.operationtype = c === '+' ? 'POST' : c === '#' ? 'PATCH' : 'GET';
				}

				builder.push(route);

				// route
				continue;
			}

			if (line.indexOf('NEWSCHEMA(') !== -1) {

				var m = line.match(/'.*?'/);
				if (m == null)
					continue;

				schema = {};
				schema.TYPE = 'schema';
				schema.name = m.toString().replace(/'/g, '');
				schema.prop = [];
				builder.push(schema);
				continue;
			}

			var index = line.indexOf('define(');
			if (index !== -1) {

				var prop = line.substring(index + 7).trim().replace(/'|"/g, '').split(',').trim();
				var obj = { name: prop[0], type: prop[1].replace(/;/g, '').replace(/\)\)/g, ')'), required: !!prop[2] };

				if (obj.type.lastIndexOf(')') !== -1 && obj.type.lastIndexOf('(') === -1)
					obj.type = obj.type.replace(/\)/g, '');

				obj.type = obj.type.replace(/\)\(.*?\)/g, '');

				if (obj.type.charAt(0) === '[' && obj.type.charAt(obj.type.length - 1) !== ']')
					obj.type += ']';

				schema.prop.push(obj);
				// schema field
				continue;
			}

			if (line.indexOf('setSave(') !== -1) {
				var tmp = findscope(i, lines);
				schema.save = analyze(tmp.body);
				i = tmp.end;
				continue;
			}

			if (line.indexOf('addWorkflow(') !== -1) {
				var name = findname(line);
				var tmp = findscope(i, lines);
				if (!schema.workflows)
					schema.workflows = {};
				schema.workflows[name] = analyze(tmp.body);
				i = tmp.end;
				continue;
			}

			if (line.indexOf('setQuery(') !== -1) {
				var tmp = findscope(i, lines);
				schema.query = analyze(tmp.body);
				i = tmp.end;
				continue;
			}

			if (line.indexOf('setRead(') !== -1) {
				var tmp = findscope(i, lines);
				schema.read = analyze(tmp.body);
				i = tmp.end;
				continue;
			}

			if (line.indexOf('setRemove(') !== -1) {
				var tmp = findscope(i, lines);
				schema.remove = analyze(tmp.body);
				i = tmp.end;
				continue;
			}

			if (line.indexOf('setUpdate(') !== -1) {
				var tmp = findscope(i, lines);
				schema.update = analyze(tmp.body);
				i = tmp.end;
				continue;
			}

			if (line.indexOf('setInsert(') !== -1) {
				var tmp = findscope(i, lines);
				schema.insert = analyze(tmp.body);
				i = tmp.end;
				continue;
			}

			if (line.indexOf('setPatch(') !== -1) {
				var tmp = findscope(i, lines);
				schema.patch = analyze(tmp.body);
				i = tmp.end;
				continue;
			}

		}

		return builder;
	}

	FUNC.makedocs = function(body) {

		var items = parse(body);
		var schemas = {};
		var md = [];
		var groups = {};

		for (var i = 0; i < items.length; i++) {
			var item = items[i];

			if (item.TYPE === 'schema') {
				schemas[item.name] = item;
				continue;
			}

			if (groups[item.schema])
				groups[item.schema].push(item);
			else
				groups[item.schema] = [item];
		}

		items.quicksort('url,method');

		var gk = Object.keys(groups);
		for (var a = 0; a < gk.length; a++) {

			var gkk = gk[a].replace(/,|\./g, '');
			if (!gkk)
				continue;

			var gi = groups[gkk];
			if (!gi || !gi.length)
				continue;

			var mdindexer = md.length;
			var is = false;

			for (var i = 0; i < gi.length; i++) {
				var item = gi[i];

				if (item.TYPE !== 'route')
					continue;

				var schema = schemas[item.schema];

				if (!schema)
					continue;

				var op = schema[item.action] || (schema.workflows ? schema.workflows[item.action] : null);
				if (!op)
					continue;

				md.push('::: __`' + item.method.padRight(7, ' ') + '`__ `' + item.url + (item.method === 'API' ? ('  ' + item.operation) : '') + '`' + (item.auth ? ' {authorized}(flag)' : ''));
				md.push('');

				var tmpindex = md.length;
				var action = CLONE(item);

				is = true;

				if (op.query && op.query.length)
					action.query = op.query;

				if (schema.prop && schema.prop.length)
					action.fields = schema.prop;

				action.action = undefined;
				action.TYPE = undefined;

				md.push('__Notes__:');
				md.push('- [Make a request](#api_{0})'.format(btoa(encodeURIComponent(JSON.stringify(action, (k, v) => v ? v : undefined)))));

				if (item.auth)
					md.push('- request __must be authorized__');

				if ((item.method !== 'GET' && item.method !== 'API' && item.method !== 'DELETE') || (item.method === 'API' && item.operationtype !== 'GET')) {

					if (!item.operationtype || item.operationtype === 'POST')
						md.push('- request __must contain data__ in JSON format');
					else
						md.push('- request __can contain partialled data__ in JSON format');

					if (schema.prop && schema.prop.findItem('required', true))
						md.push('- __fields marked as bold__ are required');
				}

				md.push('');

				if (op.query && op.query.length) {
					md.push('__Query arguments__:');
					for (var j = 0; j < op.query.length; j++) {
						var tmp = op.query[j];
						md.push('- `{0}`'.format(tmp));
					}
					md.push('');
				}

				if (schema.prop && schema.prop.length) {
					if ((item.method !== 'GET' && item.method !== 'DELETE') && (!item.operation || item.operationtype !== 'GET')) {
						md.push('__Request data__:');

						for (var j = 0; j < schema.prop.length; j++) {
							var tmp = schema.prop[j];
							md.push('- {2}`{0}`{2} {{1}}(type)'.format(tmp.name, tmp.type || 'String', tmp.required ? '__' : ''));

							var subschema = schemas[tmp.type.replace(/\(|\[|\]|\)/g, '')];
							if (subschema) {
								for (var x = 0; x < subschema.prop.length; x++) {
									tmp = subschema.prop[x];
									md.push('	- `{0}` {{1}}(type)'.format(tmp.name, tmp.type || 'String'));
								}
							}

						}
						md.push('');
					}
				}

				if (op.success) {
					md.push('__Output__:');
					md.push('```js\n{\n\t"success": true,\n\t["value": Object]\n}\n```');
				} else {

					tmpindex = md.length;

					if (op.autofill) {
						for (var j = 0; j < schema.prop.length; j++) {
							var tmp = schema.prop[j];
							md.push('- `{0}` {{1}}(type)'.format(tmp.name, tmp.type || 'String'));
						}
					}

					if (op.fields && op.fields.length && !op.success) {
						for (var j = 0; j < op.fields.length; j++) {
							var tmp = op.fields[j];
							md.push('- `{0}` {{1}}(type)'.format(tmp.name, tmp.type || 'String'));
						}
					}

					if (md.last() !== '') {
						md.push('');
						md.splice(tmpindex, 0, '__Response__:');
					}
				}

				md.push(':::');
				md.push('');

			}

			if (is)
				md.splice(mdindexer, 0, '#### ' + gk[a] + '\n');

		}

		return md.join('\n');
	};

})();

FUNC.parsekeys = function(value) {

	var lines = value.split('\n');
	var fields = {};
	var regnumber = /^\d+$/;
	var regchar = /["';,.()\[\]{}]/;
	var regcomma = /[.,]$/;
	var regsplit = /\t|\||\s|;/;

	for (var i = 0; i < lines.length; i++) {

		var line = lines[i].trim();
		var w;

		if (line[0] === '"') {
			w = line.substring(1, line.indexOf('"', 1));
			if (w && w.indexOf(' ') === -1 && !regchar.test(w))
				fields[w] = 1;
			continue;
		}

		var words = line.split(regsplit);
		var w;

		if (words[1] && words[2] && words[1].toLowerCase() === 'as')
			words[0] = words[2];

		if (regnumber.test(words[0])) {
			if (words[1])
				w = words[1];
		} else if (words[0])
			w = words[0];

		var index = w.indexOf('.');
		if (index !== -1)
			w = w.substring(index + 1);

		if (w) {
			w = w.replace(regcomma, '');
			if (w.indexOf(' ') === -1 && !regchar.test(w))
				fields[w] = 1;
		}
	}

	return Object.keys(fields);
};

(function() {

	var TABSCOUNT = function(val) {
		var count = 0;
		for (var i = 0; i < val.length; i++) {
			if (val.charAt(i) === '\t')
				count++;
			else
				break;
		}
		return count;
	};

	var TABS = function(count) {
		var str = '';
		for (var i = 0; i < count; i++)
			str += '\t';
		return str;
	};

	FUNC.wrapbracket = function(cm, pos) {

		var line = cm.getLine(pos.line);

		if (!(/(function|switch|else|with|if|for|while)\s\(/).test(line) || (/\w/).test(line.substring(pos.ch)))
			return;

		var tabs = TABSCOUNT(line);
		var lines = cm.lineCount();
		var plus = '';
		var nl;

		if (line.indexOf('= function') !== -1)
			plus = ';';
		else if (line.indexOf(', function') !== -1 || line.indexOf('(function') !== -1)
			plus = ');';

		if (pos.line + 1 >= lines) {
			// end of value
			cm.replaceRange('\n' + TABS(tabs + 1) + '\n' + TABS(tabs) + '}' + plus, pos, null, '+input');
			pos.line++;
			pos.ch = tabs + 1;
			cm.setCursor(pos);
			return true;
		}

		if (plus) {
			var lchar = line.substring(line.length - 2);

			if (lchar !== ');') {
				lchar = line.charAt(line.length - 1);
				if (lchar !== ';' && lchar !== ')')
					lchar = '';
			}

			if (lchar) {
				pos.ch = line.length - lchar.length;
				var post = {};
				post.line = pos.line;
				post.ch = line.length;
				cm.replaceRange('', pos, post, '+move');
			}
		}

		for (var i = pos.line + 1; i < lines; i++) {

			var cl = cm.getLine(i);
			var tc = TABSCOUNT(cl);

			if (tc <= tabs) {
				var nl = cl && cl.indexOf('}') === -1 ? true : false;
				pos.line = i - 1;
				pos.ch = 10000;
				cm.replaceRange('\n' + TABS(tabs) + '}' + plus + (nl ? '\n' : ''), pos, null, '+input');
				pos.ch = tabs.length;
				cm.setCursor(pos);
				return true;
			}
		}
	};
})();