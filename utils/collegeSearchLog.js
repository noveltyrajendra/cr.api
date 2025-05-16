const winston = require('winston');

const logger = new (winston.Logger)({
	transports: [
		new (winston.transports.File)({
			filename: 'college-search-log.log',
			level: 'info'
		})
		]
	});

module.exports=logger; 
