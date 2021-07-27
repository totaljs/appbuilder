exports.install = function() {
	ROUTE('SOCKET /', socket, ['csrf']);
};

function socket() {

	var self = this;

	self.autodestroy(() => MAIN.ws = null);
	MAIN.ws = self;

	self.on('message', function(client, msg) {
		self.send(msg, conn => conn.ID === client.ID && conn !== client);
	});
}