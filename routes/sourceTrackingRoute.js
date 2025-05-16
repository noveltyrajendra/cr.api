const express = require('express');
const router = express.Router();
const sourceTrackingService=require('../services/sourceTrackingService');
const { errorHandler } = require('../utils/errorHandler');
const { successHandler } = require('../utils/success-handler');

router.use(function(req,res,next){
	// console.log('middleware is working.');	
	next(); 
});

router.post('/college/search/tracking', function(req, res ) {
    sourceTrackingService.collegeSearchTracking(req.body)
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

  router.post('/college/filter/tracking', function(req, res ) {
    sourceTrackingService.collegeFilterTracking(req.body)
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

  router.post('/searchresult/colleges/tracking', function(req, res ) {
    sourceTrackingService.searchresultCollegesTracking(req.body)
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

  router.post('/superadmin/searchfrequency/tracking/level', async (req, res ) => {
    try {
      successHandler(res, await sourceTrackingService.searchFrequencyTrackingLevel(req.body), 'Search frequency level list fetched successfully!');
    } catch (error) {
      errorHandler(error, res);
    }
  });

  router.post('/superadmin/searchfrequency/tracking/state', async (req, res ) => {
    try {
      successHandler(res, await sourceTrackingService.searchFrequencyTrackingState(req.body), 'Search frequency state list fetched successfully!');
    } catch (error) {
      errorHandler(error, res);
    }
  });

  router.post('/superadmin/searchfrequency/tracking/bucket', async (req, res ) => {
    try {
      successHandler(res, await sourceTrackingService.searchFrequencyTrackingBucket(req.body), 'Search frequency bucket list fetched successfully!');
    } catch (error) {
      errorHandler(error, res);
    }
  });

  router.post('/superadmin/searchfrequency/tracking/secondarybucket', async (req, res ) => {
    try {
      successHandler(res, await sourceTrackingService.searchFrequencyTrackingSecondaryBucket(req.body), 'Search frequency secondary bucket list fetched successfully!');
    } catch (error) {
      errorHandler(error, res);
    }
  });

  router.post('/superadmin/searchfrequency/tracking/veteranservice', async (req, res ) => {
    try {
      successHandler(res, await sourceTrackingService.searchFrequencyTrackingVeteranservice(req.body), 'Search frequency veteran service list fetched successfully!');
    } catch (error) {
      errorHandler(error, res);
    }
  });

  router.post('/superadmin/searchfrequency/tracking/collegetype', async (req, res ) => {
    try {
      successHandler(res, await sourceTrackingService.searchfrequencyTrackingCollegeType(req.body), 'Search frequency college type list fetched successfully!');
    } catch (error) {
      errorHandler(error, res);
    }
  });

  router.post('/superadmin/searchfrequency/tracking/religiousaffiliation', async(req, res ) =>{
    try {
      successHandler(res, await sourceTrackingService.searchfrequencyTrackingReligiousAffiliation(req.body), 'Search frequency religious affiliation list fetched successfully!');
    } catch (error) {
      errorHandler(error, res);
    }
  });

  router.post('/superadmin/searchfrequency/tracking/ethnicaffiliation', async (req, res ) =>{
    try {
      successHandler(res, await sourceTrackingService.searchfrequencyTrackingEthnicAffiliation(req.body), 'Search frequency ethinic affiliation list fetched successfully!');
    } catch (error) {
      errorHandler(error, res);
    }
  });

  router.post('/superadmin/collegesearch/tracking', async(req, res ) => {
    try {
      successHandler(res, await sourceTrackingService.CollegesearchTracking(req.body), 'Search frequency tracking list fetched successfully!');
    } catch (error) {
      errorHandler(error, res);
    }
  });

  router.post('/superadmin/employment/tracking/branch', async(req, res ) => {
    try {
      successHandler(res, await sourceTrackingService.employmentTrackingBranch(req.body), 'Employement register from military branch list successfully!');
    } catch (error) {
      errorHandler(error, res);
    }
  });

  router.post('/superadmin/employment/tracking/security', async(req, res ) => {
    try {
      successHandler(res, await sourceTrackingService.employmentTrackingSecurity(req.body), 'Employement register from security clearance list successfully!');
    } catch (error) {
      errorHandler(error, res);
    }
  });

  router.post('/superadmin/employment/tracking/elevel', async(req, res ) => {
    try {
      successHandler(res, await sourceTrackingService.employmentTrackingEducation(req.body), 'Employement register from education level list successfully!');
    } catch (error) {
      errorHandler(error, res);
    }
  });

  router.post('/superadmin/employment/tracking/career', async(req, res ) => {
    try {
      successHandler(res, await sourceTrackingService.employmentTrackingCareer(req.body), 'Employement register from career list successfully!');
    } catch (error) {
      errorHandler(error, res);
    }    
  });

  router.post('/superadmin/employment/tracking/relocate', async(req, res ) => {
    try {
      successHandler(res, await sourceTrackingService.employmentTrackingRelocate(req.body), 'Employement register from relocate list successfully!');
    } catch (error) {
      errorHandler(error, res);
    }
  });

  router.post('/superadmin/employment/tracking/militarystatus', async (req, res ) => {
    try {
      successHandler(res, await sourceTrackingService.employmentTrackingMstatus(req.body), 'Employement register from military status list successfully!');
    } catch (error) {
      errorHandler(error, res);
    }
  });

  router.post('/superadmin/employment/tracking/rankpaygrade', async(req, res ) => {
    try {
      successHandler(res, await sourceTrackingService.employmentTrackingRankPaygrade(req.body), 'Employement register from rank/paygrade list successfully!');
    } catch (error) {
      errorHandler(error, res);
    }
  });

  router.post('/superadmin/register/tracking/branch', async (req, res) => {
    try {
      successHandler(res, await sourceTrackingService.registerTrackingBranch(req.body), 'Student register from branch list successfully!');
    } catch (error) {
      errorHandler(error, res);
    }
  });

  router.post('/superadmin/register/tracking/militarystatus', async (req, res) => {
    try {
      successHandler(res, await sourceTrackingService.registerTrackingStatus(req.body), 'Student register from military status list successfully!');
    } catch (error) {
      errorHandler(error, res);
    }
  });

  router.post('/superadmin/register/tracking/paygrade', async(req, res ) => {
    try {
      successHandler(res, await sourceTrackingService.registerTrackingPaygrade(req.body), 'Student register from paygrade list successfully!');
    } catch (error) {
      errorHandler(error, res);
    }
  });

  router.post('/superadmin/register/tracking/level', async(req, res ) => {
    try {
      successHandler(res, await sourceTrackingService.registerTrackingEducationLevel(req.body), 'Student register from education goal list successfully!');
    } catch (error) {
      errorHandler(error, res);
    }
  });

  router.post('/superadmin/register/tracking/primarybucket', async(req, res ) => {
    try {
      successHandler(res, await sourceTrackingService.registerTrackingPrimaryBucket(req.body), 'Student register from primary bucket list successfully!');
    } catch (error) {
      errorHandler(error, res);
    }
  });

  router.post('/superadmin/register/tracking/secondarybucket', async(req, res ) => {
    try {
      successHandler(res, await sourceTrackingService.registerTrackingSecondaryBucket(req.body), 'Student register from secondary bucket list successfully!');
    } catch (error) {
      errorHandler(error, res);
    }
  });

  router.post('/superadmin/register/tracking/state', async(req, res ) => {
    try {
      successHandler(res, await sourceTrackingService.registerTrackingState(req.body), 'Student register from state list successfully!');
    } catch (error) {
      errorHandler(error, res);
    }
  });

  router.post('/superadmin/seachfrequency/homepagelink', function(req, res ) {
    sourceTrackingService.getHomepageLinkClickReport(req.body)
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

  router.post('/veterans/registrations', function(req, res ) {
    sourceTrackingService.veteransRegistrations(req.body)
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

  router.post('/superadmin/searchfrequency/platform/data', function(req, res ) {
    sourceTrackingService.searchfrequencyPlatformData(req.body)
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

  router.post('/superadmin/registerfrequency/school/data', function(req, res ) {
    sourceTrackingService.registerfrequencySchoolData(req.body)
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

  router.get('/college/campaign/datalist/:cid', function(req, res ) {
    sourceTrackingService.getCollegeAdminCampaignList(req.params.cid, "")
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

  router.get('/college/campaign/detail/:cid/:camid', function(req, res ) {
    sourceTrackingService.getCollegeAdminCampaignList(req.params.cid, req.params.camid)
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

  router.post('/college/campaign/rangedata', function(req, res ) {
    sourceTrackingService.getCollegeAdminCampaignRangeData(req.body)
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

  router.get('/college/campaign/paid/nonpaid/:cid', function(req, res ) {
    sourceTrackingService.getCollegeAdminCampaignPaidNonpaid(req.params.cid)
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

router.post('/student/action-tracking', (req, res) => {
    try {
      sourceTrackingService.saveUserActionTracking(req.body);
      successHandler(res, true)
    } catch (error) {
      errorHandler(error, res);
    }
  })

// Return router
module.exports = router;