const winston = require('winston');

const logger = new (winston.Logger)({
	transports: [
		// new (winston.transports.Console)({
		// 	timestamp: tsFormat,
		// 	colorize: 'all'
		// }),
		new (winston.transports.File)({
			filename: 'user-activity-log.log',
			level: 'info'
		})
		]
	});

module.exports=logger; 

	// logger.level='debug';
	// logger.info('hello world');
	// logger.debug('debugging info');
	// logger.log('silly', "127.0.0.1 - there's no place like home");
	// logger.log('debug', "127.0.0.1 - there's no place like home");
	// logger.log('verbose', "127.0.0.1 - there's no place like home");
	// logger.log('info', "127.0.0.1 - there's no place like home");
	// logger.log('warn', "127.0.0.1 - there's no place like home");
	// logger.log('error', "127.0.0.1 - there's no place like home");
	// logger.info("127.0.0.1 - there's no place like home");
	// logger.warn("127.0.0.1 - there's no place like home");
	// logger.error("127.0.0.1 - there's no place like home");