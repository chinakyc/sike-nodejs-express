var expect = require("chai").expect;
var request = require("supertest");
var myexperss = require("../");
var Layer = require("../lib/layer");

describe("myexperss", function() {
    before(function() {
        app = myexperss();
    });

    it("should have property `stack`", function() {
        expect(app).to.have.property("stack");
    });

    it("should have property `use`", function() {
        expect(app).to.have.property("use");
    });

    it("should `.stack` instanceof Array", function() {
        expect(app.stack).to.be.an.instanceof(Array);
    });

    it("should `.use` instanceof Function", function() {
        expect(app.use).to.be.an.instanceof(Function);
    });

});

describe(".use", function() {
    var app, test;
    before(function() {
        app = myexperss();
        test = function() {};
    });
    
    it("should `.use` add middlewares to `.stack`", function() {
        expect(app.stack).to.be.empty;
        app.use(test);
        expect(app.stack).to.not.empty;
    });
});

describe("calling middleware stack", function() {
    var app; 
    beforeEach(function() {
        app = myexperss();
    });
    afterEach(function() {
        app.close();
    });

    it("Should be able to call a single middleware", function(done) {
        var m1 = function(req, res, next) {
            res.end("hello from m1");
        };
        app.use(m1);
        app.listen(4000);
        request("http://127.0.0.1:4000")
        //request(app)
            .get("/")
            .expect("hello from m1")
            .end(done);
    });

    it("Should be able to call next to go to the next middleware", function(done) {
        var m1 = function(req, res, next) {
            next();
        };
        var m2 = function(req, res, next) {
            res.end("hello from m2");
        };
        app.use(m1);
        app.use(m2);
        app.listen(4000);
        request("http://127.0.0.1:4000")
        //request(app)
            .get("/")
            .expect("hello from m2")
            .end(done);
    });

    it("Should 404 at the end of middleware chain", function(done) {
        var m1 = function(req, res, next) {
            next();
        };
        var m2 = function(req, res, next) {
            next();
        };
        app.use(m1);
        app.use(m2);
        app.listen(4000);
        request("http://127.0.0.1:4000")
        //request(app)
            .get("/")
            .expect(404)
            .end(done);
    });

    it("Should 404 if no middleware is added", function(done) {
        app.listen(4000);
        request("http://127.0.0.1:4000")
        //request(app)
            .get("/")
            .expect(404)
            .end(done);
    });
});

describe("Implement Error Handling", function() {
    var app; 
    beforeEach(function() {
        app = new myexperss();
    });
    afterEach(function() {
        app.close();
    });

    it("should return 500 for unhandled error", function(done) {
        var m1 = function(req,res,next) {
        next(new Error("boom!"));
        };
        app.use(m1);
        request(app).get("/").expect(500).end(done);
    });

    it("Slould return 500 for uncaught error", function(done){
        var m1 = function(req,res,next) {
            throw new Error("boom!");
        };
        app.use(m1);
        request(app)
        //request(app)
            .get("/")
            .expect(500)
            .end(done);
    });

    it("Slould skip error handlers when next is called without an error", function(done) {
        var m1 = function(req, res, next) {
            next();
        };
        var e1 = function(err, req, res, next) {

        };
        var m2 = function(req, res, next) {
            res.end("m2");
        };
        app.use(m1);
        app.use(e1);
        app.use(m2);
        request(app)
            .get("/")
            .expect("m2")
            .end(done);
    });

    it("should skip normal middlewares if next is called with an error", function(done) {
        var m1 = function(req, res, next) {
            next(new Error("boom!"));
        };
        var m2 = function(req, res, next) {

        };
        var e1 = function(err, req, res, next) {
            res.end("e1");
        };

        app.use(m1);
        app.use(m2);
        app.use(e1);
        request(app)
            .get("/")
            .expect("e1")
            .end(done);
    });
});
describe('Implement App embedding as middleware', function() {
    var app, subApp;
    beforeEach(function() {
        app = myexperss();
        subApp = myexperss();
    });
    it('Should pass unhandled request to parent', function(done) {
        var m2 = function(req, res, next) {
            res.end('m2');
        };
        app.use(subApp);
        app.use(m2);
        request(app)
            .get("/")
            .expect("m2")
            .end(done);
    });
    it('Should pass unhandled error to parent', function(done) {
        var m1 = function(req, res, next) {
            next("m1 error");
        };
        function e1(err, req, res, next) {
            res.end(err);
        }
        //should `.use` subApp first
        subApp.use(m1);
        app.use(subApp);
        app.use(e1);

        request(app)
            .get("/")
            .expect("m1 error")
            .end(done);
    });

});

describe("Leary class and the match method", function() {
    var layer, middleware;
    beforeEach(function(){
        middleware = function(){};
        layer = new Layer('/foo',middleware);
    });

    it("set layer.handle to be the middleware", function(){
        expect(layer.handle).to.eql(middleware);
    });

    it("set returns undefined if path doesn't match", function(){
        expect(layer.match('bar')).to.be.an.undefined;
    });

    it("return matched path if layer matches the request path exactly", function(){
        expect(layer.match('/foo')).to.eql({"path" : layer.path});
    });

    it("return matched prefix if layer matches matches the prefix of the request", function(){
        expect(layer.match('/foo/bar')).to.eql({"path" : layer.path});
    });
});

describe("app.use should add a Layer to stack", function(){
    var app, layer, middleware;
    before(function(){
        app = myexperss();
        middleware = function(){};
    });

    it("first layer's path should be /", function(){
        app.use(middleware);
        expect(app.stack[0].path).to.eql('/');
    });

    it("second layer's path should be /", function(){
        app.use('/foo', middleware);
        expect(app.stack[1].path).to.eql('/foo');
    });

});

describe("The middlewares called should match request path", function(){
    var app;
    before(function(){
        app = myexperss();
        app.use("/foo", function(req,res,next){
            res.end("foot");
        });
        app.use(function(req,res){
            res.end("root");
        });
    });

    it("returns root for GET/", function(done){
        request(app)
            .get('/')
            .expect('root')
            .end(done);
    });
    
    it("returns root for GET /foo", function(done){
        request(app)
            .get('/foo')
            .expect('foot')
            .end(done);
    });
    
    it("returns root for GET /foo/bar", function(done){
        request(app)
            .get('/foo/bar')
            .expect('foot')
            .end(done);
    });
});

describe("The error handlers called should match request path:",function() {
  var app;
  before(function() {
    app = myexperss();
    app.use("/foo",function(req,res,next) {
      throw "boom!";
    });

    app.use("/foo/a",function(err,req,res,next) {
      res.end("error handled /foo/a");
    });

    app.use("/foo/b",function(err,req,res,next) {
      res.end("error handled /foo/b");
    });
  });

  it("handles error with /foo/a",function(done) {
    request(app).get("/foo/a").expect("error handled /foo/a").end(done);
  });

  it("handles error with /foo/b",function(done) {
    request(app).get("/foo/b").expect("error handled /foo/b").end(done);
  });

  it("returns 500 for /foo",function(done) {
    request(app).get("/foo").expect(500).end(done);
  });
});
