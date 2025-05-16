var legionPost = (function() {
	var legionPostModel =require('../models/legionPostModel');
	var request = require('request');
	var async = require('async');
	var legionPost=[];
	var legionPosts=[];
	var milisecond=1;
	var count=0;
	var legionPostLatLng= [];
	var defaultLegionPost= [];
	function getLegionPost(zip)
	{
		return new Promise(function(resolve, reject) {
			request('http://www.members.legion.org/cgi-bin/lansaweb?wam=MYLJPOST&webrtn=wr_locator&ml=LANSA:XHTML&part=tal&lang=ENG+f(entzip)='+zip+'+F(entmiles)=10', function (error, response, body) {
				if(response && response.statusCode==200){
					legionPost=[];
					legionPostLatLng=[];
					legionPost=JSON.parse(body);
					check = legionPost[0].error;
					if(legionPost && legionPost.length>0 && check == undefined){
						async.each(legionPost,function(val,cb){
							getLatLngForLegionPost(val).then(function(legionPostLocation){
								if(legionPostLocation.lat!=0 && legionPostLocation.lng!=0)
									legionPostLatLng.push(legionPostLocation);
								cb();
							},function(error){
								console.log('inside error');
								cb();
							});
						},function(err){
							if(legionPostLatLng.length>0){
								resolve(legionPostModel(legionPostLatLng));
							}
							else
								resolve(null);
						})
					}
				}else{
					return reject('error');
				}

			});
		});
	}

	function getDefaultLegionPost(zip)
	{
		return new Promise(function(resolve, reject) {
			request('http://www.members.legion.org/cgi-bin/lansaweb?wam=MYLJPOST&webrtn=wr_locator&ml=LANSA:XHTML&part=tal&lang=ENG+f(entzip)='+zip+'+F(entmiles)=10', function (error, response, body) {
			if(response && response.statusCode==200){
					legionPosts=[];
					defaultLegionPost=[];
					legionPosts=JSON.parse(body);
					check = legionPosts[0].error;
					if(legionPosts && legionPosts.length>0 && check == undefined){
						legionPosts.forEach((value) => {
							var legionPostResponse={
								legalName : value['legal name'],
								postNumber: value['post number'],
								dept:value['dept'],
								lat:0,
								lng:0,
								address1:value['address1'],
								address2:value['address2'],
								city:value['city'],
								state:value['state'],
								zip:value['zip'],
								miles:value['miles'],
								phone:value['post phone'],
								web:value['web address'],
								email:value['email address'],
								adjutant:value['adjutant'],
								commander:value['commander'],
								billToName:value['bill to name'],
								billAddress1:value['bill address 1'],
								billAddress2:value['bill address 2'],
								duesRate:value['dues rate'],
								meeting:value['meeting'],
								postHome:value['post home'],
								permCharterDate:value['perm charter date']
							}
							defaultLegionPost.push(legionPostResponse);
						})
						resolve(legionPostModel(defaultLegionPost));
					}else {
						resolve(null);
					}
				}else{
					return reject('error');
				}

			});
		});
	}

	function getLatLngForLegionPost(legionPost){
		var address = legionPost.address1 + ', '+ legionPost.city + ', '+ legionPost.state +' '+ legionPost.zip;
		return new Promise(function(resolve, reject) {
			request('https://maps.googleapis.com/maps/api/geocode/json?address='+address+'&sensor=true&key=AIzaSyDxD9VJPqS2yHyyACy6XgUUiC7c7Fa9EQc', function (error, response, body) {
				var geoCodeResponse =JSON.parse(body);
				// console.log('error:', error);
				// console.log('statusCode:', response && response.statusCode);
				if(geoCodeResponse.status=='OK'){
					if(geoCodeResponse.results.length > 0){
						var lat=0;
						var lng=0;
						geoCodeResponse.results.forEach((value) => {
							value.address_components.forEach((addressValue) => {
								if(addressValue.short_name && addressValue.short_name==legionPost.state){
									lat=value.geometry.location.lat ? value.geometry.location.lat : 0;
									lng=value.geometry.location.lng ? value.geometry.location.lng : 0;
								}
							})
						})
						var legionPostResponse={
							legalName : legionPost['legal name'],
							postNumber: legionPost['post number'],
							dept:legionPost['dept'],
							lat:lat,
							lng:lng,
							address1:legionPost['address1'],
							address2:legionPost['address2'],
							city:legionPost['city'],
							state:legionPost['state'],
							zip:legionPost['zip'],
							miles:legionPost['miles'],
							phone:legionPost['post phone'],
							web:legionPost['web address'],
							email:legionPost['email address'],
							adjutant:legionPost['adjutant'],
							commander:legionPost['commander'],
							billToName:legionPost['bill to name'],
							billAddress1:legionPost['bill address 1'],
							billAddress2:legionPost['bill address 2'],
							duesRate:legionPost['dues rate'],
							meeting:legionPost['meeting'],
							postHome:legionPost['post home'],
							permCharterDate:legionPost['perm charter date']
						}
						resolve(legionPostResponse);
					}else if(geoCodeResponse.status=='OVER_QUERY_LIMIT'){
						var legionPostResponse={
							legalName : legionPost['legal name'],
							postNumber: legionPost['post number'],
							dept:legionPost['dept'],
							lat:0,
							lng:0,
							address1:legionPost['address1'],
							address2:legionPost['address2'],
							city:legionPost['city'],
							state:legionPost['state'],
							zip:legionPost['zip'],
							miles:legionPost['miles'],
							phone:legionPost['post phone'],
							web:legionPost['web address'],
							email:legionPost['email address'],
							adjutant:legionPost['adjutant'],
							commander:legionPost['commander'],
							billToName:legionPost['bill to name'],
							billAddress1:legionPost['bill address 1'],
							billAddress2:legionPost['bill address 2'],
							duesRate:legionPost['dues rate'],
							meeting:legionPost['meeting'],
							postHome:legionPost['post home'],
							permCharterDate:legionPost['perm charter date']
						}
						resolve(legionPostResponse);
					}
					else{
						var legionPostResponse={
							legalName : legionPost['legal name'],
							postNumber: legionPost['post number'],
							dept:legionPost['dept'],
							lat:0,
							lng:0,
							address1:legionPost['address1'],
							address2:legionPost['address2'],
							city:legionPost['city'],
							state:legionPost['state'],
							zip:legionPost['zip'],
							miles:legionPost['miles'],
							phone:legionPost['post phone'],
							web:legionPost['web address'],
							email:legionPost['email address'],
							adjutant:legionPost['adjutant'],
							commander:legionPost['commander'],
							billToName:legionPost['bill to name'],
							billAddress1:legionPost['bill address 1'],
							billAddress2:legionPost['bill address 2'],
							duesRate:legionPost['dues rate'],
							meeting:legionPost['meeting'],
							postHome:legionPost['post home'],
							permCharterDate:legionPost['perm charter date']
						}
						resolve(legionPostResponse);
					}
				}else{
						var legionPostResponse={
							legalName : legionPost['legal name'],
							postNumber: legionPost['post number'],
							dept:legionPost['dept'],
							lat:0,
							lng:0,
							address1:legionPost['address1'],
							address2:legionPost['address2'],
							city:legionPost['city'],
							state:legionPost['state'],
							zip:legionPost['zip'],
							miles:legionPost['miles'],
							phone:legionPost['post phone'],
							web:legionPost['web address'],
							email:legionPost['email address'],
							adjutant:legionPost['adjutant'],
							commander:legionPost['commander'],
							billToName:legionPost['bill to name'],
							billAddress1:legionPost['bill address 1'],
							billAddress2:legionPost['bill address 2'],
							duesRate:legionPost['dues rate'],
							meeting:legionPost['meeting'],
							postHome:legionPost['post home'],
							permCharterDate:legionPost['perm charter date']
						}
						reject(legionPostResponse);
				}
			});
		});
	}


	return {
		getLegionPost: getLegionPost,
		getDefaultLegionPost: getDefaultLegionPost
	}

})();

module.exports = legionPost;