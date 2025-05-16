let superAdminCommunicationService = (function() {

  let mysqlService=require('./mysqlService');
  let sha1 = require('sha1');
  let moment = require('moment');
	let stringUtil = require('../utils/stringUtil');
  let superAdminConstant=require('../constants/superAdminConstant');
	let superAdminCommunicationModel=require('../models/superAdminCommunicationModel');
	let reconMessageService =  require('./reconMessageService');

  function listComminication()
	{	
		return new Promise(function(resolve, reject) {

			let listQuery = 'SELECT rm.id, rm.responder, rm.recipient, rm.message_id, rm.student_id, rm.college_id, rm.message,rm.date_created, stu.first_name, stu.middle_initial, stu.last_name, col.college_name FROM recon_messages rm Left join students stu on stu.uuid = rm.student_id left join colleges col on col.id = rm.college_id where rm.student_id!=\'\' and rm.college_id!=\'\' order by date_created DESC';
      
			mysqlService.query(listQuery)
			.then(function(response){
        resolve(superAdminCommunicationModel(response));
			},function(err){  
				if (err) {
					var error = err;
					error.status = 503;
					return reject(error)
				};
			});
		});
	}

	function sendProxyMessage(messageData)
	{
		return new Promise(function(resolve, reject) {
		
			for(let i=0;i<messageData.collegeDatas.length;i++){
				let messageContent = stringUtil.replaceAll(messageData.message,'~~college-name~~',messageData.collegeDatas[i].collegeName);
				let messageArray = {
					studentId:messageData.studentId,
					collegeId:messageData.collegeDatas[i].collegeId,
					messageId:"",
					attachment:"",
					replyMessage: messageContent,
					collegeEmail: messageData.collegeDatas[i].contactEmail,
					recipient: "COLLEGE",
					responder:  "USER",
					type: "reply"
				}
				//console.log("DD:",messageArray);
				reconMessageService.replyVeterenMessage(messageArray).then(function(response){
					resolve(response);
				},function(err){  
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
			}
		});
	}

	function listCommunicationDetail(id)
	{	
		return new Promise(function(resolve, reject) {

			let listQuery = 'SELECT rm.id, rm.responder, rm.recipient, rm.message_id, rm.student_id, rm.college_id, rm.message,rm.date_created, stu.first_name, stu.middle_initial, stu.last_name, col.college_name FROM recon_messages rm Left join students stu on stu.uuid = rm.student_id left join colleges col on col.id = rm.college_id where rm.student_id!=\'\' and rm.college_id!=\'\' and rm.college_id='+id+' order by date_created DESC';
      
			mysqlService.query(listQuery)
			.then(function(response){
        resolve(superAdminCommunicationModel(response));
			},function(err){  
				if (err) {
					var error = err;
					error.status = 503;
					return reject(error)
				};
			});
		});
	}
  
  return {
		listComminication: listComminication,
		sendProxyMessage: sendProxyMessage,
		listCommunicationDetail: listCommunicationDetail
	}

})();

module.exports = superAdminCommunicationService;