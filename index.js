module.exports = express_factory;
var http = require("http");

function myexpress() {
    this.stack = [];
}

myexpress.prototype = http.createServer(
        function(req, res) {
            req._iterator = this._generator(req, res);
            function _next() {
                if (arguments.length >= 1){
                    req._my_error = arguments[0];
                }
                var mid = req._iterator.next();
                if(mid.value !== undefined){
                    if (req._my_error !== undefined){
                        if(mid.value.length == 4){
                            mid.value(req._my_error, req, res, _next);
                        }
                        else{
                            _next();
                        }
                    }
                    else{
                        try{
                            if(mid.value.length == 4){
                                _next();
                            }
                            else{
                                mid.value(req, res, _next);
                            }
                        }
                        catch(e){
                            _next(e);
                        }
                    }
                }
            }
            //mid = this._next.next();
            //var next = this._next.next;
            //mid.value(req, res, next.bind(this._next));
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

myexpress.prototype.use = function(middleware) {
    //NOTE:should `subApp.use(middleware)` before `app.use(subApp)`
    if(middleware instanceof myexpress){
        this.stack = this.stack.concat(middleware.stack);
    }
    else{
        this.stack.push(middleware);
    }
};

myexpress.prototype._generator = function* (req, res){
    var i;
    for(i=0;i<this.stack.length;i++){
        yield this.stack[i];
    }
};

function express_factory() {
    return new myexpress();
}
