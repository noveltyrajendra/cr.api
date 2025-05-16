const express    = require('express');
const router = express.Router(); 
const branchService=require('../services/branchService');
const { errorHandler } = require('../utils/errorHandler');
const logger = require('../utils/userActivityHandler');


router.use(function(req,res,next){
	next(); 
});

/**
 * @api {get} /api/branch/ Request Branch information
 * @apiName GetBranches
 * @apiGroup Branch
 *
 * @apiSuccess {Boolean} success Request status.
 * @apiSuccess {object[]} data  Response wrapper.
 * @apiSuccess {integer} data.branchId primary Id of the branch.
 * @apiSuccess {String} data.shortName shortname of the branch.
 * @apiSuccess {String} data.fullName  fullname of the branch.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *    {
 *		"success": true,
 *		 "data": [
 *   		{
 *    		 "branchId": 1,
 *     		 "shortName": "Army",
 *     		 "fullName": "United States Army"
 *   		},
 *   		{
 *     		 "branchId": 2,
 *     		 "shortName": "Navy",
 *     		 "fullName": "United States Navy"
 *   		}]
 *	 }
 *   
 */
 router.get('/branch', function(req, res ) {

 	branchService.getBranches()
 	.then(function(response){
 		res.json({success:true,data:response});
 	},function(err){ errorHandler(err,res); });
 	
 });

 /**
 * @api {get} /api/branch/id Request Branch information By branch id
 * @apiName GetBrancheInfo
 * @apiGroup Branch
 */
 router.get('/branch/:id', function(req, res ) {
	
		 branchService.getBranchesById(req.params.id)
		 .then(function(response){
			 res.json({success:true,data:response});
		 },function(err){ errorHandler(err,res); });
		 
	 });

router.post('/credit/estimator', async(req, res) => {
	try {
		const branchData = await branchService.getCreditEstimator(req.body);
		res.json({ success: true, data: branchData });
	} catch (error) {
		errorHandler(error, res);
	}
});

router.get('/gibill/datalist', async(req, res ) => {
	try {
		const gibillData = await branchService.getGibillCalculatorData();
		res.json({ success: true, data: gibillData });
	} catch (error) {
		errorHandler(error, res);
	}
});

router.get('/admin/setting/:name', async(req, res ) => {
	try {
		const gibillData = await branchService.getAdminSetting(req.params.name);
		res.json({ success: true, data: gibillData });
	} catch (error) {
		errorHandler(error, res);
	}
});

router.post('/admin/setting', async(req, res) => {
	try {
		const branchData = await branchService.saveAdminSetting(req.body);
		res.json({ success: true, data: branchData });
	} catch (error) {
		errorHandler(error, res);
	}
});

router.get('/bah/calculator/datalist', async(req, res ) => {
	try {
		const bahData = await branchService.getBahCalculatorData();
		res.json({ success: true, data: bahData });
	} catch (error) {
		errorHandler(error, res);
	}
});

router.get('/bah/calculator/city/:stateId', async(req, res ) => {
	try {
		const gibillData = await branchService.getBahCalculatorCity(req.params.stateId);
		res.json({ success: true, data: gibillData });
	} catch (error) {
		errorHandler(error, res);
	}
});

router.post('/bah/calculate', async(req, res) => {
	try {
		const calData = await branchService.calculateBahByStateCity(req.body);
		res.json({ success: true, data: calData });
	} catch (error) {
		errorHandler(error, res);
	}
});

router.get('/bah/search/zipcode/:searchText', async(req, res ) => {
	try {
		const gibillData = await branchService.getZipcodeData(req.params.searchText);
		res.json({ success: true, data: gibillData });
	} catch (error) {
		errorHandler(error, res);
	}
});

router.get('/bah/search/zipcode', async(req, res ) => {
	try {
		const gibillData = await branchService.getZipcodeData("");
		res.json({ success: true, data: gibillData });
	} catch (error) {
		errorHandler(error, res);
	}
});

router.get('/bah/zipcode', async(req, res ) => {
	try {
		const gibillData = await branchService.getWidgetZipcode();
		res.json({ success: true, data: gibillData });
	} catch (error) {
		errorHandler(error, res);
	}
});

router.get('/oha/calculator/country/datalist', async(req, res ) => {
	try {
		const ohaData = await branchService.getOhaCalculatorCountryData();
		res.json({ success: true, data: ohaData });
	} catch (error) {
		errorHandler(error, res);
	}
});

router.get('/oha/calculator/locality/:countryId', async(req, res ) => {
	try {
		const ohaData = await branchService.getOhaCalculatorLocality(req.params.countryId);
		res.json({ success: true, data: ohaData });
	} catch (error) {
		errorHandler(error, res);
	}
});

router.post('/oha/calculator/bahdata', async(req, res) => {
	try {
		const calData = await branchService.calculateOhaCalculatorBahRate(req.body);
		res.json({ success: true, data: calData });
	} catch (error) {
		errorHandler(error, res);
	}
});

router.post('/oha/calculator/save/setting', async(req, res) => {
	try {
		const calData = await branchService.ohaCalculatorSaveSetting(req.body);
		res.json({ success: true, data: calData });
	} catch (error) {
		errorHandler(error, res);
	}
});

// Return router
module.exports = router;