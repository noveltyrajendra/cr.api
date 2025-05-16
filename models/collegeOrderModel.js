var collegeOrderModel = function(src){

	var config = require('../config');
	var orderList=[];
	src.forEach(function(obj)
	{	
		orderList.push({
      id:obj.id,
      collegeId:obj.college_id,
			collegeName:obj.collegeName,
			displayOrder:obj.display_order,
			isTicked: obj.checked_college
		});
	});
	return orderList;
};

module.exports = collegeOrderModel;