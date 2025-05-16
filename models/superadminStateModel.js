var superadminStateModel = function(src){

	var config = require('../config');
	var orderList=[];
	src.forEach(function(obj)
	{	
		orderList.push({
      count:obj.cid,
      state:obj.state_name
		});
	});
	return orderList;
};

module.exports = superadminStateModel;