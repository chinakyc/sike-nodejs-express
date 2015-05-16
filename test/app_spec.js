var expect = require("chai").expect;
var request = require("supertest");
var myexperss = require("../");

describe("myexperss", function() {
    before(function() {
        app = myexperss();
    });

    it("should have property `stack`", function() {
        expect(app).to.have.property('stack');
    });

    it("should have property `use`", function() {
        expect(app).to.have.property('use');
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

    it('Should be able to call a single middleware', function(done) {
        var m1 = function(req, res, next) {
            res.end("hello from m1");
        };
        app.use(m1);
        //app.listen(4000);
        //request('http://127.0.0.1:4000')
        request(app)
            .get('/')
            .expect("hello from m1")
            .end(done);
    });
});
