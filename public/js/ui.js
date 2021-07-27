COMPONENT('exec', function(self, config) {
	self.readonly();
	self.blind();
	self.make = function() {

		var scope = null;

		var scopepath = function(el, val) {
			if (!scope)
				scope = el.scope();
			return val == null ? scope : scope ? scope.makepath ? scope.makepath(val) : val.replace(/\?/g, el.scope().path) : val;
		};

		var fn = function(plus) {
			return function(e) {

				var el = $(this);
				var attr = el.attrd('exec' + plus);
				var path = el.attrd('path' + plus);
				var href = el.attrd('href' + plus);
				var def = el.attrd('def' + plus);
				var reset = el.attrd('reset' + plus);

				scope = null;

				var prevent = el.attrd('prevent' + plus);

				if (prevent === 'true' || prevent === '1') {
					e.preventDefault();
					e.stopPropagation();
				}

				if (attr) {
					if (attr.indexOf('?') !== -1) {
						var tmp = scopepath(el);
						if (tmp) {
							M.scope(tmp.path);
							attr = tmp.makepath ? tmp.makepath(attr) : attr.replace(/\?/g, tmp.path);
						}
					}
					EXEC(attr, el, e);
				}

				href && NAV.redirect(href);

				if (def) {
					if (def.indexOf('?') !== -1)
						def = scopepath(el, def);
					DEFAULT(def);
				}

				if (reset) {
					if (reset.indexOf('?') !== -1)
						reset = scopepath(el, reset);
					RESET(reset);
				}

				if (path) {
					var val = el.attrd('value');
					if (val) {
						if (path.indexOf('?') !== -1)
							path = scopepath(el, path);
						var v = GET(path);
						SET(path, new Function('value', 'return ' + val)(v), true);
					}
				}
			};
		};

		self.event('dblclick', config.selector2 || '.exec2', fn('2'));
		self.event('click', config.selector || '.exec', fn(''));
	};
});

COMPONENT('inlineform', 'autohide:1', function(self, config, cls) {

	var cls2 = '.' + cls;
	var regnohide = /ui-datepicker|ui-timepicker|ui-directory|ui-inlineform|ui-floatinginput|ui-inlineform/g;
	var dw = 300;
	var options;
	var events = {};
	var skip = false;

	if (!W.$$inlineform) {
		W.$$inlineform = true;

		$(document).on('click', cls2 + '-close', function() {
			SETTER(self.name, 'hide');
		});

		ON('resize2 + reflow + scroll + resize', function() {
			SETTER(self.name, 'hide');
		});
	}

	var disableskip = function() {
		skip = false;
	};

	var autohide = function(e) {

		if (skip)
			return;

		var tmp = e.target;
		while (tmp) {

			if (tmp.tagName === 'BODY' || tmp.tagName === 'HTML' || !tmp.getAttribute)
				break;

			var cc = tmp.getAttribute('class') || '';

			if (cc && regnohide.test(cc)) {
				skip = true;
				setTimeout(disableskip, 100);
				return;
			}

			tmp = tmp.parentNode;
			if (!tmp) {
				skip = true;
				setTimeout(disableskip, 100);
				return;
			}
		}

		self.hide();
	};

	self.readonly();

	self.submit = function() {
		if (config.submit)
			self.EXEC(config.submit, self.hide);
		else
			self.hide();
		options.callback && options.callback(self.hide);
	};

	self.cancel = function() {
		config.cancel && self.EXEC(config.cancel, self);
		self.hide();
	};

	self.hide = function() {
		if (!self.hclass('hidden')) {
			self.release(true);
			self.aclass('hidden invisible');
			self.find(cls2).rclass(cls + '-animate');
			config.hide && self.EXEC(config.hide);
			events.unbind();
		}
	};

	self.icon = function(value) {
		var el = this.rclass2('fa');
		value.icon && el.aclass((value.icon.indexOf(' ') === -1 ? 'fa fa-' : '') + value.icon);
	};

	events.bind = function() {
		if (!events.is) {
			events.is = true;
			if (config.autohide)
				$(document).on('click', autohide);
		}
	};

	events.unbind = function() {
		if (events.is) {
			events.is = false;
			if (config.autohide)
				$(document).off('click', autohide);
		}
	};

	self.make = function() {

		$(document.body).append('<div id="{0}" class="hidden {3}-container" style="max-width:{1}"><div class="{3}"><div class="{3}-title" data-bind="@config__html span:value.title__change .ui-inlineform-icon:@icon"><button name="cancel" class="{3}-close"><i class="fa fa-times"></i></button><i class="{3}-icon"></i><span></span></div></div></div>'.format(self.ID, (config.width || dw) + 'px', self.path, cls));

		var el = $('#' + self.ID);
		var scr = self.find('> script');
		self.template = scr.length ? scr.html() : '';

		el.find(cls2)[0].appendChild(self.dom);
		self.aclass(cls + '-body');
		self.rclass('hidden invisible');
		self.replace(el);

		self.event('click', 'button[name]', function() {
			var t = this;
			var el = $(this);
			switch (t.name) {
				case 'submit':
					if (el.hclass('exec'))
						self.hide();
					else
						self.submit(self.hide);
					break;
				case 'cancel':
					!t.disabled && self[t.name](self.hide);
					break;
			}
		});

		config.enter && self.event('keydown', 'input', function(e) {
			e.which === 13 && !self.find('button[name="submit"]')[0].disabled && setTimeout(self.submit, 500, self.hide);
		});
	};

	self.toggle = function(opt) {
		if (self.hclass('hidden'))
			self.show(opt);
		else
			self.hide();
	};

	self.show = function(opt) {

		var el = opt.element;
		var is = false;
		options = opt;

		if (!self.hclass('hidden')) {
			SETTER(self.name, 'hide');
			return;
		}

		if (self.template) {
			is = self.template.COMPILABLE();
			self.find('div[data-jc-replaced]').html(self.template);
			self.template = null;
			is && COMPILE();
			setTimeout(self.show, 250, opt);
			return;
		}

		self.release(false);
		self.rclass('hidden');

		var offset = el.offset();
		var w = config.width || dw;
		var ma = 35;

		if (opt.align === 'right') {
			offset.left -= w - el.width();
			ma = w - 35;
		} else if (opt.align === 'center') {
			ma = (w / 2);
			offset.left -= ma - (el.width() / 2);
			ma -= 12;
		}

		if (opt.position === 'bottom')
			offset.top -= self.element.innerHeight() + 10;
		else
			offset.top += el.height() + 10;

		if (opt.offsetX)
			offset.left += opt.offsetX;

		if (opt.offsetY)
			offset.top += opt.offsetY;

		config.reload && EXEC(config.reload, self);
		config.default && DEFAULT(config.default, true);

		self.css(offset);

		if (!isMOBILE && config.autofocus) {
			setTimeout(function(el) {
				el = self.find('input[type="text"],select,textarea');
				el.length && el[0].focus();
			}, 500, el);
		}

		setTimeout(function() {
			events.bind();
			self.rclass('invisible');
			self.find(cls2).aclass(cls + '-animate');
		}, 300);
	};
});

COMPONENT('selectbox', function(self, config, cls) {

	var cls2 = '.' + cls;
	var Eitems, Eselected, datasource, condition;

	self.items = EMPTYARRAY;
	self.template = Tangular.compile('<span data-search="{{ search }}" data-index="{{ index }}">{{ text }}</span>');
	self.nocompile && self.nocompile();

	self.validate = function(value) {
		return config.disabled || !config.required ? true : value && value.length > 0;
	};

	self.configure = function(key, value) {

		var redraw = false;

		switch (key) {
			case 'type':
				self.type = value;
				break;
			case 'disabled':
				self.tclass('ui-disabled', value);
				self.find('input').prop('disabled', value);
				if (value)
					self.rclass(cls + '-invalid');
				else if (config.required)
					self.state(1, 1);
				break;
			case 'if':
				condition = value ? FN(value) : null;
				break;
			case 'required':
				!value && self.state(1, 1);
				break;
			case 'height':
			case 'search':
				redraw = true;
				break;
			case 'items':
				var arr = [];
				value.split(',').forEach(function(item) {
					item = item.trim().split('|');
					var obj = {};
					obj.name = item[0].trim();
					obj.id = (item[1] == null ? item[0] : item[1]).trim();
					if (config.type === 'number')
						obj.id = +obj.id;
					arr.push(obj);
				});
				self.bind('', arr);
				break;
			case 'datasource':
				self.datasource(value, self.bind);
				datasource = value;
				break;
		}

		redraw && self.redraw();
	};

	self.search = function() {
		var search = config.search ? self.find('input').val().toSearch() : '';
		self.find(cls2 + '-main').find('span').each(function() {
			var el = $(this);
			el.tclass('hidden', el.attrd('search').indexOf(search) === -1);
		});
		self.find(cls2 + '-search-icon').tclass('fa-search', search.length === 0).tclass('fa-times', search.length > 0);
	};

	self.redraw = function() {
		self.html((typeof(config.search) === 'string' ? '<div class="{0}-search"><span><i class="fa fa-search {0}-search-icon"></i></span><div><input type="text" placeholder="{1}" /></div></div><div>'.format(cls, config.search) : '') + '<div class="{0}-container" style="height:{1}px"><div class="{0}-area {0}-main"><div class="{0}-body noscrollbar"></div></div><div class="{0}-area"><div class="{0}-body noscrollbar" style="height:{1}px"></div></div></div>'.format(cls, config.height || '200'));
		self.find(cls2 + '-body').each(function(index) {
			if (index)
				Eselected = $(this);
			else
				Eitems = $(this);
		});
	};

	self.bind = function(path, value) {

		var kt = config.text || 'name';
		var kv = config.value || 'id';
		var builder = [];

		self.items = [];

		if (value) {
			var index = 0;
			for (var i = 0; i < value.length; i++) {
				var item = value[i];

				if (condition && !condition(item))
					continue;

				var text, val;

				if (typeof(item) === 'string') {
					text = item;
					val = self.parser(item);
				} else {
					text = item[kt];
					val = item[kv];
				}

				item = { text: text, value: val, index: index++, search: text.toSearch() };
				self.items.push(item);
				builder.push(self.template(item));
			}
		}


		Eitems.empty().append(builder.join(''));
		self.refresh();
		self.search();
	};

	self.make = function() {

		self.aclass(cls);
		self.redraw();

		config.datasource && self.reconfigure('datasource:' + config.datasource);
		config.items && self.reconfigure('items:' + config.items);

		self.event('click', 'span[data-index]', function() {

			if (config.disabled)
				return;

			var selected = self.get() || [];
			var index = +this.getAttribute('data-index');
			var value = self.items[index];

			if (selected.indexOf(value.value) === -1)
				selected.push(value.value);
			else
				selected = selected.remove(value.value);

			self.set(selected);
			self.change(true);
		});

		self.event('click', '.fa-times', function() {
			if (!config.disabled) {
				self.find('input').val('');
				self.search();
			}
		});

		typeof(config.search) === 'string' && self.event('keydown', 'input', function() {
			!config.disabled && setTimeout2(self.id, self.search, 500);
		});
	};

	self.setter = function(value, path, type) {

		var selected = {};
		var builder = [];

		var ds = self.items;
		var dsl = ds.length;

		if (value) {
			for (var i = 0, length = value.length; i < length; i++) {
				for (var j = 0; j < dsl; j++) {
					if (ds[j].value === value[i]) {
						selected[j] = true;
						builder.push(self.template(ds[j]));
					}
				}
			}
		}

		Eitems.find('span').each(function() {
			var el = $(this);
			var index = +el.attrd('index');
			el.tclass(cls + '-selected', selected[index] !== undefined);
		});


		Eselected.empty().append(builder.join(''));
		self.search();

		if (type !== 1) {
			setTimeout(function() {
				Eitems[0].scrollTop = 0;
			}, 500);
		}
	};

	self.state = function(type) {
		if (type) {
			var invalid = config.required ? self.isInvalid() : false;
			if (invalid !== self.$oldstate) {
				self.$oldstate = invalid;
				self.tclass(cls + '-invalid', invalid);
			}
		}
	};
});

COMPONENT('edit', 'disabled:0', function(self, config, cls) {

	var rtrue = /1|true/i;
	var events = {};

	self.readonly();
	self.getter = null;
	self.setter = null;

	var isdisabled = function(el) {
		var c = 'disabled';
		var disabled = el.attrd(c);
		var parent;
		if (!disabled) {
			parent = el.parent();
			disabled = parent.attrd(c) || parent.parent().attrd(c);
		}
		return disabled ? rtrue.test(disabled) : false;
	};

	self.parse = function(el) {
		var t = el[0];
		return t.$editable ? t.$editable : (t.$editable = (el.attrd('edit') || '').parseConfig());
	};

	self.movecursor = function(el, beg) {
		var range, selection, doc = document;
		if (doc.createRange) {
			range = doc.createRange();
			range.selectNodeContents(el[0]);
			range.collapse(beg ? true : false);
			selection = W.getSelection();
			selection.removeAllRanges();
			selection.addRange(range);
		} else if (doc.selection) {
			range = doc.body.createTextRange();
			range.moveToElementText(el[0]);
			range.collapse(beg ? true : false);
			range.select();
		}
	};

	self.cancel = function(opt, el) {
		opt.value = null;
		!opt.save && el.html('');
		self.approve2(el);
	};

	self.focusnext = function(el, e) {
		if (el instanceof jQuery)
			el = el[0];
		var arr = self.find('.edit');
		for (var i = 0; i < arr.length; i++) {
			if (arr[i] === el) {
				var next = arr[i + 1];
				if (next) {
					$(next).trigger('dblclick');
					e && e.preventDefault();
				}
				return true;
			}
		}
	};

	self.make = function() {

		self.event('dblclick', '.edit', function(e) {

			if (config.disabled)
				return;

			var t = this;

			e.preventDefault();
			e.stopPropagation();

			if (t.$editable && t.$editable.is)
				return;

			var el = $(t);

			if (isdisabled(el))
				return;

			var opt = self.parse(el);

			if (!opt || (opt.canedit && !opt.canedit(el)))
				return;

			opt.is = true;
			opt.element = el;
			opt.keypressed = 0;
			opt.html = el.html();

			if (opt.value == null || opt.value == '') {
				opt.value = opt.raw ? '' : opt.html;
				if (opt.raw && !el.hclass('invalid')) {
					opt.clear = true;
					self.movecursor(el, 1);
				}
			}

			self.attach(el);
		});

		events.keydown = function(e) {

			var t = this;

			if (!t.$events)
				return;

			var meta = t.$editable;

			if (meta.clear) {
				t.innerHTML = '';
				meta.clear = 0;
			}

			if (!meta.keypressed) {
				meta.keypressed = 1;
				$(t).aclass('keypressed');
			}

			if ((e.metaKey || e.ctrlKey) && (e.which === 66 || e.which === 76 || e.which === 73 || e.which === 85)) {
				if (meta.type !== 'html') {
					e.preventDefault();
					e.stopPropagation();
				}
			}

			var el;

			if (e.which === 27) {
				el = $(t);
				self.cnotify(el, 'no');
				self.detach(el);
				if (config.escape) {
					setTimeout(function() {
						self.EXEC(config.escape, meta.path, GET(meta.path), el);
					}, 100);
				}
				return;
			}

			if (e.which === 13 || e.which === 9) {

				if (e.which === 13 && meta.multiline)
					return;

				e.preventDefault();

				el = $(t);
				if (self.approve(el)) {

					self.detach(el);
					el.rclass('keypressed');

					if (e.which === 9) {
						if (self.focusnext(t, e))
							return;
					}

					if (config.enter) {
						setTimeout(function() {
							self.EXEC(config.enter, meta.path, GET(meta.path), el);
						}, 100);
					}

				} else {
					// INVALID
					self.cnotify(el, 'no');
				}
			}
		};

		events.blur = function() {
			var t = this;
			if (t.$events) {
				var el = $(t);
				el.rclass('keypressed');

				if (t.$editable.is) {
					var is = self.approve(el);
					self.cnotify(el, is ? 'ok' : 'no');
				}

				self.detach(el);
			}
		};

		events.paste = function(e) {
			e.preventDefault();
			e.stopPropagation();
			var meta = this.$editable;
			var text = e.originalEvent.clipboardData.getData(self.attrd('clipboard') || 'text/plain');
			text && document.execCommand('insertText', false, meta.multiline ? text.trim() : text.replace(/\n|\r/g, '').trim());
		};

		events.focus = function(e) {
			var t = this;
			var jcbind = e.target.$jcbind || {};

			if (t.$editable && t.$editable.is && t.$editable.autosource) {
				var attr = t.$editable;
				var opt = {};
				opt.element = $(t);
				opt.search = GET(attr.autosource);
				opt.offsetY = 10;
				opt.callback = function(item, el) {
					attr.value = typeof(item) === 'string' ? item : item[attr.autovalue || 'name'];
					el.html(attr.value);
					self.approve2(el);
				};
				SETTER('autocomplete', 'show', opt);
				return;
			}

			if (jcbind.empty && jcbind.empty == e.target.innerText) {
				$(e.target).empty();
				return;
			}
		};
	};

	self.approve = function(el) {

		var opt = el[0].$editable;
		var cur = el.html();

		if (!opt.required && (opt.html === cur || (opt.raw && !cur && !opt.empty)))
			return true;

		var val = cur;

		if (opt.type !== 'html') {
			var area = document.createElement('TEXTAREA');
			area.innerHTML = val;
			val = $(area).text();
			val = val.replace(/<br(\s\/)?>/g, opt.multiline ? '\n' : '').trim();
		}

		if (opt.maxlength && val.length > opt.maxlength)
			val = val.substring(0, opt.maxlength);

		opt.value = val;

		switch (opt.type) {
			case 'number':
				opt.value = opt.value ? opt.value.parseFloat() : 0;
				if ((opt.minvalue != null && opt.value < opt.minvalue) || (opt.maxvalue != null && opt.value > opt.maxvalue)) {
					opt.value = '';
					return false;
				}
				break;
			case 'phone':
				if (opt.required) {
					if (!opt.value.isPhone()) {
						opt.html = null;
						return false;
					}
				} else if (opt.value && !opt.value.isPhone()) {
					opt.value = '';
					return false;
				}
				break;
			case 'email':
				if (opt.required) {
					if ((!opt.value || !opt.value.isEmail())) {
						opt.html = null;
						return false;
					}
				} else if (opt.value && !opt.value.isEmail()) {
					opt.value = '';
					return false;
				}

				break;
			case 'date':
				if (!opt.empty) {
					opt.value = opt.value ? opt.value.parseDate(opt.format) : null;
					if (opt.required && !opt.value)
						return false;
				}
				break;
			case 'boolean':
				opt.value = opt.value === true || opt.value == 'true' || opt.value == '1' || opt.value == 'on';
				break;
			default:
				if (opt.required && !opt.value) {
					//opt.value = '';
					opt.html = null;
					return false;
				}
				break;
		}

		// EMPTY STRING
		if ((!opt.type || opt.type === 'string') && (opt.value == null || opt.value === '') && (opt.prev == null || opt.prev === ''))
			return false;

		if (!opt.empty && (opt.required && (opt.value == null || opt.value === '')) || (opt.validate && !opt.validate(opt.value)))
			return false;

		self.approve2(el);
		return true;
	};

	self.cnotify = function(el, classname) {
		var meta = el[0].$editable;
		if (classname === 'ok') {
			self.EXEC(el.attrd('edit'), meta, function() {
				el.html(meta.html);
			});
		}
	};

	self.approve2 = function(el) {
		var meta = el[0].$editable;
		self.EXEC(el.attrd('edit'), meta, function() {
			el.html(meta.html);
		});
	};

	self.attach = function(el) {
		if (!el[0].$events) {

			var o = el[0].$editable;
			el[0].$events = true;

			el.aclass('edit-editing' + (o.multiline ? ' edit-multiline' : ''));
			el.on('focus', events.focus);
			el.on('keydown', events.keydown);
			el.on('blur', events.blur);
			el.on('paste', events.paste);
			el.attr('contenteditable', true);
			el.focus();
			self.movecursor(el, o.clear ? 1 : 0);
		}
	};

	self.detach = function(el) {
		if (el[0].$events) {
			el.off('keydown', events.keydown);
			el.off('blur', events.blur);
			el.off('paste', events.paste);
			el[0].$events = false;
			var opt = el[0].$editable;
			if (opt.html != null)
				el.html(opt.html);
			opt.is = false;
			el.rclass('edit-editing edit-multiline');
			el.attr('contenteditable', false);
		}
	};

});

COMPONENT('floatinginput', 'minwidth:200', function(self, config, cls) {

	var cls2 = '.' + cls;
	var timeout, icon, plus, input, summary;
	var is = false;
	var plusvisible = false;

	self.readonly();
	self.singleton();
	self.nocompile && self.nocompile();

	self.configure = function(key, value, init) {
		if (init)
			return;
		switch (key) {
			case 'placeholder':
				self.find('input').prop('placeholder', value);
				break;
		}
	};

	self.make = function() {

		self.aclass(cls + ' hidden');
		self.append('<div class="{1}-summary hidden"></div><div class="{1}-input"><span class="{1}-add hidden"><i class="fa fa-plus"></i></span><span class="{1}-button"><i class="fa fa-search"></i></span><div><input type="text" placeholder="{0}" class="{1}-search-input" name="dir{2}" autocomplete="dir{2}" /></div></div'.format(config.placeholder, cls, Date.now()));

		input = self.find('input');
		icon = self.find(cls2 + '-button').find('i');
		plus = self.find(cls2 + '-add');
		summary = self.find(cls2 + '-summary');

		self.event('click', cls2 + '-button', function(e) {
			input.val('');
			self.search();
			e.stopPropagation();
			e.preventDefault();
		});

		self.event('click', cls2 + '-add', function() {
			if (self.opt.callback) {
				self.opt.scope && M.scope(self.opt.scope);
				self.opt.callback(input.val(), self.opt.element, true);
				self.hide();
			}
		});

		self.event('keydown', 'input', function(e) {
			switch (e.which) {
				case 27:
					self.hide();
					break;
				case 13:
					if (self.opt.callback) {
						self.opt.scope && M.scope(self.opt.scope);
						self.opt.callback(this.value, self.opt.element);
					}
					self.hide();
					break;
			}
		});

		var e_click = function(e) {
			var node = e.target;
			var count = 0;

			if (is) {
				while (true) {
					var c = node.getAttribute('class') || '';
					if (c.indexOf(cls + '-input') !== -1)
						return;
					node = node.parentNode;
					if (!node || !node.tagName || node.tagName === 'BODY' || count > 3)
						break;
					count++;
				}
			} else {
				is = true;
				while (true) {
					var c = node.getAttribute('class') || '';
					if (c.indexOf(cls) !== -1) {
						is = false;
						break;
					}
					node = node.parentNode;
					if (!node || !node.tagName || node.tagName === 'BODY' || count > 4)
						break;
					count++;
				}
			}

			is && self.hide(0);
		};

		var e_resize = function() {
			is && self.hide(0);
		};

		self.bindedevents = false;

		self.bindevents = function() {
			if (!self.bindedevents) {
				$(document).on('click', e_click);
				$(W).on('resize', e_resize);
				self.bindedevents = true;
			}
		};

		self.unbindevents = function() {
			if (self.bindedevents) {
				self.bindedevents = false;
				$(document).off('click', e_click);
				$(W).off('resize', e_resize);
			}
		};

		self.event('input', 'input', function() {
			var is = !!this.value;
			if (plusvisible !== is) {
				plusvisible = is;
				plus.tclass('hidden', !this.value);
			}
		});

		var fn = function() {
			is && self.hide(1);
		};

		self.on('reflow + scroll + resize + resize2', fn);
	};

	self.show = function(opt) {

		// opt.element
		// opt.callback(value, el)
		// opt.offsetX     --> offsetX
		// opt.offsetY     --> offsetY
		// opt.offsetWidth --> plusWidth
		// opt.placeholder
		// opt.render
		// opt.minwidth
		// opt.maxwidth
		// opt.icon;
		// opt.maxlength = 30;

		var el = opt.element instanceof jQuery ? opt.element[0] : opt.element;

		self.tclass(cls + '-default', !opt.render);

		if (!opt.minwidth)
			opt.minwidth = 200;

		if (is) {
			clearTimeout(timeout);
			if (self.target === el) {
				self.hide(1);
				return;
			}
		}

		self.initializing = true;
		self.target = el;
		plusvisible = false;

		var element = $(opt.element);

		setTimeout(self.bindevents, 500);

		self.opt = opt;
		opt.class && self.aclass(opt.class);

		input.val(opt.value || '');
		input.prop('maxlength', opt.maxlength || 50);

		self.target = element[0];

		var w = element.width();
		var offset = element.offset();
		var width = w + (opt.offsetWidth || 0);

		if (opt.minwidth && width < opt.minwidth)
			width = opt.minwidth;
		else if (opt.maxwidth && width > opt.maxwidth)
			width = opt.maxwidth;

		var ico = '';

		if (opt.icon) {
			if (opt.icon.indexOf(' ') === -1)
				ico = 'fa fa-' + opt.icon;
			else
				ico = opt.icon;
		} else
			ico = 'fa fa-pencil-alt';

		icon.rclass2('fa').aclass(ico).rclass('hidden');

		if (opt.value) {
			plusvisible = true;
			plus.rclass('hidden');
		} else
			plus.aclass('hidden');

		self.find('input').prop('placeholder', opt.placeholder || config.placeholder);
		var options = { left: 0, top: 0, width: width };

		summary.tclass('hidden', !opt.summary).html(opt.summary || '');

		switch (opt.align) {
			case 'center':
				options.left = Math.ceil((offset.left - width / 2) + (width / 2));
				break;
			case 'right':
				options.left = (offset.left - width) + w;
				break;
			default:
				options.left = offset.left;
				break;
		}

		options.top = opt.position === 'bottom' ? ((offset.top - self.height()) + element.height()) : offset.top;
		options.scope = M.scope ? M.scope() : '';

		if (opt.offsetX)
			options.left += opt.offsetX;

		if (opt.offsetY)
			options.top += opt.offsetY;

		self.css(options);

		!isMOBILE && setTimeout(function() {
			opt.select && input[0].select();
			input.focus();
		}, 200);


		self.tclass(cls + '-monospace', !!opt.monospace);
		self.rclass('hidden');

		setTimeout(function() {
			self.initializing = false;
			is = true;
			if (self.opt && self.target && self.target.offsetParent)
				self.aclass(cls + '-visible');
			else
				self.hide(1);
		}, 100);
	};

	self.hide = function(sleep) {
		if (!is || self.initializing)
			return;
		clearTimeout(timeout);
		timeout = setTimeout(function() {
			self.unbindevents();
			self.rclass(cls + '-visible').aclass('hidden');
			if (self.opt) {
				self.opt.close && self.opt.close();
				self.opt.class && self.rclass(self.opt.class);
				self.opt = null;
			}
			is = false;
		}, sleep ? sleep : 100);
	};
});

COMPONENT('checkbox', function(self, config, cls) {

	self.nocompile && self.nocompile();

	self.validate = function(value) {
		return (config.disabled || !config.required) ? true : (value === true || value === 'true' || value === 'on');
	};

	self.configure = function(key, value, init) {
		if (init)
			return;
		switch (key) {
			case 'label':
				self.find('span').html(value);
				break;
			case 'required':
				self.find('span').tclass(cls + '-label-required', value);
				break;
			case 'disabled':
				self.tclass('ui-disabled', value);
				break;
			case 'checkicon':
				self.find('i').rclass2('fa-').aclass('fa-' + value);
				break;
		}
	};

	self.make = function() {
		self.aclass(cls);
		self.html('<div><i class="fa fa-{2}"></i></div><span{1}>{0}</span>'.format(config.label || self.html(), config.required ? (' class="' + cls + '-label-required"') : '', config.checkicon || 'check'));
		config.disabled && self.aclass('ui-disabled');
		self.event('click', function() {
			if (!config.disabled) {
				self.dirty(false);
				self.getter(!self.get());
			}
		});
	};

	self.setter = function(value) {
		var is = config.reverse ? !value : !!value;
		self.tclass(cls + '-checked', is);
	};
});

COMPONENT('validation', 'delay:100;flags:visible', function(self, config, cls) {

	var path, elements = null;
	var def = 'button[name="submit"]';
	var flags = null;
	var tracked = false;
	var reset = 0;
	var old, track;

	self.readonly();

	self.make = function() {
		elements = self.find(config.selector || def);
		path = self.path.replace(/\.\*$/, '');
	};

	self.configure = function(key, value, init) {
		switch (key) {
			case 'selector':
				if (!init)
					elements = self.find(value || def);
				break;
			case 'flags':
				if (value) {
					flags = value.split(',');
					for (var i = 0; i < flags.length; i++)
						flags[i] = '@' + flags[i];
				} else
					flags = null;
				break;
			case 'track':
				track = value.split(',').trim();
				break;
		}
	};

	var settracked = function() {
		tracked = 0;
	};

	self.setter = function(value, path, type) {

		var is = path === self.path || path.length < self.path.length;

		if (reset !== is) {
			reset = is;
			self.tclass(cls + '-modified', !reset);
		}

		if ((type === 1 || type === 2) && track && track.length) {
			for (var i = 0; i < track.length; i++) {
				if (path.indexOf(track[i]) !== -1) {
					tracked = 1;
					return;
				}
			}
			if (tracked === 1) {
				tracked = 2;
				setTimeout(settracked, config.delay * 3);
			}
		}
	};

	var check = function() {
		var disabled = tracked ? !VALID(path, flags) : DISABLED(path, flags);
		if (!disabled && config.if)
			disabled = !EVALUATE(self.path, config.if);
		if (disabled !== old) {
			elements.prop('disabled', disabled);
			self.tclass(cls + '-ok', !disabled);
			self.tclass(cls + '-no', disabled);
			old = disabled;
		}
	};

	self.state = function(type, what) {
		if (type === 3 || what === 3)
			tracked = 0;
		setTimeout2(self.ID, check, config.delay);
	};

});

COMPONENT('importer', function(self, config) {

	var init = false;
	var clid = null;
	var pending = false;
	var content = '';

	self.readonly();

	self.make = function() {
		var scr = self.find('script');
		content = scr.length ? scr.html() : '';
	};

	self.reload = function(recompile) {
		config.reload && EXEC(config.reload);
		recompile && COMPILE();
		setTimeout(function() {
			pending = false;
			init = true;
		}, 1000);
	};

	self.setter = function(value) {

		if (pending)
			return;

		if (config.if !== value) {
			if (config.cleaner && init && !clid)
				clid = setTimeout(self.clean, config.cleaner * 60000);
			return;
		}

		pending = true;

		if (clid) {
			clearTimeout(clid);
			clid = null;
		}

		if (init) {
			self.reload();
			return;
		}

		if (content) {
			self.html(content);
			setTimeout(self.reload, 50, true);
		} else
			self.import(config.url, self.reload);
	};

	self.clean = function() {
		config.clean && EXEC(config.clean);
		setTimeout(function() {
			self.empty();
			init = false;
			clid = null;
		}, 1000);
	};
});

COMPONENT('movable', function(self, config) {

	var events = {};
	var draggable;

	self.readonly();

	self.make = function() {
		var target = config.global ? $(document) : config.parent ? self.parent(config.parent) : self.element;
		target.on('dragenter dragover dragexit drop dragleave dragstart', config.selector, events.ondrag).on('mousedown', config.selector, events.ondown);
	};

	events.ondrag = function(e) {

		if (!draggable)
			return;

		if (e.type !== 'dragstart') {
			e.stopPropagation();
			e.preventDefault();
		}

		switch (e.type) {
			case 'drop':

				var parent = draggable.parentNode;
				var a = draggable;
				var b = e.target;
				var ai = -1;
				var bi = -1;
				var is = false;

				while (true) {
					if (b.parentNode === parent) {
						is = true;
						break;
					}
					b = b.parentNode;
					if (b == null || b.tagName === 'HTML')
						break;
				}

				if (a === b || !is)
					return;

				for (var i = 0; i < parent.children.length; i++) {
					var child = parent.children[i];
					if (a === child)
						ai = i;
					else if (b === child)
						bi = i;
					if (bi !== -1 && ai !== -1)
						break;
				}

				if (ai > bi)
					parent.insertBefore(a, b);
				else
					parent.insertBefore(a, b.nextSibling);

				config.exec && EXEC(self.makepath(config.exec), $(parent).find(config.selector), a, b);
				self.path && self.change(true);
				break;

			case 'dragstart':
				var eo = e.originalEvent;
				eo.dataTransfer && eo.dataTransfer.setData('text', '1');
				break;
			case 'dragenter':
			case 'dragover':
			case 'dragexit':
			case 'dragleave':
				break;
		}
	};

	events.ondown = function() {
		draggable = this;
	};

	self.destroy = function() {
		$(document).off('dragenter dragover dragexit drop dragleave dragstart', config.selector, events.ondrag).off('mousedown', config.selector, events.ondown);
	};
});

COMPONENT('form', 'zindex:12;scrollbar:1', function(self, config, cls) {

	var cls2 = '.' + cls;
	var container;
	var csspos = {};

	if (!W.$$form) {

		W.$$form_level = W.$$form_level || 1;
		W.$$form = true;

		$(document).on('click', cls2 + '-button-close', function() {
			SET($(this).attrd('path'), '');
		});

		var resize = function() {
			setTimeout2('form', function() {
				for (var i = 0; i < M.components.length; i++) {
					var com = M.components[i];
					if (com.name === 'form' && !HIDDEN(com.dom) && com.$ready && !com.$removed)
						com.resize();
				}
			}, 200);
		};

		ON('resize2', resize);

		$(document).on('click', cls2 + '-container', function(e) {

			var el = $(e.target);
			if (e.target === this || el.hclass(cls + '-container-padding')) {
				var com = $(this).component();
				if (com && com.config.closeoutside) {
					com.set('');
					return;
				}
			}

			if (!(el.hclass(cls + '-container-padding') || el.hclass(cls + '-container')))
				return;

			var form = $(this).find(cls2);
			var c = cls + '-animate-click';
			form.aclass(c);

			setTimeout(function() {
				form.rclass(c);
			}, 300);
		});
	}

	self.readonly();
	self.submit = function() {
		if (config.submit)
			self.EXEC(config.submit, self.hide, self.element);
		else
			self.hide();
	};

	self.cancel = function() {
		config.cancel && self.EXEC(config.cancel, self.hide);
		self.hide();
	};

	self.hide = function() {
		if (config.independent)
			self.hideforce();
		self.esc(false);
		self.set('');
	};

	self.icon = function(value) {
		var el = this.rclass2('fa');
		value.icon && el.aclass(value.icon.indexOf(' ') === -1 ? ('fa fa-' + value.icon) : value.icon);
		el.tclass('hidden', !value.icon);
	};

	self.resize = function() {

		if (self.scrollbar) {
			container.css('height', WH);
			self.scrollbar.resize();
		}

		if (!config.center || self.hclass('hidden'))
			return;

		var ui = self.find(cls2);
		var fh = ui.innerHeight();
		var wh = WH;
		var r = (wh / 2) - (fh / 2);
		csspos.marginTop = (r > 30 ? (r - 15) : 20) + 'px';
		ui.css(csspos);
	};

	self.make = function() {

		$(document.body).append('<div id="{0}" class="hidden {4}-container invisible"><div class="{4}-scrollbar"><div class="{4}-container-padding"><div class="{4}" style="max-width:{1}px"><div data-bind="@config__text span:value.title__change .{4}-icon:@icon" class="{4}-title"><button name="cancel" class="{4}-button-close{3}" data-path="{2}"><i class="fa fa-times"></i></button><i class="{4}-icon"></i><span></span></div></div></div></div>'.format(self.ID, config.width || 800, self.path, config.closebutton == false ? ' hidden' : '', cls));

		var scr = self.find('> script');
		self.template = scr.length ? scr.html().trim() : '';
		if (scr.length)
			scr.remove();

		var el = $('#' + self.ID);
		var body = el.find(cls2)[0];
		container = el.find(cls2 + '-scrollbar');

		if (config.scrollbar) {
			el.css('overflow', 'hidden');
			self.scrollbar = SCROLLBAR(el.find(cls2 + '-scrollbar'), { visibleY: 1, orientation: 'y' });
		}

		while (self.dom.children.length)
			body.appendChild(self.dom.children[0]);

		self.rclass('hidden invisible');
		self.replace(el, true);

		self.event('scroll', function() {
			EMIT('scroll', self.name);
			EMIT('reflow', self.name);
		});

		self.event('click', 'button[name]', function() {
			var t = this;
			switch (t.name) {
				case 'submit':
					self.submit(self.hide);
					break;
				case 'cancel':
					!t.disabled && self[t.name](self.hide);
					break;
			}
		});

		config.enter && self.event('keydown', 'input', function(e) {
			e.which === 13 && !self.find('button[name="submit"]')[0].disabled && setTimeout(self.submit, 800);
		});
	};

	self.configure = function(key, value, init, prev) {
		if (init)
			return;
		switch (key) {
			case 'width':
				value !== prev && self.find(cls2).css('max-width', value + 'px');
				break;
			case 'closebutton':
				self.find(cls2 + '-button-close').tclass('hidden', value !== true);
				break;
		}
	};

	self.esc = function(bind) {
		if (bind) {
			if (!self.$esc) {
				self.$esc = true;
				$(W).on('keydown', self.esc_keydown);
			}
		} else {
			if (self.$esc) {
				self.$esc = false;
				$(W).off('keydown', self.esc_keydown);
			}
		}
	};

	self.esc_keydown = function(e) {
		if (e.which === 27 && !e.isPropagationStopped()) {
			var val = self.get();
			if (!val || config.if === val) {
				e.preventDefault();
				e.stopPropagation();
				self.hide();
			}
		}
	};

	self.hideforce = function() {
		if (!self.hclass('hidden')) {
			self.aclass('hidden');
			self.release(true);
			self.find(cls2).rclass(cls + '-animate');
			W.$$form_level--;
		}
	};

	var allowscrollbars = function() {
		$('html').tclass(cls + '-noscroll', !!$(cls2 + '-container').not('.hidden').length);
	};

	self.setter = function(value) {

		setTimeout2(self.name + '-noscroll', allowscrollbars, 50);

		var isHidden = value !== config.if;

		if (self.hclass('hidden') === isHidden) {
			if (!isHidden) {
				config.reload && self.EXEC(config.reload, self);
				config.default && DEFAULT(self.makepath(config.default), true);
			}
			return;
		}

		setTimeout2(cls, function() {
			EMIT('reflow', self.name);
		}, 10);

		if (isHidden) {
			if (!config.independent)
				self.hideforce();
			return;
		}

		if (self.template) {
			var is = self.template.COMPILABLE();
			self.find(cls2).append(self.template);
			self.template = null;
			is && COMPILE();
		}

		if (W.$$form_level < 1)
			W.$$form_level = 1;

		W.$$form_level++;

		self.css('z-index', W.$$form_level * config.zindex);
		self.element.scrollTop(0);
		self.rclass('hidden');

		self.resize();
		self.release(false);

		config.reload && self.EXEC(config.reload, self);
		config.default && DEFAULT(self.makepath(config.default), true);

		if (!isMOBILE && config.autofocus) {
			setTimeout(function() {
				self.find(typeof(config.autofocus) === 'string' ? config.autofocus : 'input[type="text"],select,textarea').eq(0).focus();
			}, 1000);
		}

		setTimeout(function() {
			self.rclass('invisible');
			self.element.scrollTop(0);
			self.find(cls2).aclass(cls + '-animate');
		}, 300);

		// Fixes a problem with freezing of scrolling in Chrome
		setTimeout2(self.ID, function() {
			self.css('z-index', (W.$$form_level * config.zindex) + 1);
		}, 500);

		config.closeesc && self.esc(true);
	};
});

COMPONENT('directory', 'minwidth:200', function(self, config, cls) {

	var cls2 = '.' + cls;
	var container, timeout, icon, plus, skipreset = false, skipclear = false, ready = false, input = null, issearch = false;
	var is = false, selectedindex = 0, resultscount = 0, skiphide = false;
	var templateE = '{{ name | encode | ui_directory_helper }}';
	var templateR = '{{ name | raw }}';
	var template = '<li data-index="{{ $.index }}" data-search="{{ $.search }}" {{ if selected }} class="current selected{{ if classname }} {{ classname }}{{ fi }}"{{ else if classname }} class="{{ classname }}"{{ fi }}>{{ if $.checkbox }}<span class="' + cls + '-checkbox"><i class="fa fa-check"></i></span>{{ fi }}{0}</li>';
	var templateraw = template.format(templateR);
	var regstrip = /(&nbsp;|<([^>]+)>)/ig;
	var parentclass;

	template = template.format(templateE);

	Thelpers.ui_directory_helper = function(val) {
		var t = this;
		return t.template ? (typeof(t.template) === 'string' ? t.template.indexOf('{{') === -1 ? t.template : Tangular.render(t.template, this) : t.render(this, val)) : self.opt.render ? self.opt.render(this, val) : val;
	};

	self.template = Tangular.compile(template);
	self.templateraw = Tangular.compile(templateraw);

	self.readonly();
	self.singleton();
	self.nocompile && self.nocompile();

	self.configure = function(key, value, init) {
		if (init)
			return;
		switch (key) {
			case 'placeholder':
				self.find('input').prop('placeholder', value);
				break;
		}
	};

	self.make = function() {

		self.aclass(cls + ' hidden');
		self.append('<div class="{1}-search"><span class="{1}-add hidden"><i class="fa fa-plus"></i></span><span class="{1}-button"><i class="fa fa-search"></i></span><div><input type="text" placeholder="{0}" class="{1}-search-input" name="dir{2}" autocomplete="new-password" /></div></div><div class="{1}-container"><ul></ul></div>'.format(config.placeholder, cls, Date.now()));
		container = self.find('ul');
		input = self.find('input');
		icon = self.find(cls2 + '-button').find('.fa');
		plus = self.find(cls2 + '-add');

		self.event('mouseenter mouseleave', 'li', function() {
			if (ready && !issearch) {
				container.find('li.current').rclass('current');
				$(this).aclass('current');
				var arr = container.find('li:visible');
				for (var i = 0; i < arr.length; i++) {
					if ($(arr[i]).hclass('current')) {
						selectedindex = i;
						break;
					}
				}
			}
		});

		self.event('focus', 'input', function() {
			if (self.opt.search === false)
				$(this).blur();
		});

		self.event('click', cls2 + '-button', function(e) {
			skipclear = false;
			input.val('');
			self.search();
			e.stopPropagation();
			e.preventDefault();
		});

		self.event('click', cls2 + '-add', function() {
			if (self.opt.custom && self.opt.callback) {
				self.opt.scope && M.scope(self.opt.scope);
				self.opt.callback(input.val(), self.opt.element, true);
				self.hide();
			}
		});

		self.event('click', 'li', function(e) {

			if (self.opt.callback) {
				self.opt.scope && M.scope(self.opt.scope);
				var item = self.opt.items[+this.getAttribute('data-index')];
				if (self.opt.checkbox) {
					item.selected = !item.selected;
					$(this).tclass('selected', item.selected);
					var response = [];
					for (var i = 0; i < self.opt.items.length; i++) {
						var m = self.opt.items[i];
						if (m.selected)
							response.push(m);
					}
					self.opt.callback(response, self.opt.element);
					skiphide = true;
				} else
					self.opt.callback(item, self.opt.element);
			}

			is = true;

			if (!self.opt.checkbox) {
				self.hide(0);
				e.preventDefault();
				e.stopPropagation();
			}

		});

		var e_click = function(e) {

			if (skiphide) {
				skiphide = false;
				return;
			}

			var node = e.target;
			var count = 0;

			if (is) {
				while (true) {
					var c = node.getAttribute('class') || '';
					if (c.indexOf(cls + '-search-input') !== -1)
						return;
					node = node.parentNode;
					if (!node || !node.tagName || node.tagName === 'BODY' || count > 3)
						break;
					count++;
				}
			} else {
				is = true;
				while (true) {
					var c = node.getAttribute('class') || '';
					if (c.indexOf(cls) !== -1) {
						is = false;
						break;
					}
					node = node.parentNode;
					if (!node || !node.tagName || node.tagName === 'BODY' || count > 4)
						break;
					count++;
				}
			}

			is && self.hide(0);
		};

		var e_resize = function() {
			is && self.hide(0);
		};

		self.bindedevents = false;

		self.bindevents = function() {
			if (!self.bindedevents) {
				$(document).on('click', e_click);
				$(W).on('resize', e_resize);
				self.bindedevents = true;
			}
		};

		self.unbindevents = function() {
			if (self.bindedevents) {
				self.bindedevents = false;
				$(document).off('click', e_click);
				$(W).off('resize', e_resize);
			}
		};

		self.event('keydown', 'input', function(e) {
			var o = false;
			switch (e.which) {
				case 8:
					skipclear = false;
					break;
				case 27:
					o = true;
					self.hide();
					break;
				case 13:
					o = true;
					var sel = self.find('li.current');
					if (self.opt.callback) {
						self.opt.scope && M.scope(self.opt.scope);
						if (sel.length)
							self.opt.callback(self.opt.items[+sel.attrd('index')], self.opt.element);
						else if (self.opt.custom)
							self.opt.callback(this.value, self.opt.element, true);
					}
					self.hide();
					break;
				case 38: // up
					o = true;
					selectedindex--;
					if (selectedindex < 0)
						selectedindex = 0;
					self.move();
					break;
				case 40: // down
					o = true;
					selectedindex++;
					if (selectedindex >= resultscount)
						selectedindex = resultscount;
					self.move();
					break;
			}

			if (o) {
				e.preventDefault();
				e.stopPropagation();
			}

		});

		self.event('input', 'input', function() {
			issearch = true;
			setTimeout2(self.ID, self.search, 100, null, this.value);
		});

		var fn = function() {
			is && self.hide(1);
		};

		self.on('reflow + scroll + resize + resize2', fn);
		$(W).on('scroll', fn);
	};

	self.move = function() {

		var counter = 0;
		var scroller = container.parent();
		var li = container.find('li');
		var hli = (li.eq(0).innerHeight() || 30) + 1;
		var was = false;
		var last = -1;
		var lastselected = 0;
		var plus = (hli * 2);

		for (var i = 0; i < li.length; i++) {

			var el = $(li[i]);

			if (el.hclass('hidden')) {
				el.rclass('current');
				continue;
			}

			var is = selectedindex === counter;
			el.tclass('current', is);

			if (is) {
				was = true;
				var t = (hli * (counter || 1));
				// var p = (t / sh) * 100;
				scroller[0].scrollTop = t - plus;
			}

			counter++;
			last = i;
			lastselected++;
		}

		if (!was && last >= 0) {
			selectedindex = lastselected;
			li.eq(last).aclass('current');
		}
	};

	var nosearch = function() {
		issearch = false;
	};

	self.nosearch = function() {
		setTimeout2(self.ID + 'nosearch', nosearch, 500);
	};

	self.search = function(value) {

		if (!self.opt)
			return;

		icon.tclass('fa-times', !!value).tclass('fa-search', !value);
		self.opt.custom && plus.tclass('hidden', !value);

		if (!value && !self.opt.ajax) {
			if (!skipclear)
				container.find('li').rclass('hidden');
			if (!skipreset)
				selectedindex = 0;
			resultscount = self.opt.items ? self.opt.items.length : 0;
			self.move();
			self.nosearch();
			return;
		}

		resultscount = 0;
		selectedindex = 0;

		if (self.opt.ajax) {
			var val = value || '';
			if (self.ajaxold !== val) {
				self.ajaxold = val;
				setTimeout2(self.ID, function(val) {
					self.opt && self.opt.ajax(val, function(items) {
						var builder = [];
						var indexer = {};
						var item;
						var key = (self.opt.search == true ? self.opt.key : (self.opt.search || self.opt.key)) || 'name';

						for (var i = 0; i < items.length; i++) {
							item = items[i];
							if (self.opt.exclude && self.opt.exclude(item))
								continue;
							indexer.index = i;
							indexer.search = item[key] ? item[key].replace(regstrip, '') : '';
							indexer.checkbox = self.opt.checkbox === true;
							resultscount++;
							builder.push(self.opt.ta(item, indexer));
						}

						if (self.opt.empty) {
							item = {};
							var tmp = self.opt.raw ? '<b>{0}</b>'.format(self.opt.empty) : self.opt.empty;
							item[self.opt.key || 'name'] = tmp;
							if (!self.opt.raw)
								item.template = '<b>{0}</b>'.format(self.opt.empty);
							indexer.index = -1;
							builder.unshift(self.opt.ta(item, indexer));
						}

						skipclear = true;
						self.opt.items = items;
						container.html(builder);
						self.move();
						self.nosearch();
					});
				}, 300, null, val);
			}
		} else if (value) {
			value = value.toSearch();
			var arr = container.find('li');
			for (var i = 0; i < arr.length; i++) {
				var el = $(arr[i]);
				var val = el.attrd('search').toSearch();
				var is = val.indexOf(value) === -1;
				el.tclass('hidden', is);
				if (!is)
					resultscount++;
			}
			skipclear = true;
			self.move();
			self.nosearch();
		}
	};

	self.show = function(opt) {

		// opt.element
		// opt.items
		// opt.callback(value, el)
		// opt.offsetX     --> offsetX
		// opt.offsetY     --> offsetY
		// opt.offsetWidth --> plusWidth
		// opt.placeholder
		// opt.render
		// opt.custom
		// opt.minwidth
		// opt.maxwidth
		// opt.key
		// opt.exclude    --> function(item) must return Boolean
		// opt.search
		// opt.selected   --> only for String Array "opt.items"
		// opt.classname

		var el = opt.element instanceof jQuery ? opt.element[0] : opt.element;

		if (opt.items == null)
			opt.items = EMPTYARRAY;

		self.tclass(cls + '-default', !opt.render);

		if (parentclass) {
			self.rclass(parentclass);
			parentclass = null;
		}

		if (opt.classname) {
			self.aclass(opt.classname);
			parentclass = opt.classname;
		}

		if (!opt.minwidth)
			opt.minwidth = 200;

		if (is) {
			clearTimeout(timeout);
			if (self.target === el) {
				self.hide(1);
				return;
			}
		}

		self.initializing = true;
		self.target = el;
		opt.ajax = null;
		self.ajaxold = null;

		var element = $(opt.element);
		var callback = opt.callback;
		var items = opt.items;
		var type = typeof(items);
		var item;

		if (type === 'string') {
			items = GET(items);
			type = typeof(items);
		}

		if (type === 'function' && callback) {
			type = '';
			opt.ajax = items;
			items = null;
		}

		if (!items && !opt.ajax) {
			self.hide(0);
			return;
		}

		setTimeout(self.bindevents, 500);
		self.tclass(cls + '-search-hidden', opt.search === false);

		self.opt = opt;
		opt.class && self.aclass(opt.class);

		input.val('');

		var builder = [];
		var selected = null;

		opt.ta = opt.key ? Tangular.compile((opt.raw ? templateraw : template).replace(/\{\{\sname/g, '{{ ' + opt.key)) : opt.raw ? self.templateraw : self.template;

		if (!opt.ajax) {
			var indexer = {};
			var key = (opt.search == true ? opt.key : (opt.search || opt.key)) || 'name';
			for (var i = 0; i < items.length; i++) {

				item = items[i];

				if (typeof(item) === 'string')
					item = { name: item, id: item, selected: item === opt.selected };

				if (opt.exclude && opt.exclude(item))
					continue;

				if (item.selected || opt.selected === item) {
					selected = i;
					skipreset = true;
					item.selected = true;
				} else
					item.selected = false;

				indexer.checkbox = opt.checkbox === true;
				indexer.index = i;
				indexer.search = item[key] ? item[key].replace(regstrip, '') : '';
				builder.push(opt.ta(item, indexer));
			}

			if (opt.empty) {
				item = {};
				var tmp = opt.raw ? '<b>{0}</b>'.format(opt.empty) : opt.empty;
				item[opt.key || 'name'] = tmp;
				if (!opt.raw)
					item.template = '<b>{0}</b>'.format(opt.empty);
				indexer.index = -1;
				builder.unshift(opt.ta(item, indexer));
			}
		}

		self.target = element[0];

		var w = element.width();
		var offset = element.offset();
		var width = w + (opt.offsetWidth || 0);

		if (opt.minwidth && width < opt.minwidth)
			width = opt.minwidth;
		else if (opt.maxwidth && width > opt.maxwidth)
			width = opt.maxwidth;

		ready = false;

		opt.ajaxold = null;
		plus.aclass('hidden');
		self.find('input').prop('placeholder', opt.placeholder || config.placeholder);
		var scroller = self.find(cls2 + '-container').css('width', width + 30);
		container.html(builder);

		var options = { left: 0, top: 0, width: width };

		switch (opt.align) {
			case 'center':
				options.left = Math.ceil((offset.left - width / 2) + (opt.element.innerWidth() / 2));
				break;
			case 'right':
				options.left = (offset.left - width) + opt.element.innerWidth();
				break;
			default:
				options.left = offset.left;
				break;
		}

		options.top = opt.position === 'bottom' ? ((offset.top - self.height()) + element.height()) : offset.top;
		options.scope = M.scope ? M.scope() : '';

		if (opt.offsetX)
			options.left += opt.offsetX;

		if (opt.offsetY)
			options.top += opt.offsetY;

		var mw = width;
		var mh = self.height();

		if (options.left < 0)
			options.left = 10;
		else if ((mw + options.left) > WW)
			options.left = (WW - mw) - 10;

		if (options.top < 0)
			options.top = 10;
		else if ((mh + options.top) > WH)
			options.top = (WH - mh) - 10;

		self.css(options);

		!isMOBILE && setTimeout(function() {
			ready = true;
			if (opt.search !== false)
				input.focus();
		}, 200);

		setTimeout(function() {
			self.initializing = false;
			is = true;
			if (selected == null)
				scroller[0].scrollTop = 0;
			else {
				var h = container.find('li:first-child').innerHeight() + 1;
				var y = (container.find('li.selected').index() * h) - (h * 2);
				scroller[0].scrollTop = y < 0 ? 0 : y;
			}
		}, 100);

		if (is) {
			self.search();
			return;
		}

		selectedindex = selected || 0;
		resultscount = items ? items.length : 0;
		skipclear = true;

		self.search();
		self.rclass('hidden');

		setTimeout(function() {
			if (self.opt && self.target && self.target.offsetParent)
				self.aclass(cls + '-visible');
			else
				self.hide(1);
		}, 100);

		skipreset = false;
	};

	self.hide = function(sleep) {
		if (!is || self.initializing)
			return;
		clearTimeout(timeout);
		timeout = setTimeout(function() {
			self.unbindevents();
			self.rclass(cls + '-visible').aclass('hidden');
			if (self.opt) {
				self.opt.close && self.opt.close();
				self.opt.class && self.rclass(self.opt.class);
				self.opt = null;
			}
			is = false;
		}, sleep ? sleep : 100);
	};
});

COMPONENT('radiobuttonexpert', function(self, config, cls) {

	var cls2 = '.' + cls;
	var template;
	var recompile = false;
	var selected;
	var reg = /\$(index|path)/g;

	self.nocompile();

	self.configure = function(key, value, init) {
		if (init)
			return;
		switch (key) {
			case 'disabled':
				self.tclass('ui-disabled', value);
				break;
			case 'required':
				self.find(cls2 + '-label').tclass(cls + '-label-required', value);
				break;
			case 'type':
				self.type = config.type;
				break;
			case 'label':
				self.find(cls2 + '-label').html(value);
				break;
			case 'datasource':
				if (value.indexOf(',') === -1)
					self.datasource(value, self.bind);
				else
					self.bind('', self.parsesource(value));
				break;
		}
	};

	self.make = function() {

		var element = self.find('script');
		if (!element.length)
			return;

		var html = element.html();
		element.remove();
		html = html.replace('>', ' data-value="{{ {0} }}" data-disabled="{{ {1} }}">'.format(config.value || 'id', config.disabledkey || 'disabled'));
		template = Tangular.compile(html);
		recompile = html.COMPILABLE();

		config.label && self.html('<div class="' + cls + '-label{1}">{0}</div>'.format(config.label, config.required ? (' ' + cls + '-label-required') : ''));
		config.datasource && self.reconfigure('datasource:' + config.datasource);
		config.type && (self.type = config.type);
		config.disabled && self.aclass('ui-disabled');

		self.event('click', '[data-value]', function() {
			var el = $(this);
			if (config.disabled || +el.attrd('disabled'))
				return;
			var value = self.parser(el.attrd('value'));
			self.set(value);
			self.change(true);
		});
	};

	self.validate = function(value) {
		return (config.disabled || !config.required) ? true : !!value;
	};

	self.setter = function(value) {

		selected && selected.rclass('selected');

		if (value == null)
			return;

		var el = self.find('[data-value="' + value + '"]');
		if (el) {
			el.aclass('selected');
			selected = el;
		}
	};

	self.bind = function(path, arr) {

		if (!arr)
			arr = EMPTYARRAY;

		var builder = [];
		var disabledkey = config.disabledkey || 'disabled';

		for (var i = 0; i < arr.length; i++) {
			var item = arr[i];
			item[disabledkey] = +item[disabledkey] || 0;
			builder.push(template(item).replace(reg, function(text) {
				return text.substring(0, 2) === '$i' ? i.toString() : self.path + '[' + i + ']';
			}));
		}

		var render = builder.join('');
		self.find(cls2 + '-container').remove();
		self.append('<div class="{0}-container{1}">{2}</div>'.format(cls, config.class ? ' ' + config.class : '', render));
		self.refresh();
		recompile && self.compile();
	};

});

COMPONENT('input', 'maxlength:200;dirkey:name;dirvalue:id;increment:1;autovalue:name;direxclude:false;forcevalidation:1;searchalign:1;after:\\:', function(self, config, cls) {

	var cls2 = '.' + cls;
	var input, placeholder, dirsource, binded, customvalidator, mask, rawvalue, isdirvisible = false, nobindcamouflage = false, focused = false;

	self.nocompile();
	self.bindvisible(20);

	self.init = function() {
		Thelpers.ui_input_icon = function(val) {
			return val.charAt(0) === '!' || val.indexOf(' ') !== -1 ? ('<span class="ui-input-icon-custom"><i class="' + (val.charAt(0) === '!' ? val.substring(1) : val) + '"></i></span>') : ('<i class="fa fa-' + val + '"></i>');
		};
		W.ui_input_template = Tangular.compile(('{{ if label }}<div class="{0}-label">{{ if icon }}<i class="{{ icon }}"></i>{{ fi }}{{ label | raw }}{{ after | raw }}</div>{{ fi }}<div class="{0}-control{{ if licon }} {0}-licon{{ fi }}{{ if ricon || (type === \'number\' && increment) }} {0}-ricon{{ fi }}">{{ if ricon || (type === \'number\' && increment) }}<div class="{0}-icon-right{{ if type === \'number\' && increment && !ricon }} {0}-increment{{ else if riconclick || type === \'date\' || type === \'time\' || (type === \'search\' && searchalign === 1) || type === \'password\' }} {0}-click{{ fi }}">{{ if type === \'number\' && !ricon }}<i class="fa fa-caret-up"></i><i class="fa fa-caret-down"></i>{{ else }}{{ ricon | ui_input_icon }}{{ fi }}</div>{{ fi }}{{ if licon }}<div class="{0}-icon-left{{ if liconclick || (type === \'search\' && searchalign !== 1) }} {0}-click{{ fi }}">{{ licon | ui_input_icon }}</div>{{ fi }}<div class="{0}-input{{ if align === 1 || align === \'center\' }} center{{ else if align === 2 || align === \'right\' }} right{{ fi }}">{{ if placeholder && !innerlabel }}<div class="{0}-placeholder">{{ placeholder }}</div>{{ fi }}{{ if dirsource || type === \'icon\' || type === \'emoji\' || type === \'color\' }}<div class="{0}-value" tabindex="0"></div>{{ else }}<input type="{{ if type === \'password\' }}password{{ else }}text{{ fi }}"{{ if autofill }} autocomplete="on" name="{{ PATH }}"{{ else }} name="input' + Date.now() + '" autocomplete="new-password"{{ fi }} data-jc-bind=""{{ if maxlength > 0}} maxlength="{{ maxlength }}"{{ fi }}{{ if autofocus }} autofocus{{ fi }} />{{ fi }}</div></div>{{ if error }}<div class="{0}-error hidden"><i class="fa fa-warning"></i> {{ error }}</div>{{ fi }}').format(cls));
	};

	self.make = function() {

		if (!config.label)
			config.label = self.html();

		if (isMOBILE && config.autofocus)
			config.autofocus = false;

		config.PATH = self.path.replace(/\./g, '_');

		self.aclass(cls + ' invisible');
		self.rclass('invisible', 100);
		self.redraw();

		self.event('input change', function() {
			if (nobindcamouflage)
				nobindcamouflage = false;
			else
				self.check();
		});

		self.event('focus', 'input,' + cls2 + '-value', function() {

			if (config.disabled)
				return $(this).blur();

			focused = true;
			self.camouflage(false);
			self.aclass(cls + '-focused');
			config.autocomplete && EXEC(self.makepath(config.autocomplete), self, input.parent());
			if (config.autosource) {
				var opt = {};
				opt.element = self.element;
				opt.search = GET(self.makepath(config.autosource));
				opt.callback = function(value) {
					var val = typeof(value) === 'string' ? value : value[config.autovalue];
					if (config.autoexec) {
						EXEC(self.makepath(config.autoexec), value, function(val) {
							self.set(val, 2);
							self.change();
							self.bindvalue();
						});
					} else {
						self.set(val, 2);
						self.change();
						self.bindvalue();
					}
				};
				SETTER('autocomplete', 'show', opt);
			} else if (config.mask) {
				setTimeout(function(input) {
					input.selectionStart = input.selectionEnd = 0;
				}, 50, this);
			} else if (config.dirsource && (config.autofocus != false && config.autofocus != 0)) {
				if (!isdirvisible)
					self.find(cls2 + '-control').trigger('click');
			}
		});

		self.event('paste', 'input', function(e) {
			if (config.mask) {
				var val = (e.originalEvent.clipboardData || window.clipboardData).getData('text');
				self.set(val.replace(/\s|\t/g, ''));
				e.preventDefault();
			}
		});

		self.event('keydown', 'input', function(e) {

			var t = this;
			var code = e.which;

			if (t.readOnly || config.disabled) {
				// TAB
				if (e.keyCode !== 9) {
					if (config.dirsource) {
						self.find(cls2 + '-control').trigger('click');
						return;
					}
					e.preventDefault();
					e.stopPropagation();
				}
				return;
			}

			if (!config.disabled && config.dirsource && (code === 13 || code > 30)) {
				self.find(cls2 + '-control').trigger('click');
				return;
			}

			if (config.mask) {

				if (e.metaKey) {
					if (code === 8 || code === 127) {
						e.preventDefault();
						e.stopPropagation();
					}
					return;
				}

				if (code === 32) {
					e.preventDefault();
					e.stopPropagation();
					return;
				}

				var beg = e.target.selectionStart;
				var end = e.target.selectionEnd;
				var val = t.value;
				var c;

				if (code === 8 || code === 127) {

					if (beg === end) {
						c = config.mask.substring(beg - 1, beg);
						t.value = val.substring(0, beg - 1) + c + val.substring(beg);
						self.curpos(beg - 1);
					} else {
						for (var i = beg; i <= end; i++) {
							c = config.mask.substring(i - 1, i);
							val = val.substring(0, i - 1) + c + val.substring(i);
						}
						t.value = val;
						self.curpos(beg);
					}

					e.preventDefault();
					return;
				}

				if (code > 40) {

					var cur = String.fromCharCode(code);

					if (mask && mask[beg]) {
						if (!mask[beg].test(cur)) {
							e.preventDefault();
							return;
						}
					}

					c = config.mask.charCodeAt(beg);
					if (c !== 95) {
						beg++;
						while (true) {
							c = config.mask.charCodeAt(beg);
							if (c === 95 || isNaN(c))
								break;
							else
								beg++;
						}
					}

					if (c === 95) {

						val = val.substring(0, beg) + cur + val.substring(beg + 1);
						t.value = val;
						beg++;

						while (beg < config.mask.length) {
							c = config.mask.charCodeAt(beg);
							if (c === 95)
								break;
							else
								beg++;
						}

						self.curpos(beg);
					} else
						self.curpos(beg + 1);

					e.preventDefault();
					e.stopPropagation();
				}
			}

		});

		self.event('blur', 'input', function() {
			focused = false;
			self.camouflage(true);
			self.rclass(cls + '-focused');
		});

		self.event('click', cls2 + '-control', function() {

			if (config.disabled || isdirvisible)
				return;

			if (config.type === 'icon') {
				opt = {};
				opt.element = self.element;
				opt.value = self.get();
				opt.empty = true;
				opt.callback = function(val) {
					self.change(true);
					self.set(val);
					self.check();
					rawvalue.focus();
				};
				SETTER('faicons', 'show', opt);
				return;
			} else if (config.type === 'color') {
				opt = {};
				opt.element = self.element;
				opt.value = self.get();
				opt.empty = true;
				opt.callback = function(al) {
					self.change(true);
					self.set(al);
					self.check();
					rawvalue.focus();
				};
				SETTER('colorpicker', 'show', opt);
				return;
			} else if (config.type === 'emoji') {
				opt = {};
				opt.element = self.element;
				opt.value = self.get();
				opt.empty = true;
				opt.callback = function(al) {
					self.change(true);
					self.set(al);
					self.check();
					rawvalue.focus();
				};
				SETTER('emoji', 'show', opt);
				return;
			}

			if (!config.dirsource)
				return;

			isdirvisible = true;
			setTimeout(function() {
				isdirvisible = false;
			}, 500);

			var opt = {};
			opt.element = self.find(cls2 + '-control');
			opt.items = dirsource || GET(self.makepath(config.dirsource));
			opt.offsetY = -1 + (config.diroffsety || 0);
			opt.offsetX = 0 + (config.diroffsetx || 0);
			opt.placeholder = config.dirplaceholder;
			opt.render = config.dirrender ? GET(self.makepath(config.dirrender)) : null;
			opt.custom = !!config.dircustom;
			opt.offsetWidth = 2;
			opt.minwidth = config.dirminwidth || 200;
			opt.maxwidth = config.dirmaxwidth;
			opt.key = config.dirkey || config.key;
			opt.empty = config.dirempty;

			if (config.dirraw)
				opt.raw = true;

			if (config.dirsearch != null)
				opt.search = config.dirsearch;

			var val = self.get();
			opt.selected = val;

			if (dirsource && config.direxclude == false) {
				for (var i = 0; i < dirsource.length; i++) {
					var item = dirsource[i];
					if (item)
						item.selected = typeof(item) === 'object' && item[config.dirvalue] === val;
				}
			} else if (config.direxclude) {
				opt.exclude = function(item) {
					return item ? item[config.dirvalue] === val : false;
				};
			}

			opt.callback = function(item, el, custom) {

				// empty
				if (item == null) {
					rawvalue.html('');
					self.set(null, 2);
					self.change();
					self.check();
					return;
				}

				var val = custom || typeof(item) === 'string' ? item : item[config.dirvalue || config.value];
				if (custom && typeof(config.dircustom) === 'string') {
					var fn = GET(config.dircustom);
					fn(val, function(val) {
						self.set(val, 2);
						self.change();
						self.bindvalue();
					});
				} else if (custom) {
					if (val) {
						self.set(val, 2);
						self.change();
						if (dirsource)
							self.bindvalue();
						else
							input.val(val);
					}
				} else {
					self.set(val, 2);
					self.change();
					if (dirsource)
						self.bindvalue();
					else
						input.val(val);
				}

				rawvalue.focus();
			};

			SETTER('directory', 'show', opt);
		});

		self.event('click', cls2 + '-placeholder,' + cls2 + '-label', function(e) {
			if (!config.disabled) {
				if (config.dirsource) {
					e.preventDefault();
					e.stopPropagation();
					self.find(cls2 + '-control').trigger('click');
				} else if (!config.camouflage || $(e.target).hclass(cls + '-placeholder')) {
					if (input.length)
						input.focus();
					else
						rawvalue.focus();
				}
			}
		});

		self.event('click', cls2 + '-icon-left,' + cls2 + '-icon-right', function(e) {

			if (config.disabled)
				return;

			var el = $(this);
			var left = el.hclass(cls + '-icon-left');
			var opt;

			if (config.dirsource && left && config.liconclick) {
				e.preventDefault();
				e.stopPropagation();
			}

			if (!left && !config.riconclick) {
				if (config.type === 'date') {
					opt = {};
					opt.element = self.element;
					opt.value = self.get();
					opt.callback = function(val) {
						self.change(true);
						self.set(val);
						input.focus();
					};
					SETTER('datepicker', 'show', opt);
				} else if (config.type === 'time') {
					opt = {};
					opt.element = self.element;
					opt.value = self.get();
					opt.callback = function(val) {
						self.change(true);
						self.set(val);
						input.focus();
					};
					SETTER('timepicker', 'show', opt);
				} else if (config.type === 'search')
					self.set('');
				else if (config.type === 'password')
					self.password();
				else if (config.type === 'number') {
					var tmp = $(e.target);
					if (tmp.attr('class').indexOf('fa-') !== -1) {
						var n = tmp.hclass('fa-caret-up') ? 1 : -1;
						self.change(true);
						var val = self.preparevalue((self.get() || 0) + (config.increment * n));
						self.set(val, 2);
					}
				}
				return;
			}

			if (left && config.liconclick)
				EXEC(self.makepath(config.liconclick), self, el);
			else if (config.riconclick)
				EXEC(self.makepath(config.riconclick), self, el);
			else if (left && config.type === 'search')
				self.set('');

		});
	};

	self.camouflage = function(is) {
		if (config.camouflage) {
			if (is) {
				var t = input[0];
				var arr = t.value.split('');
				for (var i = 0; i < arr.length; i++)
					arr[i] = typeof(config.camouflage) === 'string' ? config.camouflage : '*';
				nobindcamouflage = true;
				t.value = arr.join('');
			} else {
				nobindcamouflage = true;
				var val = self.get();
				input[0].value = val == null ? '' : val;
			}
			self.tclass(cls + '-camouflaged', is);
		}
	};

	self.curpos = function(pos) {
		var el = input[0];
		if (el.createTextRange) {
			var range = el.createTextRange();
			range.move('character', pos);
			range.select();
		} else if (el.selectionStart) {
			el.focus();
			el.setSelectionRange(pos, pos);
		}
	};

	self.validate = function(value) {

		if ((!config.required || config.disabled) && !self.forcedvalidation())
			return true;

		if (config.dirsource)
			return !!value;

		if (customvalidator)
			return customvalidator(value);

		if (self.type === 'date')
			return value instanceof Date && !isNaN(value.getTime());

		if (value == null)
			value = '';
		else
			value = value.toString();

		if (config.mask && typeof(value) === 'string' && value.indexOf('_') !== -1)
			return false;

		if (config.minlength && value.length < config.minlength)
			return false;

		switch (self.type) {
			case 'email':
				return value.isEmail();
			case 'phone':
				return value.isPhone();
			case 'url':
				return value.isURL();
			case 'zip':
				return (/^\d{5}(?:[-\s]\d{4})?$/).test(value);
			case 'currency':
			case 'number':
				value = value.parseFloat();
				if ((config.minvalue != null && value < config.minvalue) || (config.maxvalue != null && value > config.maxvalue))
					return false;
				return config.minvalue == null ? value > 0 : true;
		}

		return value.length > 0;
	};

	self.offset = function() {
		var offset = self.element.offset();
		var control = self.find(cls2 + '-control');
		var width = control.width() + 2;
		return { left: offset.left, top: control.offset().top + control.height(), width: width };
	};

	self.password = function(show) {
		var visible = show == null ? input.attr('type') === 'text' : show;
		input.attr('type', visible ? 'password' : 'text');
		self.find(cls2 + '-icon-right').find('i').tclass(config.ricon, visible).tclass('fa-eye-slash', !visible);
	};

	self.preparevalue = function(value) {

		if (self.type === 'number' && (config.minvalue != null || config.maxvalue != null)) {
			var tmp = typeof(value) === 'string' ? +value.replace(',', '.') : value;
			if (config.minvalue > tmp)
				value = config.minvalue;
			if (config.maxvalue < tmp)
				value = config.maxvalue;
		}

		return value;
	};

	self.getterin = self.getter;
	self.getter = function(value, realtime, nobind) {

		if (nobindcamouflage)
			return;

		if (config.mask && config.masktidy) {
			var val = [];
			for (var i = 0; i < value.length; i++) {
				if (config.mask.charAt(i) === '_')
					val.push(value.charAt(i));
			}
			value = val.join('');
		}

		self.getterin(self.preparevalue(value), realtime, nobind);
	};

	self.setterin = self.setter;

	self.setter = function(value, path, type) {

		if (config.mask) {
			if (value) {
				if (config.masktidy) {
					var index = 0;
					var val = [];
					for (var i = 0; i < config.mask.length; i++) {
						var c = config.mask.charAt(i);
						val.push(c === '_' ? (value.charAt(index++) || '_') : c);
					}
					value = val.join('');
				}

				// check values
				if (mask) {
					var arr = [];
					for (var i = 0; i < mask.length; i++) {
						var c = value.charAt(i);
						if (mask[i] && mask[i].test(c))
							arr.push(c);
						else
							arr.push(config.mask.charAt(i));
					}
					value = arr.join('');
				}
			} else
				value = config.mask;
		}

		self.setterin(value, path, type);
		self.bindvalue();

		config.camouflage && !focused && setTimeout(self.camouflage, type === 1 ? 1000 : 1, true);

		if (config.type === 'password')
			self.password(true);
	};

	self.check = function() {

		var is = input.length ? !!input[0].value : !!self.get();

		if (binded === is)
			return;

		binded = is;
		placeholder && placeholder.tclass('hidden', is);
		self.tclass(cls + '-binded', is);

		if (config.type === 'search')
			self.find(cls2 + '-icon-' + (config.searchalign === 1 ? 'right' : 'left')).find('i').tclass(config.searchalign === 1 ? config.ricon : config.licon, !is).tclass('fa-times', is);
	};

	self.bindvalue = function() {

		var value = self.get();

		if (dirsource) {

			var item;

			for (var i = 0; i < dirsource.length; i++) {
				item = dirsource[i];
				if (typeof(item) === 'string') {
					if (item === value)
						break;
					item = null;
				} else if (item[config.dirvalue || config.value] === value) {
					item = item[config.dirkey || config.key];
					break;
				} else
					item = null;
			}

			if (value && item == null && config.dircustom)
				item = value;

			if (config.dirraw)
				rawvalue.html(item || '');
			else
				rawvalue.text(item || '');

		} else if (config.dirsource)
			if (config.dirraw)
				rawvalue.html(value || '');
			else
				rawvalue.text(value || '');
		else {
			switch (config.type) {
				case 'color':
					rawvalue.css('background-color', value || '');
					break;
				case 'icon':
					rawvalue.html('<i class="{0}"></i>'.format(value || ''));
					break;
				case 'emoji':
					rawvalue.html(value);
					break;
			}
		}

		self.check();
	};

	self.redraw = function() {

		if (!config.ricon) {
			if (config.dirsource)
				config.ricon = 'angle-down';
			else if (config.type === 'date') {
				config.ricon = 'calendar';
				if (!config.align && !config.innerlabel)
					config.align = 1;
			} else if (config.type === 'icon' || config.type === 'color' || config.type === 'emoji') {
				config.ricon = 'angle-down';
				if (!config.align && !config.innerlabel)
					config.align = 1;
			} else if (config.type === 'time') {
				config.ricon = 'clock-o';
				if (!config.align && !config.innerlabel)
					config.align = 1;
			} else if (config.type === 'search')
				if (config.searchalign === 1)
					config.ricon = 'search';
				else
					config.licon = 'search';
			else if (config.type === 'password')
				config.ricon = 'eye';
			else if (config.type === 'number') {
				if (!config.align && !config.innerlabel)
					config.align = 1;
			}
		}

		self.tclass(cls + '-masked', !!config.mask);
		self.rclass2(cls + '-type-');

		if (config.type)
			self.aclass(cls + '-type-' + config.type);

		self.html(W.ui_input_template(config));
		input = self.find('input');
		rawvalue = self.find(cls2 + '-value');
		placeholder = self.find(cls2 + '-placeholder');
	};

	self.configure = function(key, value) {
		switch (key) {
			case 'icon':
				if (value && value.indexOf(' ') === -1)
					config.icon = 'fa fa-' + value;
				break;
			case 'dirsource':
				if (config.dirajax || value.indexOf('/') !== -1) {
					dirsource = null;
					self.bindvalue();
				} else {
					if (value.indexOf(',') !== -1) {
						dirsource = self.parsesource(value);
						self.bindvalue();
					} else {
						self.datasource(value, function(path, value) {
							dirsource = value;
							self.bindvalue();
						});
					}
				}
				self.tclass(cls + '-dropdown', !!value);
				input.prop('readonly', !!config.disabled || !!config.dirsource);
				break;
			case 'disabled':
				self.tclass('ui-disabled', !!value);
				input.prop('readonly', !!value || !!config.dirsource);
				self.reset();
				break;
			case 'required':
				self.tclass(cls + '-required', !!value);
				self.reset();
				break;
			case 'type':
				self.type = value;
				break;
			case 'validate':
				customvalidator = value ? (/\(|=|>|<|\+|-|\)/).test(value) ? FN('value=>' + value) : (function(path) { path = self.makepath(path); return function(value) { return GET(path)(value); }; })(value) : null;
				break;
			case 'innerlabel':
				self.tclass(cls + '-inner', !!value);
				break;
			case 'monospace':
				self.tclass(cls + '-monospace', !!value);
				break;
			case 'maskregexp':
				if (value) {
					mask = value.toLowerCase().split(',');
					for (var i = 0; i < mask.length; i++) {
						var m = mask[i];
						if (!m || m === 'null')
							mask[i] = '';
						else
							mask[i] = new RegExp(m);
					}
				} else
					mask = null;
				break;
			case 'mask':
				config.mask = value.replace(/#/g, '_');
				break;
		}
	};

	self.formatter(function(path, value) {
		if (value) {
			switch (config.type) {
				case 'lower':
					return (value + '').toLowerCase();
				case 'upper':
					return (value + '').toUpperCase();
				case 'phone':
					return (value + '').replace(/\s/g, '');
				case 'email':
					return (value + '').toLowerCase();
				case 'date':
					return value.format(config.format || 'yyyy-MM-dd');
				case 'time':
					return value.format(config.format || 'HH:mm');
				case 'number':
					return config.format ? value.format(config.format) : value;
			}
		}

		return value;
	});

	self.parser(function(path, value) {
		if (value) {
			var tmp;
			switch (config.type) {
				case 'date':
					tmp = self.get();
					if (tmp)
						tmp = tmp.format('HH:mm');
					else
						tmp = '';
					return value + (tmp ? (' ' + tmp) : '');
				case 'lower':
				case 'email':
					value = value.toLowerCase();
					break;
				case 'upper':
					value = value.toUpperCase();
					break;
				case 'phone':
					value = value.replace(/\s/g, '');
					break;
				case 'time':
					tmp = value.split(':');
					var dt = self.get();
					if (dt == null)
						dt = new Date();
					dt.setHours(+(tmp[0] || '0'));
					dt.setMinutes(+(tmp[1] || '0'));
					dt.setSeconds(+(tmp[2] || '0'));
					value = dt;
					break;
			}
		}
		return value ? config.spaces === false ? value.replace(/\s/g, '') : value : value;
	});

	self.state = function(type) {
		if (type) {
			var invalid = config.required ? self.isInvalid() : self.forcedvalidation() ? self.isInvalid() : false;
			if (invalid === self.$oldstate)
				return;
			self.$oldstate = invalid;
			self.tclass(cls + '-invalid', invalid);
			config.error && self.find(cls2 + '-error').tclass('hidden', !invalid);
		}
	};

	self.forcedvalidation = function() {

		if (!config.forcevalidation)
			return false;

		if (self.type === 'number')
			return false;

		var val = self.get();
		return (self.type === 'phone' || self.type === 'email') && (val != null && (typeof(val) === 'string' && val.length !== 0));
	};

});

COMPONENT('largeform', 'zindex:12;padding:30;scrollbar:1;scrolltop:1;style:1', function(self, config, cls) {

	var cls2 = '.' + cls;
	var csspos = {};
	var nav = false;
	var init = false;

	if (!W.$$largeform) {

		W.$$largeform_level = W.$$largeform_level || 1;
		W.$$largeform = true;

		$(document).on('click', cls2 + '-button-close', function() {
			SET($(this).attrd('path'), '');
		});

		var resize = function() {
			setTimeout2(self.name, function() {
				for (var i = 0; i < M.components.length; i++) {
					var com = M.components[i];
					if (com.name === 'largeform' && !HIDDEN(com.dom) && com.$ready && !com.$removed)
						com.resize();
				}
			}, 200);
		};

		ON('resize2', resize);

		$(document).on('click', cls2 + '-container', function(e) {

			if (e.target === this) {
				var com = $(this).component();
				if (com && com.config.closeoutside) {
					com.set('');
					return;
				}
			}

			var el = $(e.target);
			if (el.hclass(cls + '-container') && !el.hclass(cls + '-style-2')) {
				var form = el.find(cls2);
				var c = cls + '-animate-click';
				form.aclass(c);
				setTimeout(function() {
					form.rclass(c);
				}, 300);
			}
		});
	}

	self.readonly();
	self.submit = function() {
		if (config.submit)
			self.EXEC(config.submit, self.hide, self.element);
		else
			self.hide();
	};

	self.cancel = function() {
		config.cancel && self.EXEC(config.cancel, self.hide);
		self.hide();
	};

	self.hide = function() {
		if (config.independent)
			self.hideforce();
		self.esc(false);
		self.set('');
	};

	self.icon = function(value) {
		var el = this.rclass2('fa');
		value.icon && el.aclass(value.icon.indexOf(' ') === -1 ? ('fa fa-' + value.icon) : value.icon);
	};

	self.resize = function() {

		if (self.hclass('hidden'))
			return;

		var padding = isMOBILE ? 0 : config.padding;
		var ui = self.find(cls2);

		csspos.height = WH - (config.style == 1 ? (padding * 2) : padding);
		csspos.top = padding;
		ui.css(csspos);

		var el = self.find(cls2 + '-title');
		var th = el.height();
		csspos = { height: csspos.height - th, width: ui.width() };

		if (nav)
			csspos.height -= nav.height();

		self.find(cls2 + '-body').css(csspos);
		self.scrollbar && self.scrollbar.resize();
		self.element.SETTER('*', 'resize');
	};

	self.make = function() {

		$(document.body).append('<div id="{0}" class="hidden {4}-container invisible"><div class="{4}" style="max-width:{1}px"><div data-bind="@config__text span:value.title__change .{4}-icon:@icon" class="{4}-title"><button name="cancel" class="{4}-button-close{3}" data-path="{2}"><i class="fa fa-times"></i></button><i class="{4}-icon"></i><span></span></div><div class="{4}-body"></div></div>'.format(self.ID, config.width || 800, self.path, config.closebutton == false ? ' hidden' : '', cls));

		var scr = self.find('> script');
		self.template = scr.length ? scr.html().trim() : '';
		scr.length && scr.remove();

		var el = $('#' + self.ID);
		var body = el.find(cls2 + '-body')[0];

		while (self.dom.children.length) {
			var child = self.dom.children[0];
			if (child.tagName === 'NAV') {
				nav = $(child);
				body.parentNode.appendChild(child);
			} else
				body.appendChild(child);
		}

		self.rclass('hidden invisible');
		self.replace(el, true);

		if (config.scrollbar)
			self.scrollbar = SCROLLBAR(self.find(cls2 + '-body'), { visibleY: config.visibleY, orientation: 'y' });

		if (config.style === 2)
			self.aclass(cls + '-style-2');

		self.event('scroll', function() {
			EMIT('scroll', self.name);
			EMIT('reflow', self.name);
		});

		self.event('click', 'button[name]', function() {
			var t = this;
			switch (t.name) {
				case 'submit':
					self.submit(self.hide);
					break;
				case 'cancel':
					!t.disabled && self[t.name](self.hide);
					break;
			}
		});

		config.enter && self.event('keydown', 'input', function(e) {
			e.which === 13 && !self.find('button[name="submit"]')[0].disabled && setTimeout(self.submit, 800);
		});
	};

	self.configure = function(key, value, init, prev) {
		if (!init) {
			switch (key) {
				case 'width':
					value !== prev && self.find(cls2).css('max-width', value + 'px');
					break;
				case 'closebutton':
					self.find(cls2 + '-button-close').tclass('hidden', value !== true);
					break;
			}
		}
	};

	self.esc = function(bind) {
		if (bind) {
			if (!self.$esc) {
				self.$esc = true;
				$(W).on('keydown', self.esc_keydown);
			}
		} else {
			if (self.$esc) {
				self.$esc = false;
				$(W).off('keydown', self.esc_keydown);
			}
		}
	};

	self.esc_keydown = function(e) {
		if (e.which === 27 && !e.isPropagationStopped()) {
			var val = self.get();
			if (!val || config.if === val) {
				e.preventDefault();
				e.stopPropagation();
				self.hide();
			}
		}
	};

	self.hideforce = function() {
		if (!self.hclass('hidden')) {
			self.aclass('hidden');
			self.release(true);
			self.find(cls2).rclass(cls + '-animate');
			W.$$largeform_level--;
		}
	};

	var allowscrollbars = function() {
		$('html').tclass(cls + '-noscroll', !!$(cls2 + '-container').not('.hidden').length);
	};

	self.setter = function(value) {

		setTimeout2(self.name + '-noscroll', allowscrollbars, 50);

		var isHidden = value !== config.if;

		if (self.hclass('hidden') === isHidden) {
			if (!isHidden) {
				config.reload && self.EXEC(config.reload, self);
				config.default && DEFAULT(self.makepath(config.default), true);
				config.scrolltop && self.scrollbar && self.scrollbar.scrollTop(0);
			}
			return;
		}

		setTimeout2(cls, function() {
			EMIT('reflow', self.name);
		}, 10);

		if (isHidden) {
			if (!config.independent)
				self.hideforce();
			return;
		}

		if (self.template) {
			var is = self.template.COMPILABLE();
			self.find(cls2).append(self.template);
			self.template = null;
			is && COMPILE();
		}

		if (W.$$largeform_level < 1)
			W.$$largeform_level = 1;

		W.$$largeform_level++;

		self.css('z-index', W.$$largeform_level * config.zindex);
		self.rclass('hidden');

		self.release(false);
		config.scrolltop && self.scrollbar && self.scrollbar.scrollTop(0);

		config.reload && self.EXEC(config.reload, self);
		config.default && DEFAULT(self.makepath(config.default), true);

		if (!isMOBILE && config.autofocus) {
			setTimeout(function() {
				self.find(typeof(config.autofocus) === 'string' ? config.autofocus : 'input[type="text"],select,textarea').eq(0).focus();
			}, 1000);
		}

		self.resize();

		setTimeout(function() {
			self.rclass('invisible');
			self.find(cls2).aclass(cls + '-animate');
			if (!init && isMOBILE) {
				$('body').aclass('hidden');
				setTimeout(function() {
					$('body').rclass('hidden');
				}, 50);
			}
			init = true;
		}, 300);

		// Fixes a problem with freezing of scrolling in Chrome
		setTimeout2(self.ID, function() {
			self.css('z-index', (W.$$largeform_level * config.zindex) + 1);
		}, 500);

		config.closeesc && self.esc(true);
	};
});

COMPONENT('colorpicker', function(self) {

	var cls = 'ui-colorpicker';
	var cls2 = '.' + cls;
	var is = false;
	var events = {};
	var colors = [['E73323', 'EC8632', 'FFFD54', '68B25B', '7CFBFD', '4285F4', 'E73CF7', '73197B', '91683C', 'FFFFFF', '808080', '000000'],['FFFFFF', 'E8E8E8', 'D1D1D1', 'B9B9B9', 'A2A2A2', '8B8B8B', '747474', '5D5D5D', '464646', '2E2E2E', '171717', '000000'],['5C0E07', '5E350F', '66651C', '41641A', '2D6419', '2D6438', '2D6465', '133363', '000662', '2D0962', '5C1262', '5C0F32', '8A1A11', '8E501B', '99982F', '62962B', '47962A', '479654', '479798', '214D94', '010E93', '451393', '8A2094', '8A1C4C', 'B9261A', 'BD6B27', 'CCCB41', '83C83C', '61C83B', '61C871', '62C9CA', '2E67C5', '0216C4', '5C1DC4', 'B92EC5', 'B92865', 'E73323', 'EC8632', 'FFFD54', 'A4FB4E', '7BFA4C', '7BFA8D', '7CFBFD', '3B80F7', '041EF5', '7327F5', 'E73CF7', 'E7357F', 'E8483F', 'EF9D4B', 'FFFE61', 'B4FB5C', '83FA5A', '83FAA2', '83FBFD', '5599F8', '343CF5', '8C42F6', 'E84FF7', 'E84A97', 'EA706B', 'F2B573', 'FFFE7E', 'C5FC7C', '96FA7A', '96FBB9', '96FCFD', '7BB2F9', '666AF6', 'A76EF7', 'EB73F8', 'EA71B0', 'F6CECD', 'FAE6CF', 'FFFED1', 'EBFED1', 'D7FDD0', 'D7FDE7', 'D8FEFE', 'D1E5FD', 'CCCDFB', 'E1CEFB', 'F6CFFC', 'F6CEE4']];

	self.singleton();
	self.readonly();
	self.blind();
	self.nocompile();

	self.make = function() {

		var html = '';
		for (var i = 0; i < colors.length; i++) {
			html += '<div>';
			for (var j = 0; j < colors[i].length; j++) {
				html += '<span class="{0}-cell"><span style="background-color:#{1}"></span></span>'.format(cls, colors[i][j]);
			}
			html += '</div>';
		}

		self.html('<div class="{0}"><div class="{0}-body">{1}</div></div>'.format(cls, html));
		self.aclass(cls + '-container hidden');

		self.event('click', cls2 + '-cell', function() {
			var el = $(this);
			self.opt.callback && self.opt.callback(el.find('span').attr('style').replace('background-color:', ''));
			self.hide();
		});

		events.click = function(e) {
			var el = e.target;
			var parent = self.dom;
			do {
				if (el == parent)
					return;
				el = el.parentNode;
			} while (el);
			self.hide();
		};

		self.on('scroll + reflow + resize + resize2', self.hide);
	};

	self.bindevents = function() {
		if (!events.is) {
			events.is = true;
			$(document).on('click', events.click);
		}
	};

	self.unbindevents = function() {
		if (events.is) {
			events.is = false;
			$(document).off('click', events.click);
		}
	};

	self.show = function(opt) {

		var tmp = opt.element ? opt.element instanceof jQuery ? opt.element[0] : opt.element.element ? opt.element.dom : opt.element : null;

		if (is && tmp && self.target === tmp) {
			self.hide();
			return;
		}

		events.is && self.unbindevents();
		self.target = tmp;
		self.opt = opt;
		var css = {};

		if (is) {
			css.left = 0;
			css.top = 0;
			self.element.css(css);
		} else
			self.rclass('hidden');

		var target = $(opt.element);
		var w = self.element.width();
		var offset = target.offset();

		if (opt.element) {
			switch (opt.align) {
				case 'center':
					css.left = Math.ceil((offset.left - w / 2) + (target.innerWidth() / 2));
					break;
				case 'right':
					css.left = (offset.left - w) + target.innerWidth();
					break;
				default:
					css.left = offset.left;
					break;
			}

			css.top = opt.position === 'bottom' ? (offset.top - self.element.height() - 10) : (offset.top + target.innerHeight() + 10);

		} else {
			css.left = opt.x;
			css.top = opt.y;
		}

		if (opt.offsetX)
			css.left += opt.offsetX;

		if (opt.offsetY)
			css.top += opt.offsetY;

		is = true;
		self.element.css(css);
		setTimeout(self.bindevents, 10);
	};

	self.hide = function() {
		if (is) {
			is = false;
			self.target = null;
			self.opt = null;
			setTimeout(self.unbindevents, 50);
			self.aclass('hidden');
		}
	};
});

COMPONENT('clipboard', function(self) {

	var container;

	self.singleton();
	self.readonly();
	self.nocompile && self.nocompile();

	self.copy = function(value) {
		container.val(value);
		container.focus();
		container.select();
		document.execCommand('copy');
		container.blur();
	};

	self.make = function() {
		var id = 'clipboard' + self.id;
		$(document.body).append('<textarea id="{0}" class="ui-clipboard"></textarea>'.format(id));
		container = $('#' + id);
	};

	self.setter = function(value) {
		value && self.copy(value);
	};
});

COMPONENT('keyvalue', 'maxlength:100', function(self, config, cls) {

	var cls2 = '.' + cls;
	var container, content = null;
	var cempty = 'empty';
	var skip = false;
	var empty = {};

	self.nocompile && self.nocompile();
	self.template = Tangular.compile('<div class="{0}-item"><div class="{0}-item-remove"><i class="fa fa-times"></i></div><div class="{0}-item-key"><input type="text" name="key" maxlength="{{ max }}"{{ if disabled }} disabled="disabled"{{ fi }} placeholder="{{ placeholder_key }}" value="{{ key }}" autocomplete="new-password" /></div><div class="{0}-item-value"><input type="text" maxlength="{{ max }}" placeholder="{{ placeholder_value }}" value="{{ value }}" autocomplete="new-password" /></div></div>'.format(cls));

	self.binder = function(fn) {
		self.binder2 = fn;
	};

	self.binder2 = function(type, value) {
		return value;
	};

	self.configure = function(key, value, init, prev) {

		if (init)
			return;

		var redraw = false;

		switch (key) {
			case 'disabled':
				self.tclass('ui-disabled', value);
				self.find('input').prop('disabled', value);
				empty.disabled = value;
				break;
			case 'maxlength':
				self.find('input').prop('maxlength', value);
				break;
			case 'placeholderkey':
				self.find('input[name="key"]').prop('placeholder', value);
				break;
			case 'placeholdervalue':
				self.find('input[name="value"]').prop('placeholder', value);
				break;
			case 'icon':
				if (value && prev)
					self.find('i').rclass2('fa').aclass(value.indexOf(' ') === -1 ? ('fa fa-' + value) : value);
				else
					redraw = true;
				break;

			case 'label':
				redraw = true;
				break;
		}

		if (redraw) {
			self.redraw();
			self.refresh();
		}
	};

	self.redraw = function() {

		var icon = config.icon;
		var label = config.label || content;

		if (icon) {
			if (icon.indexOf(' ') === -1)
				icon = 'fa fa-' + icon;
			icon = '<i class="{0}"></i>'.format(icon);
		}

		empty.value = '';

		self.html((label ? '<div class="' + cls + '-label">{1}{0}:</div>'.format(label, icon) : '') + '<div class="' + cls + '-items"></div>' + self.template(empty).replace('-item"', '-item ' + cls + '-base"'));
		container = self.find(cls2 + '-items');
	};

	self.make = function() {

		empty.max = config.maxlength;
		empty.placeholder_key = config.placeholderkey;
		empty.placeholder_value = config.placeholdervalue;
		empty.value = '';
		empty.disabled = config.disabled;

		content = self.html();

		self.aclass(cls);
		self.disabled && self.aclass('ui-disabled');
		self.redraw();

		self.event('click', '.fa-times', function() {

			if (config.disabled)
				return;

			var el = $(this);
			var parent = el.closest(cls2 + '-item');
			var inputs = parent.find('input');
			var obj = self.get();
			!obj && (obj = {});
			var key = inputs[0].value;
			parent.remove();
			delete obj[key];

			SET(self.path, obj, 2);
			self.change(true);
		});

		self.event('focus', 'input', function() {
			config.autocomplete && self.EXEC(config.autocomplete, $(this), self);
		});

		self.event('change keypress', 'input', function(e) {

			if (config.disabled || (e.type !== 'change' && e.which !== 13))
				return;

			var el = $(this);
			var inputs = el.closest(cls2 + '-item').find('input');
			var key = self.binder2('key', inputs[0].value);
			var value = self.binder2('value', inputs.get(1).value);

			if (!key || !value)
				return;

			var base = el.closest(cls2 + '-base').length > 0;
			if (base && e.type === 'change')
				return;

			if (base) {
				var tmp = self.get();
				!tmp && (tmp = {});
				tmp[key] = value;
				self.set(tmp);
				self.change(true);
				inputs.val('');
				inputs.eq(0).focus();
				return;
			}

			var keyvalue = {};
			var k;

			container.find('input').each(function() {
				if (this.name === 'key') {
					k = this.value.trim();
				} else if (k) {
					keyvalue[k] = this.value.trim();
					k = '';
				}
			});

			skip = true;
			SET(self.path, keyvalue, 2);
			self.change(true);
		});
	};

	self.setter = function(value) {

		if (skip) {
			skip = false;
			return;
		}

		if (!value) {
			container.empty();
			self.aclass(cempty);
			return;
		}

		var builder = [];

		Object.keys(value).forEach(function(key) {
			empty.key = key;
			empty.value = value[key];
			builder.push(self.template(empty));
		});

		self.tclass(cempty, builder.length === 0);
		container.empty().append(builder.join(''));
	};
});

COMPONENT('menu', function(self, config, cls) {

	self.singleton();
	self.readonly();
	self.nocompile && self.nocompile();

	var cls2 = '.' + cls;

	var is = false;
	var issubmenu = false;
	var isopen = false;
	var events = {};
	var ul, children, prevsub, parentclass;

	self.make = function() {
		self.aclass(cls + ' hidden ' + cls + '-style-' + (config.style || 1));
		self.append('<div class="{0}-items"><ul></ul></div><div class="{0}-submenu hidden"><ul></ul></div>'.format(cls));
		ul = self.find(cls2 + '-items').find('ul');
		children = self.find(cls2 + '-submenu');

		self.event('click', 'li', function(e) {

			clearTimeout2(self.ID);

			var el = $(this);
			if (!el.hclass(cls + '-divider') && !el.hclass(cls + '-disabled')) {
				self.opt.scope && M.scope(self.opt.scope);
				var index = el.attrd('index').split('-');
				if (index.length > 1) {
					// submenu
					self.opt.callback(self.opt.items[+index[0]].children[+index[1]]);
					self.hide();
				} else if (!issubmenu) {
					self.opt.callback(self.opt.items[+index[0]]);
					self.hide();
				}
			}

			e.preventDefault();
			e.stopPropagation();
		});

		events.hide = function() {
			is && self.hide();
		};

		self.event('scroll', events.hide);
		self.on('reflow + scroll + resize + resize2', events.hide);

		events.click = function(e) {
			if (is && !isopen && (!self.target || (self.target !== e.target && !self.target.contains(e.target))))
				setTimeout2(self.ID, self.hide, isMOBILE ? 700 : 300);
		};

		events.hidechildren = function() {
			if ($(this.parentNode.parentNode).hclass(cls + '-items')) {
				if (prevsub && prevsub[0] !== this) {
					prevsub.rclass(cls + '-selected');
					prevsub = null;
					children.aclass('hidden');
					issubmenu = false;
				}
			}
		};

		events.children = function() {

			if (prevsub && prevsub[0] !== this) {
				prevsub.rclass(cls + '-selected');
				prevsub = null;
			}

			issubmenu = true;
			isopen = true;

			setTimeout(function() {
				isopen = false;
			}, 500);

			var el = prevsub = $(this);
			var index = +el.attrd('index');
			var item = self.opt.items[index];

			el.aclass(cls + '-selected');

			var html = self.makehtml(item.children, index);
			children.find('ul').html(html);
			children.rclass('hidden');

			var css = {};
			var offset = el.position();

			css.left = ul.width() - 5;
			css.top = offset.top - 5;

			var offsetX = offset.left;

			offset = self.element.offset();

			var w = children.width();
			var left = offset.left + css.left + w;
			if (left > WW + 30)
				css.left = (offsetX - w) + 5;

			children.css(css);
		};
	};

	self.bindevents = function() {
		events.is = true;
		$(document).on('touchstart mouseenter mousedown', cls2 + '-children', events.children).on('touchstart mousedown', events.click);
		$(W).on('scroll', events.hide);
		self.element.on('mouseenter', 'li', events.hidechildren);
	};

	self.unbindevents = function() {
		events.is = false;
		$(document).off('touchstart mouseenter mousedown', cls2 + '-children', events.children).off('touchstart mousedown', events.click);
		$(W).off('scroll', events.hide);
		self.element.off('mouseenter', 'li', events.hidechildren);
	};

	self.showxy = function(x, y, items, callback) {
		var opt = {};
		opt.x = x;
		opt.y = y;
		opt.items = items;
		opt.callback = callback;
		self.show(opt);
	};

	self.makehtml = function(items, index) {
		var builder = [];
		var tmp;

		for (var i = 0; i < items.length; i++) {
			var item = items[i];

			if (typeof(item) === 'string') {
				// caption or divider
				if (item === '-')
					tmp = '<hr />';
				else
					tmp = '<span>{0}</span>'.format(item);
				builder.push('<li class="{0}-divider">{1}</li>'.format(cls, tmp));
				continue;
			}

			var cn = item.classname || '';
			var icon = '';

			if (item.icon)
				icon = '<i class="{0}"></i>'.format(item.icon.charAt(0) === '!' ? item.icon.substring(1) : item.icon.indexOf('fa-') === -1 ? ('fa fa-' + item.icon) : item.icon);
			else
				cn = (cn ? (cn + ' ') : '') + cls + '-nofa';

			tmp = '';

			if (index == null && item.children && item.children.length) {
				cn += (cn ? ' ' : '') + cls + '-children';
				tmp += '<i class="fa fa-play pull-right"></i>';
			}

			if (item.selected)
				cn += (cn ? ' ' : '') + cls + '-selected';

			if (item.disabled)
				cn += (cn ? ' ' : '') + cls + '-disabled';

			tmp += '<div class="{0}-name">{1}{2}{3}</div>'.format(cls, icon, item.name, item.shortcut ? '<b>{0}</b>'.format(item.shortcut) : '');

			if (item.note)
				tmp += '<div class="ui-menu-note">{0}</div>'.format(item.note);

			builder.push('<li class="{0}" data-index="{2}">{1}</li>'.format(cn, tmp, (index != null ? (index + '-') : '') + i));
		}

		return builder.join('');
	};

	self.show = function(opt) {

		if (typeof(opt) === 'string') {
			// old version
			opt = { align: opt };
			opt.element = arguments[1];
			opt.items = arguments[2];
			opt.callback = arguments[3];
			opt.offsetX = arguments[4];
			opt.offsetY = arguments[5];
		}

		var tmp = opt.element ? opt.element instanceof jQuery ? opt.element[0] : opt.element.element ? opt.element.dom : opt.element : null;

		if (is && tmp && self.target === tmp) {
			self.hide();
			return;
		}

		var tmp;

		self.target = tmp;
		self.opt = opt;
		opt.scope = M.scope();

		if (parentclass && opt.classname !== parentclass) {
			self.rclass(parentclass);
			parentclass = null;
		}

		if (opt.large)
			self.aclass('ui-large');
		else
			self.rclass('ui-large');

		isopen = false;
		issubmenu = false;
		prevsub = null;

		var css = {};
		children.aclass('hidden');
		children.find('ul').empty();
		clearTimeout2(self.ID);

		ul.html(self.makehtml(opt.items));

		if (!parentclass && opt.classname) {
			self.aclass(opt.classname);
			parentclass = opt.classname;
		}

		if (is) {
			css.left = 0;
			css.top = 0;
			self.element.css(css);
		} else {
			self.rclass('hidden');
			self.aclass(cls + '-visible', 100);
			is = true;
			if (!events.is)
				self.bindevents();
		}

		var target = $(opt.element);
		var w = self.width();
		var offset = target.offset();

		if (opt.element) {
			switch (opt.align) {
				case 'center':
					css.left = Math.ceil((offset.left - w / 2) + (target.innerWidth() / 2));
					break;
				case 'right':
					css.left = (offset.left - w) + target.innerWidth();
					break;
				default:
					css.left = offset.left;
					break;
			}

			css.top = opt.position === 'bottom' ? (offset.top - self.element.height() - 10) : (offset.top + target.innerHeight() + 10);

		} else {
			css.left = opt.x;
			css.top = opt.y;
		}

		if (opt.offsetX)
			css.left += opt.offsetX;

		if (opt.offsetY)
			css.top += opt.offsetY;

		var mw = w;
		var mh = self.height();

		if (css.left < 0)
			css.left = 10;
		else if ((mw + css.left) > WW)
			css.left = (WW - mw) - 10;

		if (css.top < 0)
			css.top = 10;
		else if ((mh + css.top) > WH)
			css.top = (WH - mh) - 10;

		self.element.css(css);
	};

	self.hide = function() {
		events.is && self.unbindevents();
		is = false;
		self.opt && self.opt.hide && self.opt.hide();
		self.target = null;
		self.opt = null;
		self.aclass('hidden');
		self.rclass(cls + '-visible');
	};

});

COMPONENT('animation', 'style:2;delay:200;init:1000;cleaner:1000;visible:0;offset:50', function(self, config, cls) {

	self.readonly();

	if (!config.if)
		self.blind();

	self.destroy = function() {
		self.visibleinterval && clearInterval(self.interval);
	};

	self.make = function() {
		if (config.visible) {
			self.visibleinterval = setInterval(function() {
				if (VISIBLE(self.dom, config.offset)) {
					self.visibleinterval = null;
					clearInterval(self.visibleinterval);
					self.animate();
				}
			}, 500);
		} else
			setTimeout2(self.ID, self.animate, config.init);

		config.datasource && self.datasource(config.datasource, function() {
			setTimeout2(self.ID, self.animate, config.init);
		});
	};

	self.restore = function() {
		self.find('.animated').aclass('animation').rclass('animated');
	};

	self.animate = function() {

		var el = self.find('.animation');
		var arr = [];

		for (var i = 0; i < el.length; i++) {

			var t = el[i];

			if (!t.$anim) {
				var $t = $(t);

				if (!t.$animopt) {
					var opt = ($t.attrd('animation') || '').parseConfig();
					t.$animopt = opt;
				}

				t.$anim = cls + '-' + (t.$animopt.style || config.style);
				$t.aclass(t.$anim + '-init animating');
				arr.push($t);
			}
		}

		if (!arr.length)
			return;

		setTimeout(function(arr) {

			if (self.removed)
				return;

			var maxdelay = 500;

			if (config.together) {

				for (var i = 0; i < arr.length; i++) {
					var el = arr[i];
					var c = el[0].$anim;
					var opt = el[0].$animopt;
					if (!self.removed) {
						if (opt.noanimation)
							el.rclass('animation ' + c + '-init');
						else
							el.rclass('animation').aclass(c + '-run');
					}
				}

				setTimeout(function() {
					if (!self.removed) {
						for (var i = 0; i < arr.length; i++) {
							var c = arr[i][0].$anim;
							arr[i].rclass(c + '-init ' + c + '-run animating').aclass('animated');
							delete arr[i][0].$anim;
						}
						config.exec && self.EXEC(config.exec, self.element);
					}
				}, 1500);

				return;
			}

			arr.wait(function(el, next, index) {

				var opt = el[0].$animopt;
				var delay = (opt.order || index) * (opt.delay || config.delay);
				var clsname = cls + '-' + (opt.style || config.style);

				if (maxdelay < delay)
					maxdelay = delay;

				if (el.hclass('hidden') || el.hclass('invisible')) {
					el.rclass('animation ' + clsname + '-init').aclass('animated');
					next();
					return;
				}

				el[0].$animtime = setTimeout(function(el) {
					if (!self.removed) {
						if (opt.noanimation)
							el.rclass('animation ' + clsname + '-init');
						else
							el.rclass('animation').aclass(clsname + '-run');
					}
				}, delay, el);

				next();

			}, function() {

				setTimeout(function() {
					for (var i = 0; i < arr.length; i++) {
						var c = arr[i][0].$anim;
						arr[i].rclass(c + '-init ' + c + '-run animating').aclass('animated');
						delete arr[i][0].$anim;
					}
					config.exec && self.EXEC(config.exec, self.element);
				}, maxdelay + 1000);
			});

		}, config.init / 10 >> 0, arr);
	};

	self.setter = function(value) {
		if (config.if) {
			if (value === config.if)
				setTimeout2(self.ID, self.animate, config.init);
			else
				self.restore();
		}
	};

});

COMPONENT('textarea', 'scrollbar:true', function(self, config, cls) {

	var cls2 = '.' + cls;
	var input, placeholder, content = null;

	self.nocompile && self.nocompile();

	self.validate = function(value) {
		if (config.disabled || !config.required || config.readonly)
			return true;
		if (value == null)
			value = '';
		else
			value = value.toString();
		return value.length > 0;
	};

	self.configure = function(key, value, init) {
		if (init)
			return;

		var redraw = false;

		switch (key) {
			case 'readonly':
				self.find('textarea').prop('readonly', value);
				break;
			case 'disabled':
				self.tclass('ui-disabled', value);
				self.find('textarea').prop('disabled', value);
				self.reset();
				break;
			case 'required':
				self.noValid(!value);
				!value && self.state(1, 1);
				self.tclass(cls + '-required', value);
				break;
			case 'placeholder':
				placeholder.html(value || '');
				break;
			case 'maxlength':
				input.prop('maxlength', value || 1000);
				break;
			case 'label':
				redraw = true;
				break;
			case 'autofocus':
				input.focus();
				break;
			case 'monospace':
				self.tclass(cls + '-monospace', value);
				break;
			case 'icon':
				redraw = true;
				break;
			case 'format':
				self.format = value;
				self.refresh();
				break;
			case 'height':
				self.find('textarea').css('height', (value > 0 ? value + 'px' : value));
				break;
		}

		redraw && setTimeout2('redraw' + self.id, function() {
			self.redraw();
			self.refresh();
		}, 100);
	};

	self.redraw = function() {

		var attrs = [];
		var builder = [];
		var placeholderelement = '';

		self.tclass('ui-disabled', !!config.disabled);
		self.tclass(cls + '-monospace', !!config.monospace);
		self.tclass(cls + '-required', !!config.required);

		config.placeholder && (placeholderelement = '<div class="{0}-placeholder">{1}</div>'.format(cls, config.placeholder));
		config.maxlength && attrs.attr('maxlength', config.maxlength);
		config.error && attrs.attr('error');
		attrs.attr('data-jc-bind', '');
		config.height && attrs.attr('style', 'height:{0}px'.format(config.height));
		config.autofocus === 'true' && attrs.attr('autofocus');
		config.disabled && attrs.attr('disabled');
		config.readonly && attrs.attr('readonly');
		builder.push('{1}<textarea {0}></textarea>'.format(attrs.join(' '), placeholderelement));

		var label = config.label || content;

		if (!label.length) {
			config.error && builder.push('<div class="{0}-helper"><i class="fa fa-warning" aria-hidden="true"></i> {1}</div>'.format(cls, config.error));
			self.aclass(cls + ' ' + cls + '-container');
			self.html(builder.join(''));
		} else {
			var html = builder.join('');
			builder = [];
			builder.push('<div class="' + cls + '-label">');
			config.icon && builder.push('<i class="fa fa-{0}"></i>'.format(config.icon));
			builder.push(label);
			builder.push(':</div><div class="{0}">{1}</div>'.format(cls, html));
			config.error && builder.push('<div class="{0}-helper"><i class="fa fa-warning" aria-hidden="true"></i> {1}</div>'.format(cls, config.error));
			self.html(builder.join(''));
			self.rclass(cls);
			self.aclass(cls + '-container');
		}

		input = self.find('textarea');
		placeholder = self.find(cls2 + '-placeholder');

		if (!config.scrollbar) {
			input.noscrollbar();
			input.css('padding-right', (SCROLLBARWIDTH() + 5) + 'px');
		}
	};

	self.make = function() {
		content = self.html();
		self.type = config.type;
		self.format = config.format;
		self.redraw();

		self.event('click', cls2 + '-placeholder', function() {
			if (!config.disabled) {
				placeholder.aclass('hidden');
				input.focus();
			}
		});

		self.event('focus', 'textarea', function() {
			placeholder.aclass('hidden');
		});

		self.event('blur', 'textarea', function() {
			if (!self.get() && config.placeholder)
				placeholder.rclass('hidden');
		});
	};

	self.state = function(type) {
		if (!type)
			return;
		var invalid = config.required ? self.isInvalid() : false;
		if (invalid === self.$oldstate)
			return;
		self.$oldstate = invalid;
		self.tclass(cls + '-invalid', invalid);
		config.error && self.find( cls2 + '-helper').tclass(cls + '-helper-show', invalid);
	};

	self.setter2 = function(value) {

		if (!config.placeholder)
			return;

		if (value)
			placeholder.aclass('hidden');
		else
			placeholder.rclass('hidden');
	};
});

COMPONENT('dropdowncheckbox', 'checkicon:check;visible:0;alltext:All selected;limit:0;selectedtext:{0} selected', function(self, config, cls) {

	var cls2 = '.' + cls;
	var data = [], render = '';
	var container, values, content, datasource = null;
	var prepared = false;
	var W = window;

	!W.$dropdowncheckboxtemplate && (W.$dropdowncheckboxtemplate = Tangular.compile('<div class="' + cls + '-item" data-index="{{ index }}"><div><i class="fa fa-{{ $.checkicon }}"></i></div><span>{{ text }}</span></div>'));
	var template = W.$dropdowncheckboxtemplate;

	self.nocompile && self.nocompile();

	self.validate = function(value) {
		return config.disabled || !config.required ? true : value && value.length > 0;
	};

	self.configure = function(key, value, init) {

		if (init)
			return;

		var redraw = false;

		switch (key) {

			case 'type':
				self.type = value;
				break;

			case 'required':
				self.tclass(cls + '-required', config.required);
				break;

			case 'label':
				content = value;
				redraw = true;
				break;

			case 'disabled':
				self.tclass('ui-disabled', value);
				self.reset();
				break;

			case 'checkicon':
				self.find('i').rclass().aclass(value.indexOf(' ') === -1 ? ('fa fa-' + value) : value);
				break;

			case 'icon':
				redraw = true;
				break;

			case 'datasource':
				self.datasource(value, self.bind);
				datasource && self.refresh();
				datasource = value;
				break;

			case 'items':

				if (value instanceof Array) {
					self.bind('', value);
					return;
				}

				var items = [];
				value.split(',').forEach(function(item) {
					item = item.trim().split('|');
					var val = (item[1] == null ? item[0] : item[1]).trim();
					if (config.type === 'number')
						val = +val;
					items.push({ name: item[0].trim(), id: val });
				});

				self.bind('', items);
				self.refresh();
				break;
		}

		redraw && setTimeout2(self.id + '.redraw', self.redraw, 100);
	};

	self.redraw = function() {

		var html = '<div class="{0}"><i class="fa fa-angle-down"></i><div class="{0}-selected"></div></div><div class="{0}-values hidden">{1}</div>'.format(cls, render);
		if (content.length)
			self.html('<div class="{0}-label">{1}{2}:</div>'.format(cls, config.icon ? ('<i class="' + (config.icon.indexOf(' ') === -1 ? ('fa fa-' + config.icon) : config.icon) + '"></i>') : '', content) + html);
		else
			self.html(html);

		container = self.find(cls2 + '-values');
		values = self.find(cls2 + '-selected');
		prepared && self.refresh();
		self.tclass('ui-disabled', config.disabled === true);
		self.tclass(cls + '-required', config.required === true);
	};

	self.make = function() {

		self.type = config.type;

		content = self.html();
		self.aclass(cls + '-container');
		self.redraw();

		if (config.items)
			self.reconfigure({ items: config.items });
		else if (config.datasource)
			self.reconfigure({ datasource: config.datasource });
		else
			self.bind('', null);

		self.event('click', cls2, function(e) {

			if (config.disabled)
				return;

			container.tclass('hidden');

			if (W.$dropdowncheckboxelement) {
				W.$dropdowncheckboxelement.aclass('hidden');
				W.$dropdowncheckboxelement = null;
			}

			!container.hclass('hidden') && (W.$dropdowncheckboxelement = container);
			e.stopPropagation();
		});

		self.event('click', cls2 + '-item', function(e) {

			e.stopPropagation();

			if (config.disabled)
				return;

			var el = $(this);
			var is = !el.hclass(cls + '-checked');
			var index = +el.attrd('index');
			var value = data[index];

			if (value === undefined)
				return;

			value = value.value;

			var arr = self.get();

			if (!(arr instanceof Array))
				arr = [];

			var index = arr.indexOf(value);

			if (is) {
				if (config.limit && arr.length === config.limit)
					return;
				index === -1 && arr.push(value);
			} else {
				index !== -1 && arr.splice(index, 1);
			}

			self.set(arr);
			self.change(true);
		});
	};

	self.bind = function(path, value) {
		var clsempty = cls + '-values-empty';

		if (value !== undefined)
			prepared = true;

		if (!value || !value.length) {
			var h = config.empty || '&nbsp;';
			if (h === self.old)
				return;
			container.aclass(clsempty).html(h);
			self.old = h;
			return;
		}

		var kv = config.value || 'id';
		var kt = config.text || 'name';

		render = '';
		data = [];

		for (var i = 0, length = value.length; i < length; i++) {
			var isString = typeof(value[i]) === 'string';
			var item = { value: isString ? value[i] : value[i][kv], text: isString ? value[i] : value[i][kt], index: i };
			render += template(item, config);
			data.push(item);
		}

		var h = HASH(render);
		if (h === self.old)
			return;

		self.old = h;

		if (render)
			container.rclass(clsempty).html(render);
		else
			container.aclass(clsempty).html(config.empty);

		self.refresh();
	};

	self.setter = function(value) {

		if (!prepared)
			return;

		var label = '';
		var count = value == null || !value.length ? undefined : value.length;

		if (value && count) {
			var remove = [];
			for (var i = 0; i < count; i++) {
				var selected = value[i];
				var index = 0;
				var is = false;
				while (true) {
					var item = data[index++];
					if (item === undefined)
						break;
					if (item.value != selected)
						continue;
					label += (label ? ', ' : '') + item.text;
					is = true;
				}
				!is && remove.push(selected);
			}

			if (config.cleaner !== false && value) {
				var refresh = false;
				while (true) {
					var item = remove.shift();
					if (item === undefined)
						break;
					value.splice(value.indexOf(item), 1);
					refresh = true;
				}
				refresh && self.set(value);
			}
		}

		container.find(cls2 + '-item').each(function() {
			var el = $(this);
			var index = +el.attrd('index');
			var checked = false;
			if (!value || !value.length)
				checked = false;
			else if (data[index])
				checked = data[index];
			checked && (checked = value.indexOf(checked.value) !== -1);
			el.tclass(cls + '-checked', checked);
		});

		if (!label && value && config.cleaner !== false) {
			// invalid data
			// it updates model without notification
			self.rewrite([]);
		}

		if (!label && config.placeholder) {
			values.rattr('title', '');
			values.html('<span class="{1}-placeholder">{0}</span>'.format(config.placeholder, cls));
		} else {
			if (count == data.length && config.alltext !== 'null' && config.alltext)
				label = config.alltext;
			else if (config.visible && count > config.visible)
				label = config.selectedtext.format(count, data.length);
			values.attr('title', label);
			values.html(label);
		}
	};

	self.state = function(type) {
		if (!type)
			return;
		var invalid = config.required ? self.isInvalid() : false;
		if (invalid === self.$oldstate)
			return;
		self.$oldstate = invalid;
		self.tclass(cls + '-invalid', invalid);
	};

	if (!W.$dropdowncheckboxevent) {
		W.$dropdowncheckboxevent = true;
		$(document).on('click', function() {
			if (W.$dropdowncheckboxelement) {
				W.$dropdowncheckboxelement.aclass('hidden');
				W.$dropdowncheckboxelement = null;
			}
		});
	}
});

COMPONENT('loading', function(self, config, cls) {

	var delay;
	var prev;

	self.readonly();
	self.singleton();
	self.nocompile();

	self.make = function() {
		self.aclass(cls + ' ' + cls + '-' + (config.style || 1));
		self.append('<div><div class="' + cls + '-text hellip"></div></div>');
	};

	self.show = function(text) {
		clearTimeout(delay);

		if (prev !== text) {
			prev = text;
			self.find('.' + cls + '-text').html(text || '');
		}

		self.rclass('hidden');
		return self;
	};

	self.hide = function(timeout) {
		clearTimeout(delay);
		delay = setTimeout(function() {
			self.aclass('hidden');
		}, timeout || 1);
		return self;
	};

});

COMPONENT('autocomplete', 'height:200', function(self, config, cls) {

	var clssel = 'selected';

	var container, old, searchtimeout, searchvalue, blurtimeout, datasource, offsetter, scroller;
	var margin = {};
	var skipmouse = false;
	var is = false;
	var prev;

	self.template = Tangular.compile('<li{{ if select }} class="' + clssel + '"{{ fi }} data-index="{{ index }}"><span>{{ name }}</span><span>{{ type }}</span></li>');
	self.readonly();
	self.singleton();
	self.nocompile && self.nocompile();

	self.make = function() {

		self.aclass(cls + '-container hidden');
		self.html('<div class="' + cls + '"><div class="noscrollbar"><ul></ul></div></div>');

		scroller = self.find('.noscrollbar');
		container = self.find('ul');

		self.event('click', 'li', function(e) {
			e.preventDefault();
			e.stopPropagation();
			if (self.opt.callback) {
				var val = datasource[+$(this).attrd('index')];
				self.opt.scope && M.scope(self.opt.scope);
				if (self.opt.path)
					SET(self.opt.path, val.value === undefined ? val.name : val.value);
				else
					self.opt.callback(val, old);
			}
			self.visible(false);
		});

		self.event('mouseenter mouseleave', 'li', function(e) {
			if (!skipmouse) {
				prev && prev.rclass(clssel);
				prev = $(this).tclass(clssel, e.type === 'mouseenter');
			}
		});

		$(document).on('click', function() {
			is && self.visible(false);
		});

		self.on('scroll + resize + reflow + resize2', function() {
			is && self.visible(false);
		});
	};

	self.prerender = function(value) {
		self.render(value);
	};

	self.configure = function(name, value) {
		switch (name) {
			case 'height':
				value && scroller.css('height', value);
				break;
		}
	};

	function keydown(e) {
		var c = e.which;
		var input = this;
		if (c !== 38 && c !== 40 && c !== 13) {
			if (c !== 8 && c < 32)
				return;
			clearTimeout(searchtimeout);
			searchtimeout = setTimeout(function() {
				var val = input.value || input.innerHTML;
				if (!val)
					return self.render(EMPTYARRAY);
				if (searchvalue === val)
					return;
				searchvalue = val;
				self.resize();
				self.opt.search(val, self.prerender);
			}, 200);
			return;
		}

		if (!datasource || !datasource.length || !is)
			return;

		var current = container.find('.' + clssel);
		if (c === 13) {
			if (prev) {
				prev = null;
				self.visible(false);
				if (current.length) {
					var val = datasource[+current.attrd('index')];
					self.opt.scope && M.scope(self.opt.scope);
					if (self.opt.callback)
						self.opt.callback(val, old);
					else if (self.opt.path)
						SET(self.opt.path, val.value === undefined ? val.name : val.value);
					e.preventDefault();
					e.stopPropagation();
				}
			}
			return;
		}

		e.preventDefault();
		e.stopPropagation();

		if (current.length) {
			current.rclass(clssel);
			current = c === 40 ? current.next() : current.prev();
		}

		skipmouse = true;
		!current.length && (current = self.find('li:{0}-child'.format(c === 40 ? 'first' : 'last')));
		prev && prev.rclass(clssel);
		prev = current.aclass(clssel);
		var index = +current.attrd('index');
		var h = current.innerHeight();
		var offset = ((index + 1) * h) + (h * 2);
		scroller[0].scrollTop = offset > config.height ? offset - config.height : 0;
		setTimeout2(self.ID + 'skipmouse', function() {
			skipmouse = false;
		}, 100);
	}

	function blur() {
		clearTimeout(blurtimeout);
		blurtimeout = setTimeout(function() {
			self.visible(false);
		}, 300);
	}

	self.visible = function(visible) {
		clearTimeout(blurtimeout);
		self.tclass('hidden', !visible);
		is = visible;
	};

	self.resize = function() {

		if (!offsetter || !old)
			return;

		var offset = offsetter.offset();
		offset.top += offsetter.height();
		offset.width = offsetter.width();

		if (margin.left)
			offset.left += margin.left;
		if (margin.top)
			offset.top += margin.top;
		if (margin.width)
			offset.width += margin.width;

		self.css(offset);
	};

	self.show = function(opt) {

		clearTimeout(searchtimeout);
		var selector = 'input,[contenteditable]';

		if (opt.input == null)
			opt.input = opt.element;

		if (opt.input.setter)
			opt.input = opt.input.find(selector);
		else
			opt.input = $(opt.input);

		if (opt.input[0].tagName !== 'INPUT' && !opt.input.attr('contenteditable'))
			opt.input = opt.input.find(selector);

		if (opt.element.setter) {
			if (!opt.callback)
				opt.callback = opt.element.path;
			opt.element = opt.element.element;
		}

		if (old) {
			old.removeAttr('autocomplete');
			old.off('blur', blur);
			old.off('keydown', keydown);
		}

		opt.input.on('keydown', keydown);
		opt.input.on('blur', blur);
		opt.input.attr('autocomplete', 'off');

		old = opt.input;
		margin.left = opt.offsetX;
		margin.top = opt.offsetY;
		margin.width = opt.offsetWidth;
		opt.scope = M.scope ? M.scope() : '';

		offsetter = $(opt.element);
		self.opt = opt;
		self.resize();
		self.refresh();
		searchvalue = '';
		self.visible(false);
	};

	self.attach = function(input, search, callback, left, top, width) {
		self.attachelement(input, input, search, callback, left, top, width);
	};

	self.attachelement = function(element, input, search, callback, left, top, width) {

		if (typeof(callback) === 'number') {
			width = left;
			left = top;
			top = callback;
			callback = null;
		}

		var opt = {};
		opt.offsetX = left;
		opt.offsetY = top;
		opt.offsetWidth = width;

		if (typeof(callback) === 'string')
			opt.path = callback;
		else
			opt.callback = callback;

		opt.search = search;
		opt.element = input;
		opt.input = input;
		self.show(opt);
	};

	self.render = function(arr) {

		datasource = arr;

		if (!arr || !arr.length) {
			self.visible(false);
			return;
		}

		var builder = [];
		for (var i = 0; i < arr.length; i++) {
			var obj = arr[i];

			if (!i && self.opt.autoselect)
				obj.select = true;

			obj.index = i;
			if (!obj.name)
				obj.name = obj.text;
			builder.push(self.template(obj));
		}

		container.empty().append(builder.join(''));
		skipmouse = true;

		setTimeout(function() {
			scroller[0].scrollTop = 0;
			skipmouse = false;
		}, 100);

		prev = container.find('.' + clssel);
		self.visible(true);
		setTimeout(scroller.noscrollbar, 100, true);
	};
});

COMPONENT('miniform', 'zindex:12', function(self, config, cls) {

	var cls2 = '.' + cls;
	var csspos = {};

	if (!W.$$miniform) {

		W.$$miniform_level = W.$$miniform_level || 1;
		W.$$miniform = true;

		$(document).on('click', cls2 + '-button-close', function() {
			SET($(this).attrd('path'), '');
		});

		var resize = function() {
			setTimeout2(self.name, function() {
				for (var i = 0; i < M.components.length; i++) {
					var com = M.components[i];
					if (com.name === 'miniform' && !HIDDEN(com.dom) && com.$ready && !com.$removed)
						com.resize();
				}
			}, 200);
		};

		ON('resize2', resize);

		$(document).on('click', cls2 + '-container', function(e) {

			if (e.target === this) {
				var com = $(this).component();
				if (com && com.config.closeoutside) {
					com.set('');
					return;
				}
			}

			var el = $(e.target);

			if (el.hclass(cls + '-container-cell')) {
				var form = $(this).find(cls2);
				var c = cls + '-animate-click';
				form.aclass(c).rclass(c, 300);
				var com = el.parent().component();
				if (com && com.config.closeoutside)
					com.set('');
			}
		});
	}

	self.readonly();
	self.submit = function() {
		if (config.submit)
			self.EXEC(config.submit, self.hide, self.element);
		else
			self.hide();
	};

	self.cancel = function() {
		config.cancel && self.EXEC(config.cancel, self.hide);
		self.hide();
	};

	self.hide = function() {
		if (config.independent)
			self.hideforce();
		self.esc(false);
		self.set('');
	};

	self.esc = function(bind) {
		if (bind) {
			if (!self.$esc) {
				self.$esc = true;
				$(W).on('keydown', self.esc_keydown);
			}
		} else {
			if (self.$esc) {
				self.$esc = false;
				$(W).off('keydown', self.esc_keydown);
			}
		}
	};

	self.esc_keydown = function(e) {
		if (e.which === 27 && !e.isPropagationStopped()) {
			var val = self.get();
			if (!val || config.if === val) {
				e.preventDefault();
				e.stopPropagation();
				self.hide();
			}
		}
	};

	self.hideforce = function() {
		if (!self.hclass('hidden')) {
			self.aclass('hidden');
			self.release(true);
			self.find(cls2).rclass(cls + '-animate');
			W.$$miniform_level--;
		}
	};

	self.icon = function(value) {
		var el = this.rclass2('fa');
		value.icon && el.aclass(value.icon.indexOf(' ') === -1 ? ('fa fa-' + value.icon) : value.icon);
		this.tclass('hidden', !value.icon);
	};

	self.resize = function() {

		if (!config.center || self.hclass('hidden'))
			return;

		var ui = self.find(cls2);
		var fh = ui.innerHeight();
		var wh = WH;
		var r = (wh / 2) - (fh / 2);
		csspos.marginTop = (r > 30 ? (r - 15) : 20) + 'px';
		ui.css(csspos);
	};

	self.make = function() {

		$(document.body).append('<div id="{0}" class="hidden {4}-container invisible"><div class="{4}-container-table"><div class="{4}-container-cell"><div class="{4}" style="max-width:{1}px"><div data-bind="@config__text span:value.title__change .{4}-icon:@icon" class="{4}-title"><button name="cancel" class="{4}-button-close{3}" data-path="{2}"><i class="fa fa-times"></i></button><i class="{4}-icon"></i><span></span></div></div></div></div>'.format(self.ID, config.width || 800, self.path, config.closebutton == false ? ' hidden' : '', cls));

		var scr = self.find('> script');
		self.template = scr.length ? scr.html().trim() : '';
		if (scr.length)
			scr.remove();

		var el = $('#' + self.ID);
		var body = el.find(cls2)[0];

		while (self.dom.children.length)
			body.appendChild(self.dom.children[0]);

		self.rclass('hidden invisible');
		self.replace(el, true);

		self.event('scroll', function() {
			EMIT('scroll', self.name);
			EMIT('reflow', self.name);
		});

		self.event('click', 'button[name]', function() {
			var t = this;
			switch (t.name) {
				case 'submit':
					self.submit(self.hide);
					break;
				case 'cancel':
					!t.disabled && self[t.name](self.hide);
					break;
			}
		});

		config.enter && self.event('keydown', 'input', function(e) {
			e.which === 13 && !self.find('button[name="submit"]')[0].disabled && setTimeout(self.submit, 800);
		});
	};

	self.configure = function(key, value, init, prev) {
		if (!init) {
			switch (key) {
				case 'width':
					value !== prev && self.find(cls2).css('max-width', value + 'px');
					break;
				case 'closebutton':
					self.find(cls2 + '-button-close').tclass('hidden', value !== true);
					break;
			}
		}
	};

	self.setter = function(value) {

		setTimeout2(cls + '-noscroll', function() {
			$('html').tclass(cls + '-noscroll', !!$(cls2 + '-container').not('.hidden').length);
		}, 50);

		var isHidden = value !== config.if;

		if (self.hclass('hidden') === isHidden) {
			if (!isHidden) {
				config.reload && self.EXEC(config.reload, self);
				config.default && DEFAULT(self.makepath(config.default), true);
			}
			return;
		}

		setTimeout2(cls, function() {
			EMIT('reflow', self.name);
		}, 10);

		if (isHidden) {
			if (!config.independent)
				self.hideforce();
			return;
		}

		if (self.template) {
			var is = self.template.COMPILABLE();
			self.find(cls2).append(self.template);
			self.template = null;
			is && COMPILE();
		}

		if (W.$$miniform_level < 1)
			W.$$miniform_level = 1;

		W.$$miniform_level++;

		self.css('z-index', W.$$miniform_level * config.zindex);
		self.rclass('hidden');

		self.resize();
		self.release(false);

		config.reload && self.EXEC(config.reload, self);
		config.default && DEFAULT(self.makepath(config.default), true);

		if (!isMOBILE && config.autofocus) {
			setTimeout(function() {
				self.find(typeof(config.autofocus) === 'string' ? config.autofocus : 'input[type="text"],select,textarea').eq(0).focus();
			}, 1000);
		}

		setTimeout(function() {
			self.rclass('invisible');
			self.find(cls2).aclass(cls + '-animate');
		}, 300);

		// Fixes a problem with freezing of scrolling in Chrome
		setTimeout2(self.ID, function() {
			self.css('z-index', (W.$$miniform_level * config.zindex) + 1);
		}, 500);

		config.closeesc && self.esc(true);
	};
});

COMPONENT('infowindows', 'reoffsetresize:0', function(self, config, cls) {

	var cls2 = '.' + cls;
	var cache = {};
	var services = [];
	var events = {};
	var drag = {};
	var prevfocused;
	var serviceid;
	var data = [];
	var lastWW = WW;
	var lastWH = WH;

	self.make = function() {
		self.aclass(cls);
		self.event('click', cls2 + '-control', function() {
			var el = $(this);
			var name = el.attrd('name');
			var item = cache[el.closest(cls2 + '-item').attrd('id')];
			switch (name) {
				case 'close':
					item.setcommand('close');
					break;
				default:
					item.setcommand(name);
					break;
			}
		});

		self.event('mousedown touchstart', cls2 + '-item', function() {
			if (prevfocused) {
				if (prevfocused[0] == this)
					return;
				prevfocused.rclass(cls + '-focused');
			}
			prevfocused = $(this).aclass(cls + '-focused');
		});

		self.event('mousedown touchstart', cls2 + '-title,' + cls2 + '-resize', events.down);
		self.on('resize2', self.resize2);
		serviceid = setInterval(events.service, 5000);
	};

	self.finditem = function(id) {
		return cache[id];
	};

	self.send = function(type, body) {
		for (var i = 0; i < data.length; i++)
			data[i].meta.data(type, body, data[i].element);
	};

	self.destroy = function() {
		clearInterval(serviceid);
	};

	self.resize2 = function() {
		setTimeout2(self.ID, self.resize, 200);
	};

	self.recompile = function() {
		setTimeout2(self.iD + 'compile', COMPILE, 50);
	};

	self.resizeforce = function() {

		self.element.find(cls2 + '-maximized').each(function() {
			cache[$(this).attrd('id')].setcommand('maximize');
		});

		if (config.reoffsetresize) {
			var diffWW = lastWW - WW;
			var diffWH = lastWH - WH;

			var keys = Object.keys(cache);
			for (var i = 0; i < keys.length; i++) {
				var win = cache[keys[i]];
				win.setoffset(win.x - diffWW, win.y - diffWH);
			}

			lastWW = WW;
			lastWH = WH;
		}
	};

	self.resize = function() {
		setTimeout2(self.ID + 'resize', self.resizeforce, 300);
	};

	events.service = function() {
		for (var i = 0; i < services.length; i++) {
			var tmp = services[i];
			if (tmp.$service)
				tmp.$service++;
			else
				tmp.$service = 1;
			tmp.meta.service && tmp.meta.service.call(tmp, tmp.$service, tmp.element);
		}
	};

	events.down = function(e) {

		var E = e;

		if (e.type === 'touchstart') {
			drag.touch = true;
			e = e.touches[0];
		} else
			drag.touch = false;

		if (e.target.nodeName === 'I')
			return;

		var el = $(this);
		var parent = el.closest(cls2 + '-item');

		if (parent.hclass(cls + '-maximized'))
			return;

		drag.resize = el.hclass(cls + '-resize');
		drag.is = false;

		E.preventDefault();

		var myoffset = self.element.position();
		var pos;

		if (drag.resize) {
			var c = el.attr('class');
			drag.el = el.closest(cls2 + '-item');
			drag.dir = c.match(/-(tl|tr|bl|br)/)[0].substring(1);
			pos = drag.el.position();
			var m = self.element.offset();
			drag.body = drag.el.find(cls2 + '-body');
			drag.plus = m;
			drag.x = pos.left;
			drag.y = pos.top;
			drag.width = drag.el.width();
			drag.height = drag.body.height();
		} else {
			drag.el = el.closest(cls2 + '-item');
			pos = drag.el.position();
			drag.x = e.pageX - pos.left;
			drag.y = e.pageY - pos.top;
		}

		drag.el.aclass(cls + '-block');
		drag.offX = myoffset.left;
		drag.offY = myoffset.top;
		drag.item = cache[drag.el.attrd('id')];

		if (drag.item.meta.actions) {
			if (drag.resize) {
				if (drag.item.meta.actions.resize == false)
					return;
			} else {
				if (drag.item.meta.actions.move == false)
					return;
			}
		}

		drag.el.aclass(cls + '-dragged');
		$(W).on('mousemove touchmove', events.move).on('mouseup touchend', events.up);
	};

	events.move = function(e) {

		var evt = e;
		if (drag.touch)
			evt = e.touches[0];

		var obj = {};
		drag.is = true;

		if (drag.resize) {

			var x = evt.pageX - drag.offX - drag.plus.left;
			var y = evt.pageY - drag.offY - drag.plus.top;
			var off = drag.item.meta.offset;
			var w;
			var h;

			switch (drag.dir) {

				case 'tl':
					obj.left = x;
					obj.top = y;
					w = drag.width - (x - drag.x);
					h = drag.height - (y - drag.y);

					if ((off.minwidth && w < off.minwidth) || (off.minheight && h < off.minheight) || (off.maxwidth && w > off.maxwidth) || (off.maxheight && h > off.maxheight))
						break;

					obj.width = w;
					drag.el.css(obj);
					obj.height = h;
					delete obj.width;
					delete obj.top;
					drag.body.css(obj);
					break;

				case 'tr':
					w = x - drag.x;
					h = drag.height - (y - drag.y);

					if ((off.minwidth && w < off.minwidth) || (off.minheight && h < off.minheight) || (off.maxwidth && w > off.maxwidth) || (off.maxheight && h > off.maxheight))
						break;

					obj.width = w;
					obj.top = y;
					drag.el.css(obj);
					obj.height = h;
					delete obj.width;
					delete obj.top;
					drag.body.css(obj);
					break;

				case 'bl':

					w = drag.width - (x - drag.x);
					h = y - drag.y - 30;

					if ((off.minwidth && w < off.minwidth) || (off.minheight && h < off.minheight) || (off.maxwidth && w > off.maxwidth) || (off.maxheight && h > off.maxheight))
						break;

					obj.left = x;
					obj.width = w;
					drag.el.css(obj);
					delete obj.width;
					obj.height = h;
					drag.body.css(obj);
					break;

				case 'br':
					w = x - drag.x;
					h = y - drag.y - 30;

					if ((off.minwidth && w < off.minwidth) || (off.minheight && h < off.minheight) || (off.maxwidth && w > off.maxwidth) || (off.maxheight && h > off.maxheight))
						break;

					obj.width = w;
					drag.el.css(obj);
					delete obj.width;
					obj.height = h;
					drag.body.css(obj);
					break;
			}

			drag.item.ert && clearTimeout(drag.item.ert);
			drag.item.ert = setTimeout(drag.item.emitresize, 100);

		} else {
			obj.left = evt.pageX - drag.x - drag.offX;
			obj.top = evt.pageY - drag.y - drag.offY;

			if (obj.top < 0)
				obj.top = 0;

			drag.el.css(obj);
		}

		if (!drag.touch)
			e.preventDefault();
	};

	events.up = function() {

		drag.el.rclass(cls + '-dragged').rclass(cls + '-block');
		$(W).off('mousemove touchmove', events.move).off('mouseup touchend', events.up);

		if (!drag.is)
			return;

		var item = drag.item;
		var meta = item.meta;
		var pos = drag.el.position();

		drag.is = false;
		drag.x = meta.offset.x = item.x = pos.left;
		drag.y = meta.offset.y = item.y = pos.top;

		if (drag.resize) {
			item.width = meta.offset.width = drag.el.width();
			item.height = meta.offset.height = drag.body.height();
			meta.resize && meta.resize.call(item, item.width, item.height, drag.body, item.x, item.y);
			self.element.SETTER('*', 'resize');
		}

		meta.move && meta.move.call(item, item.x, item.y, drag.body);
		self.wsave(item);
		self.change(true);
	};

	var wsavecallback = function(item) {

		var obj = {};
		obj.x = item.x;
		obj.y = item.y;
		obj.width = item.width;
		obj.height = item.height;
		obj.ww = WW;
		obj.wh = WH;
		obj.hidden = item.meta.hidden;

		PREF.set(item.cachekey, obj, '1 month');
	};

	self.wsave = function(obj) {
		if (obj.meta.actions && obj.meta.actions.autosave)
			setTimeout2(self.ID + '_infowin_' + obj.meta.id, wsavecallback, 500, null, obj);
	};

	self.wadd = function(item) {

		var obj = cache[item.id] = {};

		obj.cachekey = 'infowin_' + (item.cachekey || item.id) + '_' + (item.offset.width + 'x' + item.offset.height);

		var hidden = '';
		var ishidden = false;

		if (item.actions && item.actions.autosave) {
			pos = PREF[obj.cachekey];
			if (pos) {

				var mx = 0;
				var my = 0;

				if (config.reoffsetresize && pos.ww != null && pos.wh != null) {
					mx = pos.ww - WW;
					my = pos.wh - WH;
				}

				item.offset.x = pos.x - mx;
				item.offset.y = pos.y - my;
				item.offset.width = pos.width;
				item.offset.height = pos.height;

				if (pos.hidden && (item.hidden == null || item.hidden)) {
					ishidden = true;
					item.hidden = true;
				}
			}
		}

		if (!ishidden)
			ishidden = item.hidden;

		hidden = ishidden ? ' hidden' : '';

		var el = $('<div class="{0}-item{1}" data-id="{id}" style="left:{x}px;top:{y}px;width:{width}px"><span class="{0}-resize {0}-resize-tl"></span><span class="{0}-resize {0}-resize-tr"></span><span class="{0}-resize {0}-resize-bl"></span><span class="{0}-resize {0}-resize-br"></span><div class="{0}-title"><i class="fa fa-times {0}-control" data-name="close"></i><span>{{ title }}</span></div><div class="{0}-body" style="height:{height}px"></div></div>'.format(cls, hidden).arg(item.offset).arg(item));
		var body = el.find(cls2 + '-body');
		var pos;

		body.append(item.html);

		if (typeof(item.html) === 'string' && item.html.COMPILABLE())
			self.recompile();

		if (item.actions) {
			if (item.actions.resize == false)
				el.aclass(cls + '-noresize');
			if (item.actions.move == false)
				el.aclass(cls + '-nomove');

			var noclose = item.actions.close == false;
			if (item.actions.hide)
				noclose = false;

			if (noclose)
				el.aclass(cls + '-noclose');
		}

		obj.main = self;
		obj.meta = item;
		obj.element = body;
		obj.container = el;
		obj.x = item.offset.x;
		obj.y = item.offset.y;
		obj.width = item.offset.width;
		obj.height = item.offset.height;

		if (item.buttons) {
			var builder = [];
			for (var i = 0; i < item.buttons.length; i++) {
				var btn = item.buttons[i];
				var icon = btn.icon.indexOf(' ') === -1 ? ('fa fa-' + btn.icon) : btn.icon;
				builder.push('<i class="fa fa-{1} {0}-control" data-name="{2}"></i>'.format(cls, icon, btn.name));
			}
			builder.length && el.find(cls2 + '-lastbutton').before(builder.join(''));
		}

		item.make && item.make.call(cache[item.id], body);

		obj.emitresize = function() {
			obj.ert = null;
			obj.element.SETTER('*', 'resize');
		};

		obj.setsize = function(w, h) {
			var t = this;
			var obj = {};

			if (w) {
				obj.width = t.width = t.meta.offset.width = w;
				t.element.parent().css('width', w);
			}

			if (h) {
				t.element.css('height', h);
				t.height = t.meta.offset.height = h;
			}

			t.ert && clearTimeout(t.ert);
			t.ert = setTimeout(t.emitresize, 100);
			self.wsave(t);
		};

		obj.setcommand = function(type) {

			var el = obj.element.parent();
			var c;

			switch (type) {

				case 'toggle':
					obj.setcommand(obj.meta.hidden ? 'show' : 'hide');
					break;

				case 'show':
					if (obj.meta.hidden) {
						obj.meta.hidden = false;
						obj.element.parent().rclass('hidden');
						self.wsave(obj);
						self.resize2();
					}
					break;

				case 'close':
				case 'hide':

					if (type === 'hide' && obj.meta.hidden)
						return;

					if (obj.meta.close) {
						obj.meta.close(function() {
							self.wrem(obj.meta);
							self.resize2();
						});
					} else {
						self.wrem(obj.meta);
						self.resize2();
					}
					break;

				case 'resize':
					obj.setsize(obj.width, obj.height);
					break;

				case 'move':
					obj.setoffset(obj.x, obj.y);
					break;

				case 'focus':
					prevfocused && prevfocused.rclass(cls + '-focused');
					prevfocused = obj.element.parent().aclass(cls + '-focused');
					break;
				default:
					if (obj.meta.buttons) {
						var btn = obj.meta.buttons.findItem('name', type);
						if (btn && btn.exec)
							btn.exec.call(obj, obj);
					}
					break;
			}
		};

		obj.setoffset = function(x, y) {
			var t = this;
			var obj = {};

			if (x != null)
				obj.left = t.x = t.meta.offset.x = x;

			if (y != null)
				obj.top = t.y = t.meta.offset.y = y;

			t.element.parent().css(obj);
			self.wsave(t);
		};

		obj.meta.service && services.push(obj);
		obj.meta.data && data.push(obj);

		self.append(el);
		return obj;
	};

	self.wrem = function(item) {
		var obj = cache[item.id];
		if (obj) {
			var main = obj.element.closest(cls2 + '-item');

			if (obj.meta.actions.hide) {
				obj.meta.hidden = true;
				main.aclass('hidden');
				self.wsave(obj);
			} else {
				obj.meta.destroy && obj.meta.destroy.call(obj);
				main.off('*');
				main.find('*').off('*');
				main.remove();
				delete cache[item.id];

				var index = services.indexOf(obj);
				if (index !== -1)
					services.splice(index, 1);

				index = data.indexOf(obj);
				if (index !== -1)
					data.splice(index, 1);

				var arr = self.get();
				arr.splice(arr.findIndex('id', item.id), 1);
				self.update();
			}
		}
	};

	self.setter = function(value) {

		if (!value)
			value = EMPTYARRAY;

		var updated = {};

		for (var i = 0; i < value.length; i++) {
			var item = value[i];
			if (!cache[item.id])
				cache[item.id] = self.wadd(item);
			updated[item.id] = 1;
		}

		// Remove older windows
		var keys = Object.keys(cache);
		for (var i = 0; i < keys.length; i++) {
			var key = keys[i];
			if (!updated[key])
				self.wrem(cache[key].meta);
		}
	};

	self.toggle = function(id) {
		var item = cache[id];
		item && item.setcommand('toggle');
	};

	self.show = function(id) {
		var item = cache[id];
		item && item.setcommand('show');
	};

	self.focus = function(id) {
		var item = cache[id];
		item && item.setcommand('focus');
	};

	self.hide = function(id) {
		var item = cache[id];
		item && item.setcommand('hide');
	};

});

COMPONENT('viewbox', 'margin:0;scroll:true;delay:100;scrollbar:0;visibleY:1;height:100;invisible:1', function(self, config, cls) {

	var eld, elb;
	var scrollbar;
	var cls2 = '.' + cls;
	var init = false;
	var cache;

	self.readonly();

	self.init = function() {

		var resize = function() {
			for (var i = 0; i < M.components.length; i++) {
				var com = M.components[i];
				if (com.name === 'viewbox' && com.dom.offsetParent && com.$ready && !com.$removed)
					com.resizeforce();
			}
		};

		ON('resize2', function() {
			setTimeout2('viewboxresize', resize, 200);
		});
	};

	self.destroy = function() {
		scrollbar && scrollbar.destroy();
	};

	self.configure = function(key, value, init) {
		switch (key) {
			case 'disabled':
				eld.tclass('hidden', !value);
				break;
			case 'minheight':
			case 'margin':
			case 'marginxs':
			case 'marginsm':
			case 'marginmd':
			case 'marginlg':
				!init && self.resize();
				break;
			case 'selector': // backward compatibility
				config.parent = value;
				self.resize();
				break;
		}
	};

	self.scrollbottom = function(val) {
		if (val == null)
			return elb[0].scrollTop;
		elb[0].scrollTop = (elb[0].scrollHeight - self.dom.clientHeight) - (val || 0);
		return elb[0].scrollTop;
	};

	self.scrolltop = function(val) {
		if (val == null)
			return elb[0].scrollTop;
		elb[0].scrollTop = (val || 0);
		return elb[0].scrollTop;
	};

	self.make = function() {
		config.invisible && self.aclass('invisible');
		config.scroll && MAIN.version > 17 && self.element.wrapInner('<div class="' + cls + '-body"></div>');
		self.element.prepend('<div class="' + cls + '-disabled hidden"></div>');
		eld = self.find('> .{0}-disabled'.format(cls)).eq(0);
		elb = self.find('> .{0}-body'.format(cls)).eq(0);
		self.aclass('{0} {0}-hidden'.format(cls));
		if (config.scroll) {
			if (config.scrollbar) {
				if (MAIN.version > 17) {
					scrollbar = W.SCROLLBAR(self.find(cls2 + '-body'), { visibleY: config.visibleY, visibleX: config.visibleX, orientation: config.visibleX ? null : 'y', parent: self.element });
					self.scrolltop = scrollbar.scrollTop;
					self.scrollbottom = scrollbar.scrollBottom;
				} else
					self.aclass(cls + '-scroll');
			} else {
				self.aclass(cls + '-scroll');
				self.find(cls2 + '-body').aclass('noscrollbar');
			}
		}
		self.resize();
	};

	self.released = function(is) {
		!is && self.resize();
	};

	var css = {};

	self.resize = function(scrollto) {
		setTimeout2(self.ID, self.resizeforce, 200, null, scrollto);
	};

	self.resizeforce = function(scrollto) {

		var el = self.parent(config.parent);
		var h = el.height();
		var w = el.width();
		var width = WIDTH();
		var mywidth = self.element.width();

		var key = width + 'x' + mywidth + 'x' + w + 'x' + h;
		if (cache === key) {
			scrollbar && scrollbar.resize();
			if (scrollto) {
				if (scrollto ==='bottom')
					self.scrollbottom(0);
				else
					self.scrolltop(0);
			}
			return;
		}

		cache = key;

		var margin = config.margin;
		var responsivemargin = config['margin' + width];

		if (responsivemargin != null)
			margin = responsivemargin;

		if (margin === 'auto')
			margin = self.element.offset().top;

		if (h === 0 || w === 0) {
			self.$waiting && clearTimeout(self.$waiting);
			self.$waiting = setTimeout(self.resize, 234);
			return;
		}

		h = ((h / 100) * config.height) - margin;

		if (config.minheight && h < config.minheight)
			h = config.minheight;

		css.height = h;
		css.width = mywidth;
		eld.css(css);

		css.width = null;
		self.css(css);
		elb.length && elb.css(css);
		self.element.SETTER('*', 'resize');
		var c = cls + '-hidden';
		self.hclass(c) && self.rclass(c, 100);
		scrollbar && scrollbar.resize();

		if (scrollto) {
			if (scrollto ==='bottom')
				self.scrollbottom(0);
			else
				self.scrolltop(0);
		}

		if (!init) {
			self.rclass('invisible', 250);
			init = true;
		}
	};

	self.resizescrollbar = function() {
		scrollbar && scrollbar.resize();
	};

	self.setter = function() {
		setTimeout(self.resize, config.delay, config.scrollto || config.scrolltop);
	};
});

COMPONENT('intro', 'closebutton:0;width:400;height:366', function(self, config, cls) {

	var cls2 = '.' + cls;
	var container = 'intro' + GUID(4);
	var content, figures, buttons, button = null;
	var index = 0;
	var visible = false;
	var body;

	self.readonly();

	self.hide = function() {
		if (visible) {
			self.set('');
			config.exec && EXEC(config.exec, true);
			config.remove && self.remove();
		}
	};

	self.make = function() {

		$(document.body).append('<div id="{0}" class="hidden {1}"><div class="{1}-body" style="max-width:{2}px;height:{3}px;top:{4}px"></div></div>'.format(container, cls, config.width, config.height, (WH / 2 >> 0) - config.height / 2 >> 0));
		content = self.element;
		container = $('#' + container);
		content.rclass('hidden');
		body = container.find(cls2 + '-body');
		body[0].appendChild(self.element[0]);
		self.replace(container);
		content.aclass(cls + '-figures');
		figures = content.find('figure');
		var items = [];

		figures.each(function(index) {
			items.push('<i class="fa fa-circle {0}-button" data-index="{1}"></i>'.format(cls, index));
		});

		if (config.closebutton) {
			body.prepend('<span><i class="fa fa-times"></i></span>');
			body.find('span').on('click', self.hide);
		}

		body.append('<div class="{0}-pagination"><button name="next"></button>{1}</div>'.format(cls, items.join('')));
		buttons = self.find(cls2 + '-button');
		button = self.find(cls2 + '-pagination').find('button');

		self.event('click', 'button[name="next"]', function() {
			index++;
			if (index >= figures.length) {
				self.set('');
				config.exec && EXEC(config.exec);
				config.remove && self.remove();
			} else {
				self.move(index);
				config.page && EXEC(config.page, index);
			}
		});

		self.event('click', 'button[name="close"]', self.hide);

		self.event('click', cls2 + '-button', function() {
			self.move(+this.getAttribute('data-index'));
		});

		self.on('resize2', self.resize);
		self.resize();
	};

	self.resize = function() {
		setTimeout2(self.ID, self.resizeforce, 300);
	};

	self.resizeforce = function() {
		var css = {};
		css.top = (WH / 2 >> 0) - config.height / 2 >> 0;

		if (WIDTH() === 'xs') {
			css['max-width'] = 'auto';
			css.width = '86%';
		} else {
			css.width = '';
		}

		body.css(css);
	};

	self.move = function(indexer) {
		figures.filter('.visible').rclass('visible');
		buttons.filter('.selected').rclass('selected');
		figures.eq(indexer).aclass('visible');
		buttons.eq(indexer).aclass('selected');
		button.html(indexer < buttons.length - 1 ? ((config.next || 'Next') + '<i class="fa fa-chevron-right"></i>') : (config.close || 'Done'));
		index = indexer;
		return self;
	};

	self.setter = function(value) {
		var is = value == config.if;
		if (is === visible)
			return;
		index = 0;
		self.move(0);
		visible = is;
		self.tclass('hidden', !is);
		setTimeout(function() {
			self.find(cls2 + '-body').tclass(cls + '-body-visible', is);
		}, 100);
	};
});

COMPONENT('searchinput', 'searchicon:fa fa-search;cancelicon:fa fa-times;align:left', function(self, config, cls) {

	var input;
	var icon;
	var prev;

	self.novalidate();

	self.make = function() {

		self.aclass(cls + ' ' + cls + '-' + config.align);
		self.html('<span><i class="{0}"></i></span><div><input type="text" autocomplete="new-password" maxlength="100" placeholder="{1}" data-jc-bind /></div>'.format(config.searchicon, config.placeholder));
		input = self.find('input')[0];
		icon = self.find('i');

		self.event('click', 'span', function() {
			prev && self.set('');
		});

		if (config.autofocus && !isMOBILE) {
			setTimeout(function() {
				input.focus();
			}, config.autofocus == true ? 500 : config.autofocus);
		}

	};

	self.focus = function() {
		input && input.focus();
	};

	self.check = function() {
		var is = !!input.value.trim();
		if (is !== prev) {
			icon.rclass().aclass(is ? config.cancelicon : config.searchicon);
			prev = is;
			self.tclass(cls + '-is', is);
		}
	};

	self.clear = function() {
		input.value = '';
		config.exec && self.SEEX(config.exec, input.value);
		self.check();
	};

	self.setter = function(value) {
		input.value = value || '';
		config.exec && self.SEEX(config.exec, input.value);
		self.check();
	};

});

COMPONENT('search', 'class:hidden;delay:50;attribute:data-search;splitwords:1;delaydatasource:100', function(self, config, cls) {

	self.readonly();

	self.make = function() {
		config.datasource && self.datasource(config.datasource, function() {
			setTimeout(function() {
				self.refresh();
			}, config.delaydatasource);
		});
	};

	self.search = function() {

		var value = self.get();
		var elements = self.find(config.selector);
		var length = elements.length;

		if (!value) {
			elements.rclass(config.class);
			self.rclass2(cls + '-');
			config.exec && self.SEEX(config.exec, { hidden: 0, count: length, total: length, search: '', is: false });
			return;
		}

		var search = value.toSearch();
		var count = 0;
		var hidden = 0;

		if (config.splitwords)
			search = search.split(' ');

		self.aclass(cls + '-used');

		for (var i = 0; i < length; i++) {

			var el = elements.eq(i);
			var val = (el.attr(config.attribute) || '').toSearch();
			var is = false;

			if (search instanceof Array) {
				for (var j = 0; j < search.length; j++) {
					if (val.indexOf(search[j]) === -1) {
						is = true;
						break;
					}
				}
			} else
				is = val.indexOf(search) === -1;

			el.tclass(config.class, is);

			if (is)
				hidden++;
			else
				count++;
		}

		self.tclass(cls + '-empty', !count);
		config.exec && self.SEEX(config.exec, { total: length, hidden: hidden, count: count, search: search, is: true });
	};

	self.setter = function(value) {
		if (!config.selector || !config.attribute || value == null)
			return;
		setTimeout2('search' + self.ID, self.search, config.delay);
	};
});

COMPONENT('message', 'button:OK', function(self, config, cls) {

	var cls2 = '.' + cls;
	var is;
	var events = {};

	self.readonly();
	self.singleton();
	self.nocompile && self.nocompile();

	self.make = function() {

		var pls = (config.style === 2 ? (' ' + cls + '2') : '');
		self.aclass(cls + ' hidden' + pls);

		if (config.closeoutside)
			self.event('click', function(e) {
				var node = e.target;
				var skip = { SPAN: 1, A: 1, I: 1 };
				if (!skip[node.tagName])
					self.hide();
			});
		else
			self.event('click', 'button', self.hide);
	};

	events.keyup = function(e) {
		if (e.which === 27)
			self.hide();
	};

	events.bind = function() {
		if (!events.is) {
			$(W).on('keyup', events.keyup);
			events.is = false;
		}
	};

	events.unbind = function() {
		if (events.is) {
			events.is = false;
			$(W).off('keyup', events.keyup);
		}
	};

	self.warning = function(message, icon, fn) {
		if (typeof(icon) === 'function') {
			fn = icon;
			icon = undefined;
		}
		self.callback = fn;
		self.content(cls + '-warning', message, icon || 'warning');
	};

	self.info = function(message, icon, fn) {
		if (typeof(icon) === 'function') {
			fn = icon;
			icon = undefined;
		}
		self.callback = fn;
		self.content(cls + '-info', message, icon || 'info-circle');
	};

	self.success = function(message, icon, fn) {

		if (typeof(icon) === 'function') {
			fn = icon;
			icon = undefined;
		}

		self.callback = fn;
		self.content(cls + '-success', message, icon || 'check-circle');
	};

	self.response = function(message, callback, response) {

		var fn;

		if (typeof(message) === 'function') {
			response = callback;
			fn = message;
			message = null;
		} else if (typeof(callback) === 'function')
			fn = callback;
		else {
			response = callback;
			fn = null;
		}

		if (response instanceof Array) {
			var builder = [];
			for (var i = 0; i < response.length; i++) {
				var err = response[i].error;
				err && builder.push(err);
			}
			self.warning(builder.join('<br />'));
			SETTER('!loading/hide');
		} else if (typeof(response) === 'string') {
			self.warning(response);
			SETTER('!loading/hide');
		} else {

			if (message) {
				if (message.length < 40 && message.charAt(0) === '?')
					SET(message, response);
				else
					self.success(message);
			}

			if (typeof(fn) === 'string')
				SET(fn, response);
			else if (fn)
				fn(response);
		}
	};

	self.hide = function() {
		events.unbind();
		self.callback && self.callback();
		self.aclass('hidden');
	};

	self.content = function(classname, text, icon) {

		if (icon.indexOf(' ') === -1)
			icon = 'fa fa-' + icon;

		!is && self.html('<div><div class="{0}-icon"><i class="{1}"></i></div><div class="{0}-body"><div class="{0}-text"></div><hr /><button>{2}</button></div></div>'.format(cls, icon, config.button));

		self.rclass2(cls + '-').aclass(classname);
		self.find(cls2 + '-body').rclass().aclass(cls + '-body');

		if (is)
			self.find(cls2 + '-icon').find('.fa').rclass2('fa').aclass(icon);

		self.find(cls2 + '-text').html(text);
		self.rclass('hidden');
		is = true;
		events.bind();
		setTimeout(function() {
			self.aclass(cls + '-visible');
			setTimeout(function() {
				self.find(cls2 + '-icon').aclass(cls + '-icon-animate');
			}, 300);
		}, 100);
	};
});

COMPONENT('approve', 'cancel:Cancel', function(self, config, cls) {

	var cls2 = '.' + cls;
	var events = {};
	var buttons;
	var oldcancel;

	self.readonly();
	self.singleton();
	self.nocompile && self.nocompile();

	self.make = function() {

		self.aclass(cls + ' hidden');
		self.html('<div><div class="{0}-body"><span class="{0}-close"><i class="fa fa-times"></i></span><div class="{0}-content"></div><div class="{0}-buttons"><button data-index="0"></button><button data-index="1"></button></div></div></div>'.format(cls));

		buttons = self.find(cls2 + '-buttons').find('button');

		self.event('click', 'button', function() {
			self.hide(+$(this).attrd('index'));
		});

		self.event('click', cls2 + '-close', function() {
			self.callback = null;
			self.hide(-1);
		});

		self.event('click', function(e) {
			var t = e.target.tagName;
			if (t !== 'DIV')
				return;
			var el = self.find(cls2 + '-body');
			el.aclass(cls + '-click');
			setTimeout(function() {
				el.rclass(cls + '-click');
			}, 300);
		});
	};

	events.keydown = function(e) {
		var index = e.which === 13 ? 0 : e.which === 27 ? 1 : null;
		if (index != null) {
			self.find('button[data-index="{0}"]'.format(index)).trigger('click');
			e.preventDefault();
			e.stopPropagation();
			events.unbind();
		}
	};

	events.bind = function() {
		$(W).on('keydown', events.keydown);
	};

	events.unbind = function() {
		$(W).off('keydown', events.keydown);
	};

	self.show = function(message, a, b, fn) {

		if (typeof(b) === 'function') {
			fn = b;
			b = config.cancel;
		}

		if (M.scope)
			self.currscope = M.scope();

		self.callback = fn;

		var icon = a.match(/"[a-z0-9-\s]+"/);
		if (icon) {

			var tmp = icon + '';
			if (tmp.indexOf(' ') == -1)
				tmp = 'fa fa-' + tmp;

			a = a.replace(icon, '').trim();
			icon = '<i class="{0}"></i>'.format(tmp.replace(/"/g, ''));
		} else
			icon = '';

		var color = a.match(/#[0-9a-f]+/i);
		if (color)
			a = a.replace(color, '').trim();

		buttons.eq(0).css('background-color', color || '').html(icon + a);

		if (oldcancel !== b) {
			oldcancel = b;
			buttons.eq(1).html(b);
		}

		self.find(cls2 + '-content').html(message.replace(/\n/g, '<br />'));
		$('html').aclass(cls + '-noscroll');
		self.rclass('hidden');
		events.bind();
		self.aclass(cls + '-visible', 5);
	};

	self.hide = function(index) {

		if (!index) {
			self.currscope && M.scope(self.currscope);
			self.callback && self.callback(index);
		}

		self.rclass(cls + '-visible');
		events.unbind();
		setTimeout2(self.id, function() {
			$('html').rclass(cls + '-noscroll');
			self.aclass('hidden');
		}, 1000);
	};
});

// MODIFIED!!!
COMPONENT('fullform', 'zindex:12;padding:20;scrollbar:1;scrolltop:1;style:1', function(self, config, cls) {

	var cls2 = '.' + cls;
	var csspos = {};
	var nav = false;
	var init = false;

	if (!W.$$fullform) {

		W.$$fullform_level = W.$$fullform_level || 1;
		W.$$fullform = true;

		$(document).on('click', cls2 + '-button-close', function() {
			SET($(this).attrd('path'), '');
		});

		var resize = function() {
			setTimeout2(self.name, function() {
				for (var i = 0; i < M.components.length; i++) {
					var com = M.components[i];
					if (com.name === 'fullform' && !HIDDEN(com.dom) && com.$ready && !com.$removed)
						com.resize();
				}
			}, 200);
		};

		ON('resize2', resize);

		$(document).on('click', cls2 + '-container', function(e) {

			if (e.target === this) {
				var com = $(this).component();
				if (com && com.config.closeoutside) {
					com.set('');
					return;
				}
			}

			var el = $(e.target);
			if (el.hclass(cls + '-container') && !el.hclass(cls + '-style-2')) {
				var form = el.find(cls2);
				var c = cls + '-animate-click';
				form.aclass(c);
				setTimeout(function() {
					form.rclass(c);
				}, 300);
			}
		});
	}

	self.readonly();
	self.submit = function() {
		if (config.submit)
			self.EXEC(config.submit, self.hide, self.element);
		else
			self.hide();
	};

	self.cancel = function() {
		config.cancel && self.EXEC(config.cancel, self.hide);
		self.hide();
	};

	self.hide = function() {
		if (config.independent)
			self.hideforce();
		self.esc(false);
		self.set('');
	};

	self.icon = function(value) {
		var el = this.rclass2('fa');
		value.icon && el.aclass(value.icon.indexOf(' ') === -1 ? ('fa fa-' + value.icon) : value.icon);
	};

	self.resize = function() {

		if (self.hclass('hidden'))
			return;

		var padding = isMOBILE ? 0 : config.style === 1 ? config.padding : 0;
		var ui = self.find(cls2);
		var p = (config.style == 1 ? (padding * 2) : 0);

		csspos.height = WH - (config.style == 1 ? (padding * 2) : padding);
		csspos.top = padding;
		ui.css(csspos);

		var el = self.find(cls2 + '-title');
		var th = el.height();

		csspos = { height: csspos.height - th, width: WW - p };

		if (nav)
			csspos.height -= nav.height();

		self.find(cls2 + '-body').css(csspos).parent().css({ width: WW - p });
		self.scrollbar && self.scrollbar.resize();
		self.element.SETTER('*', 'resize');
	};

	self.make = function() {

		$(document.body).append('<div id="{0}" class="hidden {4}-container invisible"><div class="{4}"><div data-bind="@config__text span:value.title__change .{4}-icon:@icon" class="{4}-title"><button name="cancel" class="{4}-button-close{3}" data-path="{2}"><i class="fa fa-times"></i></button><i class="{4}-icon"></i><span></span></div><div class="{4}-body"></div></div>'.format(self.ID, config.width || 800, self.path, config.closebutton == false ? ' hidden' : '', cls));

		var scr = self.find('> script');
		self.template = scr.length ? scr.html().trim() : '';
		scr.length && scr.remove();

		var el = $('#' + self.ID);
		var body = el.find(cls2 + '-body')[0];

		while (self.dom.children.length) {
			var child = self.dom.children[0];
			if (child.tagName === 'NAV') {
				nav = $(child);
				body.parentNode.appendChild(child);
			} else
				body.appendChild(child);
		}

		self.rclass('hidden invisible');
		self.replace(el, true);

		if (config.scrollbar)
			self.scrollbar = SCROLLBAR(self.find(cls2 + '-body'), { visibleY: config.visibleY, orientation: 'y' });

		if (config.style === 2)
			self.aclass(cls + '-style-2');

		self.event('scroll', function() {
			EMIT('scroll', self.name);
			EMIT('reflow', self.name);
		});

		self.event('click', 'button[name]', function() {
			var t = this;
			switch (t.name) {
				case 'submit':
					self.submit(self.hide);
					break;
				case 'cancel':
					!t.disabled && self[t.name](self.hide);
					break;
			}
		});

		config.enter && self.event('keydown', 'input', function(e) {
			e.which === 13 && !self.find('button[name="submit"]')[0].disabled && setTimeout(self.submit, 800);
		});
	};

	self.configure = function(key, value, init, prev) {
		if (!init) {
			switch (key) {
				case 'width':
					value !== prev && self.find(cls2).css('max-width', value + 'px');
					break;
				case 'closebutton':
					self.find(cls2 + '-button-close').tclass('hidden', value !== true);
					break;
			}
		}
	};

	self.esc = function(bind) {
		if (bind) {
			if (!self.$esc) {
				self.$esc = true;
				$(W).on('keydown', self.esc_keydown);
			}
		} else {
			if (self.$esc) {
				self.$esc = false;
				$(W).off('keydown', self.esc_keydown);
			}
		}
	};

	self.esc_keydown = function(e) {
		if (e.which === 27 && !e.isPropagationStopped()) {
			var val = self.get();
			if (!val || config.if === val) {
				e.preventDefault();
				e.stopPropagation();
				self.hide();
			}
		}
	};

	self.hideforce = function() {
		if (!self.hclass('hidden')) {
			self.aclass('hidden');
			self.release(true);
			self.find(cls2).rclass(cls + '-animate');
			W.$$fullform_level--;
		}
	};

	var allowscrollbars = function() {
		$('html').tclass(cls + '-noscroll', !!$(cls2 + '-container').not('.hidden').length);
	};

	self.setter = function(value, path, type) {

		setTimeout2(self.name + '-noscroll', allowscrollbars, 50);

		var isHidden = value !== config.if;

		if (self.hclass('hidden') === isHidden) {
			if (!isHidden) {
				config.reload && self.EXEC(config.reload, self);
				config.default && DEFAULT(self.makepath(config.default), true);
				config.scrolltop && self.scrollbar && self.scrollbar.scrollTop(0);
			}
			return;
		}

		setTimeout2(cls, function() {
			EMIT('reflow', self.name);
		}, 10);

		if (isHidden) {
			if (!config.independent)
				self.hideforce();
			return;
		}

		if (self.template) {
			var is = self.template.COMPILABLE();
			self.find(cls2).append(self.template);
			self.template = null;
			is && COMPILE();
		}

		if (W.$$fullform_level < 1)
			W.$$fullform_level = 1;

		W.$$fullform_level++;

		self.css('z-index', W.$$fullform_level * config.zindex);
		self.rclass('hidden');

		self.release(false);

		if (type !== 'restore') {
			config.scrolltop && self.scrollbar && self.scrollbar.scrollTop(0);
			config.reload && self.EXEC(config.reload, self);
			config.default && DEFAULT(self.makepath(config.default), true);
			if (!isMOBILE && config.autofocus) {
				setTimeout(function() {
					self.find(typeof(config.autofocus) === 'string' ? config.autofocus : 'input[type="text"],select,textarea').eq(0).focus();
				}, 1000);
			}
		}

		self.resize();

		setTimeout(function() {
			self.rclass('invisible');
			self.find(cls2).aclass(cls + '-animate');
			if (!init && isMOBILE) {
				$('body').aclass('hidden');
				setTimeout(function() {
					$('body').rclass('hidden');
				}, 50);
			}
			init = true;
		}, 300);

		// Fixes a problem with freezing of scrolling in Chrome
		setTimeout2(self.ID, function() {
			self.css('z-index', (W.$$fullform_level * config.zindex) + 1);
		}, 500);

		config.closeesc && self.esc(true);
	};
});

COMPONENT('shortcuts', function(self) {

	var items = [];
	var length = 0;
	var keys = {};
	var keys_session = {};
	var issession = false;

	self.singleton();
	self.readonly();
	self.blind();
	self.nocompile && self.nocompile();

	var cb = function(o, e) {
		o.callback(e, o.owner);
	};

	self.make = function() {

		$(W).on('keydown', function(e) {

			var f = e.key;
			var c = e.keyCode;

			if (f.length > 1 && f.charAt(0) === 'F')
				c = 0;
			else
				f = '-';

			// ctrl,alt,shift,meta,fkey,code
			var key = (e.ctrlKey ? 1 : 0) + '' + (e.altKey ? 1 : 0) + '' + (e.shiftKey ? 1 : 0) + '' + (e.metaKey ? 1 : 0) + f + c;

			if (issession) {
				if (!keys_session[key])
					return;
			} else {
				if (!keys[key])
					return;
			}

			if (length && !e.isPropagationStopped()) {
				for (var i = 0; i < length; i++) {
					var o = items[i];
					if (o.fn(e)) {
						if (o.prevent) {
							e.preventDefault();
							e.stopPropagation();
						}
						setTimeout(cb, 100, o, e);
						return;
					}
				}
			}
		});

		ON('component + knockknock', self.refresh);
	};

	self.refreshforce = function() {

		var arr = document.querySelectorAll('.shortcut');
		var index = 0;

		while (true) {
			var item = items[index++];
			if (item == null)
				break;
			if (item.owner) {
				index--;
				items.splice(index, 1);
			}
		}

		for (var i = 0; i < arr.length; i++) {
			var shortcut = arr[i].getAttribute('data-shortcut');
			shortcut && self.register(shortcut, self.execshortcut, true, arr[i]);
		}
	};

	self.session = function(callback) {
		issession = true;
		keys_session = {};
		callback(self.register);
	};

	self.end = function() {
		issession = false;
	};

	self.execshortcut = function(e, owner) {
		$(owner).trigger('click');
	};

	self.refresh = function() {
		setTimeout2(self.ID, self.refreshforce, 500);
	};

	self.exec = function(shortcut) {
		var item = items.findItem('shortcut', shortcut.toLowerCase().replace(/\s/g, ''));
		item && item.callback(EMPTYOBJECT, item.owner);
	};

	self.register = function(shortcut, callback, prevent, owner) {

		var currentkeys = issession ? keys_session : keys;

		shortcut.split(',').trim().forEach(function(shortcut) {

			var builder = [];
			var alias = [];
			var cachekey = [0, 0, 0, 0, '-', 0]; // ctrl,alt,shift,meta,fkey,code

			shortcut.split('+').trim().forEach(function(item) {
				var lower = item.toLowerCase();
				alias.push(lower);

				switch (lower) {
					case 'ctrl':
						cachekey[0] = 1;
						break;
					case 'alt':
						cachekey[1] = 1;
						break;
					case 'shift':
						cachekey[2] = 1;
						break;
					case 'win':
					case 'meta':
					case 'cmd':
						cachekey[3] = 1;
						break;
				}

				switch (lower) {
					case 'ctrl':
					case 'alt':
					case 'shift':
						builder.push('e.{0}Key'.format(lower));
						return;
					case 'win':
					case 'meta':
					case 'cmd':
						builder.push('e.metaKey');
						return;
					case 'ins':
						builder.push('e.keyCode===45');
						cachekey[5] = 45;
						return;
					case 'space':
						builder.push('e.keyCode===32');
						cachekey[5] = 32;
						return;
					case 'tab':
						builder.push('e.keyCode===9');
						cachekey[5] = 9;
						return;
					case 'esc':
						builder.push('e.keyCode===27');
						cachekey[5] = 27;
						return;
					case 'enter':
						builder.push('e.keyCode===13');
						cachekey[5] = 13;
						return;
					case 'backspace':
						builder.push('e.keyCode===8');
						cachekey[5] = 8;
						break;
					case 'del':
					case 'delete':
						builder.push('e.keyCode===46');
						cachekey[5] = 46;
						return;
					case 'save':
						builder.push('(e.metaKey&&e.keyCode===115)');
						cachekey[5] = -1;
						return;
					case 'remove':
						builder.push('((e.metaKey&&e.keyCode===8)||e.keyCode===46)');
						cachekey[5] = -1;
						return;
					case 'up':
						builder.push('e.keyCode===38');
						cachekey[5] = 38;
						return;
					case 'down':
						builder.push('e.keyCode===40');
						cachekey[5] = 40;
						return;
					case 'right':
						builder.push('e.keyCode===39');
						cachekey[5] = 39;
						return;
					case 'left':
						builder.push('e.keyCode===37');
						cachekey[5] = 37;
						return;
					case 'f1':
					case 'f2':
					case 'f3':
					case 'f4':
					case 'f5':
					case 'f6':
					case 'f7':
					case 'f8':
					case 'f9':
					case 'f10':
					case 'f11':
					case 'f12':
						var a = item.toUpperCase();
						builder.push('e.key===\'{0}\''.format(a));
						cachekey[4] = a;
						return;
					case 'capslock':
						builder.push('e.which===20');
						cachekey[5] = 20;
						return;
				}

				var num = item.parseInt();
				if (num) {
					builder.push('e.which===' + num);
					cachekey[5] = num;
				} else {
					num = item.toUpperCase().charCodeAt(0);
					cachekey[5] = num;
					builder.push('e.keyCode==={0}'.format(num));
				}
			});

			items.push({ shortcut: alias.join('+'), fn: new Function('e', 'return ' + builder.join('&&')), callback: callback, prevent: prevent, owner: owner });
			length = items.length;

			var k;

			// Remove
			if (cachekey[5] === -1) {
				cachekey[5] = 8;
				k = cachekey.join('');
				currentkeys[k] = 1;
				cachekey[5] = 46;
			}

			k = cachekey.join('');
			currentkeys[k] = 1;
		});

		if (!owner)
			self.refresh();

		return self;
	};
});

COMPONENT('textboxlist', 'maxlength:100;required:false;error:You reach the maximum limit;movable:false', function (self, config, cls) {

	var container, content;
	var empty = {};
	var skip = false;
	var cempty = cls + '-empty';
	var crequired = 'required';
	var helper = null;
	var cls2 = '.' + cls;

	self.setter = null;
	self.getter = null;
	self.nocompile && self.nocompile();

	self.template = Tangular.compile(('<div class="{0}-item"><div>'  + (config.movable ? '<i class="fa fa-angle-up {0}-up"></i><i class="fa fa-angle-down {0}-down"></i>' : '') + '<i class="fa fa-times {0}-remove"></i></div><div><input type="text" maxlength="{{ max }}" placeholder="{{ placeholder }}"{{ if disabled}} disabled="disabled"{{ fi }} value="{{ value }}" /></div></div>').format(cls));

	self.configure = function (key, value, init, prev) {

		if (init)
			return;

		var redraw = false;
		switch (key) {
			case 'disabled':
				self.tclass(crequired, value);
				self.find('input').prop('disabled', true);
				empty.disabled = value;
				self.reset();
				break;
			case 'maxlength':
				empty.max = value;
				self.find('input').prop(key, value);
				break;
			case 'placeholder':
				empty.placeholder = value;
				self.find('input').prop(key, value);
				break;
			case 'label':
				redraw = true;
				break;
			case 'icon':
				if (value && prev)
					self.find('i').rclass().aclass(value);
				else
					redraw = true;
				break;
		}

		if (redraw) {
			skip = false;
			self.redraw();
			self.refresh();
		}
	};

	self.redraw = function () {

		var icon = '';
		var html = config.label || content;

		if (config.icon)
			icon = '<i class="{0}"></i>'.format(config.icon.indexOf(' ') === -1 ? ('fa fa-' + config.icon) : config.icon);

		empty.value = '';
		self.tclass(cls + '-movable', !!config.movable);
		self.html((html ? ('<div class="' + cls + '-label{2}">{1}{0}:</div>').format(html, icon, config.required ? (' ' + cls + '-required') : '') : '') + ('<div class="' + cls + '-items"></div>' + self.template(empty).replace('-item"', '-item ' + cls + '-base"')));
		container = self.find(cls2 + '-items');
	};

	self.make = function () {

		empty.max = config.max;
		empty.placeholder = config.placeholder;
		empty.value = '';
		empty.disabled = config.disabled;

		if (config.disabled)
			self.aclass('ui-disabled');

		content = self.html();
		self.aclass(cls);
		self.redraw();

		self.event('focus', 'input', function() {
			config.autocomplete && self.EXEC(config.autocomplete, $(this), self);
		});

		self.move = function(offset, el) {

			var arr = self.get();
			var index = el.index();
			var tmp;

			if (offset === 1) {
				if (arr[index] == null || arr[index + 1] == null)
					return;
			} else {
				if (arr[index] == null || arr[index - 1] == null)
					return;
			}

			tmp = arr[index];
			arr[index] = arr[index + offset];
			arr[index + offset] = tmp;
			var items = self.find(cls2 + '-item');
			items.eq(index).find('input').val(arr[index]);
			items.eq(index + offset).find('input').val(arr[index + offset]);
		};

		self.event('click', cls2 + '-up', function () {
			self.move(-1, $(this).closest(cls2 + '-item'));
		});

		self.event('click', cls2 + '-down', function () {
			self.move(1, $(this).closest(cls2 + '-item'));
		});

		self.event('click', cls2 + '-remove', function () {

			if (config.disabled)
				return;

			var el = $(this);
			var parent = el.closest(cls2 + '-item');
			var value = parent.find('input').val();
			var arr = self.get();

			helper != null && helper.remove();
			helper = null;

			parent.remove();

			var index = arr.indexOf(value);
			if (index === -1)
				return;

			arr.splice(index, 1);

			self.tclass(cempty, !arr.length);
			self.tclass(crequired, config.required && !arr.length);

			skip = true;
			SET(self.path, arr, 2);
			self.change(true);
		});

		self.event('change keypress blur', 'input', function (e) {

			if ((e.type === 'keypress' && e.which !== 13) || config.disabled)
				return;

			var el = $(this);

			var value = this.value.trim();
			if (!value)
				return;

			var arr = [];
			var base = el.closest(cls2 + '-base');
			var len = base.length > 0;

			if (len && e.type === 'change')
				return;

			var raw = self.get();

			if (config.limit && len && raw.length >= config.limit) {
				if (!helper) {
					base.after(('<div class="' + cls + '-helper"><i class="fa fa-warning" aria-hidden="true"></i> {0}</div>').format(config.error));
					helper = container.closest(cls2).find(cls2 + '-helper');
				}
				return;
			}

			if (len) {

				if (!raw || raw.indexOf(value) === -1)
					self.push(value);

				this.value = '';
				self.change(true);
				return;
			}

			skip = true;

			container.find('input').each(function () {
				var temp = this.value.trim();
				switch (config.type) {
					case 'number':
						temp = temp.parseInt();
						break;
					case 'date':
						temp = temp.parseDate();
						break;
				}

				if (arr.indexOf(temp) === -1)
					arr.push(temp);
				else
					skip = false;
			});

			self.set(arr, 2);
			self.change(true);
		});
	};

	self.setter = function (value) {

		if (skip) {
			skip = false;
			return;
		}

		if (!value || !value.length) {
			self.aclass(cempty);
			config.required && self.aclass(crequired);
			container.empty();
			return;
		}

		self.rclass(cempty);
		self.rclass(crequired);
		var builder = [];

		for (var i = 0; i < value.length; i++) {
			empty.value = value[i];
			builder.push(self.template(empty));
		}

		container.empty().append(builder.join(''));
	};

	self.validate = function(value, init) {

		if (init)
			return true;

		var valid = !config.required;
		var items = container.children();

		if (!value || !value.length)
			return valid;

		for (var i = 0; i < value.length; i++) {
			var item = value[i];
			!item && (item = '');
			switch (config.type) {
				case 'email':
					valid = item.isEmail();
					break;
				case 'url':
					valid = item.isURL();
					break;
				case 'currency':
				case 'number':
					valid = item > 0;
					break;
				case 'date':
					valid = item instanceof Date && !isNaN(item.getTime());
					break;
				default:
					valid = item.length > 0;
					break;
			}
			items.eq(i).tclass(cls + '-item-invalid', !valid);
		}

		return valid;
	};

});


COMPONENT('snackbar','timeout:4000;button:OK',function(self,config,cls){var cls2='.'+cls,show=true,callback,delay;self.readonly();self.blind();self.nocompile&&self.nocompile();self.make=function(){self.aclass(cls+' hidden');self.append('<div><span class="{0}-dismiss"></span><span class="{0}-icon"></span><div class="{0}-body"></div></div>'.format(cls));self.event('click',cls2+'-dismiss',function(){self.hide();callback&&callback()})};self.hide=function(){clearTimeout2(self.ID);self.rclass(cls+'-visible');if(delay){clearTimeout(delay);self.aclass('hidden');delay=null}else{delay=setTimeout(function(){delay=null;self.aclass('hidden')},1000)}show=true};self.waiting=function(message,button,close){self.show(message,button,close,'spinner fa-pulse')};self.success=function(message,button,close){self.show(message,button,close,'check-circle')};self.warning=function(message,button,close){self.show(message,button,close,'times-circle')};self.show=function(message,button,close,icon){if(typeof(button)==='function'){close=button;button=null}callback=close;var ico=icon||'info-circle';if(ico.indexOf(' ')===-1)ico='fa fa-'+ico;self.find(cls2+'-icon').html('<i class="{0}"></i>'.format(ico));self.find(cls2+'-body').html(message).attr('title',message);self.find(cls2+'-dismiss').html(button||config.button);if(show){self.rclass('hidden');setTimeout(function(){self.aclass(cls+'-visible')},50)}setTimeout2(self.ID,self.hide,config.timeout+50);show=false};self.response=function(message,callback,response){var fn;if(typeof(message)==='function'){response=callback;fn=message;message=null}else if(typeof(callback)==='function')fn=callback;else{response=callback;fn=null}if(response instanceof Array){var builder=[];for(var i=0;i<response.length;i++){var err=response[i].error;err&&builder.push(err)}self.warning(builder.join('<br />'));SETTER('!loading/hide')}else if(typeof(response)==='string'){self.warning(response);SETTER('!loading/hide')}else{if(message){if(message.length<40&&message.charAt(0)==='?')SET(message,response);else self.success(message)}if(typeof(fn)==='string')SET(fn,response);else if(fn)fn(response)}}});
COMPONENT('websocket','reconnect:3000;encoder:false',function(self,config){var ws,url,queue=[],sending=false,isidle=false;self.online=false;self.readonly();self.nocompile&&self.nocompile();self.make=function(){url=(config.url||'').env(true);if(!url.match(/^(ws|wss):\/\//))url=location.origin.replace('http','ws')+(url.charAt(0)!=='/'?'/':'')+url;setTimeout(self.connect,500);self.destroy=function(){isidle=true;self.close()}};self.send=function(obj){var data=JSON.stringify(obj);if(config.encoder)queue.push(encodeURIComponent(data));else queue.push(data);self.process();return self};self.idletime=function(is){if(isidle!==is){isidle=is;if(is){ws&&self.close()}else{if(!ws)self.connect()}}};self.process=function(callback){if(!ws||!ws.send||sending||!queue.length||ws.readyState!==1){callback&&callback();return}sending=true;var async=queue.splice(0,3);async.wait(function(item,next){if(ws){ws.send(item);setTimeout(next,5)}else{queue.unshift(item);next()}},function(){callback&&callback();sending=false;queue.length&&self.process()})};self.close=function(isClosed){if(ws){self.online=false;ws.onopen=ws.onclose=ws.onmessage=null;!isClosed&&ws.close();ws=null;EMIT('online',false)}return self};function onClose(e){if(e.code===4001){location.href=location.href+'';return}e.reason&&WARN('WebSocket:',config.encoder?decodeURIComponent(e.reason):e.reason);self.close(true);if(!isidle)setTimeout(self.connect,config.reconnect)}function onMessage(e){var data;try{data=PARSE(config.encoder?decodeURIComponent(e.data):e.data);self.path&&self.set(data)}catch(e){WARN('WebSocket "{0}": {1}'.format(url,e.toString()))}data&&EMIT('message',data)}function onOpen(){self.online=true;self.process(function(){EMIT('online',true)})}self.connect=function(){ws&&self.close();setTimeout2(self.id,function(){ws=new WebSocket(url.env(true));ws.onopen=onOpen;ws.onclose=onClose;ws.onmessage=onMessage;self.ws=ws},100);return self}});