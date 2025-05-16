var reportCommunicationstatModel = function(src){

    var config = require('../config');
    let moment =require('moment');
    var commList=[];
    src.forEach(function(obj)
	{	
        let receiveDate = "";
        if(obj.received_date){
            receiveDate = moment(obj.received_date).format('YYYY-MM-DD');
        }
        
        commList.push({
			id:obj.id,
			collegeName:obj.college_name,
			messageReceived:obj.nomess?obj.nomess:0,
            notReply:obj.noreply?obj.noreply:0,
            receivedDate:receiveDate
		});

	});
	return commList;
};

module.exports = reportCommunicationstatModel;