module.exports = makeRoute;

function makeRoute(verb, handler){
    return function(req,res,next){
        if(req.method.toLowerCase() === verb){
            return handler(req, res, next);
        }
        else{
            next();
        }
    };
}
