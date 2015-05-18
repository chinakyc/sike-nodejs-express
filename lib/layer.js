function Layer(path, middleware) {
    this.path = path;
    this.handle = middleware;
}
Layer.prototype.match = function(url) {
    if(this.path == url.slice(0,this.path.length)){
        return {"path" : this.path};
    }
    return undefined;
};

module.exports = Layer;
