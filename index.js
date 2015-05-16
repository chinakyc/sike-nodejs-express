module.exports = express_factory;

function myexpress() {
    this.stack = [];
}

myexpress.prototype.use = function(middleware) {
    this.stack.push(middleware);
};

function express_factory() {
    return new myexpress();
}
