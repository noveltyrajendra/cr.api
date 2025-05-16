const express = require('express');
const router = express.Router();
const superAdminCollegeService=require('../services/superAdminCollegeService');
const { errorHandler } = require('../utils/errorHandler');

router.use(function(req,res,next){
	// console.log('middleware is working.');	
	next(); 
});

router.get('/superadmin/college/list/:type', function(req, res ) {
	superAdminCollegeService.listColleges(req.params.type)
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

router.get('/superadmin/disable/college/list', function(req, res ) {
	superAdminCollegeService.listInactiveColleges()
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

router.get('/superadmin/collegelist', function(req, res ) {
	superAdminCollegeService.listCollegesData()
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

router.get('/superadmin/collegelist/:state', function(req, res ) {
	superAdminCollegeService.listCollegesByState(req.params.state)
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

router.get('/superadmin/national/collegelist', function(req, res ) {
	superAdminCollegeService.listNationalCollegesData()
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

router.post('/superadmin/national/savelist', function(req, res ) {
	superAdminCollegeService.saveNationalList(req.body)
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

router.get('/superadmin/state/collegelist/:state', function(req, res ) {
	superAdminCollegeService.listStateCollegesData(req.params.state)
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

router.post('/superadmin/state/savelist', function(req, res ) {
	superAdminCollegeService.saveStateList(req.body)
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

router.get('/superadmin/college/edit/:id', function(req, res ) {
	superAdminCollegeService.getCollegeDataById(req.params.id)
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

router.post('/superadmin/addcollege', function(req, res ) {
	superAdminCollegeService.addCollegeinfo(req.body)
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

router.post('/superadmin/editcollege', function(req, res ) {
	superAdminCollegeService.editCollegeinfo(req.body)
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

router.post('/superadmin/accesseditcollege', function(req, res ) {
	superAdminCollegeService.accessEditCollegeinfo(req.body)
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

router.post('/superadmin/collegesearch', function(req, res ) {
	superAdminCollegeService.collegeSearchData(req.body)
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

router.get('/superadmin/statewise/collegecount', function(req, res ) {
	superAdminCollegeService.listStateWiseCollegesCount()
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

router.get('/superadmin/dashboard/college/bucketrelation', function(req, res ) {
	//superAdminCollegeService.manageCollegeBucketRelation()
	superAdminCollegeService.manageCollegeBucketRelationPartial()
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

router.get('/superadmin/dashboard/student/bucketrelation', function(req, res ) {
	superAdminCollegeService.manageStudentBucketRelation()
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

router.get('/superadmin/college/contacts/list', function(req, res ) {
	superAdminCollegeService.listCollegeContacts()
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

router.get('/superadmin/college/contacts/edit/:id', function(req, res ) {
	superAdminCollegeService.editCollegeContacts(req.params.id)
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

router.post('/superadmin/editcollege/contacts', function(req, res ) {
	superAdminCollegeService.collegeContactsData(req.body)
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

router.post('/superadmin/addcollege/contacts', function(req, res ) {
	superAdminCollegeService.addCollegeContactsData(req.body)
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

router.get('/superadmin/college/imageinfo/list', function(req, res ) {
	superAdminCollegeService.listCollegeImageInfoList()
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

//Route for college bounce order listing
router.get('/superadmin/bounce/statewise/collegecount', function(req, res ) {
	superAdminCollegeService.listStateWiseBounceCollegesCount()
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

router.get('/superadmin/bounce/collegelist/:state', function(req, res ) {
	superAdminCollegeService.listCollegesBounceByState(req.params.state)
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

router.get('/superadmin/bounce/national/collegelist', function(req, res ) {
	superAdminCollegeService.listNationalBounceCollegesData()
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

router.post('/superadmin/bounce/national/savelist', function(req, res ) {
	superAdminCollegeService.saveNationalBounceList(req.body)
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

router.get('/superadmin/bounce/state/collegelist/:state', function(req, res ) {
	superAdminCollegeService.listStateBounceCollegesData(req.params.state)
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

router.post('/superadmin/bounce/state/savelist', function(req, res ) {
	superAdminCollegeService.saveBounceStateList(req.body)
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

router.get('/superadmin/college/autolist/:stext', function(req, res ) {
	superAdminCollegeService.listCollegesBySearchText(req.params.stext)
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

router.post('/superadmin/dashboardreport/degreereport/users', function (req, res) {
	superAdminCollegeService.getUsersByBucketData(req.body)
	.then(function(response) {
		if(response)
		{
			res.json({success: true, data: response});
		}
		else
		{
			res.json({success:false,data:null,message:'unable to get'});
		}
	}, function(err){ errorHandler(err,res) });
})

router.post('/superadmin/bounce/national/checklist', function(req, res ) {
	superAdminCollegeService.saveNationalBounceTick(req.body)
	.then(function(response){
		if(response)
		{
			res.json({success:true,data:response});
		}
		else
		{
			res.json({success:false,data:null,message:'unable to insert'});
		}

	},function(err){ errorHandler(err,res); });

});

router.post('/superadmin/specificprofilename', function(req, res) {
	superAdminCollegeService.saveSpecificCollegeName(req.body)
	.then(function(response) {
		if(response)
		{
			res.json({success:true,data:response});
		}
		else
		{
			res.json({success:false,data:null,message:'unable to update'});
		}
	},function(err){ errorHandler(err,res); })
})

router.post('/superadmin/update/specificprofilename', function(req, res) {
	superAdminCollegeService.updateSpecificCollegeName(req.body)
	.then(function(response) {
		if(response)
		{
			res.json({success:true,data:response});
		}
		else
		{
			res.json({success:false,data:null,message:'unable to update'});
		}
	},function(err){ errorHandler(err,res); })
})

router.get('/superadmin/college/profilename/:type', function(req, res) {
	superAdminCollegeService.getSpecificCollegeName(req.params.type)
	.then(function(response) {
		if(response)
		{
			res.json({success:true,data:response});
		}
		else
		{
			res.json({success:false,data:null,message:'unable to update'});
		}
	},function(err){ errorHandler(err,res); })
})

router.post('/superadmin/delete/specificdegree', function(req, res) {
	superAdminCollegeService.deleteSpecificCollegeDegree(req.body)
	.then(function(response) {
		if(response)
		{
			res.json({success:true,data:response});
		}
		else
		{
			res.json({success:false,data:null,message:'unable to update'});
		}
	},function(err){ errorHandler(err,res); })
})

router.get('/superadmin/college/list/specificdegree/:collegeid', function(req, res ) {
	superAdminCollegeService.listSpecificCollegeDegree(req.params.collegeid)
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

router.get('/superadmin/college/list/specificdegreewithid/:id', function(req, res ) {
	superAdminCollegeService.listSpecificCollegeDegreeById(req.params.id)
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

router.post('/superadmin/college/save/specificdegree', function(req, res) {
	superAdminCollegeService.saveSpecificCollegeDegree(req.body)
	.then(function(response) {
		if(response)
		{
			res.json({success:true,data:response});
		}
		else
		{
			res.json({success:false,data:null,message:'unable to update'});
		}
	},function(err){ errorHandler(err,res); })
})

router.get('/superadmin/college/specificdegree/delete/:id', function(req, res ) {
	superAdminCollegeService.deleteCollegeSpecificDegree(req.params.id)
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

router.post('/superadmin/addscholarship', function(req, res ) {
	superAdminCollegeService.addScholarshipData(req.body)
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

router.get('/superadmin/scholarship/list', function(req, res ) {
	superAdminCollegeService.getAllScholarshipData()
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

router.get('/superadmin/scholarship/edit/:id', function(req, res ) {
	superAdminCollegeService.getScholarshipDataById(req.params.id)
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

router.get('/superadmin/scholarship/optiondata/:id', function(req, res ) {
	superAdminCollegeService.getScholarshipOptionDataById(req.params.id)
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

router.post('/superadmin/editscholarship', function(req, res ) {
	superAdminCollegeService.editScholarshipData(req.body)
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

router.get('/superadmin/scholarship/delete/:id', function(req, res ) {
	superAdminCollegeService.deleteScholarshipDataById(req.params.id)
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

router.get('/superadmin/college/specificdegree/:id', function(req, res ) {
	superAdminCollegeService.getCollegeSpecificDegreeById(req.params.id)
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

router.post('/superadmin/add/specificdegree', function(req, res ) {
	superAdminCollegeService.addSpecificDegreeData(req.body)
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

router.get('/superadmin/specificdegree/:id', function(req, res ) {
	superAdminCollegeService.getSpecificDegreeDataById(req.params.id)
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

router.post('/superadmin/edit/specificdegree', function(req, res ) {
	superAdminCollegeService.editSpecificDegreeData(req.body)
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

router.get('/superadmin/specificdegree/delete/:id', function(req, res ) {
	superAdminCollegeService.deleteSpecificDegreeDeleteById(req.params.id)
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

router.get('/import/degreespecific/college/data', function(req, res ) {
	superAdminCollegeService.importSpecificDegreeCollegeData()
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

router.get('/superadmin/nonspecificcollegelist', function(req, res ) {
	superAdminCollegeService.listNonSpecificCollegesData()
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

router.post('/superadmin/scholarship/degreedata', function(req, res ) {
	superAdminCollegeService.getScholarshipDegree(req.body)
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

router.post('/scholarship/filter', function (req, res) {
    superAdminCollegeService.searchScholarshipData(req.body)
	.then(function (response) {
	if (response) {
		res.json({ success: true, data: response });
	}
	else {
		res.json({ success: false, data: null, message: 'unable to update' });
	}

	}, function (err) { errorHandler(err, res); });
});

router.post('/superadmin/scholarship/secdegreedata', function (req, res) {
    superAdminCollegeService.getScholarshipSecondaryDegree(req.body)
	.then(function (response) {
	if (response) {
		res.json({ success: true, data: response });
	}
	else {
		res.json({ success: false, data: null, message: 'unable to update' });
	}

	}, function (err) { errorHandler(err, res); });
});

router.post('/superadmin/degreespecific/degreestatus', function(req, res ) {
	superAdminCollegeService.editSpecificDegreeStatus(req.body)
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

router.get('/superadmin/college/imageinfo/:id', function(req, res ) {
	superAdminCollegeService.getCollegeImageInfoById(req.params.id)
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

router.get('/superadmin/bounceback/degree/list/:status', function(req, res ) {
	superAdminCollegeService.getBouncebackDegreeList(req.params.status)
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

router.post('/superadmin/college/filter/degree', function(req, res ) {
	superAdminCollegeService.getCollegeListFilterByDegree(req.body)
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

router.post('/superadmin/bounceback/degree/savelist', function(req, res ) {
	superAdminCollegeService.addCollegeListDegreeBounceback(req.body)
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

router.get('/superadmin/bounceback/updatedegree/:status/:id', function(req, res ) {
	superAdminCollegeService.updateBouncebackDegreeById(req.params.status, req.params.id)
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

router.get('/superadmin/college/bounceback/degree/:id', function(req, res ) {
	superAdminCollegeService.getBouncebackDegreeById(req.params.id)
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

router.get('/superadmin/bounceback/degree/collegelist/:id', function(req, res ) {
	superAdminCollegeService.getBouncebackDegreeCollegeList(req.params.id)
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

router.post('/superadmin/bounceback/degree/editlist', function(req, res ) {
	superAdminCollegeService.editCollegeListDegreeBounceback(req.body)
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

router.post('/superadmin/campaign/state/update', function(req, res ) {
	superAdminCollegeService.updateCollegeinfoState(req.body)
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

router.get('/superadmin/degreeorder/list/:status', async(req, res ) => {
	try {
		const response = await superAdminCollegeService.getDegreeOrderList(req.params.status);
		res.json({ success: true, data: response });
	} catch (error) {
		errorHandler(error, res);
	}
});

router.get('/superadmin/college/degreeorder/:id', async(req, res ) => {
	try {
		const response = await superAdminCollegeService.getDegreeOrderById(req.params.id);
		res.json({ success: true, data: response });
	} catch (error) {
		errorHandler(error, res);
	}
});

router.get('/superadmin/degreeorder/collegelist/:id', async(req, res ) => {
	try {
		const response = await superAdminCollegeService.getDegreeOrderCollegeList(req.params.id);
		res.json({ success: true, data: response });
	} catch (error) {
		errorHandler(error, res);
	}
});

router.get('/superadmin/degreeorder/update/:status/:id', async(req, res ) => {
	try {
		const response = await superAdminCollegeService.updateDegreeOrderById(req.params.status, req.params.id);
		res.json({ success: true, data: response });
	} catch (error) {
		errorHandler(error, res);
	}
});

router.post('/superadmin/degreespecific/college/filter', function(req, res ) {
	superAdminCollegeService.getParentCollegeListFilterByDegree(req.body)
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

/*router.get('/superadmin/college/import', async(req, res ) => {
	try {
		const response = await superAdminCollegeService.importCollegeInfo();
		res.json({ success: true, data: response });
	} catch (error) {
		errorHandler(error, res);
	}
});

router.get('/superadmin/manage/college/overview', async(req, res ) => {
	try {
		const response = await superAdminCollegeService.manageImportCollegeOverview();
		res.json({ success: true, data: response });
	} catch (error) {
		errorHandler(error, res);
	}
});

router.get('/superadmin/manage/college/metadata', async(req, res ) => {
	try {
		const response = await superAdminCollegeService.manageImportCollegeMetadata();
		res.json({ success: true, data: response });
	} catch (error) {
		errorHandler(error, res);
	}
});*/

// Return router
module.exports = router;