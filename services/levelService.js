var levelService = (function() {

	var mysqlService=require('./mysqlService');
	var levelConstant=require('../constants/levelConstant');
	var levelModel =require('../models/levelModel');

	function getLevels()
	{	
		return new Promise(function(resolve, reject) {
			mysqlService.query(levelConstant.DEFAULT_LEVEL_QUERY)
			 	.then(function(response){

			 			resolve(levelModel(response));	
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
		getLevels: getLevels
	}

})();

module.exports = levelService;