exports.install = function() {

	ROUTE('API    /api/    +minify                  *Minify    --> exec', 1024 * 5);
	ROUTE('API    /api/    +encoder                 *Encoder   --> exec');
	ROUTE('API    /api/    -ip                      *Utils     --> ip');
	ROUTE('API    /api/    -uid                     *Utils     --> uid');
	ROUTE('API    /api/    -autocomplete_modules    *List      --> modules');
	ROUTE('API    /api/    -autocomplete_config     *List      --> config');

	ROUTE('GET    /api/download/', download);
};

function download() {
	var $ = this;
	var opt = {};
	opt.url = $.query.url;
	opt.limit = 1024 * 5;
	opt.custom = true;
	opt.callback = function(err, response) {
		if (err)
			$.throw400();
		else
			$.stream('application/json', response.stream);
	};
	REQUEST(opt);
}