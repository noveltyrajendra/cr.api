var reportVeteraninfoModel = function(src){

    var config = require('../config');
    let moment =require('moment');
    var veteranList=[];
    String.prototype.replaceAll = function(search, replacement) {
        var target = this;
        return target.replace(new RegExp(search, 'g'), replacement);
    };
    function replaceAll(str, map){
        for(key in map){
            str = str.replaceAll(key, map[key]);
        }
        return str;
    }
	src.forEach(function(obj)
	{	
        regDate = "";
		let studentName = obj.first_name+(obj.middle_initial? ' '+obj.middle_initial:'')+' '+obj.last_name;
        if(obj.date_created){
            regDate = moment(obj.date_created).format('M/D/YY');
        }

        var map = {
            'http://localhost:4200' : 'app',
            'http://cr-staging.collegerecon.com' : 'app',
            'https://app.collegerecon.com' : 'app',
            'https://search.collegerecon.com' : 'flow',
            'http://search-staging.collegerecon.com' : 'flow',
            'https://legion.collegerecon.com':'legion'
        };
        let site_source_replace =obj.site_source ? obj.site_source : '' 
        var site_source = replaceAll(site_source_replace , map);
        veteranList.push({
			id:obj.uuid,
            studentName:studentName,
            email:obj.email,
			state:obj.state,
            registerDate:obj.date_created?obj.date_created:"",
            regDate:regDate,
            source:site_source_replace,
            hasPhone: obj.phone_number ? 'Yes' : 'No',
            militaryStatus: obj.military_status,
            isSubscription:obj.nag_email_subscription,
			schoolContacted:obj.schools?obj.schools:0,
			pschollContacted:obj.pschools?obj.pschools:0
		});

	});
	return veteranList;
};

module.exports = reportVeteraninfoModel;