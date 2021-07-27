NEWSCHEMA('Encoder', function(schema) {

	schema.define('type', ['crc32', 'crc32unsigned', 'md5', 'sha1', 'sha256', 'sha512', 'hexe', 'hexd'], true);
	schema.define('body', '[String]', true);

	schema.addWorkflow('exec', function($) {
		var model = $.model;
		var is16 = !!$.query.is16;
		for (var i = 0; i < model.body.length; i++) {
			if (model.type === 'hexe')
				model.body[i] = U.createBuffer(model.body[i]).toString('hex');
			else if (model.type === 'hexd')
				model.body[i] = U.createBuffer(model.body[i], 'hex').toString('utf8');
			else {
				var d = model.body[i].hash(model.type);
				model.body[i] = is16 ? d.toString(16) : d.toString();
			}
		}
		$.callback(model.body);
	});

});