//During the test the env variable is set to test
process.env.NODE_ENV = 'develpoment';

//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../server');
let should = chai.should();

chai.use(chaiHttp);

//Our parent block
describe('College', function() {

  describe('/GET default college', function() {
    it('it should return default college', function(done) {
      chai.request(server)
            .get('/api/college/default')
            .end(function(err, res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.data.should.be.a('array');
                res.body.data.length.should.be.above(0);
              done();
            });
    });
  });

    describe('/GET college list', function() {
    it('it should return all college', function(done) {
      chai.request(server)
            .get('/api/college/list')
            .end(function(err, res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.data.should.be.a('array');
                res.body.data.length.should.be.above(0);
              done();
            });
    });
  });


  describe('/GET college by id', function() {
    it('it should return college profile for college id 1', function(done) {
      chai.request(server)
            .get('/api/college/1')
            .end(function(err, res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.data.should.be.a('object');
              done();
            });
    });
  });  


  describe('/Search college ', function() {
    it('it should return colleges when searched with state', function(done) {
      chai.request(server)
            .post('/api/college/Search')
            .send({
              state:['AK']
            })
            .end(function(err, res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.count.should.be.above(0);
              done();
            });
    });

    it('it should return colleges when searched with majors', function(done) {
      chai.request(server)
            .post('/api/college/Search')
            .send({
              majors:[390201,44]
            })
            .end(function(err, res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.count.should.be.above(0);
              done();
            });
    });

  it('it should return colleges when searched with religious affiliation', function(done) {
      chai.request(server)
            .post('/api/college/Search')
            .send({
              religiousAffiliation:"United Methodist"
            })
            .end(function(err, res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.count.should.be.above(0);
              done();
            });
    });

   it('it should return colleges when searched with ethnic affiliation', function(done) {
      chai.request(server)
            .post('/api/college/Search')
            .send({
              ethnicAffiliation:"No ethnic affiliation"
            })
            .end(function(err, res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.count.should.be.above(0);
              done();
            });
    });

    it('it should return colleges when searched with publicOrPrivate', function(done) {
      chai.request(server)
            .post('/api/college/Search')
            .send({
              publicOrPrivate:"public"
            })
            .end(function(err, res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.count.should.be.above(0);
              done();
            });
    });

     it('it should return colleges when searched with years offered', function(done) {
      chai.request(server)
            .post('/api/college/Search')
            .send({
              yearsOffered:"2 year"
            })
            .end(function(err, res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.count.should.be.above(0);
              done();
            });
    });

     it('it should return colleges when searched with gender preference', function(done) {
      chai.request(server)
            .post('/api/college/Search')
            .send({
              genderPreference:"Coed School"
            })
            .end(function(err, res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.count.should.be.above(0);
              done();
            });
    });

    it('it should return colleges when searched with school setting', function(done) {
      chai.request(server)
            .post('/api/college/Search')
            .send({
              schoolSetting:"town"
            })
            .end(function(err, res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.count.should.be.above(0);
              done();
            });
    });

    it('it should return colleges when searched with provideOnlineGraduateClasses ', function(done) {
      chai.request(server)
            .post('/api/college/Search')
            .send({
              provideOnlineGraduateClasses:"yes"
            })
            .end(function(err, res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.count.should.be.above(0);
              done();
            });
    });

    it('it should return colleges when searched with provideOnlineUnderGraduateClasses ', function(done) {
      chai.request(server)
            .post('/api/college/Search')
            .send({
              provideOnlineUnderGraduateClasses:"yes"
            })
            .end(function(err, res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.count.should.be.above(0);
              done();
            });
    });

    it('it should return colleges when searched with provideOnlineClasses ', function(done) {
      chai.request(server)
            .post('/api/college/Search')
            .send({
              provideOnlineClasses:"yes"
            })
            .end(function(err, res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.count.should.be.above(0);
              done();
            });
    });

    it('it should return colleges when searched with underGraduateTuitionFrom ', function(done) {
      chai.request(server)
            .post('/api/college/Search')
            .send({
              underGraduateTuitionFrom:1000
            })
            .end(function(err, res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.count.should.be.above(0);
              done();
            });
    });

    it('it should return colleges when searched with underGraduateTuitionTo ', function(done) {
      chai.request(server)
            .post('/api/college/Search')
            .send({
              underGraduateTuitionTo:2000
            })
            .end(function(err, res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.count.should.be.above(0);
              done();
            });
    });

    it('it should return colleges when searched with graduateTuitionFrom ', function(done) {
      chai.request(server)
            .post('/api/college/Search')
            .send({
              graduateTuitionFrom:1000
            })
            .end(function(err, res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.count.should.be.above(0);
              done();
            });
    });

    it('it should return colleges when searched with graduateTuitionTo ', function(done) {
      chai.request(server)
            .post('/api/college/Search')
            .send({
              graduateTuitionTo:2000
            })
            .end(function(err, res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.count.should.be.above(0);
              done();
            });
    });

    it('it should return colleges when searched with underGraduatePopulationFrom ', function(done) {
      chai.request(server)
            .post('/api/college/Search')
            .send({
              underGraduatePopulationFrom:10
            })
            .end(function(err, res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.count.should.be.above(0);
              done();
            });
    });

    it('it should return colleges when searched with underGraduatePopulationTo ', function(done) {
      chai.request(server)
            .post('/api/college/Search')
            .send({
              underGraduatePopulationTo:1000
            })
            .end(function(err, res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.count.should.be.above(0);
              done();
            });
    });

     it('it should return colleges when searched with graduatePopulationFrom ', function(done) {
      chai.request(server)
            .post('/api/college/Search')
            .send({
              graduatePopulationFrom:10
            })
            .end(function(err, res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.count.should.be.above(0);
              done();
            });
    });

    it('it should return colleges when searched with graduatePopulationTo ', function(done) {
      chai.request(server)
            .post('/api/college/Search')
            .send({
              graduatePopulationTo:10000
            })
            .end(function(err, res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.count.should.be.above(0);
              done();
            });
    });

    it('it should return colleges when searched with giStudentFrom ', function(done) {
      chai.request(server)
            .post('/api/college/Search')
            .send({
              giStudentFrom:10
            })
            .end(function(err, res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.count.should.be.above(0);
              done();
            });
    });

    it('it should return colleges when searched with giStudentTo ', function(done) {
      chai.request(server)
            .post('/api/college/Search')
            .send({
              giStudentTo:10000
            })
            .end(function(err, res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.count.should.be.above(0);
              done();
            });
    });

    it('it should return colleges when searched with bahFrom ', function(done) {
      chai.request(server)
            .post('/api/college/Search')
            .send({
              bahFrom:10
            })
            .end(function(err, res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.count.should.be.above(0);
              done();
            });
    });

    it('it should return colleges when searched with bahTo ', function(done) {
      chai.request(server)
            .post('/api/college/Search')
            .send({
              bahTo:10000
            })
            .end(function(err, res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.count.should.be.above(0);
              done();
            });
    });


    it('it should return colleges when searched with sva ', function(done) {
      chai.request(server)
            .post('/api/college/Search')
            .send({
              provideSva:"yes"
            })
            .end(function(err, res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.count.should.be.above(0);
              done();
            });
    });


    it('it should return colleges when searched with provide fulltime veteran counselor ', function(done) {
      chai.request(server)
            .post('/api/college/Search')
            .send({
              provideFullTimeVeteranCounselor:"yes"
            })
            .end(function(err, res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.count.should.be.above(0);
              done();
            });
    });

    it('it should return colleges when searched with principles of excellence ', function(done) {
      chai.request(server)
            .post('/api/college/Search')
            .send({
              principlesOfExcellence:"yes"
            })
            .end(function(err, res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.count.should.be.above(0);
              done();
            });
    });

    it('it should return colleges when searched with associaion on campus ', function(done) {
      chai.request(server)
            .post('/api/college/Search')
            .send({
              associaionOnCampus:"yes"
            })
            .end(function(err, res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.count.should.be.above(0);
              done();
            });
    });

    it('it should return colleges when searched with upwardBound ', function(done) {
      chai.request(server)
            .post('/api/college/Search')
            .send({
              upwardBound:"yes"
            })
            .end(function(err, res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.count.should.be.above(0);
              done();
            });
    });

    it('it should return colleges when searched with eightKeys ', function(done) {
      chai.request(server)
            .post('/api/college/Search')
            .send({
              eightKeys:"yes"
            })
            .end(function(err, res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.count.should.be.above(0);
              done();
            });
    });

    it('it should return colleges when searched with rotcService ', function(done) {
      chai.request(server)
            .post('/api/college/Search')
            .send({
              rotcService:"yes"
            })
            .end(function(err, res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.count.should.be.above(0);
              done();
            });
    });

    it('it should return colleges when searched with isMemberOfSoc ', function(done) {
      chai.request(server)
            .post('/api/college/Search')
            .send({
              isMemberOfSoc:"yes"
            })
            .end(function(err, res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.count.should.be.above(0);
              done();
            });
    });

    it('it should return colleges when searched with aceCredit ', function(done) {
      chai.request(server)
            .post('/api/college/Search')
            .send({
              aceCredit:"yes"
            })
            .end(function(err, res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.count.should.be.above(0);
              done();
            });
    });


    it('it should return colleges when searched with clepCredit ', function(done) {
      chai.request(server)
            .post('/api/college/Search')
            .send({
              clepCredit:"yes"
            })
            .end(function(err, res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.count.should.be.above(0);
              done();
            });
    });

    it('it should return colleges when searched with dsstCredit ', function(done) {
      chai.request(server)
            .post('/api/college/Search')
            .send({
              dsstCredit:"yes"
            })
            .end(function(err, res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.count.should.be.above(0);
              done();
            });
    });

    it('it should return colleges when searched with inStateTuitionForActiveDuty ', function(done) {
      chai.request(server)
            .post('/api/college/Search')
            .send({
              inStateTuitionForActiveDuty:"yes"
            })
            .end(function(err, res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.count.should.be.above(0);
              done();
            });
    });

    it('it should return colleges when searched with approvedTaFunding ', function(done) {
      chai.request(server)
            .post('/api/college/Search')
            .send({
              approvedTaFunding:"yes"
            })
            .end(function(err, res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.count.should.be.above(0);
              done();
            });
    });

    it('it should return colleges when searched with yellowRibbon ', function(done) {
      chai.request(server)
            .post('/api/college/Search')
            .send({
              yellowRibbon:"yes"
            })
            .end(function(err, res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.count.should.be.above(0);
              done();
            });
    });

    it('it should return colleges when searched with scholarshipsForVeterans ', function(done) {
      chai.request(server)
            .post('/api/college/Search')
            .send({
              scholarshipsForVeterans:"yes"
            })
            .end(function(err, res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.count.should.be.above(0);
              done();
            });
    });

     it('it should return colleges when searched with reducedTuition ', function(done) {
      chai.request(server)
            .post('/api/college/Search')
            .send({
              reducedTuition:"no"
            })
            .end(function(err, res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.count.should.be.above(0);
              done();
            });
    });


  });  


});