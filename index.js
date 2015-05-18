module.exports = express_factory;
var http = require("http");
var Layer = require("./lib/layer");

function myexpress() {
    this.stack = [];
}

myexpress.prototype = http.createServer(
        function(req, res) {
            _iterator = this._generator();
            function _next() {
                if (arguments.length >= 1){
                    req._my_error = arguments[0];
                    console.log(req._my_error);
                }
                var item = _iterator.next();
                var layer = item.value ;
                if(layer !== undefined){
                    if (req._my_error !== undefined){
                        if(layer.handle.length == 4 && layer.match(req.url)){
                            layer.handle(req._my_error, req, res, _next);
                        }
                        else{
                            _next();
                        }
                    }
                    else{
                        try{
                            if(layer.handle.length <= 3 && layer.match(req.url)){
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
            _next();
            if(req._my_error !== undefined){
                res.writeHeader(500);
                res.end('Internal Error');
            }
            else{
                res.writeHeader(404);
                res.end('Not Found');
            }
        });

myexpress.prototype.use = function(path, middleware) {
    //NOTE:should `subApp.use(middleware)` before `app.use(subApp)`
    if(middleware instanceof myexpress){
        this.stack = this.stack.concat(middleware.stack);
    }
    else{
        if (arguments.length == 1){
            middleware = path;
            path = '/';
        }
        var layer = new Layer(path, middleware);
        this.stack.push(layer);
    }
};

myexpress.prototype._generator = function* (){
    var i;
    for(i=0;i<this.stack.length;i++){
        yield this.stack[i];
    }
};

function express_factory() {
    return new myexpress();
}
