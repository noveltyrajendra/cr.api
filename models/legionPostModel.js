var legionPostModel = function(src){
	var list=[];
	src.forEach(function(obj)
	{	
		list.push({
			legalName:obj.legalName,
			postNumber:obj.postNumber.trim(),
			dept:obj.dept,
			latlng:obj.lat+','+obj.lng,
			address1:obj.address1,
			address2:obj.address2,
			city:obj.city,
			state:obj.state,
			zip:obj.zip,
			miles:obj.miles,
			phone:obj.phone,
			web:obj.web,
			email:obj.email,
			adjutant:obj.adjutant,
			commander:obj.commander,
			billToName:obj.billToName,
			billAddress1:obj.billAddress1,
			billAddress2:obj.billAddress2,
			duesRate:obj.duesRate,
			meeting:obj.meeting,
			postHome:obj.postHome,
			permCharterDate:obj.permCharterDate
		});
	});
	return list;
}

module.exports = legionPostModel;