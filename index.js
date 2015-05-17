module.exports = express_factory;
var http = require("http");

function myexpress() {
    this.stack = [];
}

myexpress.prototype = http.createServer(
        function(req, res) {
            this._next = this._drive(reqr, res);
            function _next() {
                if (arguments.length >= 1){
                    this.error = arguments[0];
                }
                mid = this._next.next();
                if(mid.value !== undefined){
                    if (this.error !== undefined){
                        if(mid.value.length == 4){
                            mid.value(this.error, req, res, _next.bind(this));
                        }
                        else{
                            _next.bind(this)();
                        }
                    }
                    else{
                        try{
                            if(mid.value.length == 4){
                                _next.bind(this)();
                            }
                            else{
                                mid.value(req, res, _next.bind(this));
                            }
                        }
                        catch(e){
                            _next.bind(this)(e);
                        }
                    }
                }
            }
            //mid = this._next.next();
            //var next = this._next.next;
            //mid.value(req, res, next.bind(this._next));
            _next.call(this);
            if(this.error !== undefined){
                res.writeHeader(500);
                res.end('Internal Error');
            }
            else{
                res.writeHeader(404);
                res.end('Not Found');
            }
        });

myexpress.prototype.use = function(middleware) {
    //NOTE:should `.use` subApp first
    if(middleware instanceof myexpress){
        this.stack = this.stack.concat(middleware.stack);
    }
    else{
        this.stack.push(middleware);
    }
};

myexpress.prototype._drive = function* (req, res){
    //this._argvs = [req, res, this._next];
    var i;
    for(i=0;i<this.stack.length;i++){
        //var next = this._next.next;
        //yield this.stack[i](req, res, next.bind(this._next));
        yield this.stack[i];
    }
};

function express_factory() {
    return new myexpress();
}
