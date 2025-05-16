var branchesModel = function(src){

	var list=[];
	src.forEach(function(obj)
	{	
		list.push({
			branchId:obj.id,
			shortName:obj.branch_short_name,
			fullName:obj.branch_full_name
		});

	});
	return list;
};

module.exports = branchesModel;