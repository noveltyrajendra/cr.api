var og = require('open-graph');

var ogGraphService = (()=> {
	function getOgGraphDescription(resource_url){
		return new Promise((resolve, reject)=> {
			og(resource_url, function(err, meta){
				if(err){
					resolve(null);
				}
				// console.log('meta',JSON.);
				resolve(meta);
			})
		});	
	}
	
	// getOgGraphDescription('https://vimeo.com/243940584');
	return {
		getOgGraphDescription:getOgGraphDescription
	}

})();

module.exports = ogGraphService;