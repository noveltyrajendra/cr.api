//During the test the env variable is set to test
process.env.NODE_ENV = 'develpoment';

//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../server');
let should = chai.should();

chai.use(chaiHttp);

//Our parent block
describe('Level', function() {
  describe('/GET all levels', function() {
    it('it should return all active levels', function(done) {
      chai.request(server)
            .get('/api/levels')
            .end(function(err, res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.data.should.be.a('array');
                res.body.data.length.should.be.above(0);
              done();
            });
    });
  });

});