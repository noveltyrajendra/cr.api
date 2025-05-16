let superAdminKeywordService = (function () {
	let mysqlService = require('./mysqlService');
	let superAdminkeywordListModel = require('../models/superAdminkeywordListModel');

	function listKeywords() {
		return new Promise(function (resolve, reject) {
			let listQuery = 'Select * from admin_linking_tags order by name ASC';
			mysqlService.query(listQuery)
				.then(function (response) {
					resolve(superAdminkeywordListModel(response));
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}

	return {
		listKeywords: listKeywords
	}
})();
module.exports = superAdminKeywordService;
