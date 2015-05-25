var p2re = require("path-to-regexp");
var makeRoute = require("./route");

function Layer(path, middleware, options) {
    this.keys = [];
    this.path = path;
    if(!options){
        options = {end: false};
    }
    this._path = p2re(path, this.keys, options);
    if(typeof middleware.handle == 'function'){
        if(middleware.isRoute){
            this.handle = middleware.handle.bind(middleware);
            this.isRoute = true;
        }
        else{
            this.handle = middleware.handle.bind(middleware);
            this.isSubApp = true;
        }
    }
    else{
        this.handle = middleware;
    }
}
Layer.prototype.match = function(url) {
    if(this._path.test(url)){
        url = decodeURIComponent(url);
        var m = this._path.exec(url);
        var match= {path : m[0], params : {}};
        for (var i=1; i<m.length; i++) {
            if (typeof m[i] == 'string'){
                var name = this.keys[(i-1)].name;
                match.params[name] = m[i];
            }
            else{
                break;
            }
        }
        return match;
    }
    return undefined;
};

module.exports = Layer;
