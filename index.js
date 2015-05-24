module.exports = express_factory;

var http = require("http");
var Layer = require("./lib/layer");
var makeRoute = require("./lib/route");
var methods = require("methods");

function myexpress() {
    this.stack = [];
}

myexpress.prototype = http.createServer(
    function (req, res) {
        //main handler
        this.handle(undefined, req, res);
        //the default action
        if(req._my_error !== undefined){
            res.writeHeader(500);
            res.end('Internal Error');
        }
        else{
            res.writeHeader(404);
            res.end('Not Found');
        }
    }
);

myexpress.prototype.handle = function(err, req, res, next) {
    var orgUrl, matched, _iterator;
    _iterator = this._generator();
    orgUrl = req.url;
    req._my_error = err;
    function _next() {
        /*
         * subApp changed req.url so
         * resetting req.url to orgUrl
         */
        req.url = orgUrl;
        //dummy error handle
        if (arguments.length >= 1){
            req._my_error = arguments[0];
        }
        //item from `this.stack`
        var item = _iterator.next();
        var layer = item.value;
        //when item.done is true, the iterator is exhausted
        //so we discard it
        if(!item.done){
            matched = layer.match(req.url);
            if (layer.isSubApp){
                if(matched){
                    req.url = _trimming_path(req.url, layer.path);
                    layer.handle(req._my_error, req, res, _next);
                }
                else{
                    _next();
                }
            }
            else{
                if (req._my_error !== undefined){
                    //TODO
                    //we must ensure err_handler.length == 4
                    //think of : function err_handler(err, req, res){}
                    //so this is not a good way
                    if(layer.handle.length == 4 && matched){
                        req.params = matched.params;
                        layer.handle(req._my_error, req, res, _next);
                    }
                    else{
                        _next();
                    }
                }
                else{
                    try{
                        if(layer.handle.length <= 3 && matched){
                            req.params = matched.params;
                            layer.handle(req, res, _next);
                        }
                        else{
                            _next();
                        }
                    }
                    catch(e){
                        _next(e);
                    }
                }
            }
        }
    }
    //march
    _next();
    //back to the previous handler
    if (next){
        next();
    }
};
myexpress.prototype.use = function(path, middleware, options) {
    //mount middleware
    if (arguments.length == 1){
        middleware = path;
        path = '/';
    }
    var layer = new Layer(path, middleware, options);
    this.stack.push(layer);
};

myexpress.prototype._generator = function* (){
    var i;
    for(i=0;i<this.stack.length;i++){
        yield this.stack[i];
    }
};

function _trimming_path(url, path) {
    if (path.endsWith('/')){
        return url.replace(path.slice(0,path.length-1), '');
    }
    else{
        return url.replace(path, '');
    }
}

//Loop over the verbs and generate methods
methods.forEach(function(method) {
        myexpress.prototype[method] = function(path, middleware) {
            middleware = makeRoute(method, middleware);
            this.use(path, middleware, {end:true});
        };
    });

function express_factory() {
    return new myexpress();
}
