var http = require("http");
var mime = require("mime");
var accepts = require("accepts");
var crc32 = require("buffer-crc32");

var resProto = Object.create(http.ServerResponse.prototype);
resProto.isExpress = true;

//for rewrite setHeader;
resProto._setHeader = resProto.setHeader;

//Implement res.redirect
resProto.redirect = function(code, path) {
    if(code != 301){
        path = code;
        code = 302;
    }
    this.writeHeader(code, {
        "Content-length": 0,
        "Location": path,
        "Connection": "close"
    });
    this.end("");
};

//rewrite setHeader, save set status
resProto.setHeader = function(name, value) {
    if(name === "Content-Type") {
        this._contentTypeSet = true;
    }
    else if (name === "ETag") {
        //Don't override existing ETag header.
        if (this._etag) return;
        this._etag = value;
    }
    else if (name === "Last-Modified") {
        //Don't override existing modified header.
        if (this._lastModified) return;
        this._lastModified = value;
    }
    this._setHeader(name, value);
};

//Implement res.type
resProto.type = function(ext) {
    mime_type = mime.lookup(ext);
    this.setHeader("Content-Type", mime_type);
};

//Implement res.default_type
//sets the Content-Type if it wasn't already set.
resProto.default_type = function(ext) {
    mime_type = mime.lookup(ext);
    if (!this._contentTypeSet){
        this.setHeader("Content-Type", mime_type);
    }
};
/*
 *Implement res.format
 *res.format performs content-negotiation 
 *on the reqests's Accept header.
 */
resProto.format = function(formats_obj) {
    var formats, accept, accept_type;
    formats = Object.keys(formats_obj);
    accept = accepts(this.req);
    accept_type = accept.types(formats);
    if (JSON.stringify(accept_type) !== JSON.stringify(['*/*'])) {
        this.type(accept_type);
        formats_obj[accept.types(formats)]();
    }
    else{
        var err = new Error("Not Acceptable");
        err.statusCode = 406;
        throw err;
    }
};
/*
 *Implement res.send
 *Here's a list of things res.send does:
 *1. Can handle String or Buffer body.
 *2. Sets default Content-Type:
 *                1. default to text/html for String body.
 *                2. default to application/octet-stream for Buffer body.
 *3.Sets Content-Length.
 *4.If only a status code is given use http.STATUS_CODES[code] as body.
 *5.Respond in JSON format if given an object.
 *6.Calculates ETag (for conditional get).
 */
resProto.send = function(status, content) {
    var req_date, res_date, no_modify, etag;
    if(arguments.length === 1) {
        if(status in http.STATUS_CODES) {
            //If only a status code is given use http.STATUS_CODES[code] as body.
            content = http.STATUS_CODES[status];
        }
        else{
            content = status;
            //defaults status code to 200
            status = 200;
        }
    }
    //Conditional get with Last-Modified
    if (this.req.headers["if-modified-since"]);
        req_date = new Date(this.req.headers["if-modified-since"]);
        if(this._lastModified) {
            res_date = new Date(this._lastModified);
            no_modify = res_date <= req_date;
        }

    if (this.req.method === "GET" && content !== "" && content !== undefined){
        //Conditionnal get with ETag
        //if this._etag is undefined, use crc32.unsigned(content);
        etag = this._etag || ('"'+ crc32.unsigned(content) +'"');
        if (etag === this.req.headers["if-none-match"] || no_modify) {
            this.statusCode = 304;
            this.end(http.STATUS_CODES[304]);
            return;
        }
        else{
            this.setHeader("ETag", etag);
        }
    }
    //sets status code
    this.statusCode = status;
    //default to application/octet-stream for Buffer body.
    if(content instanceof Buffer) {
        this.default_type("bin");
    }
    //default to text/html for String body.
    else if (typeof content == "string") {
        this.default_type("html");
    }
    //Respond in JSON format if give an object.
    else if (typeof content == "object") {
        this.default_type("json");
        content = JSON.stringify(content);
    }
    this.length(content);
    this.end(content);
};

resProto.length = function(content) {
    this.setHeader("Content-Length", Buffer.byteLength(content));
};

module.exports = resProto;
