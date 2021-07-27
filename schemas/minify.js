const Exec = require('child_process').exec;
const Fs = require('fs');

NEWSCHEMA('Minify', function(schema) {

	schema.define('compiled', 'String', true);

	schema.addWorkflow('exec', function($, model) {

		var filename = PATH.temp('compiled_' + Date.now().toString(36) + '.js');
		Fs.writeFile(filename, model.compiled, function() {
			Exec('uglifyjs --compress --mangle -- ' + filename, function(err, response) {

				Fs.unlink(filename, NOOP);

				if (err)
					$.callback(model.compiled);
				else
					$.callback(response);
			});
		});

	});

});