const express    = require('express');
const router = express.Router(); 
const collegeService=require('../services/collegeService');
const majorService=require('../services/majorService');
const { errorHandler } = require('../utils/errorHandler');
const logger = require('../utils/collegeSearchLog');
const AWS = require('aws-sdk');
const config = require('../config')

AWS.config.update({
	accessKeyId: config.ACCESS_KEY_ID,
	secretAccessKey: config.ACCESS_SECRET_KEY,
	region: config.REGION,
  });


router.use(function(req,res,next){
	// console.log('middleware is working.');	
	next(); 
});

/**
 * @api {get} /college/default Request Default College  
 * @apiName Get Default Colleges
 * @apiGroup College
 *
 *
 * @apiSuccess {Boolean} success Request status.
 * @apiSuccess {object[]} data  Response wrapper.
 * @apiSuccess {Number} data.collegeId  College Id.
 * @apiSuccess {String} data.collegeName  College Name.
 * @apiSuccess {String} data.streetAddress  College Address.
 * @apiSuccess {String} data.city  City.
 * @apiSuccess {String} data.state  State.
 * @apiSuccess {String} data.postalCode  Postal Code.
 * @apiSuccess {String} data.phone  Phonen Number.
 * @apiSuccess {String} data.website  College Website.
 * @apiSuccess {String} data.collegeLogo Url of image of college logo.
 * @apiSuccess {String} data.collegePhoto Url of image of college.
 * @apiSuccess {string} [message] Message (only returned when error occurs).
 * @apiSuccess {Number} [count] Length of data (only retuned when success).
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *    {
 *	  "success": true,
 *	  "data": [{
 *			      "collegeId": 100,
 *			      "collegeName": "Quinnipiac University",
 *			      "streetAddress": "275 Mt Carmel Ave",
 *			      "city": "Hamden",
 *			      "state": "CT",
 *			      "postalCode": "06518",
 *			      "phone": "203-582-8600",
 *			      "website": "http://www.qu.edu",
 *			      "collegeLogo": "https://www.collegerecon.com/assets/college-media/512_logo.jpg",
 *			      "collegePhoto": "https://www.collegerecon.com/assets/college-media/512_photo.jpg"
 *			    },
 *			    {
 *			      "collegeId": 101,
 *			      "collegeName": "Upper Iowa University",
 *			      "streetAddress": "605 Washington St",
 *			      "city": "Fayette",
 *			      "state": "IA",
 *			      "postalCode": "52142",
 *			      "phone": "(563) 425-5200",
 *			      "website": "http://www.uiu.edu",
 *			      "collegeLogo": "https://www.collegerecon.com/assets/college-media/Upper_Iowa_University_logo.jpg",
 *			      "collegePhoto": "https://www.collegerecon.com/assets/college-media/Upper_Iowa_University_photo.jpg"
 *			    }],
 *	 "count":2
 *	 }
 *
 *
 */
 router.get('/college/default', function(req, res ) {
 	collegeService.getDefaultColleges()
 	.then(function(response){
 		res.json({success:true,data:response,count:response.length});
 	},function(err){ errorHandler(err,res); });
 	
 });

/**
 * @api {get} /college/list Request all College  
 * @apiName Get all Colleges
 * @apiGroup College
 *
 *
 * @apiSuccess {Boolean} success Request status.
 * @apiSuccess {object[]} data  Response wrapper.
 * @apiSuccess {Number} data.collegeId  College Id.
 * @apiSuccess {String} data.collegeName  College Name.
 * @apiSuccess {String} data.streetAddress  College Address.
 * @apiSuccess {String} data.city  City.
 * @apiSuccess {String} data.state  State.
 * @apiSuccess {String} data.postalCode  Postal Code.
 * @apiSuccess {String} data.phone  Phonen Number.
 * @apiSuccess {String} data.website  College Website.
 * @apiSuccess {String} data.collegeLogo Url of image of college logo.
 * @apiSuccess {String} data.collegePhoto Url of image of college.
 * @apiSuccess {string} [message] Message (only returned when error occurs).
 * @apiSuccess {Number} [count] Length of data (only retuned when success).
 *
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *    {
 *	  "success": true,
 *	  "data": [{
 *			      "collegeId": 100,
 *			      "collegeName": "Quinnipiac University",
 *			      "streetAddress": "275 Mt Carmel Ave",
 *			      "city": "Hamden",
 *			      "state": "CT",
 *			      "postalCode": "06518",
 *			      "phone": "203-582-8600",
 *			      "website": "http://www.qu.edu",
 *			      "collegeLogo": "https://www.collegerecon.com/assets/college-media/512_logo.jpg",
 *			      "collegePhoto": "https://www.collegerecon.com/assets/college-media/512_photo.jpg"
 *			    },
 *			    {
 *			      "collegeId": 101,
 *			      "collegeName": "Upper Iowa University",
 *			      "streetAddress": "605 Washington St",
 *			      "city": "Fayette",
 *			      "state": "IA",
 *			      "postalCode": "52142",
 *			      "phone": "(563) 425-5200",
 *			      "website": "http://www.uiu.edu",
 *			      "collegeLogo": "https://www.collegerecon.com/assets/college-media/Upper_Iowa_University_logo.jpg",
 *			      "collegePhoto": "https://www.collegerecon.com/assets/college-media/Upper_Iowa_University_photo.jpg"
 *			    }],
 *	 "count":2	
 *	 }
 */

 router.get('/college/list', function(req, res ) {
 	collegeService.getAllColleges()
 	.then(function(response){
 		res.json({success:true,data:response,count:response.length});
 	},function(err){ errorHandler(err,res); });
 	
 });

/**
 * @api {post} /college/search Search College 
 * @apiName search college
 * @apiGroup College
 *
 * @apiParam {String[]} [state] State of college.
 * @apiParam {Number[]} [majors] Major id's offered by college.
 * @apiParam {String} [religiousAffiliation] Religious affilication.
 * @apiParam {String} [ethnicAffiliation] Ethnic affiliation.
 * @apiParam {String} [publicOrPrivate] Public or private college.
 * @apiParam {String} [yearsOffered] Years offered eg : 2 year , 4 year.
 * @apiParam {String} [genderPreference] Gender preference.
 * @apiParam {String} [schoolSetting] School setting eg: urban, suburb, town, rural, online.
 * @apiParam {String} [provideOnlineGraduateClasses] Offers online graduate courses.
 * @apiParam {String} [provideOnlineUnderGraduateClasses] Offers online undergraduate courses.
 * @apiParam {String} [provideOnlineClasses] Offers online courses.
 * @apiParam {Number} [underGraduateTuitionFrom] Undergraduate tuition range from.
 * @apiParam {Number} [underGraduateTuitionTo] Undergraduate tuition range to.
 * @apiParam {Number} [graduateTuitionFrom] Graduate tuition range from.
 * @apiParam {Number} [graduateTuitionTo] Graduate tuition range to.
 * @apiParam {Number} [underGraduatePopulationFrom] Undergraduate population range from.
 * @apiParam {Number} [underGraduatePopulationTo] Undergraduate population range to.
 * @apiParam {Number} [graduatePopulationFrom] Graduate population range from.
 * @apiParam {Number} [graduatePopulationTo] Graduate population range to.
 * @apiParam {Number} [giStudentFrom] GI bill student range from.
 * @apiParam {Number} [giStudentFrom] GI bill student range to. 
 * @apiParam {Number} [bahTo] B.A.H range from.
 * @apiParam {Number} [bahTo] B.A.H range to. 
 * @apiParam {String} [provideSva] Campus SVA chapter (yes or no). 
 * @apiParam {String} [provideFullTimeVeteranCounselor] Full-Time Veteran Counselor on Campus (yes or no). 
 * @apiParam {String} [principlesOfExcellence] Signed VA Principles of Excellence (yes or no). 
 * @apiParam {String} [associaionOnCampus] Club/Association for Veterans (yes or no). 
 * @apiParam {String} [upwardBound] Veteran Upward Bound Program (yes or no). 
 * @apiParam {String} [eightKeys] 8 Keys to Veterans' Success (yes or no). 
 * @apiParam {String} [rotcService] Offers ROTC Program (yes or no). 
 * @apiParam {String} [isMemberOfSoc] Member of S.O.C (yes or no). 
 * @apiParam {String} [aceCredit] Offers College Credit for Military Experiences (yes or no). 
 * @apiParam {String} [clepCredit] Awards Credit for CLEP Exam (yes or no). 
 * @apiParam {String} [dsstCredit] Awards Credit for DSST Exam (yes or no). 
 * @apiParam {String} [inStateTuitionForActiveDuty] Comply with The Veteran's Choice Act (yes or no). 
 * @apiParam {String} [approvedTaFunding] Approved for TA Funding (yes or no). 
 * @apiParam {String} [yellowRibbon] Yellow Ribbon Program (yes or no). 
 * @apiParam {String} [scholarshipsForVeterans] Scholarships for Military (yes or no). 
 * @apiParam {String} [reducedTuition] Reduced Tuition for Military (yes or no). 

 * @apiSuccess {Boolean} success Request status.
 * @apiSuccess {object[]} data  Response wrapper.
 * @apiSuccess {Number} data.collegeId  College Id.
 * @apiSuccess {String} data.collegeName  College Name.
 * @apiSuccess {String} data.streetAddress  College Address.
 * @apiSuccess {String} data.city  City.
 * @apiSuccess {String} data.state  State.
 * @apiSuccess {String} data.postalCode  Postal Code.
 * @apiSuccess {String} data.phone  Phonen Number.
 * @apiSuccess {String} data.website  College Website.
 * @apiSuccess {String} data.overview college short description.
 * @apiSuccess {String} data.collegeLogo Url of image of college logo.
 * @apiSuccess {String} data.collegePhoto Url of image of college.
 * @apiSuccess {string} [message] Message (only returned when error occurs).
 * @apiSuccess {Number} [count] Length of data (only retuned when success).

 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *    {
 *	  "success": true,
 *	  "data": [{
 *			      "collegeId": 100,
 *			      "collegeName": "Quinnipiac University",
 *			      "streetAddress": "275 Mt Carmel Ave",
 *			      "city": "Hamden",
 *			      "state": "CT",
 *			      "postalCode": "06518",
 *			      "phone": "203-582-8600",
 *			      "website": "http://www.qu.edu",
 *						"overview": "this is short description",
 *			      "collegeLogo": "https://www.collegerecon.com/assets/college-media/512_logo.jpg",
 *			      "collegePhoto": "https://www.collegerecon.com/assets/college-media/512_photo.jpg"
 *			    },
 *			    {
 *			      "collegeId": 101,
 *			      "collegeName": "Upper Iowa University",
 *			      "streetAddress": "605 Washington St",
 *			      "city": "Fayette",
 *			      "state": "IA",
 *			      "postalCode": "52142",
 *			      "phone": "(563) 425-5200",
 *			      "website": "http://www.uiu.edu",
 							"overview": "this is short description",
 *			      "collegeLogo": "https://www.collegerecon.com/assets/college-media/Upper_Iowa_University_logo.jpg",
 *			      "collegePhoto": "https://www.collegerecon.com/assets/college-media/Upper_Iowa_University_photo.jpg"
 *			    }],
 *	 "count":2	
 *	 }
 */
 router.post('/college/search', function(req, res ) {
 	logger.log('info', "search-criteria " + JSON.stringify(req.body));
 	collegeService.searchCollege(req.body)
 	.then(function(response){
 		if(response)
 		{
 			res.json({success:true,data:response});
 		}
 		else
 		{
 			res.json({success:false,data:null,message:'college not found'});
 		}
 		
 	},function(err){ errorHandler(err,res); });
 	
 });

/**
 * @api {get} /college/:collegeid Request College by College Id 
 * @apiName search college by college id
 * @apiGroup College
 *
 * @apiParam {Number} collegeid College Id.
 *
 * @apiSuccess {Boolean} success Request status.
 * @apiSuccess {object} data  Response wrapper.
 * @apiSuccess {Number} data.collegeId  College Id.
 * @apiSuccess {String} data.collegeName  College Name.
 * @apiSuccess {String} data.streetAddress  College Address.
 * @apiSuccess {String} data.city  City.
 * @apiSuccess {String} data.state  State.
 * @apiSuccess {String} data.postalCode  Postal Code.
 * @apiSuccess {String} data.phone  Phonen Number.
 * @apiSuccess {String} data.website  College Website.
 * @apiSuccess {String} data.collegeLogo Url of image of college logo.
 * @apiSuccess {String} data.collegePhoto Url of image of college.
 * @apiSuccess {String} data.collegeBanner Url of image of college banner.
 * @apiSuccess {String} data.status College status.
 * @apiSuccess {String} data.timeZone College Timezone.
 * @apiSuccess {String} data.fax College Fax.
 * @apiSuccess {String} data.email College Email.
 * @apiSuccess {String} data.overview College Overview.
 * @apiSuccess {object} data.veteranAffairs College veteran affairs.
 * @apiSuccess {String} data.veteranAffairs.name Veteran Affairs Name.
 * @apiSuccess {String} data.veteranAffairs.adress Veteran Affairs Address.
 * @apiSuccess {String} data.veteranAffairs.city Veteran Affairs City.
 * @apiSuccess {String} data.veteranAffairs.state Veteran Affairs State.
 * @apiSuccess {String} data.veteranAffairs.postalCode Veteran Affairs PostalCode.
 * @apiSuccess {String} data.veteranAffairs.phone Veteran Affairs Phone.
 * @apiSuccess {String} data.veteranAffairs.fax Veteran Affairs Fax.
 * @apiSuccess {String} data.veteranAffairs.email Veteran Affairs Email.
 * @apiSuccess {String} data.veteranAffairs.website Veteran Affairs Website.
 * @apiSuccess {Number} data.inStateTuition College In state Tuition.
 * @apiSuccess {Number} data.outStateTuition College Out State Tuition.
 * @apiSuccess {Number} data.maleStudentCount Total male students.
 * @apiSuccess {Number} data.femaleStudentCount Total female students.
 * @apiSuccess {Number} data.studentPopulation Total students.
 * @apiSuccess {String} data.religiousAffiliation College Religious Affiliation.
 * @apiSuccess {String} data.ethnicAffiliation College Ethnic Affiliation.
 * @apiSuccess {String} data.yearsOffered Year offered.
 * @apiSuccess {String} data.genderPreference Gender Preference.
 * @apiSuccess {String} data.schoolSetting School Setting.
 * @apiSuccess {String} data.publicPrivate Public or Private.
 * @apiSuccess {String} data.SatScore SAT Score.
 * @apiSuccess {String} data.actScore ACT Score.
 * @apiSuccess {String} data.gpaRange GPA Range.
 * @apiSuccess {String} data.academicLevel Academic Level.
 * @apiSuccess {String} data.rotc ROCT.
 * @apiSuccess {String} data.yellowRibbon Yellow Ribbon.
 * @apiSuccess {String} data.clepCredit CLEP Credit.
 * @apiSuccess {String} data.dsstCredit DSST Credit.
 * @apiSuccess {String} data.onlineClasses Online Classes.
 * @apiSuccess {String} data.followAceCredit ACE Credit.
 * @apiSuccess {String} data.reducedTuition Reduced Tutuion.
 * @apiSuccess {String} data.scholarshipsForVeterans Scholarships For Veterans.
 * @apiSuccess {String} data.inStateTuitionNoResidency In State Tuition No Residency.
 * @apiSuccess {String} data.approvedTaFunding Approved TA Funding.
 * @apiSuccess {String} data.principlesOfExcellence Principles Of Excellence.
 * @apiSuccess {String} data.fullTimeVetCounselors FullTime Veteran Counselors.
 * @apiSuccess {String} data.clubAssocCampus Club / Association on Campus.
 * @apiSuccess {String} data.upwardBound Upward Bound.
 * @apiSuccess {String} data.awardsAceCredit Awards Ace Credit.
 * @apiSuccess {String} data.sva SVA.
 * @apiSuccess {String} data.bah B.A.H.
 * @apiSuccess {String} data.giBill GI Bill Students.
 * @apiSuccess {String} data.eightKeys 8 Keys to success.
 * @apiSuccess {String} data.calendar Calendar.
 * @apiSuccess {String} data.books Books.
 * @apiSuccess {String} data.accessLevel Access Level.
 * @apiSuccess {object[]} data.majorsOffered Majors offered by college.
 * @apiSuccess {integer} data.majorsOffered.majorId Primary Id of the Major.
 * @apiSuccess {String} data.majorsOffered.majorTitle Title of the Major.
 * @apiSuccess {String} data.majorsOffered.description Description for the Major.
 * @apiSuccess {string} [message] Message (only returned when error occurs).
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *    {
 *	  "success": true,
 *	  "data": {
		    "collegeName": "Alaska Bible College",
		    "streetAddress": "248 E Elmwood",
		    "city": "Palmer",
		    "state": "AK",
		    "postalCode": "99645",
		    "phone": "(907) 745-3201",
		    "website": "www.akbible.edu/",
		    "collegeLogo": "https://www.collegerecon.com/assets/college-media/alaska.jpg",
		    "collegePhoto": "https://www.collegerecon.com/assets/college-media/bible.jpg",
				"collegeBanner": "https://www.collegerecon.com/assets/college-media/banner.jpg",
		    "status": "ACTIVE",
		    "timeZone": "America/Chicago",
		    "fax": "",
		    "email": "information@hfalliance.com",
		    "overview": "The purpose of Alaska Bible College is to exalt the Lord Jesus Christ and extend ...",
		    "veteranAffairs": {
		      "name": "David Ley",
		      "adress": "",
		      "city": "",
		      "state": "",
		      "postalCode": "",
		      "phone": "(800) 478-7884",
		      "fax": "",
		      "email": "",
		      "website": "http://example.com"
		    },
		    "inStateTuition": 9300,
		    "outStateTuition": 9300,
		    "maleStudentCount": 45.7,
		    "femaleStudentCount": 54.3,
		    "studentPopulation": 58,
		    "religiousAffiliation": "UndeNo Religious Affiliationminational",
		    "ethnicAffiliation": "No ethnic affiliation",
		    "yearsOffered": "4 Year",
		    "genderPreference": "Coed School",
		    "schoolSetting": "Town",
		    "publicPrivate": "Private",
		    "SatScore": 0,
		    "actScore": 0,
		    "gpaRange": "",
		    "academicLevel": "Level 5",
		    "rotc": "NO",
		    "yellowRibbon": "NO",
		    "clepCredit": "YES",
		    "dsstCredit": "NO",
		    "onlineClasses": "YES",
		    "followAceCredit": "NO",
		    "reducedTuition": "NO",
		    "scholarshipsForVeterans": "NO",
		    "inStateTuitionNoResidency": "NO",
		    "approvedTaFunding": "NO",
		    "principlesOfExcellence": "NO",
		    "fullTimeVetCounselors": "NO",
		    "clubAssocCampus": "NO",
		    "upwardBound": "NO",
		    "awardsAceCredit": "NO",
		    "sva": "No",
		    "bah": 2148,
		    "giBill": 3,
		    "eightKeys": "NO",
		    "calendar": "SEMESTERS",
		    "books": 300,
		    "accredit": "",
		    "accessLevel": "Registered",
		    "majorsOffered": [
		      {
		        "majorId": 390201,
		        "majorTitle": "Bible/Biblical Studies",
		        "description": "A program that focuses on the Christian and/or Jewish Bible and related literature, with an emphasis on understanding and interpreting the theological, doctrinal, and ethical messages contained therein  May include preparation for applying these studies i"
		      },
		      {
		        "majorId": 390301,
		        "majorTitle": "Missions/Missionary Studies and Missiology",
		        "description": "A program that focuses on the theory and practice of religious outreach, social service and proselytization, and that prepares individuals for mission vocations  Includes instruction in theology, evangelism, preaching, medical and social mission work, mis"
		      },
		      {
		        "majorId": 390601,
		        "majorTitle": "Theology/Theological Studies",
		        "description": "A program that focuses on the beliefs and doctrine of a particular religious faith from the intramural point of view of that faith  Includes instruction in systematic theology, historical theology, moral theology, doctrinal studies, dogmatics, apologetics"
		      }
		    ]
		  },
 *	 "count":2	
 *	 }np
 */
 router.get('/college/:collegeid', function(req, res ) {

 	collegeService.getCollegeProfile(req.params.collegeid)
 	.then(function(response){
 		if(response.length > 0)
 		{
 			res.json({success:true,data:response[0]});
 		}
 		else
 		{
 			res.json({success:false,data:null,message:'college not found'});
 		}
 		
 	},function(err){ errorHandler(err,res); });
 	
 });

 router.get('/college/comparison/:collegeId/:studentId', function(req, res ) {

 	collegeService.getCollegeComparisonDetail(req.params.collegeId, req.params.studentId)
 	.then(function(response){
	res.json({success:true,data:response});
 		
 	},function(err){ errorHandler(err,res); });
 	
 });


/**
 * @api {post} /college/collegesearch Search College 
 * @apiName collegesearch 
 * @apiGroup College
 *
 * 
 * @apiParam {String} [text] text enter in search box.

 * @apiSuccess {Boolean} success Request status.
 * @apiSuccess {object[]} data  Response wrapper.
 * @apiSuccess {Number} data.collegeId  College Id.
 * @apiSuccess {String} data.collegeName  College Name.
 * @apiSuccess {String} data.streetAddress  College Address.
 * @apiSuccess {String} data.city  City.
 * @apiSuccess {String} data.state  State.
 * @apiSuccess {String} data.postalCode  Postal Code.
 * @apiSuccess {String} data.phone  Phonen Number.
 * @apiSuccess {String} data.website  College Website.
 * @apiSuccess {String} data.overview college short description.
 * @apiSuccess {String} data.collegeLogo Url of image of college logo.
 * @apiSuccess {String} data.collegePhoto Url of image of college.
 * @apiSuccess {string} [message] Message (only returned when error occurs).
 * @apiSuccess {Number} [count] Length of data (only retuned when success).

 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *    {
 *	  "success": true,
 *	  "data": [{
 *			      "collegeId": 100,
 *			      "collegeName": "Quinnipiac University",
 *			      "streetAddress": "275 Mt Carmel Ave",
 *			      "city": "Hamden",
 *			      "state": "CT",
 *			      "postalCode": "06518",
 *			      "phone": "203-582-8600",
 *			      "website": "http://www.qu.edu",
 *				  "overview": "this is short description",
 *			      "collegeLogo": "https://www.collegerecon.com/assets/college-media/512_logo.jpg",
 *			      "collegePhoto": "https://www.collegerecon.com/assets/college-media/512_photo.jpg"
 *			    },
 *			    {
 *			      "collegeId": 101,
 *			      "collegeName": "Upper Iowa University",
 *			      "streetAddress": "605 Washington St",
 *			      "city": "Fayette",
 *			      "state": "IA",
 *			      "postalCode": "52142",
 *			      "phone": "(563) 425-5200",
 *			      "website": "http://www.uiu.edu",
 				  "overview": "this is short description",
 *			      "collegeLogo": "https://www.collegerecon.com/assets/college-media/Upper_Iowa_University_logo.jpg",
 *			      "collegePhoto": "https://www.collegerecon.com/assets/college-media/Upper_Iowa_University_photo.jpg"
 *			    }],
 *	 "count":2	
 *	 }
 */
 router.post('/college/collegesearch', function(req, res ) {
 	collegeService.searchCollegeSearch(req.body)
 	.then(function(response){
 		if(response)
 		{
 			res.json({success:true,data:response});
 		}
 		else
 		{
 			res.json({success:false,data:null,message:'college not found'});
 		}
 		
 	},function(err){ errorHandler(err,res); });
 	
 });

 /**
 * @api {post} /college/autolist Search College 
 * @apiName collegesearch 
 * @apiGroup College
 *
 * 
 * @apiParam {String} [text] text enter in search box.

 * @apiSuccess {Boolean} success Request status.
 * @apiSuccess {object[]} data  Response wrapper.
 * @apiSuccess {Number} data.collegeId  College Id.
 * @apiSuccess {String} data.collegeName,data.city,data.state  College Name.
 * @apiSuccess {string} [message] Message (only returned when error occurs).
 * @apiSuccess {Number} [count] Length of data (only retuned when success).

 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *    {
 *	  "success": true,
 *	  "data": [{
 *			      "collegeId": 100,
 *			      "collegeName": "Quinnipiac University - Hamden, CT"
 *			    },
 *			    {
 *			      "collegeId": 101,
 *			      "collegeName": "Upper Iowa University - Fayette, IA"
 *			    }],
 *	 "count":2	
 *	 }
 */
 router.post('/college/autolist', function(req, res ) {
 	collegeService.getautolistCollege(req.body)
 	.then(function(response){
 		if(response)
 		{
 			res.json({success:true,data:response,count:response.length});
 		}
 		else
 		{
 			res.json({success:false,data:null,message:'college not found'});
 		}
 		
 	},function(err){ errorHandler(err,res); });
 	
 });

/**
 * @api {get} /api/college/newsfeed/:collegeId Request All newsfeed information by College Id
 * @apiName getNewsfeedByCollege
 * @apiGroup College
 *
 * @apiParam {Number} collegeId Filter by collegeId.
 *
 * @apiSuccess {Boolean} success Request Status.
 * @apiSuccess {object[]} data Data Wrapper.
 * @apiSuccess {integer} data.newsfeedId Primary Id of the Newsfeed.
 * @apiSuccess {String} data.post post of Newsfeed.
 * @apiSuccess {String} data.postType post type for the Newsfeed.
 * @apiSuccess {String} data.postPrivacy post privacy for the Newsfeed.
 * @apiSuccess {String} data.dlImageUrl image url for the Newsfeed.
 * @apiSuccess {String} data.resourceUrl resource url for the Newsfeed.
 * @apiSuccess {String} data.dateCreated created date for the Newsfeed.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *    {
 *	  "success": true,
 *	  "data": [{
			      "newsfeedId": 1,
			      "post": "newsfeed text here",
			      "postType": "TEXT",
						"postPrivacy": "public",
						"dlImageUrl": "https://i.ytimg.com/vi/CpIs7hv1NK0/maxresdefault.jpg",
						"resourceUrl": "https://www.youtube.com/watch?v=CpIs7hv1NK0",
						"dateCreated": "2015-09-22 16:51:05"
			    },
			    {
			      "newsfeedId": 2,
			      "post": "newsfeed text here",
			      "postType": "ARTIFACT",
						"postPrivacy": "private",
						"dlImageUrl": "https://i.ytimg.com/vi/CpIs7hv1NK0/maxresdefault.jpg",
						"resourceUrl": "https://www.youtube.com/watch?v=CpIs7hv1NK0",
						"dateCreated": "2015-09-22 16:51:05"
			    }],
 *	 "count":2
 *	 }
 */

 router.get('/college/newsfeed/:collegeId', function(req, res ) {
 	collegeService.getNewsfeedByCollege(req.params.collegeId)
 	.then(function(response){
 		res.json({success:true,data:response,count:response.length});
 	},function(err){ errorHandler(err,res); });
 	
 });

 /**
 * @api {post} /college/update/overviewtext  
 * @apiName update overview text information
 * @apiGroup College
 */ 
 router.post('/college/update/overviewtext', function(req, res ) {
 	collegeService.updateCollegeOverviewText(req.body)
 	.then(function(response){
 		if(response)
 		{
 			res.json({success:true,data:response});
 		}
 		else
 		{
 			res.json({success:false,data:null,message:'unable to update'});
 		}

 	},function(err){ errorHandler(err,res); });

 });

/**
 * @api {post} /college/update/photo  
 * @apiName update college photo
 * @apiGroup College
 */ 
 router.post('/college/update/photo', function(req, res ) {
 	var ext = req.body.fileExtension;
 	var imagePath = req.body.photoPath.split(",");
 	var base64Data = imagePath[1];
	//var base64Data = req.body.photoPath.replace(/^data:image\/png;base64,/, "");
	var imageName = req.body.collegeAlias +'_photo.'+ext;
	var bitmap = new Buffer(base64Data, 'base64');


	var params = {
		Key: 'assets/college-assets/'+imageName,
		Body: bitmap,
		contentType: 'image/jpeg',
		ACL: 'public-read'
	}
	
	// require("fs").writeFile('college_images/'+imageName, bitmap, function(err) {
	// 	console.log(err);
	// });

	var s3 = new AWS.S3({params: {Bucket: config.BUCKET_NAME}});

	s3.upload(params, function(err, data) {
		if(err) {
			console.log(err, err.stack);
		} else {
			collegeService.uploadPhoto(imageName, req.body.collegeId)
			.then(function(response){
				if(response)
				{
					res.json({success:true,data:response});
				}
				else
				{
					res.json({success:false,data:null,message:'unable to update'});
				}
		
			},function(err){ errorHandler(err,res); });
		}
	})
});

/**
 * @api {post} /college/update/logo  
 * @apiName update college logo
 * @apiGroup College
 */ 
 router.post('/college/update/logo', async function(req, res ) {
 	var ext = req.body.fileExtension;
	var imagePath = req.body.logoPath.split(",");
 	var base64Data = imagePath[1];
	// var base64Data = req.body.logoPath.replace(/^data:image\/png;base64,/, "");
	var imageName = req.body.collegeAlias +'_logo.'+ext;
	var bitmap = new Buffer(base64Data, 'base64');
	
	var params = {
		Key: 'assets/college-assets/'+imageName,
		Body: bitmap,
		contentType: 'image/jpeg',
		ACL: 'public-read'
	}

	var s3 = new AWS.S3({params: {Bucket: config.BUCKET_NAME}});

	s3.upload(params, function(err, data) {
		if(err) {
			console.log(err, err.stack);
		} else {
			collegeService.uploadLogo(imageName, req.body)
			.then(function(response){
				if(response)
				{
					res.json({success:true,data:response});
				}
				else
				{
					res.json({success:false,data:null,message:'unable to update'});
				}
		
			},function(err){ errorHandler(err,res); });
		}
	})


	// console.log(imageName)

	// s3.deleteObject(deleteParams, function(err,data) {
	// 	if(err) {
	// 		console.log("error",err)
	// 	} else {
	// 	}
	// })
});

/**
 * @api {post} /college/update/banner  
 * @apiName update college banner
 * @apiGroup College
 */ 
 router.post('/college/update/banner', function(req, res ) {
 	var ext = req.body.fileExtension;
 	var imagePath = req.body.bannerPath.split(",");
 	var base64Data = imagePath[1];
	//var base64Data = req.body.bannerPath.replace(/^data:image\/png;base64,/, "");
	var imageName = req.body.collegeAlias +'_banner.'+ext;
	var bitmap = new Buffer(base64Data, 'base64');
	
// require("fs").writeFile('college_images/'+imageName, bitmap, function(err) {
	// 	console.log(err);
	// });
	var params = {
		Key: 'assets/college-assets/'+imageName,
		Body: bitmap,
		contentType: 'image/jpeg',
		ACL: 'public-read'
	}
	var s3 = new AWS.S3({params: {Bucket: config.BUCKET_NAME}});

	s3.upload(params, function(err, data) {
		if(err) {
			console.log(err, err.stack);
		} else {
			collegeService.uploadBanner(imageName, req.body)
			.then(function(response){
				if(response)
				{
					res.json({success:true,data:response});
				}
				else
				{
					res.json({success:false,data:null,message:'unable to update'});
				}
		
			},function(err){ errorHandler(err,res); });
		}
	})

});

/**
 * @api {post} /college/update/vsdimage  
 * @apiName update vsd image
 * @apiGroup College
 */ 
router.post('/college/update/vsdimage', function(req, res ) {
	var ext = req.body.fileExtension;
	var imagePath = req.body.photoPath.split(",");
	var base64Data = imagePath[1];
   //var base64Data = req.body.bannerPath.replace(/^data:image\/png;base64,/, "");
   var imageName = req.body.collegeAlias +'_vsd.'+ext;
   var bitmap = new Buffer(base64Data, 'base64');

   var params = {
	Key: 'assets/college-assets/vsd/'+imageName,
	Body: bitmap,
	contentType: 'image/jpeg',
	ACL: 'public-read'
}
var s3 = new AWS.S3({params: {Bucket: config.BUCKET_NAME}});

s3.upload(params, function(err, data) {
	if(err) {
		console.log(err, err.stack);
	} else {
		collegeService.uploadVsdImage(imageName, req.body.collegeId)
		.then(function(response){
			if(response)
			{
				res.json({success:true,data:response});
			}
			else
			{
				res.json({success:false,data:null,message:'unable to update'});
			}
	 
		},function(err){ errorHandler(err,res); });
	}
})
   
//    require("fs").writeFile('college_images/vsd/'+imageName, bitmap, function(err) {
// 	   console.log(err);
//    });

});

/**
 * @api {post} /college/update/collegeoverview  
 * @apiName update collegeoverview information
 * @apiGroup College
 */ 
 router.post('/college/update/collegeoverview', function(req, res ) {
 	collegeService.updateCollegeOverview(req.body)
 	.then(function(response){
 		if(response)
 		{
 			res.json({success:true,data:response});
 		}
 		else
 		{
 			res.json({success:false,data:null,message:'unable to update'});
 		}

 	},function(err){ errorHandler(err,res); });

 });

/**
 * @api {post} /college/update/collegelocation
 * @apiName update collegelocation information
 * @apiGroup College
 */ 
 router.post('/college/update/collegelocation', function(req, res ) {
 	collegeService.updateCollegeLocation(req.body)
 	.then(function(response){
 		if(response)
 		{
 			res.json({success:true,data:response});
 		}
 		else
 		{
 			res.json({success:false,data:null,message:'unable to update'});
 		}

 	},function(err){ errorHandler(err,res); });

 });

/**
 * @api {post} /college/update/collegemilitarydata
 * @apiName update collegelocation information
 * @apiGroup College
 */ 
 router.post('/college/update/collegemilitarydata', async (req, res ) => {
	try {
		const response = await collegeService.updateMilitaryOfferings(req.body)
		res.json({ success: true, data: response });
	} catch (error) {
		errorHandler(error, res);
	}
 });

 router.post('/college/update/timeline', function(req, res ) {
 	collegeService.saveTimeLine(req.body)
 	.then(function(response){
 		if(response)
 		{
 			res.json({success:true,data:response});
 		}
 		else
 		{
 			res.json({success:false,data:null,message:'unable to update'});
 		}

 	},function(err){ errorHandler(err,res); });

 });

  router.get('/college/timeline/delete/:collegeid/:id/', function(req, res ) {
 	collegeService.deleteTimeLine(req.params.collegeid, req.params.id)
 	.then(function(response){
 		if(response)
 		{
 			res.json({success:true,data:response});
 		}
 		else
 		{
 			res.json({success:false,data:null,message:'unable to update'});
 		}

 	},function(err){ errorHandler(err,res); });

 });

router.post('/college/update/collegeMajordata/:collegeId', async (req, res) => {
	try {
		const collegeMajors = await collegeService.updateMajorOfferings(req.body, req.params.collegeId);
		if(collegeMajors) res.json({ success: true, data: collegeMajors }); else res.json({success: false, data: null, message: 'unable to update'});
	} catch (error) {
		errorHandler(error, res);
	}
});

router.get('/college/profileview/:collegeid', function(req, res ) {
	collegeService.getCollegeProfileView(req.params.collegeid)
	.then(function(response){
		if(response.length > 0)
		{
			res.json({success:true,data:response});
		}
		else
		{
			res.json({success:false,data:null,message:'Unable to get data'});
		}

	},function(err){ errorHandler(err,res); });
});

router.get('/college/favouritelist/:collegeid', function(req, res ) {
	collegeService.getCollegeFavouriteList(req.params.collegeid)
	.then(function(response){
		if(response.length > 0)
		{
			res.json({success:true,data:response});
		}
		else
		{
			res.json({success:false,data:null,message:'Unable to get data'});
		}

	},function(err){ errorHandler(err,res); });

});

router.get('/newsfeed', function(req, res ) {
	collegeService.getNewsFeed()
	.then(function(response){
		if(response.length > 0)
		{
			res.json({success:true,data:response});
		}
		else
		{
			res.json({success:false,data:null,message:'Unable to get data'});
		}

	},function(err){ errorHandler(err,res); });

});

router.get('/setting/collegeuser/:collegeuserid', function(req, res ) {
	collegeService.getCollegeUserInfo(req.params.collegeuserid)
	.then(function(response){
		if(response.length > 0)
		{
			res.json({success:true,data:response});
		}
		else
		{
			res.json({success:false,data:null,message:'Unable to get data'});
		}

	},function(err){ errorHandler(err,res); });

});

/**
 * @api {post} /register/match/collegelist  
 * @apiName get match register college list
 * @apiGroup College
 */ 
router.post('/register/match/collegelist', function(req, res ) {
	collegeService.getRegisterMatchCollege(req.body)
	.then(function(response){
	  if(response)
	  {
		res.json({success:true,data:response});
	  }
	  else
	  {
		res.json({success:false,data:null,message:'unable to get data'});
	  }
  
	},function(err){ errorHandler(err,res); });
  
  });

//   For bounceback email to new users

  router.post('/emailbounceback/match/collegelist', function(req, res) {
	collegeService.getNewRegisteredMatchCollege(req.body)
	.then(function(response) {
		if(response)
		{
			res.json({success:true, data:response})
		}
		else
		{
			res.json({success: false,data:null, message:'unable to get the data'});
		}
	}, function(err) { errorHandler(err,res); });
});

router.post('/emailbounceback/autosendemail/newuser', function(req, res) {
	collegeService.sendBackEmailToNewUser(req.body)
	.then(function(response) {
		if(response)
		{
			res.json({success: true, data: response})
		}
		else
		{
			res.json({success: false, data: null, message: 'unable to get data'});
		}
	})
})

router.post('/emailbounceback/match/bucketdata', function (req, res) {
	collegeService.sendBackBucketDataEmailToNewUser(req.body)
		.then(function(response) {
			if(response)
			{
				res.json({success: true, data: response})
			}
			else
			{
				res.json({success: false, data: null, message: 'unable to get data'});
			}
		})
})

/**
 * @api {post} /register/match/emaildata  
 * @apiName get match register college list
 * @apiGroup College
 */ 
router.post('/register/match/emaildata', function(req, res ) {
	collegeService.getRegisterMatchEmailData(req.body)
	.then(function(response){
	  if(response)
	  {
		res.json({success:true,data:response});
	  }
	  else
	  {
		res.json({success:false,data:null,message:'unable to get data'});
	  }
  
	},function(err){ errorHandler(err,res); });
  
  });

router.get('/college/basicinfo/:collegeid', function(req, res ) {
	collegeService.getCollegeBasicInfo(req.params.collegeid)
	.then(function(response){
		if(response.length > 0)
		{
			res.json({success:true,data:response});
		}
		else
		{
			res.json({success:false,data:null,message:'Unable to get data'});
		}

	},function(err){ errorHandler(err,res); });

});

router.get('/college/static/collegelist/:collegeids', function(req, res ) {
	collegeService.getStaticCollegeList(req.params.collegeids)
	.then(function(response){
		if(response){
			if(response.collegelist.length > 0)
			{
				res.json({success:true,data:response.collegelist});
			}
			else
			{
				res.json({success:false,data:null,message:'Unable to get data'});
			}
		}

	},function(err){ errorHandler(err,res); });

});

router.post('/nagemail/subscription', function(req, res ) {
	collegeService.getNagEmailSubscriptionData(req.body)
	.then(function(response){
	  if(response)
	  {
		res.json({success:true,data:response});
	  }
	  else
	  {
		res.json({success:false,data:null,message:'unable to get data'});
	  }
  
	},function(err){ errorHandler(err,res); });
  
  });

  router.get('/college/metadata/:collegeid', function(req, res ) {
	collegeService.getCollegeMetadata(req.params.collegeid)
	.then(function(response){
		if(response.length > 0)
		{
			res.json({success:true,data:response[0]});
		}
		else
		{
			res.json({success:false,data:null,message:'college not found'});
		}
		
	},function(err){ errorHandler(err,res); });
});

router.get('/college/existby/collegeid/:collegeid', function(req, res ) {
	collegeService.checkCollegeExist(req.params.collegeid)
	.then(function(response){
		if(response.length > 0)
		{
			res.json({success:true,data:response});
		}
		else
		{
			res.json({success:false,data:null,message:'college not found'});
		}
		
	},function(err){ errorHandler(err,res); });
});

router.post('/college/monthlyreport/subscription', function(req, res ) {
	collegeService.updateCollegeMonthlySubscriptionData(req.body)
	.then(function(response){
	  if(response)
	  {
		res.json({success:true,data:response});
	  }
	  else
	  {
		res.json({success:false,data:null,message:'unable to get data'});
	  }
  
	},function(err){ errorHandler(err,res); });
  
  });
//college data add by college user
router.post('/college/update/collegeoverviewtext', function(req, res ) {
	collegeService.updateCollegeOverviewData(req.body)
	.then(function(response){
		if(response)
		{
			res.json({success:true,data:response});
		}
		else
		{
			res.json({success:false,data:null,message:'unable to update'});
		}

	},function(err){ errorHandler(err,res); });

});

router.get('/college/admin/activity/:collegeid', function(req, res ) {
	collegeService.getCollegeActivityReportForAdmin(req.params.collegeid)
	.then(function(response){
		if(response.length > 0)
		{
			res.json({success:true,data:response});
		}
		else
		{
			res.json({success:false,data:null,message:'college not found'});
		}
		
	},function(err){ errorHandler(err,res); });
});

router.get('/college/admin/activity/report/:collegeid', function(req, res ) {
	collegeService.getTweleveCollegeActivityReportForAdmin(req.params.collegeid)
	.then(function(response){
		if(response.length > 0)
		{
			res.json({success:true,data:response});
		}
		else
		{
			res.json({success:false,data:null,message:'college not found'});
		}
		
	},function(err){ errorHandler(err,res); });
});

router.get('/college/autologin/userinfo/:collegeid', function(req, res ) {
	collegeService.getCollegeAdminUserinfo(req.params.collegeid)
	.then(function(response){
		if(response.length > 0)
		{
			res.json({success:true,data:response});
		}
		else
		{
			res.json({success:false,data:null,message:'college not found'});
		}
		
	},function(err){ errorHandler(err,res); });
});

router.get('/college/yellowribbon/data/:collegeid', function(req, res ) {
	collegeService.getYellowRibbonData(req.params.collegeid)
	.then(function(response){
		if(response.length > 0)
		{
			res.json({success:true,data:response});
		}
		else
		{
			res.json({success:false,data:null,message:'college not found'});
		}
		
	},function(err){ errorHandler(err,res); });
});

router.post('/college/update/yellowribbondata', function(req, res ) {
	collegeService.updateYellowRibbonData(req.body)
	.then(function(response){
		if(response)
		{
			res.json({success:true,data:response});
		}
		else
		{
			res.json({success:false,data:null,message:'unable to update'});
		}

	},function(err){ errorHandler(err,res); });

});

router.get('/import/yellowribbon/data', function(req, res ) {
	collegeService.getImportYellowRibbonData()
	.then(function(response){
		if(response.length > 0)
		{
			res.json({success:true,data:response});
		}
		else
		{
			res.json({success:false,data:null,message:'college not found'});
		}
		
	},function(err){ errorHandler(err,res); });
});

router.get('/student/featureschool/:studentid', function(req, res ) {
	collegeService.getFeatureSchools(req.params.studentid)
	.then(function(response){
		res.json({success:true,data:response});

	},function(err){ errorHandler(err,res); });

});

/*router.get('/update/collegename/alias', function(req, res ) {
    collegeService.updateCollegeNameAlias()
    .then(function(response){
        if(response.length > 0)
        {
            res.json({success:true,data:response});
        }
        else
        {
            res.json({success:false,data:null,message:'college not found'});
        }
        
    },function(err){ errorHandler(err,res); });
});*/

router.get('/collegealias/collegeid/:calias', function(req, res ) {
    collegeService.getCollegeIdFromAlias(req.params.calias)
    .then(function(response){
        if(response)
        {
            res.json({success:true,data:response});
        }
        else
        {
            res.json({success:false,data:null,message:'college not found'});
        }
        
    },function(err){ errorHandler(err,res); });
});

router.get('/collegeid/collegealias/:id', function(req, res ) {
    collegeService.getCollegeAliasFromId(req.params.id)
    .then(function(response){
        if(response)
        {
            res.json({success:true,data:response});
        }
        else
        {
            res.json({success:false,data:null,message:'college not found'});
        }
        
    },function(err){ errorHandler(err,res); });
});

router.get('/college/bucketspecificcollegename/:pri/secbucket/:sec/levels/:level', function(req, res ) {
    collegeService.getSpecificCollegeNameFromBucketId(req.params.pri, req.params.sec, req.params.level)
    .then(function(response){
        if(response)
        {
            res.json({success:true,data:response});
        }
        else
        {
            res.json({success:false,data:null,message:'college not found'});
        }
        
    },function(err){ errorHandler(err,res); });
});

router.get('/college/bucketspecificcollegedata/:id', function(req, res) {
	collegeService.getSpecificCollegeDegreeData(req.params.id)
    .then(function(response){
        if(response)
        {
            res.json({success:true,data:response});
        }
        else
        {
            res.json({success:false,data:null,message:'college not found'});
        }
        
    },function(err){ errorHandler(err,res); });
})

router.get('/college/bucketspecificcollegeprofiledata/:id', function(req, res) {
	collegeService.getSpecificCollegeProfileData(req.params.id)
    .then(function(response){
        if(response)
        {
            res.json({success:true,data:response});
        }
        else
        {
            res.json({success:false,data:null,message:'college not found'});
        }
        
    },function(err){ errorHandler(err,res); });
})

router.post('/college/autolist/withspecific', function(req, res ) {
	collegeService.getautolistCollegeWithSpecific(req.body)
	.then(function(response){
		if(response)
		{
			res.json({success:true,data:response,count:response.length});
		}
		else
		{
			res.json({success:false,data:null,message:'college not found'});
		}
		
	},function(err){ errorHandler(err,res); });
	
});

router.post('/college/contactinfo/tracking', function(req, res ) {
	collegeService.contactInfoTracking(req.body)
	.then(function(response){
		if(response)
		{
			res.json({success:true,data:response,count:response.length});
		}
		else
		{
			res.json({success:false,data:null,message:'college not found'});
		}
		
	},function(err){ errorHandler(err,res); });
	
});

router.post('/college/bookmark/tracking', function(req, res ) {
	collegeService.bookmarkTracking(req.body)
	.then(function(response){
		if(response)
		{
			res.json({success:true,data:response,count:response.length});
		}
		else
		{
			res.json({success:false,data:null,message:'college not found'});
		}
		
	},function(err){ errorHandler(err,res); });
	
});

router.post('/college/tabs/tracking', function(req, res ) {
	collegeService.tabClickTracking(req.body)
	.then(function(response){
		if(response)
		{
			res.json({success:true,data:response,count:response.length});
		}
		else
		{
			res.json({success:false,data:null,message:'college not found'});
		}
		
	},function(err){ errorHandler(err,res); });
	
});

router.post('/college/homepagelink/tracking', function(req, res ) {
	collegeService.homepageLinkTracking(req.body)
	.then(function(response){
		if(response)
		{
			res.json({success:true,data:response,count:response.length});
		}
		else
		{
			res.json({success:false,data:null,message:'college not found'});
		}
		
	},function(err){ errorHandler(err,res); });
	
});

router.post('/college/button/tracking', function(req, res ) {
	collegeService.buttonClickTracking(req.body)
	.then(function(response){
		if(response)
		{
			res.json({success:true,data:response,count:response.length});
		}
		else
		{
			res.json({success:false,data:null,message:'college not found'});
		}
		
	},function(err){ errorHandler(err,res); });
	
});

router.post('/college/nonpartner/similarschool', function(req, res ) {
	collegeService.getSimilarSchoolLists(req.body, req.query)
	.then(function(response){
		if(response)
		{
			res.json({success:true,data:response,count:response.length});
		}
		else
		{
			res.json({success:false,data:null,message:'college not found'});
		}
		
	},function(err){ errorHandler(err,res); });
	
});

router.post('/college/email/unsubscribe', function(req, res ) {
	collegeService.unsubscribeCollegeEamil(req.body)
	.then(function(response){
		if(response)
		{
			res.json({success:true,data:response,count:response.length});
		}
		else
		{
			res.json({success:false,data:null,message:'college not found'});
		}
		
	},function(err){ errorHandler(err,res); });
	
});

router.get('/update/filter/collegename', function(req, res ) {
    collegeService.updateCollegeName()
    .then(function(response){
        if(response.length > 0)
        {
            res.json({success:true,data:response});
        }
        else
        {
            res.json({success:false,data:null,message:'college not found'});
        }
        
    },function(err){ errorHandler(err,res); });
});

router.get('/college/rotc-branch-url/:collegeId', async(req, res) => {
	try {
		const rotcBranchUrl = await collegeService.getRotcBranchUrl(req.params.collegeId);
		res.json({ success: true, data: rotcBranchUrl });
	} catch (error) {
		errorHandler(error, res);
	}
});

router.post('/college/rotc-branch-url/:collegeId', async(req, res) => {
	try {
		await collegeService.insertRotcBranchUrl(req.params.collegeId, req.body);
		res.json({ success: true, data: 'success' });
	} catch (error) {
		errorHandler(error, res);
	}
})

router.get('/college/mycaa/data/:collegeId', async(req, res) => {
	try {
		const mycaaData = await collegeService.getMycaaData(req.params.collegeId);
		res.json({ success: true, data: mycaaData });
	} catch (error) {
		errorHandler(error, res);
	}
});

router.get('/autocollege/listby/name', async(req, res ) => {
	try {
		const collegeData = await collegeService.getautolistCollegeByName(req.body);
		res.json({ success:true,data:collegeData,count:collegeData.length });
	} catch (error) {
		errorHandler(error, res);
	}
});

router.get('/college/multicampus/datalist/:collegeId/:parentId', async(req, res) => {
	try {
		const childData = await collegeService.getMultiCampusList(req.params.collegeId, req.params.parentId);
		res.json({ success: true, data: childData });
	} catch (error) {
		errorHandler(error, res);
	}
});

router.get('/college/multicampus/collegelist/:collegeId/:parentId', async(req, res) => {
	try {
		const childData = await collegeService.getMultiCampusCollegeList(req.params.collegeId, req.params.parentId);
		res.json({ success: true, data: childData });
	} catch (error) {
		errorHandler(error, res);
	}
});

router.post('/veteran/multicampus/matched/collegelist', async(req, res) => {
	try {
		const mactchedCollege = await collegeService.getMatchedMultiCampusCollegeList(req.body);
		res.json({ success: true, data: mactchedCollege });
	} catch (error) {
		errorHandler(error, res);
	}
})
// Return router
module.exports = router;