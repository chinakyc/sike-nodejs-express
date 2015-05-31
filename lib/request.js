var http = require("http");

var reqProto = Object.create(http.IncomingMessage.prototype);
reqProto.isExpress = true;

//console.dir(reqProto.__proto__);
module.exports = reqProto;
