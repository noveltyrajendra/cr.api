var settingService = (function() {

	var mysqlService=require('./mysqlService');
	var moment = require('moment');
	let sha1 = require('sha1');

	function deactivateUser(userInfo){	
		let currentDate = moment(new Date()).format('YYYY-MM-DD HH:mm:ss ')
		return new Promise(function(resolve, reject) {
			var sql = "update students set user_account_status='DISABLED', deactivation_reason= '"+userInfo.deactivationReason+  "' , last_updated= '"+currentDate +"' where uuid= '"+userInfo.uuid+"'";
			//console.log("sql",sql);
			mysqlService.query(sql)
			.then(function(response){
				resolve("Success");	
			},function(err){  
				if (err) {
					var error = err;
					error.status = 503;
					return reject(error)
				};
			});
		});
	}	

	function changePrivacySetting(settings){	
		let currentDate = moment(new Date()).format('YYYY-MM-DD HH:mm ');
		let settingValue = settings.privacyValue ? 'YES' :'NO' ;
		return new Promise(function(resolve, reject) {
			var sql = " update student_profile set " +  settings.privacyKey + " = '"+ settingValue + "' where uuid = '"+settings.uuid+"'";
			mysqlService.query(sql)
			.then(function(response){
				resolve("Success");	
			},function(err){  
				if (err) {
					var error = err;
					error.status = 503;
					return reject(error)
				};
			});
		});
	}	

	function changeEmail(userInfo){	
		let currentDate = moment(new Date()).format('YYYY-MM-DD HH:mm:ss ');
		let sql='';
		
		if(userInfo.userType == 'College'){
			sql= ` update college_users set college_user_email= '${userInfo.email}' , last_updated ='${currentDate}'  where  uuid = '${userInfo.uuid}'`
		}else if(userInfo.userType == 'Student'){
			sql= ` update students set email= '${userInfo.email}' , last_updated ='${currentDate}'  where  uuid = '${userInfo.uuid}'`
		}
		return new Promise(function(resolve, reject) {

			emailAddressCheck(userInfo.email).then(function(response){
				if(response == "Success"){
					mysqlService.query(sql)
					.then(function(response1){
						resolve("Success");	
					},function(err){  
						if (err) {
							var error = err;
							error.status = 503;
							return reject(error)
						};
					});
				}else{
					resolve(response);
				}
			  },function(err){ 
				if (err) {
				  var error = err;
				  error.status = 503;
				  return reject(error)
				};
			  });
		});
	}	

	function emailAddressCheck(email){
		return new Promise(function(resolve, reject) {
			let stdqry='';
			stdqry = 'select count(id) as total from students where email="'+email+'"';
				mysqlService.query(stdqry)
				.then(function(response){
					if(response[0].total > 0){
						resolve('Emailexist');
						return;
					}
					let collqry='';
					collqry = "select count(id) as total from college_users where college_user_email='"+email+"'"
					mysqlService.query(collqry)
					.then(function(response1){
						if(response1[0].total > 0){
							resolve('Emailexist');
						}else{
							resolve('Success');
						}
					},function(err){  
						if (err) {
							var error = err;
							error.status = 503;
							return reject(error)
						};
					});
					
				},function(err){  
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}

	function changePassword(userInfo){	
		return new Promise(function(resolve, reject) {
		let currentDate = moment(new Date()).format('YYYY-MM-DD HH:mm:ss ');
		let sql='';
		let oldPassword = sha1(userInfo.oldPassword);
		let newPassword = sha1(userInfo.password);
		validateOldPassword(userInfo.userType,oldPassword,userInfo.uuid).then(function(res){
				if(userInfo.userType.toLowerCase() == 'college'){
					sql= ` update college_users set college_user_password= '${newPassword}' , last_updated ='${currentDate}'  where  uuid = '${userInfo.uuid}'`
				}else if(userInfo.userType.toLowerCase() == 'student'){
					sql= ` update students set password= '${newPassword}' , last_updated ='${currentDate}'  where  uuid = '${userInfo.uuid}'`
				}
				//console.log('sql',sql)
				if(res == "Not Matched"){
					resolve('Incorrect Old Password');
					return;
				}
				return new Promise(function(resolve1, reject) {
					
					if(userInfo.password != userInfo.rePassword){
						resolve("Password do not match");
						return;
					}
					mysqlService.query(sql)
					.then(function(response){
						resolve("Success");	
					},function(err){  
						if (err) {
							var error = err;
							error.status = 503;
							return reject(error)
						};
					});
				});
		})

	});
	}	

	function validateOldPassword(userType, oldPassword, uuid){
		if(userType.toLowerCase()=='college'){
			return new Promise(function(resolve, reject) {
				var sql = `select college_user_password from college_users where uuid = '${uuid}'`
				//console.log('sql',sql)
				mysqlService.query(sql)
				.then(function(response){
					//console.log('response', response[0].college_user_password);
					if(response.length>0 && response[0].college_user_password.toLowerCase() == oldPassword.toLowerCase()){
						resolve("Matched")
					}
					else{
						//console.log('response', response);
						resolve("Not Matched");	
					}

				},function(err){  
					if (err) {
						var error = err;
						error.status = 503;
						console.log('err', err);
						return reject(error)
					};
				});
			});

		}else if(userType.toLowerCase() == 'student'){
			return new Promise(function(resolve, reject) {
				/*if(userInfo.password != userInfo.rePassword){
					resolve("Password do not match");
					return;
				}*/
				var sql = `select password from students where uuid = '${uuid}'`
				//console.log('sql',sql)
				mysqlService.query(sql)
				.then(function(response){
					if(response.length>0 && response[0].password.toLowerCase() == oldPassword.toLowerCase()){
						resolve("Matched")
					}
					else{
						resolve("Not Matched");	
					}

				},function(err){  
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
			});
		}
	}


	return {
		deactivateUser: deactivateUser,
		changePrivacySetting: changePrivacySetting,
		changeEmail: changeEmail,
		changePassword: changePassword

	}

})();

module.exports = settingService;