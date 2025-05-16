const express = require('express');
const router = express.Router();
const studentService = require('../services/studentService');
const { errorHandler } = require('../utils/errorHandler');
const stringUtil = require('../utils/stringUtil');
const moment = require('moment');
const AWS = require('aws-sdk');
const config = require('../config');
const { successHandler } = require('../utils/success-handler');

AWS.config.update({
  accessKeyId: config.ACCESS_KEY_ID,
  secretAccessKey: config.ACCESS_SECRET_KEY,
  region: config.REGION,
});

router.use(function (req, res, next) {
  // console.log('middleware is working.');
  next();
});

/**
 * @api {get} /student/:studentid Request Student by Student Id 
 * @apiName search Student by Student id
 * @apiGroup Student
 *
 * @apiParam {String} studentid Student Id.
 *
 * @apiSuccess {Boolean} success Request status.
 * @apiSuccess {object} data  Response wrapper.
 * @apiSuccess {String} data.firstName  First Name.
 * @apiSuccess {String} data.lastName  Last Name.
 * @apiSuccess {String} data.middleInitial  Middle Name.
 * @apiSuccess {String} data.email  Email.
 * @apiSuccess {String} data.profileImage  Url of Profile Image.
 * @apiSuccess {String} data.address  Address.
 * @apiSuccess {String} data.city  City.
 * @apiSuccess {String} data.state State.
 * @apiSuccess {String} data.postalCode Postal Code.
 * @apiSuccess {String} data.gender Gender.
 * @apiSuccess {String} data.dob Date Of Birth.
 * @apiSuccess {String} data.timeZone Time Zone.
 * @apiSuccess {String} data.phoneNumber Phone Number.
 * @apiSuccess {String} data.veteranStatus Veteran Status.
 * @apiSuccess {String} data.maritalStatus Marital Status.
 * @apiSuccess {String} data.ethnicity Ethnicity.
 * @apiSuccess {String} data.militaryStatus Military Status.
 * @apiSuccess {Number} data.militaryBranch Military Branch.
 * @apiSuccess {Number} data.militaryRank Military Rank.
 * @apiSuccess {String} data.serviceStartDate Service Start Date.
 * @apiSuccess {String} data.serviceEndDate Service Start Date.
 * @apiSuccess {String} data.enrollmentMilitaryStatus Enrollment Military Status.
 * @apiSuccess {Number} data.militaryAwards1 Military Awards 1.
 * @apiSuccess {Number} data.militaryAwards2 Military Awards 2.
 * @apiSuccess {Number} data.militaryAwards3 Military Awards 3.
 * @apiSuccess {String} data.lastSchoolAttended Last School Attended.
 * @apiSuccess {String} data.nameOfSchool Name of School.
 * @apiSuccess {String} data.gpa GPA.
 * @apiSuccess {String} data.actScore Act Score.
 * @apiSuccess {String} data.satScore Sat Score.
 * @apiSuccess {Number} data.creditsEarned Credits Earned.
 * @apiSuccess {String} data.areaOfStudy Area Of Study.
 * @apiSuccess {Number} data.academicInterest1 Academic Interest 1.
 * @apiSuccess {Number} data.academicInterest2 Academic Interest 2.
 * @apiSuccess {Number} data.academicInterest3 Academic Interest 3.
 * @apiSuccess {Number} data.academicInterest4 Academic Interest 4.
 * @apiSuccess {Number} data.academicInterest5 Academic Interest 5.
 * @apiSuccess {String} data.personalStatement Personal Statement.
 * @apiSuccess {String} data.privacyUniversal Privacy Universal.
 * @apiSuccess {String} data.privacyPhoto Privacy Photo.
 * @apiSuccess {String} data.privacyPersonal Privacy Personal.
 * @apiSuccess {String} data.privacyContact Privacy Contact.
 * @apiSuccess {String} data.privacyAcademic Privacy Academic.
 * @apiSuccess {String} data.jstTranscriptFile Jst Transcript File.
 * @apiSuccess {string} [message] Message (only returned when error occurs).
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *    {
 *	  "success": true,
 *	  "data": {
		    "firstName": "John",
		    "lastName": "Doe",
		    "middleInitial": "Palmer",
		    "email": "gmoose123@aol.com",
		    "profileImage": "https://www.collegerecon.com/assets/student-media/john.jpg",
		    "address": "7 route 100",
		    "city": "Milwaukee",
		    "state": "WI",
		    "postalCode": "53092",
				"gender": "Male",
		    "dob": "1990-11-09 00:00:00",
		    "timeZone": "America/Chicago",
		    "phoneNumber": "14134141341",
		    "veteranStatus": "No",
		    "maritalStatus": "Single",
		    "ethnicity": "White",
		    "militaryStatus": "Active",
		    "militaryBranch": 1,
		    "militaryRank": 2,
		    "serviceStartDate": "2000-11-10 00:00:00",
		    "serviceEndDate": "2015-11-11 00:00:00",
		    "enrollmentMilitaryStatus": "Active",
		    "militaryAwards1": 25,
		    "militaryAwards2": 92,
		    "militaryAwards3": 119,
		    "lastSchoolAttended": "High School",
		    "nameOfSchool": "Homestead HS",
		    "gpa": 3.6,
		    "actScore": 25,
		    "satScore": 1300,
		    "creditsEarned": 0,
		    "areaOfStudy": "Accounting",
		    "academicInterest1": 263,
		    "academicInterest2": 6,
		    "academicInterest3": 343,
		    "academicInterest4": 15,
		    "academicInterest5": 157,
		    "personalStatement": "Im a boss",
		    "privacyUniversal": "NO",
		    "privacyPhoto": "NO",
		    "privacyPersonal": "NO",
		    "privacyContact": "NO",
		    "privacyAcademic": "NO",
		    "jstTranscriptFile": "NO"
		  },
 *	 "count":2	
 *	 }np
 */
router.get('/student/:studentid', function (req, res) {
  studentService.getStudentProfile(req.params.studentid).then(
    function (response) {
      if (response.length > 0) {
        res.json({ success: true, data: response[0] });
      } else {
        res.json({ success: false, data: null, message: 'Student not found' });
      }
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});
router.get('/student/filter/:studentid', function (req, res) {
  studentService.getStudentfilterData(req.params.studentid).then(
    function (response) {
      if (response.length > 0) {
        res.json({ success: true, data: response[0] });
      } else {
        res.json({ success: false, data: null, message: 'Student not found' });
      }
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});
router.get('/student/filter/remove/:studentid', function (req, res) {
  studentService.emptyFilters(req.params.studentid).then(
    function (response) {
      if (response.length > 0) {
        res.json({ success: true, data: response[0] });
      } else {
        res.json({ success: false, data: null, message: 'Student not found' });
      }
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

/**
 * @api {get} /student/messageinfo/:studentid Request Student by Student Id 
 * @apiName search Student by Student id
 * @apiGroup Student
 *
 * @apiParam {String} studentid Student Id.
 *
 * @apiSuccess {Boolean} success Request status.
 * @apiSuccess {object} data  Response wrapper.
 * @apiSuccess {String} data.firstName  First Name.
 * @apiSuccess {String} data.lastName  Last Name.
 * @apiSuccess {String} data.middleInitial  Middle Name.
 * @apiSuccess {String} data.branchName  Branch Name.
 * @apiSuccess {String} data.rankName  Rank Name.
 * @apiSuccess {string} [message] Message (only returned when error occurs).
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *    {
 *	  "success": true,
 *	  "data": {
		    "firstName": "John",
		    "lastName": "Doe",
				"middleInitial": "Palmer",
				"branchName": "United States Air Force",
				"rankName":"Private 2nd Class"
		  },
 *	 "count":2	
 *	 }np
 */
router.get('/student/messageinfo/:studentid', function (req, res) {
  studentService.getStudentMessageData(req.params.studentid).then(
    function (response) {
      if (response.length > 0) {
        res.json({ success: true, data: response[0] });
      } else {
        res.json({ success: false, data: null, message: 'Student not found' });
      }
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

/**
 * @api {post} /student/update/photo
 * @apiName update name information
 * @apiGroup Student
 */
router.post('/student/update/photo', function (req, res) {
  var ext = req.body.fileExtension;
  //var base64Data1 = req.body.imagePath.replace(/^data:image\/png;base64,/, "");
  var imagePath = req.body.imagePath.split(',');
  var base64Data = imagePath[1];
  var imageName =
    req.body.uuid +
    '_' +
    moment(new Date()).format('MMDDYYYYHHmmss') +
    '.' +
    ext;
  var bitmap = new Buffer(base64Data, 'base64');
  // console.log('name',imageName)
  // let path ='http:\\staging.collegerecon.com\\assets\\student-media\\'+imageName;
  // // console.log(' __dirname', __dirname)
  //  	require("fs").writeFile(path, bitmap, function(err) {
  //  		console.log(err);
  //  	});
  // require("fs").writeFile('veteran_images/'+imageName, bitmap, function(err) {
  // 	console.log(err);
  //  });
  var params = {
    Key: 'assets/veteran-assets/' + imageName,
    Body: bitmap,
    contentType: 'image/jpeg',
    ACL: 'public-read',
  };

  var s3 = new AWS.S3({ params: { Bucket: config.BUCKET_NAME } });

  s3.upload(params, function (err, data) {
    if (err) {
      console.log(err, err.stack);
    } else {
      studentService.imageUpdate(imageName, req.body.uuid).then(
        function (response) {
          if (response) {
            res.json({ success: true, data: response });
          } else {
            res.json({
              success: false,
              data: null,
              message: 'unable to update',
            });
          }
        },
        function (err) {
          errorHandler(err, res);
        }
      );
    }
  });
});

/**
 * @api {post} /student/update/nameinfo
 * @apiName update name information
 * @apiGroup Student
 */
router.post('/student/update/nameinfo', function (req, res) {
  studentService.updatePersonalInfoName(req.body).then(
    function (response) {
      if (response) {
        res.json({ success: true, data: response });
      } else {
        res.json({ success: false, data: null, message: 'unable to update' });
      }
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

/**
 * @api {post} /student/update/profileinfo
 * @apiName update student profile information
 * @apiGroup Student
 */
router.post('/student/update/profileinfo', function (req, res) {
  studentService.updatePersonalInfo(req.body).then(
    function (response) {
      if (response) {
        res.json({ success: true, data: response });
      } else {
        res.json({ success: false, data: null, message: 'unable to update' });
      }
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.post('/student/update/filterdata', function (req, res) {
  studentService.updatefilterdata(req.body).then(
    function (response) {
      if (response) {
        res.json({ success: true, data: response });
      } else {
        res.json({ success: false, data: null, message: 'unable to update' });
      }
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

/**
 * @api {post} /student/update/academicinfo
 * @apiName update student academic information
 * @apiGroup Student
 */
router.post('/student/update/academicinfo', function (req, res) {
  studentService.updateAcademicInfo(req.body).then(
    function (response) {
      if (response) {
        res.json({ success: true, data: response });
      } else {
        res.json({ success: false, data: null, message: 'unable to update' });
      }
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.post('/student/delete/matchedschool', function (req, res) {
  studentService.deleteMatchedSchools(req.body).then(
    function (response) {
      if (response) {
        res.json({ success: true, data: response });
      } else {
        res.json({ success: false, data: null, message: 'unable to update' });
      }
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

/**
 * @api {post} /student/update/militaryhistory
 * @apiName update student military History information
 * @apiGroup Student
 */
router.post('/student/update/militaryhistory', function (req, res) {
  studentService.updateMilitaryInfo(req.body).then(
    function (response) {
      if (response) {
        res.json({ success: true, data: response });
      } else {
        res.json({ success: false, data: null, message: 'unable to update' });
      }
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.post('/student/update/jstfile', function (req, res) {
  var ext = req.body.fileExtension;
  var imagePath = req.body.jstfilePath.split(',');
  var base64Data = imagePath[1];
  //var base64Data = req.body.jstfilePath.replace(/^data:image\/png;base64,/, "");
  var imageName = req.body.jstfileName;
  var bitmap = new Buffer(base64Data, 'base64');
  // require("fs").writeFile('veteran_images/'+imageName, bitmap, function(err) {
  // 	console.log(err);
  // });
  var params = {
    Key: 'assets/veteran-assets/' + imageName,
    Body: bitmap,
    contentType: 'image/jpeg',
    ACL: 'public-read',
  };

  var s3 = new AWS.S3({ params: { Bucket: config.BUCKET_NAME } });

  s3.upload(params, function (err, data) {
    if (err) {
      console.log(err, err.stack);
    } else {
      studentService
        .jstTranscriptFileUpdate(imageName, data, req.body.uuid)
        .then(
          function (response) {
            if (response) {
              res.json({ success: true, data: response });
            } else {
              res.json({
                success: false,
                data: null,
                message: 'unable to update',
              });
            }
          },
          function (err) {
            errorHandler(err, res);
          }
        );
    }
  });
});

router.post('/student/update/deletejstfile', function (req, res) {
  var jstName = req.body.jstfileName;
  var s3 = new AWS.S3({ params: { Bucket: config.BUCKET_NAME } });

  var params = {
    Key: jstName,
  };

  s3.deleteObject(params, function (err, data) {
    if (err) {
      console.log('error', err);
    } else {
      studentService.jstTranscriptFileDelete(req.body).then(
        function (response) {
          if (response) {
            res.json({ success: true, data: response });
          } else {
            res.json({
              success: false,
              data: null,
              message: 'unable to update',
            });
          }
        },
        function (err) {
          errorHandler(err, res);
        }
      );
    }
  });
  // require("fs").unlink('veteran_images/'+jstName, function(err) {
  /*if(err && err.code == 'ENOENT') {
					res.json({success:false,data:null,message:"File doesn't exist, won't remove it."});
			} else if (err) {
					res.json({success:false,data:null,message:"Error occurred while trying to remove file"});
			} else {*/
  //console.info(`removed`);
  //}
  // });
});

/**
 * @api {post} /student/favourite/college
 * @apiName update favourtie college
 * @apiGroup Student
 */
router.post('/student/favourite/college', function (req, res) {
  studentService.favoutiteCollege(req.body).then(
    function (response) {
      if (response) {
        res.json({ success: true, data: response });
      } else {
        res.json({ success: false, data: null, message: 'unable to update' });
      }
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

/**
 * @api {post} /student/unfavourite/college
 * @apiName update unfavourtie college
 * @apiGroup Student
 */
router.post('/student/unfavourite/college', function (req, res) {
  studentService.unfavoutiteCollege(req.body).then(
    function (response) {
      if (response) {
        res.json({ success: true, data: response });
      } else {
        res.json({ success: false, data: null, message: 'unable to update' });
      }
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.get(
  '/student/checkfavourite/:studentid/:collegeid',
  function (req, res) {
    studentService
      .checkfavoutiteCollege(req.params.studentid, req.params.collegeid)
      .then(
        function (response) {
          if (response.length > 0) {
            res.json({ success: true, data: response });
          } else {
            res.json({
              success: false,
              data: null,
              message: 'Unable to get data',
            });
          }
        },
        function (err) {
          errorHandler(err, res);
        }
      );
  }
);

router.get('/student/profileview/:studentid', function (req, res) {
  studentService.getVeteranProfileView(req.params.studentid).then(
    function (response) {
      if (response.length > 0) {
        res.json({ success: true, data: response });
      } else {
        res.json({ success: false, data: null, message: 'Unable to get data' });
      }
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.get('/student/favouritelist/:studentid', function (req, res) {
  studentService.getVeteranFavouritelist(req.params.studentid).then(
    function (response) {
      if (response.length > 0) {
        res.json({ success: true, data: response });
      } else {
        res.json({ success: false, data: null, message: 'Unable to get data' });
      }
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

/**
 * @api {post} /register/match/save/collegelist
 * @apiName save match register college list
 * @apiGroup College
 */
router.post('/register/match/save/collegelist', function (req, res) {
  studentService.getSaveRegisterMatchCollege(req.body).then(
    function (response) {
      if (response) {
        res.json({ success: true, data: response });
      } else {
        res.json({ success: false, data: null, message: 'unable to get data' });
      }
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.post('/register/match/update/collegelist', function (req, res) {
  studentService.getUpdateRegisterMatchCollege(req.body).then(
    function (response) {
      if (response) {
        res.json({ success: true, data: response });
      } else {
        res.json({ success: false, data: null, message: 'unable to get data' });
      }
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.get('/matched/collegelist/:studentid', async (req, res) => {
  try {
    const savedSchools = await studentService.getMatchedCollegeList(
      req.params.studentid
    );
    successHandler(res, savedSchools, 'Successfully updated!');
  } catch (error) {
    errorHandler(err, res);
  }
});

router.post('/student/matched/collegeinfo', function (req, res) {
  studentService.getMatchedCollegeInfo(req.body).then(
    function (response) {
      if (response.length > 0) {
        res.json({ success: true, data: response });
      } else {
        res.json({ success: false, data: null, message: 'Student not found' });
      }
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.get(
  '/college/matched-percent/:studentid/:collegeid',
  function (req, res) {
    studentService
      .getCalculateMatchedPercent(req.params.studentid, req.params.collegeid)
      .then(
        function (response) {
          res.json({ success: true, data: response });
        },
        function (err) {
          errorHandler(err, res);
        }
      );
  }
);

router.get('/veterans/exist/:studentid', function (req, res) {
  studentService.checkVeteransExist(req.params.studentid).then(
    function (response) {
      res.json({ success: true, data: response });
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.get('/student/majorlist/:studentid', function (req, res) {
  studentService.getVeteransMajorList(req.params.studentid).then(
    function (response) {
      res.json({ success: true, data: response });
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.get('/student/bucketinfo/:studentid', function (req, res) {
  studentService.getVeteransBucketInfo(req.params.studentid).then(
    function (response) {
      res.json({ success: true, data: response });
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.get('/student/matchpercent/searchdata/:studentid', function (req, res) {
  studentService.getVeteransSearchData(req.params.studentid).then(
    function (response) {
      res.json({ success: true, data: response });
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.get(
  '/student/check/collegemessage/:studentid/:collegeid',
  function (req, res) {
    studentService
      .getVeteransMessagetoCollege(req.params.studentid, req.params.collegeid)
      .then(
        function (response) {
          res.json({ success: true, data: response });
        },
        function (err) {
          errorHandler(err, res);
        }
      );
  }
);

router.get('/student/secondary/bucket/:id', async (req, res) => {
  try {
    const secondaryBuckets = await studentService.getVeteransSecondaryBucketInfo(
      req.params.id
    );
    successHandler(res, secondaryBuckets, 'Successfully fetched!');
  } catch (error) {
    errorHandler(err, res);
  }
});

router.get('/veteran/saved/schoollist/:id', async (req, res) => {
  try {
    const savedSchools = await studentService.getVeteranSavedSchoolList(
      req.params.id
    );
    successHandler(res, savedSchools, 'Successfully fetched!');
  } catch (error) {
    errorHandler(error, res);
  }
});

router.post('/veteran/saved/school', function (req, res) {
  studentService.getSaveVeteranSchool(req.body).then(
    function (response) {
      if (response) {
        res.json({ success: true, data: response });
      } else {
        res.json({ success: false, data: null, message: 'unable to get data' });
      }
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.post('/register/saved/update/collegelist', function (req, res) {
  studentService.getUpdateSavedCollege(req.body).then(
    function (response) {
      if (response) {
        res.json({ success: true, data: response });
      } else {
        res.json({ success: false, data: null, message: 'unable to get data' });
      }
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.post('/veteran/delete/saved/school', function (req, res) {
  studentService.getDeleteSavedCollegeData(req.body).then(
    function (response) {
      if (response) {
        res.json({ success: true, data: response });
      } else {
        res.json({ success: false, data: null, message: 'unable to get data' });
      }
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.get('/student/studentdata/:studentid', function (req, res) {
  studentService.getVeteranData(req.params).then(
    function (response) {
      if (response) {
        res.json({ success: true, data: response });
      } else {
        res.json({ success: false, data: null, message: 'unable to get data' });
      }
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.post('/veteran/searchdata/update', function (req, res) {
  studentService.updateVeteranProgramMatcher(req.body).then(
    function (response) {
      if (response) {
        res.json({ success: true, data: response });
      } else {
        res.json({ success: false, data: null, message: 'unable to get data' });
      }
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.post('/veteran/scholarshipdata/update', function (req, res) {
  studentService.updateVeteranScholarshipData(req.body).then(
    function (response) {
      if (response) {
        res.json({ success: true, data: response });
      } else {
        res.json({ success: false, data: null, message: 'unable to get data' });
      }
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.post('/veteran/email/unsubscribe', function (req, res) {
  studentService.unsubscribeVeteranEmail(req.body).then(
    function (response) {
      if (response) {
        res.json({ success: true, data: response });
      } else {
        res.json({ success: false, data: null, message: 'unable to get data' });
      }
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.post('/veteran/scholarship/email/unsubscribe', function (req, res) {
  studentService.unsubscribeVeteranScholarshipEmail(req.body).then(
    function (response) {
      if (response) {
        res.json({ success: true, data: response });
      } else {
        res.json({ success: false, data: null, message: 'unable to get data' });
      }
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.put('/veterans', function (req, res) {
  let authorize = stringUtil.checkAuthoriseUser(req.headers);
  if (authorize) {
    let checkResult = stringUtil.joiVeteranDataValidation(req);
    if (checkResult.check) {
      studentService.veteranDataUpdate(req.body, req.headers['user-name']).then(
        function (response) {
          res.status(200).send({ status: 200, data: response });
        },
        function (err) {
          errorHandler(err, res);
        }
      );
    } else {
      res.status(400).json({
        status: 400,
        message: checkResult.errorMessage,
      });
    }
  } else {
    res.status(401).send({ status: 401, data: 'Unauthorized Access' });
  }
});

router.get('/student/checkcareeruser/:studentId', async (req, res) => {
  try {
    const careerUserData = await studentService.checkCareerreconUser(
      req.params.studentId
    );
    successHandler(res, careerUserData, 'Successfully updated!');
  } catch (error) {
    errorHandler(err, res);
  }
});

router.get('/veterans/:email/stats', function (req, res) {
  let authorize = stringUtil.checkAuthoriseUser(req.headers);
  if (authorize) {
    if (req.params.email) {
      studentService.getVeteransStats(req.params.email).then(
        function (response) {
          if (response) {
            if (response == 'fail') {
              res.json({
                success: false,
                message: 'Student with ' + req.params.email + ' not found',
              });
            } else {
              res.json({ success: true, data: response });
            }
          } else {
            res.json({
              success: false,
              data: null,
              message: 'unable to get data',
            });
          }
        },
        function (err) {
          errorHandler(err, res);
        }
      );
    } else {
      res.status(400).json({
        statusCode: 400,
        message: 'Email is required.',
      });
    }
  } else {
    res.status(401).send({ statusCode: 401, message: 'Unauthorized Access' });
  }
});

router.post('/veteran/:studentId', async (req, res) => {
  try {
    await studentService.updateStudent(req.body, req.params.studentId);
    successHandler(res, true, 'Successfully updated!');
  } catch (error) {
    errorHandler(error, res);
  }
});

router.get('/student/attended-school/:userId', async (req, res) => {
  try {
    const studentCollegeAttended =
      await studentService.getVeteranAttendedSchools(req.params.userId);
    successHandler(res, studentCollegeAttended, 'Successfully fetched!');
  } catch (error) {
    errorHandler(error, res);
  }
});

router.get('/student/degree-interest/:userId', async (req, res) => {
  try {
    const studentCollegeAttended =
      await studentService.getVeteranDegreeInterestList(req.params.userId);
    successHandler(res, studentCollegeAttended, 'Successfully fetched!');
  } catch (error) {
    errorHandler(error, res);
  }
});

router.get('/banner-info/:studentId', async (req, res) => {
  try {
    const bannerInfo = await studentService.getBannerInfo(req.params.studentId);
    successHandler(res, bannerInfo, 'Successfully updated!');
  } catch (error) {
    errorHandler(error, res);
  }
});

router.put('/student/military-info/:studentId', async (req, res) => {
  try {
    const militaryInfo = await studentService.updateVeteranMilitaryInfo(
      req.body,
      req.params.studentId
    );
    successHandler(res, militaryInfo, 'Successfully updated!');
  } catch (error) {
    errorHandler(error, res);
  }
});

router.put('/student/education-info/:studentId', async (req, res) => {
  try {
    const educationInfo = await studentService.updateVeteranEducationInfo(
      req.body,
      req.params.studentId
    );
    successHandler(res, educationInfo, 'Successfully updated!');
  } catch (error) {
    errorHandler(error, res);
  }
});

router.get('/student/award/:userId', async (req, res) => {
  try {
    const userAwards = await studentService.getVeteranAwards(req.params.userId);
    successHandler(res, userAwards, 'Successfully fetched!');
  } catch (error) {
    errorHandler(error, res);
  }
});

router.get('/student/major/:userId', async (req, res) => {
  try {
    const studentCollegeAttended =
      await studentService.getVeteranAttendedSchools(req.params.userId);
    successHandler(res, studentCollegeAttended, 'Successfully fetched!');
  } catch (error) {
    errorHandler(error, res);
  }
});

router.post('/student/update/phonenumber', async (req, res) => {
  try {
    await studentService.updateStudentPhone(req.body);
    successHandler(res, true, 'Successfully updated!');
  } catch (error) {
    errorHandler(error, res);
  }
});

router.get('/student/phonenumber/:studentId', async (req, res) => {
  try {
    const phoneInfo = await studentService.getUserPhoneInfo(
      req.params.studentId
    );
    successHandler(res, phoneInfo, 'Successfully!');
  } catch (error) {
    errorHandler(err, res);
  }
});

router.post('/student/requestinfo/email', async (req, res) => {
  try {
    await studentService.sentRequestInfoEmail(req.body);
    successHandler(res, true, 'Successfully updated!');
  } catch (error) {
    errorHandler(error, res);
  }
});

router.post('/student/update/disabilitystatus', async (req, res) => {
  try {
    await studentService.updateVeteranDisability(req.body);
    successHandler(res, true, 'Successfully updated!');
  } catch (error) {
    errorHandler(error, res);
  }
});

router.get('/veteran/militaryinfo/:studentId', async (req, res) => {
  try {
    let authorize = stringUtil.checkAuthoriseUser(req.headers);
    if (authorize) {
      if (req.params.studentId) {
        let result = await studentService.getMilitaryInfoData(req.params.studentId);
        if(result == 'fail'){
          res.json({
            success: false,
            message: 'Student with ' + req.params.studentId + ' not found',
          });
        }else{
          res.json({ success: true, data: result });
        }
      } else {
        res.status(400).json({
          statusCode: 400,
          message: 'Student Id is required.',
        });
      }
    } else {
      res.status(401).send({ statusCode: 401, message: 'Unauthorized Access' });
    }
  } catch (error) {
    errorHandler(error, res);
  }
});

// Return router
module.exports = router;
