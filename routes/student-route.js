const express = require('express');
const router = express.Router();
const studentService = require('../services/studentService');
const { errorHandler } = require('../utils/errorHandler');
const moment = require('moment');
const AWS = require('aws-sdk');
const config = require('../config');
const { successHandler } = require('../utils/success-handler');
const { authorize } = require('../middleware');
const { Role } = require('../shared/types');

AWS.config.update({
  accessKeyId: config.ACCESS_KEY_ID,
  secretAccessKey: config.ACCESS_SECRET_KEY,
  region: config.REGION,
});

router.get(
  '/:studentId',
  // authorize,
  // authorize(Role.STUDENT),
  async (req, res) => {
    try {
      const student = await studentService.getStudentProfile(
        req.params.studentId
      );
      successHandler(res, student, 'Fetched successfully!');
    } catch (error) {
      errorHandler(error, res);
    }
  }
);

router.get('/filter/:studentId', async (req, res) => {
  try {
    const filterData = await studentService.getStudentfilterData(
      req.params.studentId
    );
    successHandler(res, filterData, 'Fetched successfully!');
  } catch (error) {
    errorHandler(error, res);
  }
});

router.get('/filter/remove/:studentId', async (req, res) => {
  try {
    const emptyFilters = await studentService.emptyFilters(
      req.params.studentId
    );
    successHandler(res, emptyFilters, 'Fetched successfully!');
  } catch (error) {
    errorHandler(error, res);
  }
});

router.get('/messageinfo/:studentId', async (req, res) => {
  try {
    const messageInfo = await studentService.getStudentMessageData(
      req.params.studentId
    );
    successHandler(res, messageInfo, 'Fetched successfully!');
  } catch (error) {
    errorHandler(error, res);
  }
});

router.get('/checkfavourite/:studentId/:collegeId', async (req, res) => {
  try {
    const checkFavourite = await studentService.checkfavoutiteCollege(
      req.params.studentId,
      req.params.collegeId
    );
    successHandler(res, checkFavourite, 'Fetched successfully!');
  } catch (error) {
    errorHandler(error, res);
  }
});

router.get('/profileview/:studentId', async (req, res) => {
  try {
    const profile = await studentService.getVeteranProfileView(
      req.params.studentId
    );
    successHandler(res, profile, 'Fetched successfully!');
  } catch (error) {
    errorHandler(error, res);
  }
});

router.get('/favouritelist/:studentId', async (req, res) => {
  try {
    const favouriteList = await studentService.getVeteranFavouritelist(
      req.params.studentId
    );
    successHandler(res, favouriteList, 'Fetched successfully!');
  } catch (error) {
    errorHandler(error, res);
  }
});

router.get('/matched-percent/:studentId/:collegeId', async (req, res) => {
  try {
    const matchedPercent = await studentService.getCalculateMatchedPercent(
      req.params.studentId,
      req.params.collegeId
    );
    successHandler(res, matchedPercent, 'Fetched successfully!');
  } catch (error) {
    errorHandler(error, res);
  }
});

router.get('/exist/:studentId', async (req, res) => {
  try {
    const student = await studentService.checkVeteransExist(
      req.params.studentId
    );
    successHandler(res, student, 'Fetched successfully!');
  } catch (error) {
    errorHandler(error, res);
  }
});

router.get('/majorlist/:studentId', async (req, res) => {
  try {
    const majorList = await studentService.getVeteransMajorList(
      req.params.studentId
    );
    successHandler(res, majorList, 'Fetched successfully!');
  } catch (error) {
    errorHandler(error, res);
  }
});

router.get('/bucketinfo/:studentId', async (req, res) => {
  try {
    const bucketInfo = await studentService.getVeteransBucketInfo(
      req.params.studentId
    );
    successHandler(res, bucketInfo, 'Fetched successfully!');
  } catch (error) {
    errorHandler(error, res);
  }
});

router.get('/matchpercent/searchdata/:studentid', async (req, res) => {
  try {
    const matchPercent = await studentService.getVeteransSearchData(
      req.params.studentid
    );
    successHandler(res, matchPercent, 'Fetched successfully!');
  } catch (error) {
    errorHandler(error, res);
  }
});

router.get('/check/collegemessage/:studentId/:collegeId', async (req, res) => {
  try {
    const message = await studentService.getVeteransMessagetoCollege(
      req.params.studentId,
      req.params.collegeId
    );
    successHandler(res, message, 'Fetched successfully!');
  } catch (error) {
    errorHandler(error, res);
  }
});

router.get('/secondary/bucket/:id', async (req, res) => {
  try {
    const secondaryBuckets = await studentService.getVeteranSavedSchoolList(
      req.params.id
    );
    successHandler(res, secondaryBuckets, 'Successfully fetched!');
  } catch (error) {
    errorHandler(err, res);
  }
});

router.get('/saved/schoollist/:id', async (req, res) => {
  try {
    const savedSchools = await studentService.getVeteranSavedSchoolList(
      req.params.id
    );
    successHandler(res, savedSchools, 'Successfully fetched!');
  } catch (error) {
    errorHandler(error, res);
  }
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

router.get('/award/:userId', async (req, res) => {
  try {
    const userAwards = await studentService.getVeteranAwards(req.params.userId);
    successHandler(res, userAwards, 'Successfully fetched!');
  } catch (error) {
    errorHandler(error, res);
  }
});

router.get('/attended-school/:userId', async (req, res) => {
  try {
    const studentCollegeAttended =
      await studentService.getVeteranAttendedSchools(req.params.userId);
    successHandler(res, studentCollegeAttended, 'Successfully fetched!');
  } catch (error) {
    errorHandler(error, res);
  }
});

router.get('/degree-interest/:userId', async (req, res) => {
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
    successHandler(res, bannerInfo, 'Successfully fetched!');
  } catch (error) {
    errorHandler(error, res);
  }
});

router.get('/studentdata/:studentid', async (req, res) => {
  try {
    const student = await studentService.getVeteranData(req.params);
    successHandler(res, student, 'Successfully fetched!');
  } catch (error) {
    errorHandler(error, res);
  }
});

router.get('/checkcareeruser/:studentId', async (req, res) => {
  try {
    const careerUserData = await studentService.checkCareerreconUser(
      req.params.studentId
    );
    successHandler(res, careerUserData, 'Successfully updated!');
  } catch (error) {
    errorHandler(err, res);
  }
});

/**
 * @api {post} /student/update/photo
 * @apiName update name information
 * @apiGroup Student
 */
router.post('/update/photo', async (req, res) => {
  const ext = req.body.fileExtension;
  //var base64Data1 = req.body.imagePath.replace(/^data:image\/png;base64,/, "");
  const imagePath = req.body.imagePath.split(',');
  const base64Data = imagePath[1];
  const imageName =
    req.body.uuid +
    '_' +
    moment(new Date()).format('MMDDYYYYHHmmss') +
    '.' +
    ext;
  const bitmap = new Buffer(base64Data, 'base64');
  // console.log('name',imageName)
  // let path ='http:\\staging.collegerecon.com\\assets\\student-media\\'+imageName;
  // // console.log(' __dirname', __dirname)
  //  	require("fs").writeFile(path, bitmap, function(err) {
  //  		console.log(err);
  //  	});
  // require("fs").writeFile('veteran_images/'+imageName, bitmap, function(err) {
  // 	console.log(err);
  //  });
  const params = {
    Key: 'assets/veteran-assets/' + imageName,
    Body: bitmap,
    contentType: 'image/jpeg',
    ACL: 'public-read',
  };
  const s3 = new AWS.S3({ params: { Bucket: config.BUCKET_NAME } });
  s3.upload(params, async (err, data) => {
    if (err) {
      errorHandler(err, res);
    } else {
      try {
        const image = await studentService.imageUpdate(
          imageName,
          req.body.uuid
        );
        successHandler(res, image, 'Image updated successfully');
      } catch (error) {
        errorHandler(error, res);
      }
    }
  });
});

/**
 * @api {post} /student/update/nameinfo
 * @apiName update name information
 * @apiGroup Student
 */
router.post('/update/nameinfo', async (req, res) => {
  try {
    const infoName = await studentService.updatePersonalInfoName(req.body);
    successHandler(res, infoName, 'Successfully updated');
  } catch (error) {
    errorHandler(error, res);
  }
});

/**
 * @api {post} /student/update/profileinfo
 * @apiName update student profile information
 * @apiGroup Student
 */
router.post('/update/profileinfo', async (req, res) => {
  try {
    const profileInfo = await studentService.updatePersonalInfo(req.body);
    successHandler(res, profileInfo, 'Successfully updated');
  } catch (error) {
    errorHandler(error, res);
  }
});

router.post('/update/filterdata', async (req, res) => {
  try {
    const filterData = await studentService.updatePersonalInfoName(req.body);
    successHandler(res, filterData, 'Successfully updated');
  } catch (error) {
    errorHandler(error, res);
  }
});

/**
 * @api {post} /student/update/academicinfo
 * @apiName update student academic information
 * @apiGroup Student
 */
router.post('/update/academicinfo', async (req, res) => {
  try {
    const academicInfo = await studentService.updateAcademicInfo(req.body);
    successHandler(res, academicInfo, 'Successfully updated');
  } catch (error) {
    errorHandler(error, res);
  }
});

/**
 * @api {post} /student/update/militaryhistory
 * @apiName update student military History information
 * @apiGroup Student
 */
router.post('/update/militaryhistory', async (req, res) => {
  try {
    const militaryInfo = await studentService.updateMilitaryInfo(req.body);
    successHandler(res, militaryInfo, 'Successfully updated');
  } catch (error) {
    errorHandler(error, res);
  }
});

router.post('/update/jstfile', (req, res) => {
  const ext = req.body.fileExtension;
  const imagePath = req.body.jstfilePath.split(',');
  const base64Data = imagePath[1];
  //const base64Data = req.body.jstfilePath.replace(/^data:image\/png;base64,/, "");
  const bitmap = new Buffer(base64Data, 'base64');
  // require("fs").writeFile('veteran_images/'+imageName, bitmap, function(err) {
  // 	console.log(err);
  // });
  const params = {
    Key: 'assets/veteran-assets/' + req.body.jstfileName,
    Body: bitmap,
    contentType: 'image/jpeg',
    ACL: 'public-read',
  };

  const s3 = new AWS.S3({ params: { Bucket: config.BUCKET_NAME } });

  s3.upload(params, async (err, data) => {
    if (err) {
      errorHandler(error, res);
    } else {
      try {
        const jst = await studentService.jstTranscriptFileUpdate(
          req.body.jstfileName,
          data,
          req.body.uuid
        );
        successHandler(res, jst, 'Successfully uploaded');
      } catch (error) {
        errorHandler(error, res);
      }
    }
  });
});

router.post('/student/update/deletejstfile', (req, res) => {
  const jstName = req.body.jstfileName;
  const s3 = new AWS.S3({ params: { Bucket: config.BUCKET_NAME } });

  const params = {
    Key: jstName,
  };

  s3.deleteObject(params, async (err, data) => {
    if (err) {
      errorHandler(error, res);
    } else {
      try {
        const jst = await studentService.jstTranscriptFileDelete(req.body);
        successHandler(res, jst, 'Successfully uploaded');
      } catch (error) {
        errorHandler(error, res);
      }
    }
  });
});

/**
 * @api {post} /student/favourite/college
 * @apiName update favourtie college
 * @apiGroup Student
 */
router.post('/favourite/college', async (req, res) => {
  try {
    const favoriteCollege = await studentService.favoutiteCollege(req.body);
    successHandler(res, favoriteCollege, 'Successfully added');
  } catch (error) {
    errorHandler(error, res);
  }
});

/**
 * @api {post} /student/unfavourite/college
 * @apiName update unfavourtie college
 * @apiGroup Student
 */
router.post('/unfavourite/college', async (req, res) => {
  try {
    const unfavourite = await studentService.unfavoutiteCollege(req.body);
    successHandler(res, unfavourite, 'Successfully added');
  } catch (error) {
    errorHandler(error, res);
  }
});

/**
 * @api {post} /register/match/save/collegelist
 * @apiName save match register college list
 * @apiGroup College
 */
router.post('/register/match/save/collegelist', async (req, res) => {
  try {
    const matchList = await studentService.getSaveRegisterMatchCollege(
      req.body
    );
    successHandler(res, matchList, 'Successfully added');
  } catch (error) {
    errorHandler(error, res);
  }
});

router.post('/register/match/update/collegelist', function (req, res) {
  try {
    const list = studentService.getUpdateRegisterMatchCollege(req.body);
    successHandler(res, list, 'Successfully updated');
  } catch (error) {
    errorHandler(error, res);
  }
});
// TODO: NEED TO CHANGE TO GET REQUEST ONCE AUTH IS PROPERLY IMPLEMENTED
router.post('/matched/collegeinfo', function (req, res) {
  try {
    const list = studentService.getMatchedCollegeInfo(req.body);
    successHandler(res, list, 'Successfully fetched');
  } catch (error) {
    errorHandler(error, res);
  }
});
// TODO: NEED TO CHANGE TO GET REQUEST ONCE AUTH IS PROPERLY IMPLEMENTED
router.post('/saved/school', async (req, res) => {
  try {
    const savedSchool = await studentService.getSaveVeteranSchool(req.body);
    successHandler(res, savedSchool, 'Successfully fetched!');
  } catch (error) {
    errorHandler(error, res);
  }
});

router.post('/register/saved/update/collegelist', async (req, res) => {
  try {
    const savedCollege = await studentService.getUpdateSavedCollege(req.body);
    successHandler(res, savedCollege, 'Successfully updated!');
  } catch (error) {
    errorHandler(error, res);
  }
});

router.post('/email/unsubscribe', async (req, res) => {
  try {
    const data = await studentService.unsubscribeVeteranEmail(req.body);
    successHandler(res, data, 'Successfully unsubscribed!');
  } catch (error) {
    errorHandler(error, res);
  }
});

router.post('/scholarship/email/unsubscribe', async (req, res) => {
  try {
    const data = await studentService.unsubscribeVeteranScholarshipEmail(
      req.body
    );
    successHandler(res, data, 'Successfully updated!');
  } catch (error) {
    errorHandler(error, res);
  }
});

router.post('/:studentId', async (req, res) => {
  try {
    await studentService.updateStudent(req.body, req.params.studentId);
    successHandler(res, true, 'Successfully updated!');
  } catch (error) {
    errorHandler(error, res);
  }
});

router.put('/military-info/:studentId', async (req, res) => {
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

router.put('/education-info/:studentId', async (req, res) => {
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

router.delete('/delete/matchedschool', async (req, res) => {
  try {
    const deleteMatch = await studentService.deleteMatchedSchools(req.body);
    successHandler(res, deleteMatch, 'Successfully deleted');
  } catch (error) {
    errorHandler(error, res);
  }
});

// TODO: VETERAN ROUTE UPDATE
router.delete('/delete/saved/school', async (req, res) => {
  try {
    const savedSchool = await studentService.getDeleteSavedCollegeData(
      req.body
    );
    successHandler(res, savedSchool, 'Successfully updated!');
  } catch (error) {
    errorHandler(error, res);
  }
});

// Return router
module.exports = router;
