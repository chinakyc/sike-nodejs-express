#!/usr/bin/env node
var express = require("../");
var app = express();

app.use(function(req, res, next) {
    res.end('hahaha');
});

app.listen(4000);

