module.exports = createInjector;

function getParameters(fn) {
    var fnText = fn.toString();
    if(getParameters.cache[fnText]) {
        return getParameters.cache[fnText];
    }

    var FN_ARGS        = /^function\s*[^\(]*\(\s*([^\)]*)\)/m,
        FN_ARG_SPLIT   = /,/,
        FN_ARG         = /^\s*(_?)(\S+?)\1\s*$/,
        STRIP_COMMECTS = /((\/\/.*$)|(\/*[\s\S]*?\*\/))/mg;

    var inject = [];
    var argDec1 = fnText.replace(STRIP_COMMECTS, '').match(FN_ARGS);
    argDec1[1].split(FN_ARG_SPLIT).forEach(function(arg) {
        arg.replace(FN_ARG, function(all, underscore, name) {
            inject.push(name);
        });
    });
    getParameters.cache[fn] = inject;
    return inject;
}
getParameters.cache = {};

function createInjector(handler, app) {
    extract_params = getParameters(handler);
    function injector(req, res, next) {
        
    }
    injector.extract_params = function() {
        return extract_params;
    };
    injector.dependencies_loader = function() {
        var values = [];
        extract_params.forEach(function(name) {
            if(name in app._factories){
                if(typeof app._factories[name] === "function") {
                    app._factories[name]();
                }
                values.push(app._factories[name]);
            }
        });
        return function(fn) {
            fn(err, values);
        };
    }; return injector; }
