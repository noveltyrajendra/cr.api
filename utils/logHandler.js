var logHander = (function() {

var fs = require('fs');

function logHandler(timeStamp,type,message){
	var log= fs.createWriteStream('log.txt', {
	  flags: 'a' 
		})

		var logDescription=timeStamp+','+type+','+message;
		log.write('\r\n' + logDescription);
		log.end();
}

	return {
		logHandler: logHandler
	}

})();

module.exports = logHander;

