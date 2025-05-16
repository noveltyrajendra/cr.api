var campaignReportModel = function(src, listType){

	var config = require('../config');
	var campaignList=[];
    let moment = require('moment');
	src.forEach(function(obj)
	{	
        let campaignDays = 0;
        let currentDays = 0;
        let campaignMonths = 0;
        let actualCPI= 0;
        let monthlyTarget= 0;
        let monthlyForecast= 0;
        let OSI= 0;
        let previousMonthAverage = 0;
        let monthlyAverage = 0;
        let date = new Date();
        let currentDate = moment(date).format('YYYY-MM-DD');
        let currDate = currentDate.split("-");
        let currentMonthDay= currDate[2];
        let nodaysMonths = new Date(currDate[0], currDate[1], 0).getDate();
        campaignDays = parseInt(moment(obj.end_date).diff(moment(obj.cmap_startdate), 'days'));
        currentDays = moment(date).diff(moment(obj.cmap_startdate), 'days');
        campaignMonths = moment(obj.end_date).diff(moment(obj.cmap_startdate), 'months');
        if(obj.requestinfototal > 0){
            actualCPI = parseFloat(((parseInt(obj.amount_free_from_entry)/parseInt(campaignDays))*parseInt(currentDays))/parseInt(obj.requestinfototal)).toFixed(1);
            monthlyAverage = parseFloat((obj.requestinfototal/campaignMonths)).toFixed(1);
        }
        monthlyTarget = parseFloat((parseInt(obj.amount_free_from_entry)/parseInt(obj.cpi_target_free_from_entry))/parseInt(campaignMonths)).toFixed(1);
        monthlyForecast = parseFloat((parseInt(obj.curinfototal)/parseInt(currentMonthDay))*parseInt(nodaysMonths)).toFixed(1);
        if(monthlyTarget > 0){
            OSI = parseFloat((monthlyForecast/monthlyTarget)*100).toFixed(1);
        }
        previousMonthAverage = Math.round(obj.previnfototal*0.7);
        //console.log("CID:"+obj.college_name+"--",monthlyAverage+"#"+campaignMonths);

        if(listType == "default"){
            campaignList.push({
                campaignId:obj.id,
                collegeId:obj.college_id,
                schoolName:obj.college_name,
                campaignTitle:obj.campaign_name,
                startDate:obj.start_date,
                endDate:obj.end_date,
                amount:obj.amount_free_from_entry,
                campaignType:obj.campaign_type,
                cpiTarget:obj.cpi_target_free_from_entry,
                actualCpi:actualCPI,
                monthlyTarget:monthlyTarget,
                priorPreviousMonth:obj.secondinfototal,
                previousMonth:obj.previnfototal,
                currentMonth:obj.curinfototal,
                monthlyForecast:monthlyForecast,
                totalRequestInfo:obj.requestinfototal,
                osi:OSI
            });
        }else if(listType == "monthly"){
            campaignList.push({
                schoolName:obj.college_name,
                campaignTitle:obj.campaign_name,
                startDate:obj.start_date,
                endDate:obj.end_date,
                amount:obj.amount_free_from_entry,
                campaignType:obj.campaign_type,
                cpiTarget:obj.cpi_target_free_from_entry,
                actualCpi:actualCPI,
                monthlyTarget:monthlyTarget,
                priorPreviousMonth:obj.secondinfototal,
                previousMonth:obj.previnfototal,
                currentMonth:obj.curinfototal,
                monthlyForecast:monthlyForecast,
                totalRequestInfo:obj.requestinfototal,
                osi:OSI
            });
        }else if(listType == "actualcpi" && actualCPI > 180){
            campaignList.push({
                schoolName:obj.college_name,
                campaignTitle:obj.campaign_name,
                startDate:obj.start_date,
                endDate:obj.end_date,
                amount:obj.amount_free_from_entry,
                campaignType:obj.campaign_type,
                cpiTarget:obj.cpi_target_free_from_entry,
                actualCpi:actualCPI,
                monthlyTarget:monthlyTarget,
                priorPreviousMonth:obj.secondinfototal,
                previousMonth:obj.previnfototal,
                currentMonth:obj.curinfototal,
                monthlyForecast:monthlyForecast,
                totalRequestInfo:obj.requestinfototal,
                osi:OSI
            });
        }else if(listType == "monthlydrop" && (previousMonthAverage > 0 && previousMonthAverage >= obj.curinfototal)){
            campaignList.push({
                schoolName:obj.college_name,
                campaignTitle:obj.campaign_name,
                startDate:obj.start_date,
                endDate:obj.end_date,
                amount:obj.amount_free_from_entry,
                campaignType:obj.campaign_type,
                cpiTarget:obj.cpi_target_free_from_entry,
                actualCpi:actualCPI,
                monthlyTarget:monthlyTarget,
                priorPreviousMonth:obj.secondinfototal,
                previousMonth:obj.previnfototal,
                currentMonth:obj.curinfototal,
                monthlyForecast:monthlyForecast,
                totalRequestInfo:obj.requestinfototal,
                osi:OSI
            });
        }else if(listType == "individual"){
            campaignList.push({
                campaignId:obj.id,
                schoolName:obj.college_name,
                campaignTitle:obj.campaign_name,
                startDate:obj.start_date,
                endDate:obj.end_date,
                amount:obj.amount_free_from_entry,
                campaignType:obj.campaign_type,
                targeting: obj.targeting,
                cpiTarget:obj.cpi_target_free_from_entry,
                actualCpi:actualCPI,
                totalRequestInfo:obj.requestinfototal,
                monthlyAverage: monthlyAverage,
                monthlyTarget:monthlyTarget,
            });
        }

	});
	return campaignList;
};

module.exports = campaignReportModel;