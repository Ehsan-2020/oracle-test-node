// server.js

var express = require('express');
var example = require('./example.js');

var app = express();

var PORT = 3000;

app.get('/', function (req, res) {
	example.run(req, res);
});

app.listen(PORT, function () {
	console.log('Oracle test client is running on PORT:', PORT);
});
