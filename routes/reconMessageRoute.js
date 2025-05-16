const express = require('express');
const router = express.Router(); 
const reconMessageService=require('../services/reconMessageService');
const { errorHandler } =require('../utils/errorHandler');
const { successHandler } =require('../utils/success-handler');

router.use(function(req,res,next){
	// console.log('middleware is working.');	
	next(); 
});

/**
 * @api {get} /reconmessage/veteranreplyreceived/:studentid
 * @apiName get veteran reply received by college
 * @apiGroup ReconMessage
 */ 
router.get('/reconmessage/veteranreplyreceived/:studentid', function(req, res ) {
  
  reconMessageService.getVeteranReplyReceived(req.params.studentid)
      .then(function(response){
        res.json({success:true,data:response});
      },function(err){ errorHandler(err,res); });
      
    });

/**
 * @api {get} /reconmessage/veteran/inboxcount/:studentid
 * @apiName get veteran inbox message
 * @apiGroup ReconMessage
 */ 
router.get('/reconmessage/veteran/inboxcount/:studentid', function(req, res ) {
  
  reconMessageService.getVeteranInboxMessageCount(req.params.studentid)
      .then(function(response){
        res.json({success:true,data:response});
      },function(err){ errorHandler(err,res); });
      
    });

/**
 * @api {get} /reconmessage/veteran/inbox/:studentid/:type
 * @apiName get veteran inbox message
 * @apiGroup ReconMessage
 */ 
router.get('/reconmessage/veteran/inbox/:studentid/:type', function(req, res ) {
  
  reconMessageService.getVeteranInboxMessage(req.params.studentid,req.params.type)
      .then(function(response){
        res.json({success:true,data:response});
      },function(err){ errorHandler(err,res); });
      
    });

/**
 * @api {post} /student/replymessage 
 * @apiName Reply message from student
 * @apiGroup ReconMessage
 */ 
router.post('/student/replymessage', function(req, res ) {
  reconMessageService.replyVeterenMessage(req.body)
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
 * @api {post} /student/deletemessage 
 * @apiName Reply message from student
 * @apiGroup ReconMessage
 */ 
router.post('/student/deletemessage', function(req, res ) {
  reconMessageService.deleteVeterenMessage(req.body)
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
 * @api {get} /reconmessage/college/messagedata/:collegeid
 * @apiName get college message data
 * @apiGroup ReconMessage
 */ 
router.get('/reconmessage/college/messagedata/:collegeid', function(req, res ) {
  
  reconMessageService.getCollegeMessageData(req.params.collegeid)
      .then(function(response){
        res.json({success:true,data:response});
      },function(err){ errorHandler(err,res); });
      
    });

/**
 * @api {get} /reconmessage/college/inboxcount/:collegeid
 * @apiName get college inbox message
 * @apiGroup ReconMessage
 */ 
router.get('/reconmessage/college/inboxcount/:collegeid', function(req, res ) {
  
  reconMessageService.getCollegeInboxMessageCount(req.params.collegeid)
      .then(function(response){
        res.json({success:true,data:response});
      },function(err){ errorHandler(err,res); });
      
    });

/**
 * @api {get} /reconmessage/college/inbox/:collegeid/:type
 * @apiName get college inbox message
 * @apiGroup ReconMessage
 */ 
router.get('/reconmessage/college/inbox/:collegeid/:type', function(req, res ) {
  
  reconMessageService.getCollegeInboxMessage(req.params.collegeid,req.params.type)
      .then(function(response){
        res.json({success:true,data:response});
      },function(err){ errorHandler(err,res); });
      
    });

/**
 * @api {post} /college/replymessage 
 * @apiName Reply message from college
 * @apiGroup ReconMessage
 */ 
router.post('/college/replymessage', function(req, res ) {
  reconMessageService.replyCollegeMessage(req.body)
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
 * @api {post} /college/deletemessage 
 * @apiName Reply message from college
 * @apiGroup ReconMessage
 */ 
router.post('/college/deletemessage', function(req, res ) {
  reconMessageService.deleteCollegeMessage(req.body)
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
 * @api {post} /reconmessage/markread 
 * @apiName chnage new to read state
 * @apiGroup ReconMessage
 */ 
router.post('/reconmessage/markread', function(req, res ) {
  reconMessageService.markMessageAsRead(req.body)
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
 * @api {post} /student/replymessage 
 * @apiName Reply message from student
 * @apiGroup ReconMessage
 */ 
 router.post('/student/reply-all-message', async (req, res ) => {
  try {
    await this.reconMessageService.replyAllVeterenMessage(req.body);
    successHandler(res, true, 'Message sent successfully!');
  } catch (error) {
    errorHandler(err,res);
  }
});

 // Return router
 module.exports = router;