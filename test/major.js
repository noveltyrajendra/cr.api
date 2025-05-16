//During the test the env variable is set to test
process.env.NODE_ENV = 'develpoment';

//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../server');
let should = chai.should();

chai.use(chaiHttp);

//Our parent block
describe('Majors', function() {

  describe('/GET get all majors', function() {
    it('it should return all majors', function(done) {
      chai.request(server)
            .get('/api/majors')
            .end(function(err, res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.data.should.be.a('array');
                res.body.data.length.should.be.above(0);
              done();
            });
    });
  });

    describe('/GET majors by title', function() {
    it('it should return all majors which includes title as Agriculture', function(done) {
      chai.request(server)
            .get('/api/majors/Agriculture')
            .end(function(err, res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.data.should.be.a('array');
                res.body.data.length.should.be.above(0);
              done();
            });
    });
  });


  describe('/GET majors by levelId', function() {
    it('it should return majors for label 3', function(done) {
      chai.request(server)
            .get('/api/majors/level/3')
            .end(function(err, res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.data.should.be.a('array');
              done();
            });
    });
  });  

  describe('/GET majors by collegeId', function() {
    it('it should return majors for college 2', function(done) {
      chai.request(server)
            .get('/api/majors/college/2')
            .end(function(err, res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.data.should.be.a('array');
              done();
            });
    });
  });  

  describe('/GET majors by college and level', function() {
    it('it should return majors for college 2 and label 3', function(done) {
      chai.request(server)
            .get('/api/majors/college/2/level/3')
            .end(function(err, res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.data.should.be.a('array');
              done();
            });
    });
  });  


});