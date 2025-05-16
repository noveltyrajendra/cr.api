const express = require('express');
const router = express.Router();
const superAdminDashboardService=require('../services/superAdminDashboardService');
const { errorHandler } = require('../utils/errorHandler');
const { successHandler } = require('../utils/success-handler');

router.use(function(req,res,next){
	// console.log('middleware is working.');	
	next(); 
});

router.get('/superadmin/dashboard/veteran/list', function(req, res ) {
	superAdminDashboardService.listVeteranList()
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


router.post('/superadmin/dashboard/veteran/report', function(req, res ) {
	superAdminDashboardService.dashboardReportList(req.body)
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

router.post('/superadmin/report/veteraninfo', async (req, res ) => {
	try {
		successHandler(res, await superAdminDashboardService.VeteraninfoReportList(req.body), 'Fetched member list by date!')
	} catch (error) {
		errorHandler(error, res);
	}
});

router.post('/superadmin/report/comminicationstats', function(req, res ) {
	superAdminDashboardService.ComminicationstatsReportList(req.body)
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

router.get('/superadmin/veteran/collegelist/:sid', function(req, res ) {
	superAdminDashboardService.listVeteranColleges(req.params.sid)
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

router.get('/superadmin/veteran/partner/collegelist/:sid', function(req, res ) {
	superAdminDashboardService.listPartnerVeteranColleges(req.params.sid)
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

router.post('/superadmin/dashboard/veteran/report/militarystatus', function(req, res ) {
	superAdminDashboardService.VeteranByMilitaryStatus(req.body)
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

router.post('/superadmin/dashboardreport/college/receivedmostmessage', function(req, res ) {
	superAdminDashboardService.CollegeReceivedMostMessage(req.body)
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

router.post('/superadmin/dashboardreport/college/noreplymessage', function(req, res ) {
	superAdminDashboardService.CollegeNoReplyMessage(req.body)
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

router.post('/superadmin/dashboardreport/veteran/bymessagesource', function(req, res ) {
	superAdminDashboardService.veteranByMessageSource(req.body)
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
router.post('/superadmin/dashboardreport/college/useractivity', function(req, res ) {
	superAdminDashboardService.collegeUserActivity(req.body)
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

router.post('/superadmin/dashboardreport/partnercollege/useractivity', function(req, res ) {
	superAdminDashboardService.partnerCollegeUserActivity(req.body)
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

router.post('/superadmin/dashboardreport/detailcollege/useractivity', function(req, res ) {
	superAdminDashboardService.detailCollegeUserActivity(req.body)
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

router.post('/superadmin/dashboardreport/bymessagesource/sourcefilter', function(req, res ) {
	superAdminDashboardService.veteranBySourceFilterTotal(req.body)
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

router.get('/superadmin/dashboard/veteran/degreerelation', function(req, res ) {
	superAdminDashboardService.manageVeteranDegreeRelation()
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

router.post('/superadmin/report/nagemail', function(req, res ) {
	superAdminDashboardService.getNagEmailReportList(req.body)
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

router.post('/superadmin/report/collegeactivityemail', function(req, res ) {
	superAdminDashboardService.collegeActivityEmailReport(req.body)
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

router.post('/superadmin/report/userregister', function(req, res ) {
	superAdminDashboardService.getUserRegistrationReport(req.body)
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

router.post('/superadmin/report/employment/register', function(req, res ) {
	superAdminDashboardService.getEmploymentRegistrationReport(req.body)
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

router.post('/superadmin/report/veteran/sourcetracking', function(req, res ) {
	superAdminDashboardService.getVeteranSourceTrackingReport(req.body)
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

router.post('/superadmin/report/veteran/sourcetracking/filter', function(req, res ) {
	superAdminDashboardService.getVeteranSourceTrackingTotalReport(req.body)
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

router.post('/superadmin/report/bounceactivityemail', function(req, res ) {
	superAdminDashboardService.bounceActivityEmailReport(req.body)
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

router.get('/superadmin/report/registermessage', function(req, res ) {
	superAdminDashboardService.registerMessageInfo()
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

router.post('/superadmin/report/campaignentry', function(req, res ) {
	superAdminDashboardService.campaignEntryReport(req.body)
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

router.post('/superadmin/report/school/requestinfo', function(req, res ) {
	superAdminDashboardService.schoolRequestInfoList(req.body)
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

router.post('/superadmin/report/school/requestinfo/detail', function(req, res ) {
	superAdminDashboardService.schoolRequestInfoUserList(req.body)
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

router.post('/superadmin/individual/campaign/report', function(req, res ) {
	superAdminDashboardService.campaignIndividualReport(req.body)
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

router.post('/superadmin/individual/monthwise/campaignreport', function(req, res ) {
	superAdminDashboardService.campaignIndividualMonthReport(req.body)
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

router.post('/superadmin/report/allemail', function(req, res ) {
	superAdminDashboardService.allActivityEmailReport(req.body)
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

router.post('/superadmin/dashboardreport/veterans/phone-number', async (req, res) => {
	try {
		successHandler(res, await superAdminDashboardService.getPhoneNumberProvidedReport(req.body), 'Phone number provided list fetched successfully!');
	} catch (error) {
		errorHandler(error, res);
	}
});

router.post('/superadmin/dashboardreport/college/non-partner-message-receiving', async (req, res) => {
	try {
		successHandler(res, await superAdminDashboardService.getNonPartnerMessageReceiving(req.body), 'Non partner receiving messages list fetched successfully!');
	} catch (error) {
		errorHandler(error, res);
	}
});

router.post('/superadmin/dashboardreport/college/non-partner-message-responding', async (req, res) => {
	try {
		successHandler(res, await superAdminDashboardService.getNonPartnerMessageResponding(req.body), 'Non partner responding to messages list fetched successfully!');
	} catch (error) {
		errorHandler(error, res);
	}
});

router.get('/superadmin/dashboardreport/veterans/count', async (req, res) => {
	try {
		successHandler(res, await superAdminDashboardService.fetchCountForTheDay(req.query), 'Fetched count for the day!')
	} catch (error) {
		errorHandler(error, res);
	}
})

router.post('/superadmin/dashboardreport/veterans/member-count-by-date', async (req, res) => {
	try {
		successHandler(res, await superAdminDashboardService.memberCountByDate(req.body), 'Fetched count by date!')
	} catch (error) {
		errorHandler(error, res);
	}
})

router.post('/superadmin/dashboardreport/veterans/member-count-to-date', async (req, res) => {
	try {
		successHandler(res, await superAdminDashboardService.fetchMemberCountToDate(req.body), 'Fetched count to date!')
	} catch (error) {
		errorHandler(error, res);
	}
})

router.post('/superadmin/compareto/report/total', async (req, res) => {
	try {
		successHandler(res, await superAdminDashboardService.getTotalCompareReport(req.body), 'Compare To report Total!')
	} catch (error) {
		errorHandler(error, res);
	}
})

router.post('/superadmin/compareto/report/individual', async (req, res) => {
	try {
		successHandler(res, await superAdminDashboardService.getCollegewiseCompareReport(req.body), 'Compare To report Collegewise!')
	} catch (error) {
		errorHandler(error, res);
	}
})

router.post('/superadmin/college/click/report', async(req, res) => {
	try {
		const reportData = await superAdminDashboardService.getButtonClickReport(req.body);
		res.json({ success: true, data: reportData });
	} catch (error) {
		errorHandler(error, res);
	}
})

// Return router
module.exports = router;