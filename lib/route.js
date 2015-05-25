module.exports = route_factory;

var myexpress = require("../");
var methods = require("methods");

function makeRoute() {
    this.stack = [];
}

makeRoute.prototype.isRoute = true;

makeRoute.prototype.use = function(verb, handler) {
    this.stack.push({verb:verb, handler: handler});
};

makeRoute.prototype.handle = function(err, req, res, next) {
    var matched;
    _iterator = this._generator();
    req._my_error = err;
    function _next() {
        if (arguments.length >= 1){
            if(arguments[0] === 'route'){
                //handle for next('routing')
                //bypass the remaining processors
                //returns control to parent
                next();
            }
            else{
                //dummy error handle
                req._my_error = arguments[0];
            }
        }
        //item from `this.stack`
        var item = _iterator.next();
        var handle = item.value;
        //when item.done is true, the iterator is exhausted
        //so we discard it 
        if(!item.done){
            matched = (handle.verb === req.method.toLowerCase());
            if (req._my_error !== undefined){
                if(handle.handler.length == 4 && matched){
                    //req.params = matched.params;
                    handle.handler(req._my_error, req, res, _next);
                }
                    else{
                        _next();
                    }
                }
            else{
                try{
                    if((handle.handler.length <= 3 && matched) || handle.verb === 'all'){
                        //req.params = matched.params;
                        handle.handler(req, res, _next);
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
    if(next){
        next();
    }
        
};

makeRoute.prototype._generator = function* (){
    for(i of this.stack){
        yield i;
    }
};

//add custom verb
methods.push("all");
//Loop over the verbs and generate methods
methods.forEach(function(method) {
        makeRoute.prototype[method] = function(middleware) {
            this.use(method, middleware);
            return this;
        };
    });

function route_factory() {
    return new makeRoute();
}
