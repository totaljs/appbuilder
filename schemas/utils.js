NEWSCHEMA('Utils', function(schema) {

	schema.addWorkflow('uid', function($) {
		$.callback(UID());
	});

	schema.addWorkflow('ip', function($) {
		$.callback($.ip);
	});

});