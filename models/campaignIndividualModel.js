const  campaignIndividualModel = (campaign, startDate, endDate) =>{
    let moment = require('moment');
    let monthlyAverage = 0;
    let campaignDays = 0;
    let currentDays = 0;
    let monthlyTarget= 0;
    let actualCPI= 0;
    campaignDays = parseInt(moment(endDate).diff(moment(startDate), 'days'));
    currentDays = parseInt(moment(endDate).diff(moment(startDate), 'days'));
    campaignMonths = parseInt(moment(endDate).diff(moment(startDate), 'months'));
    if(campaign.reqinfototal > 0){
        actualCPI = parseFloat(((parseInt(campaign.amount_free_from_entry)/parseInt(campaignDays))*parseInt(currentDays))/parseInt(campaign.reqinfototal)).toFixed(1);
        monthlyAverage = parseFloat((campaign.reqinfototal/campaignMonths)).toFixed(1);
    }
    if(campaignMonths > 0){
        monthlyTarget = parseFloat((parseInt(campaign.amount_free_from_entry)/parseInt(campaign.cpi_target_free_from_entry))/parseInt(campaignMonths)).toFixed(1);
    }

    return {
        startDate: startDate,
        endDate: endDate,
        cpiTarget: campaign.cpi_target_free_from_entry,
        actualCpi: actualCPI,
        totalInq: campaign.reqinfototal,
        monthlyAverage: monthlyAverage,
        monthlyTarget: monthlyTarget
    }
};
module.exports = campaignIndividualModel;