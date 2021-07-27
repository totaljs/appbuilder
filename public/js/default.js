COMPONENT('designer', 'parent:auto;margin:0;width:7000;height:7000;grid:29', function(self, config, cls) {

	var cls2 = '.' + cls;
	var move = {};
	var types = {};
	var container;
	var scrollbar;
	var connections;
	var svg;
	var rendered = false;
	var map = { zoom: 1, zoomoffset: 0, history: [] };

	move.move = function(e) {
		var css = {};
		css.left = e.pageX - move.offsetX;
		css.top = e.pageY - move.offsetY;
		move.el.css(css);
		connections.find('.from' + move.id).attr('x1', css.left + (move.w / 2) >> 0).attr('y1', css.top + (move.h / 2) >> 0);
		connections.find('.to' + move.id).attr('x2', css.left + (move.w / 2) >> 0).attr('y2', css.top + (move.h / 2) >> 0);
	};

	move.up = function() {
		move.unbind();
	};

	move.bind = function() {
		if (!move.is) {
			EMIT('reflow');
			move.is = true;
			$(W).on('mousemove', move.move).on('mouseup', move.up);
		}
	};

	move.unbind = function() {
		if (move.is) {

			var id = move.el.attrd('id');
			var model = self.get();
			var item = model[id];

			config.change && self.EXEC(config.change, item, 'position');
			self.history('move', [CLONE(item)]);

			item.x = move.el.css('left').parseInt();
			item.y = move.el.css('top').parseInt();

			while (item.x % 5 !== 0)
				item.x--;

			while (item.y % 5 !== 0)
				item.y--;

			move.el.css({ left: item.x, top: item.y });
			$(W).off('mousemove', move.move).off('mouseup', move.up);
			move.is = false;
		}
	};

	map.move = function(e) {

		if (map.counter++ > 20) {
			map.up();
			return;
		}

		var x = (map.x - e.pageX);
		var y = (map.y - e.pageY);

		if (map.target[0]) {
			map.target[0].scrollTop += (y / 8) >> 0;
			map.target[0].scrollLeft += (x / 8) >> 0;
		}
	};

	map.up = function() {
		map.unbind();
	};

	map.bind = function(e) {
		if (!map.is) {
			var evt = e.touches ? e.touches[0] : e;
			var target = container.closest('.ui-scrollbar-area');
			map.target = target;
			map.counter = 0;
			map.x = evt.pageX;
			map.y = evt.pageY;
			EMIT('reflow');
			map.is = true;
			$(W).on('mousemove', map.move).on('mouseup', map.up);
		}
	};

	map.unbind = function() {
		if (map.is) {
			$(W).off('mousemove', map.move).off('mouseup', map.up);
			map.is = false;
		}
	};

	self.history = function(name, items, remove) {
		if (map.history.push({ name: name, items: items, remove: remove }) > 100)
			map.history.shift();
		config.history && self.SEEX(config.history, map.history.length ? map.history : null);
	};

	self.undo = function() {
		var item = map.history.pop();
		if (item) {

			var model = self.get();

			if (item.remove) {
				for (var i = 0; i < item.items.length; i++)
					delete model[item.items[i]];
			} else {
				for (var i = 0; i < item.items.length; i++) {
					var m = item.items[i];
					model[m.id] = m;
				}
			}

			config.history && self.SEEX(config.history, map.history.length ? map.history : null);
			SETTER('loading/show');
			SETTER('loading/hide', 1000);
			self.update('update');
		}
	};

	self.reposition = function(id) {
		var el = container.find('.item[data-id="{0}"]'.format(id));
		var css = {};
		css.left = el.css('left').parseInt();
		css.top = el.css('top').parseInt();
		var w = el.width();
		var h = el.height();
		connections.find('.from' + id).attr('x1', css.left + (w / 2) >> 0).attr('y1', css.top + (h / 2) >> 0);
		connections.find('.to' + id).attr('x2', css.left + (w / 2) >> 0).attr('y2', css.top + (h / 2) >> 0);
	};

	self.zoom = function(zoom) {
		if (zoom) {
			var tmp = zoom / 100;
			if (tmp !== map.zoom) {
				map.zoom = tmp;
				map.zoomoffset = ((100 - zoom) / 10) + (zoom > 100 ? 1 : -1);
				var container = self.find(cls2 + '-zoom-container');
				container.find('> ' + cls2 + '-zoom').css('transform', 'scale({0})'.format(map.zoom));
				var size = (config.width * tmp) >> 0;
				container.css({ width: size, height: size });
				config.zoom && self.SEEX(config.zoom, zoom);
				self.resizeforce();
			}
		}
		return map.zoom;
	};

	self.destroy = function() {
		move.unbind();
	};

	self.resize = function() {
		setTimeout2(self.ID, self.resizeforce, 300);
	};

	self.resizeforce = function() {
		var parent = self.parent(config.parent);
		var css = {};
		css.width = parent.width();
		css.height = parent.height() - config.margin;
		scrollbar.css(css);
		self.scrollbar.resize();
	};

	self.connect = function(arr) {
		if (rendered)
			self.connectforce(arr);
		else
			setTimeout(self.connect, 100, arr);
	};

	self.connectforce = function(arr) {
		connections.empty();
		for (var i = 0; i < arr.length; i++) {
			var item = arr[i].split('_');
			var a = container.find('.item[data-id="{0}"]'.format(item[0]));
			var b = container.find('.item[data-id="{0}"]'.format(item[1]));

			if (!b.length || !a.length)
				continue;

			var offa = { left: a.css('left').parseInt(), top: a.css('top').parseInt() };
			var offb = { left: b.css('left').parseInt(), top: b.css('top').parseInt() };
			var wa = a.width();
			var ha = a.height();
			var wb = b.width();
			var hb = b.height();
			connections.asvg('<line x1="{0}" y1="{1}" x2="{2}" y2="{3}" class="{4}" />'.format(offa.left + (wa / 2) >> 0, offa.top + (ha / 2) >> 0, offb.left + (wb / 2) >> 0, offb.top + (hb / 2) >> 0, 'from' + item[0] + ' to' + item[1] + ' linetype' + item[2]));
		}
	};

	self.make = function() {

		var el = self.find('script');
		for (var i = 0; i < el.length; i++)
			types[el[i].getAttribute('data-type')] = Tangular.compile(el[i].innerHTML);

		self.aclass(cls);
		self.html('<div class="{0}-scrollbar"><div class="{0}-zoom-container"><div class="{0}-zoom"><svg width="{width}" height="{height}" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="svg-grid" width="{grid}" height="{grid}" patternunits="userSpaceOnUse"><path d="M {grid} 0 L 0 0 0 {grid}" fill="none" class="{0}-grid" shape-rendering="crispEdges" /></pattern></defs><rect width="100%" height="100%" fill="url(#svg-grid)" shape-rendering="crispEdges" /><g class="connections"></g></svg><div class="{0}-container"></div></div></div></div>'.format(cls).arg(config));
		connections = self.find('g.connections');
		container = self.find(cls2 + '-container');
		scrollbar = self.find(cls2 + '-scrollbar');
		svg = self.find('svg');

		self.scrollbar = SCROLLBAR(scrollbar, { visibleY: 1, visibleX: 1 });
		self.resizeforce();

		container.css({ width: config.width, height: config.height });

		self.event('contextmenu', '.item', function(e) {
			config.contextmenu && self.EXEC(config.contextmenu, $(this), e);
			e.preventDefault();
			e.stopPropagation();
		});

		self.event('mousedown', '.movable', function(e) {

			var target = $(e.target);
			if (target.hclass('exec'))
				return;

			e.preventDefault();
			e.stopPropagation();

			var prev = move.el;

			move.el = $(this).closest('.item');
			move.id = move.el.attrd('id');
			move.w = move.el.width();
			move.h = move.el.height();

			var add = true;

			if (prev) {
				if (prev[0] == move.el[0])
					add = false;
				else
					prev.rclass('selected');
			}

			add && move.el.aclass('selected');
			var off = { left: move.el.css('left').parseInt(), top: move.el.css('top').parseInt() };
			move.x = off.left;
			move.y = off.top;
			move.offsetX = e.pageX - move.x;
			move.offsetY = e.pageY - move.y;
			move.bind();
		});

		container.on('mousedown', function(e) {
			if (e.target === container[0])
				map.bind(e);
		});

		self.rclass('hidden invisible');
		self.on('resize + resize2', self.resize);
	};

	self.add = function(item) {

		if (!item.x)
			item.x = self.scrollbar.scrollLeft() + ((WW / 2) >> 0) - 200;

		if (!item.y)
			item.y = self.scrollbar.scrollTop() + ((WH / 2) >> 0) - 200;

		self.history('add', [item.id], true);

		var template = types[item.type];
		container.append('<div class="{0} invisible" data-id="{1}" style="{2}">{3}</div>'.format('item item-' + item.type, item.id, 'left:' + item.x + 'px;top:' + item.y + 'px' + (item.color ? (';border-color:' + item.color) : ''), template(item)));
		COMPILE();
		self.togglevisible();
		config.change && self.EXEC(config.change, item, 'add');
	};

	self.togglevisible = function() {
		setTimeout(function() {
			var all = container.find('.item.invisible').rclass('invisible');
			if (all.length)
				rendered = true;
		}, 500);
	};

	self.clear = function() {
		map.history = [];
		move.el = null;
		connections.empty();
		container.html('');
		self.togglevisible();
		self.set({});
	};

	self.setter = function(value, path, type) {

		if (!value || (type !== 0 && type !== 'update'))
			return;

		connections.empty();

		var html = '';
		var keys = Object.keys(value);

		for (var i = 0; i < keys.length; i++) {
			var item = value[keys[i]];
			var template = types[item.type];
			if (template) {
				item.id = keys[i];
				if (item.type === 'schema' && !item.name)
					item.name = 'Undefined';
				html += '<div class="{0} invisible" data-id="{1}" style="{2}">{3}</div>'.format('item item-' + item.type, item.id, 'left:' + item.x + 'px;top:' + item.y + 'px' + (item.color ? (';border-color:' + item.color) : ''), template(item));
			}
		}

		if (move.el)
			move.el = null;

		container.html(html);
		self.togglevisible();
		COMPILE();
	};

});

FUNC.compile = function(model, callback, raw) {

	var data = model.body;
	var keys = Object.keys(data);
	var schemas = [];
	var definitions = [];
	var routes = [];
	var resources = {};
	var config = [];
	var init = [];
	var npm = [];
	var modules = [];
	var timers = [];
	var ready = [];
	var middleware = [];

	var variables = function(val) {
		return val.replace(/__[a-z0-9\_\.]+__/gi, function(text) {
			var key = text.substring(2, text.length - 2);
			return model.variables[key] || text;
		});
	};

	var checkvariables = function(val) {
		var output = {};
		var lines = val.split('\n');
		for (var i = 0; i < lines.length; i++) {
			var line = lines[i].trim();
			if (line.substring(0, 2) === '//')
				continue;
			for (var j = 1; j < arguments.length; j++) {
				if (line.indexOf(arguments[j]) !== -1)
					output[arguments[j]] = 1;
			}
		}
		return output;
	};

	var indent = function(val, count) {
		val = val.split('\n');
		var d = ''.padLeft(count || 2, '\t');
		for (var x = 0; x < val.length; x++)
			val[x] = d + val[x];
		return val.join('\n');
	};

	for (var i = 0; i < keys.length; i++) {

		var key = keys[i];
		var item = data[key];
		var tmp = [];

		if (item.type === 'label')
			continue;

		if (item.type === 'modules') {

			if (item.npm) {
				for (var j = 0; j < item.npm.length; j++) {
					npm.push('\tqueue.push(function(next) {\n\t\t//@build MODULES {0}\n\t\t//@code\n'.format(item.name) + indent('NPMINSTALL(\'{0}\', next);'.format(item.npm[j])) + '\n\t});');
					npm.push('');
				}
			}

			if (item.modules) {
				for (var j = 0; j < item.modules.length; j++) {
					modules.push('\tqueue.push(function(next) {\n\t\t//@build MODULES {0}\n\t\t//@code\n'.format(item.name) + indent('IMPORT(\'{0}\', next);'.format(item.modules[j])) + '\n\t});');
					modules.push('');
				}
			}
			continue;
		}

		if (item.type === 'init') {
			if (item.body) {
				init.push('\tqueue.push(function(next) {\n\t\t//@build Init {0}\n\t\t//@code\n'.format(item.name) + indent(item.body) + '\n\t});');
				init.push('');
			}
			continue;
		}

		if (item.type === 'schema') {

			if (item.routes && item.routes.length) {
				tmp.push('');
				for (var j = 0; j < item.routes.length; j++) {

					var route = item.routes[j];

					if (route.response) {
						route = CLONE(route);
						var index = route.actions.indexOf(route.response);
						if (index !== -1)
							route.actions[index] = route.actions[index] + ' (response)';
					}

					var flags = [];

					if (item.timeout > 5)
						flags.push(item.timeout * 1000);

					var f = flags.length ? (', [' + flags.join(', ') + ']') : '';
					var l = item.length ? (', ' + item.length) : '';

					var plus = f ? (f + l) : l;
					if (route.method === 'API')
						tmp.push('\tROUTE(\'{0}  {1}  {2}  *{3} --> {4}\'{5});'.format((route.authorized || '') + route.method, route.url, route.validate + route.action, item.name, route.actions.join(' '), plus));
					else
						tmp.push('\tROUTE(\'{0}  {1}  *{2} --> {3}\'{5});'.format((route.authorized || '') + route.method, route.url, item.name, route.actions.join(' '), plus));
				}
			}

			tmp.push('');
			tmp.push('\t//@build Schema "{0}"'.format(item.name));
			tmp.push('\tNEWSCHEMA(\'{0}\', function(schema) {'.format(item.name));

			if (item.compress || item.encrypt)
				tmp.push('');

			if (item.compress)
				tmp.push('\t\tschema.compress();');

			if (item.encrypt)
				tmp.push('\t\tschema.encrypt();');

			if (item.csrf)
				tmp.push('\t\tschema.csrf();');

			if (item.fields.length) {
				tmp.push('');
				tmp.push('\t\t// Fields');
				for (var j = 0; j < item.fields.length; j++) {
					var field = item.fields[j];
					tmp.push('\t\tschema.define(\'{0}\', \'{1}\''.format(field.name, field.type) + (field.required ? ', true' : '') + ');');
				}
			}

			if (item.operations.length) {

				tmp.push('');

				for (var j = 0; j < item.operations.length; j++) {
					var operation = item.operations[j];
					var method = 'addWorkflow(\'{0}\', function($, model) {';

					switch (operation.name) {
						case 'insert':
							method = 'setInsert(function($, model) {';
							break;
						case 'update':
							method = 'setUpdate(function($, model) {';
							break;
						case 'query':
							method = 'setQuery(function($, model) {';
							break;
						case 'save':
							method = 'setSave(function($, model) {';
							break;
						case 'read':
							method = 'setRead(function($, model) {';
							break;
						case 'patch':
							method = 'setPatch(function($, model) {';
							break;
						case 'remove':
							method = 'setRemove(function($, model) {';
							break;
					}

					tmp.push('\t\t//@build Schema "{0} --> {1}"'.format(item.name, operation.name));
					tmp.push('\t\tschema.' + method.format(operation.name));

					var v = operation.body ? checkvariables(operation.body, 'filter', 'query', 'id', 'user', 'params', 'files', 'controller') : EMPTYOBJECT;

					if (v.filter)
						tmp.push(indent('var filter = $.filter;', 3));

					if (v.controller)
						tmp.push(indent('var controller = $.controller;', 3));

					if (v.params)
						tmp.push(indent('var params = $.params;', 3));

					if (v.query)
						tmp.push(indent('var query = $.query;', 3));

					if (v.files)
						tmp.push(indent('var files = $.files;', 3));

					if (v.id)
						tmp.push(indent('var id = $.id;', 3));

					if (v.user)
						tmp.push(indent('var user = $.user;', 3));

					if (operation.roles) {
						var oproles = operation.roles.split(/\,|\s/).trim();
						var roles = [];
						for (var x = 0; x < oproles.length; x++)
							roles.push('\'' + oproles[x] + '\'');
						if (roles.length)
							tmp.push(indent('if (UNAUTHORIZED($, {0}))\n\treturn;'.format(roles.join(', ')), 3));
					}

					tmp.push('\t\t\t//@code');
					tmp.push(indent((operation.body || '$.invalid(404);'), 3));
					tmp.push('\t\t}' + (operation.filter ? (', \'' + operation.filter + '\'') : '') + ');');
					tmp.push('');
				}
			}

			if (item.tasks && item.tasks.length) {
				tmp.push('');
				for (var j = 0; j < item.tasks.length; j++) {
					var task = item.tasks[j];
					if (task.name && task.task && task.step)
						tmp.push('\t\tschema.addTask(\'{0}\', \'{1}/{2}\');'.format(task.name, task.task, task.step));
				}
			}

			tmp.push('\t});');
			schemas.push('(function() {');
			schemas.push(tmp.join('\n'));
			schemas.push('');
			schemas.push('})();');
			schemas.push('\n');
			continue;
		}

		if (item.type === 'task') {

			tmp.push('');
			tmp.push('\t//@build Task "{0}"'.format(item.name));
			tmp.push('\tNEWTASK(\'{0}\', function(push) {'.format(item.name));

			if (item.operations.length) {

				tmp.push('');

				for (var j = 0; j < item.operations.length; j++) {
					var operation = item.operations[j];
					var method = 'push(\'{0}\', function($, value) {';

					tmp.push('\t\t//@build Task "{0} --> {1}"'.format(item.name, operation.name));
					tmp.push('\t\t' + method.format(operation.name));

					var v = operation.body ? checkvariables(operation.body, 'filter', 'query', 'id', 'user', 'params', 'files', 'model', 'controller') : EMPTYOBJECT;

					if (v.model)
						tmp.push(indent('var model = value;', 3));

					if (v.controller)
						tmp.push(indent('var controller = $.controller;', 3));

					if (v.filter)
						tmp.push(indent('var filter = $.filter;', 3));

					if (v.params)
						tmp.push(indent('var params = $.params;', 3));

					if (v.query)
						tmp.push(indent('var query = $.query;', 3));

					if (v.files)
						tmp.push(indent('var files = $.files;', 3));

					if (v.id)
						tmp.push(indent('var id = $.id;', 3));

					if (v.user)
						tmp.push(indent('var user = $.user;', 3));

					tmp.push('\t\t\t//@code');
					tmp.push(indent((operation.body || '$.invalid(404);'), 3));
					tmp.push('\t\t});');
					tmp.push('');
				}
			}

			tmp.push('\t});');
			schemas.push('(function() {');
			schemas.push(tmp.join('\n'));
			schemas.push('');
			schemas.push('})();');
			schemas.push('\n');
			continue;
		}

		if (item.type === 'route') {
			routes.push('\t//@build Route "{0}"'.format(item.method + ' ' + item.url));
			routes.push('\tROUTE(\'{0}\', function({1}) {'.format((item.authorized || '') + item.method + ' ' + item.url, item.method === 'FILE' ? 'req, res' : ''));

			var v = item.body ? checkvariables(item.body, '$', 'self', 'user', 'controller', 'params', 'query', 'filter', 'files', 'body', 'model') : EMPTYOBJECT;

			if (v.$)
				routes.push('\t\tvar $ = this;');

			if (v.self)
				routes.push('\t\tvar self = this;');

			if (v.user)
				routes.push('\t\tvar user = this.user;');

			if (v.controller)
				routes.push('\t\tvar controller = this;');

			if (v.params)
				routes.push('\t\tvar params = this.params;');

			if (v.query)
				routes.push('\t\tvar query = this.query;');

			if (v.body)
				routes.push('\t\tvar body = this.body;');

			if (v.model)
				routes.push('\t\tvar model = this.model;');

			if (v.files)
				routes.push('\t\tvar files = this.files;');

			if (item.roles && item.roles.length) {
				var roles = [];
				for (var x = 0; x < item.roles.length; x++)
					roles.push('\'' + item.roles[x] + '\'');
				tmp.push(indent('if (UNAUTHORIZED($, {0}))\n\treturn;'.format(roles.join(', ')), 2));
			}

			routes.push('');
			routes.push('\t\t//@code');
			routes.push(indent(item.body || '', 2));
			routes.push('');

			var flags = [];

			if ((item.method === 'POST' || item.method === 'PUT') && item.upload)
				flags.push('\'upload\'');

			if (item.method === 'SOCKET' && item.serialization)
				flags.push('\'{0}\''.format(item.serialization));

			if (item.method !== 'FILE' && item.csrf)
				flags.push('\'csrf\'');

			if (item.method !== 'SOCKET' && item.method !== 'FILE' && item.timeout > 5)
				flags.push(item.timeout * 1000);

			var f = flags.length ? ', [' + flags.join(', ') + ']' : '';
			var l = item.length ? (', ' + item.length) : '';

			routes.push('\t}' + (f ? (f + l) : l) + ');');
			continue;
		}

		if (item.type === 'ready') {
			if (item.body) {
				ready.push('');
				ready.push('\t//@build Ready "{0}"'.format(item.name));
				ready.push('\tON(\'ready\', function() {');
				ready.push('');
				ready.push('\t\t//@code');
				ready.push(indent(item.body || ''));
				ready.push('\t});');
				ready.push('');
			}
		}

		if (item.type === 'middleware') {
			if (item.body) {

				var id = 'mid' + item.id;
				var v = item.body ? checkvariables(item.body, '$', 'query', 'url', 'headers', 'cancel', 'req', 'res', 'next') : EMPTYOBJECT;

				middleware.push('');
				middleware.push('\t//@build Middleware "{0}"'.format(item.name));
				middleware.push('\tMIDDLEWARE(\'{0}\', function($) {'.format(id));
				middleware.push('');

				if (!item.staticfiles) {
					middleware.push('\t\tif ($.req.isStaticFile) {');
					middleware.push('\t\t\t$.next();');
					middleware.push('\t\t\treturn;');
					middleware.push('\t\t}');
					middleware.push('');
				}

				if (v.next)
					middleware.push('\t\tvar next = $.next;');

				if (v.req)
					middleware.push('\t\tvar req = $.req;');

				if (v.res)
					middleware.push('\t\tvar res = $.res;');

				if (v.cancel)
					middleware.push('\t\tvar cancel = $.cancel;');

				if (v.headers)
					middleware.push('\t\tvar headers = $.req.headers;');

				if (v.query)
					middleware.push('\t\tvar query = $.req.query;');

				if (v.url)
					middleware.push('\t\tvar url = $.req.url;');

				middleware.push('');
				middleware.push('\t\t//@code');
				middleware.push(indent(item.body || ''));
				middleware.push('\t});');
				middleware.push('');
				middleware.push('\tF.use(\'{0}\');'.format(id));
				middleware.push('');
			}
		}

		if (item.type === 'timer') {
			if (item.body) {

				var v = checkvariables(item.body, 'hours', 'minutes', 'month', 'day', 'year', 'dayname', 'week');
				timers.push('');
				timers.push('\t//@build Timer "{0}"'.format(item.name));
				timers.push('\tON(\'service\', function(counter) {');

				if (item.minutes > 1) {
					timers.push('');
					timers.push('\t\tif (counter % {0} !== 0)'.format(item.minutes));
					timers.push('\t\t\treturn;');
				}

				if (v.hours)
					timers.push('\t\t\tvar hours = NOW.getHours();');

				if (v.minutes)
					timers.push('\t\t\tvar minutes = NOW.getMinutes();');

				if (v.month)
					timers.push('\t\t\tvar month = NOW.getMonth() + 1;');

				if (v.week)
					timers.push('\t\t\tvar week = +NOW.format(\'w\');');

				if (v.day)
					timers.push('\t\t\tvar day = NOW.getDate();');

				if (v.dayname)
					timers.push('\t\t\tvar dayname = NOW.format(\'ddd\').toLowerCase();');

				if (v.year)
					timers.push('\t\t\tvar year = NOW.getFullYear();');

				timers.push('');
				timers.push('\t\t//@code');
				timers.push(indent(item.body || ''));
				timers.push('\t});');
				timers.push('');
			}
			continue;
		}

		if (item.type === 'definition') {
			if (item.body) {
				definitions.push('');
				definitions.push('\t//@build Definition "{0}"\n\t//@code'.format(item.name));
				definitions.push('\t(function() {');
				definitions.push(indent(item.body || '', 2));
				definitions.push('\t})();');
				definitions.push('');
			}
			continue;
		}

		if (item.type === 'config') {
			item.body && config.push(item.body);
			continue;
		}

		if (item.type === 'resource' && item.languages) {

			var lngkeys = Object.keys(item.languages);
			for (var x = 0; x < lngkeys.length; x++) {
				var lng = lngkeys[x];
				if (resources[lng])
					resources[lng].push(item.languages[lng]);
				else
					resources[lng] = [item.languages[lng]];
			}

			continue;
		}

	}

	var builder = [];
	var scr;

	builder.push('CONF.default_errorbuilder_errors = true;');
	builder.push('');

	if (model.cors) {
		builder.push('CORS();');
		builder.push('');
	}

	if (config.length && !init.length) {
		builder.push('// Configuration');
		builder.push('(function() {');
		builder.push('\tLOADCONFIG(decodeURIComponent(Buffer.from(\'{0}\', \'base64\')));'.format(btoa(encodeURIComponent(variables(config.join('\n'))))));
		builder.push('})();');
		builder.push('');
	}

	var res = Object.keys(resources);

	if (res.length) {
		builder.push('// Resources');
		builder.push('(function() {');

		for (var i = 0; i < res.length; i++)
			builder.push('\tLOADRESOURCE(\'{0}\', decodeURIComponent(Buffer.from(\'{1}\', \'base64\')));'.format(res[i], btoa(encodeURIComponent(variables(resources[res[i]].join('\n'))))));

		builder.push('})();');
		builder.push('');
	}

	if (definitions.length) {
		builder.push('// Definitions');
		builder.push('(function() {');
		builder.push(definitions.join('\n'));
		builder.push('})();');
		builder.push('');
	}

	if (timers.length) {
		builder.push('// Timers');
		builder.push('(function() {');
		builder.push(timers.join('\n'));
		builder.push('})();');
		builder.push('');
	}

	if (middleware.length) {
		builder.push('// Middleware');
		builder.push('(function() {');
		builder.push(middleware.join('\n'));
		builder.push('})();');
		builder.push('');
	}

	if (ready.length) {
		builder.push('// Ready');
		builder.push('(function() {');
		builder.push(ready.join('\n'));
		builder.push('})();');
		builder.push('');
	}

	if (routes.length) {
		builder.push('// Routes');
		builder.push('(function() {');
		builder.push(routes.join('\n'));
		builder.push('})();');
		builder.push('');
	}

	if (schemas.length) {
		builder.push(schemas.join('\n'));
		builder.push('');
	}

	var a = [];
	a.push('(function() {');
	a.push('');

	if (config.length) {
		a.push('\t// Configuration');
		a.push('\t(function() {');
		a.push('\t\tLOADCONFIG(decodeURIComponent(Buffer.from(\'{0}\', \'base64\')));'.format(btoa(encodeURIComponent(variables(config.join('\n'))))));
		a.push('\t})();');
		a.push('');
	}

	a.push('\tvar queue = [];');
	a.push('');

	if (npm && npm.length)
		a.push(npm.join('\n'));

	if (init && init.length)
		a.push(init.join('\n'));

	if (modules && modules.length)
		a.push(modules.join('\n'));

	a.push('\tqueue.async(function() {');
	a.push('');

	var tmp = indent(builder.join('\n')).replace(/(\n|\t)+$/, '');
	a.push(tmp);
	a.push('');
	a.push('\t});');
	a.push('})();');

	scr = variables(a.join('\n'));

	if (!raw && model.minify)
		DAPI('minify', { compiled: scr }, callback);
	else
		callback(scr);
};

Thelpers.color = function(value) {
	var hash = HASH(value, true);
	var color = '#';
	for (var i = 0; i < 3; i++) {
		var value = (hash >> (i * 8)) & 0xFF;
		color += ('00' + value.toString(16)).substr(-2);
	}
	return color;
};

Thelpers.type = function(val) {
	val = val.toLowerCase();
	var index = val.lastIndexOf('(');
	return index === -1 ? val : val.substring(0, index);
};

FUNC.stringifyresource = function(value) {
	var keys = Object.keys(value);
	var builder = [];
	for (var i = 0; i < keys.length; i++)
		builder.push(keys[i] + '  : ' + value[keys[i]]);
	return builder.join('\n');
};

FUNC.parseresource = function(body) {

	var lines = (body || '').split('\n');
	var keys = {};

	for (var i = 0; i < lines.length; i++) {
		var line = lines[i].trim();

		if (!line || line.substring(0, 2) === '//' || line.charAt(0) === '#')
			continue;

		var index = line.indexOf(':');
		if (index !== -1) {
			var key = line.substring(0, index).trim();
			var val = line.substring(index + 1).trim();

			// Possible subtype
			index = key.indexOf('(');
			if (index !== -1)
				key = key.substring(0, index).trim();

			keys[key] = val;
		}
	}

	return keys;
};

FUNC.parsekeywords = function(body, autocomplete) {

	var lines = (body || '').split('\n');
	var REGHELPER = /(Thelpers|FUNC|REPO|MAIN)\.[a-z0-9A-Z_$]+(\s)+=/g;
	var REGCONSOLE = /console\.\w+\(.*?\)/g;
	var REGFUNCTION = /((\s)+=(\s)+function)/;
	var output = [];
	var name;
	var type;

	for (var i = 0; i < lines.length; i++) {
		var line = lines[i].trim();

		if (!line || line.substring(0, 2) === '//')
			continue;

		var m = line.match(REGHELPER);
		if (m) {
			var end = m[0].indexOf('=');
			if (end === -1)
				continue;

			type = m[0].substring(0, 4);
			name = m[0].substring(type === 'Thel' ? 9 : 5, end).trim();

			if (name) {

				if (type === 'Thel' || type === 'FUNC') {
					var subm = line.match(REGFUNCTION);
					if (!subm)
						continue;
					name = name.trim() + line.substring(line.indexOf('(', subm.index), line.indexOf(')', subm.index + 8) + 1);
				}

				var beg = m.index || 0;
				output.push({ line: i, ch: beg, name: (type === 'Thel' ? 'Thelpers' : type) + '.' + name.trim(), type: type === 'Thel' ? 'helper' : type.toUpperCase() });
			}
		}

		if (!autocomplete) {
			m = line.match(REGCONSOLE);
			if (m) {
				name = m[0].length > 20 ? (m[0].substring(0, 30) + '...') : m[0];
				var tmpindex = line.indexOf('//');
				if (tmpindex === -1 || tmpindex > m.index)
					output.push({ line: i, ch: 0, name: name, type: 'console' });
			}
		}
	}

	return output;
};