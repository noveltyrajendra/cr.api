const winston = require('winston');

const logger = new (winston.Logger)({
	transports: [
		new (winston.transports.File)({
			filename: 'request-info-log.log',
			level: 'info'
		})
		]
	});

module.exports=logger;