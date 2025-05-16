let campaignEmailAlert = (function() {
    let moment =require('moment');
    let mysqlService=require('./services/mysqlService');
    let emailService=require('./services/emailService');
    let superAdminDashboardService = require('./services/superAdminDashboardService');
    let stringUtil = require('./utils/stringUtil');
    let emailConstant=require('./constants/emailConstant');
    const json2xls = require("json2xls");
    const fs = require("fs");

    async function campaignMonthlyEmail(){
        let currMonthName  = moment().format('MMMM');
        let currYear  = moment().format('YYYY');
        let filename = "campaign-monthly-performance-"+currMonthName.toLowerCase()+"-"+currYear+".xlsx";
        let reportData = {
            type: 'active',
            listType: 'monthly'
         };
        let result = await saveCampaignReport(reportData, filename);
        if(result == "success"){
            let subject = "OSI Campaign Performance Report for "+currMonthName+", "+currYear;
            let message = "OSI Active Campaigns Performance Report for "+currMonthName+", "+currYear;
            sendCampaignAlertEmail(filename,subject,message);
        }
    }

    async function campaignActualCpi(){
        let currMonthName  = moment().format('MMMM');
        let currYear  = moment().format('YYYY');
        let filename = "campaign-actual-cpi-"+currMonthName.toLowerCase()+"-"+currYear+".xlsx";
        let reportData = {
            type: 'active',
            listType: 'actualcpi'
         };
        let result = await saveCampaignReport(reportData, filename);
        if(result == "success"){
            let subject = "OSI Campaign ActualCPI above $180 Report for "+currMonthName+", "+currYear;
            let message = "OSI Active Campaigns ActualCPI above $180 Report for "+currMonthName+", "+currYear;
            sendCampaignAlertEmail(filename,subject,message);
        }
    }

    async function campaignAverageMonthlyDrop(){
        let currMonthName  = moment().format('MMMM');
        let currYear  = moment().format('YYYY');
        let filename = "campaign-monthly-drop-"+currMonthName.toLowerCase()+"-"+currYear+".xlsx";
        let reportData = {
            type: 'active',
            listType: 'monthlydrop'
         };
        let result = await saveCampaignReport(reportData, filename);
        if(result == "success"){
            let subject = "OSI Campaign Drops by 30% Report for "+currMonthName+", "+currYear;
            let message = "OSI Active Campaigns Drops by 30% Report for "+currMonthName+", "+currYear;
            sendCampaignAlertEmail(filename,subject,message);
        }
    }

    async function saveCampaignReport(reportData, filename){
        let reportList = await superAdminDashboardService.campaignEntryReport(reportData);
        if(reportList.length > 0){
            //let rowsWithHeader = json2xls(reportList, { header: true });
            let rowsWithHeader = json2xls(reportList); 
            fs.writeFileSync(
                `xl/`+filename,
                rowsWithHeader,
                'binary'
              );
            //console.log("DD:",rowsWithHeader);
            return "success";
        }else{
            return "fail";
        }
    }

    async function sendCampaignAlertEmail(filename,subject,message){
        return new Promise(function(resolve, reject) {
            //console.log("Email ...")
            let from = "CollegeRecon <"+emailConstant.INFORMATION_EMAIL+">";
            let to = "lori.waddell@hfalliance.com,bill@hfalliance.com,garrett@hfalliance.com";
            //let to = "shivaram@noveltytechnology.com";
            let attachement =  {
                "filename" : filename,
                "path": "xl/"+filename
            }
            emailService.sendAttachementEmail(from, to, subject, message, attachement).then(function (eresponse) {
                //console.log("RRR:",eresponse)
                resolve("success");
            }, function (err) {
                if (err) {
                  var error = err;
                  error.status = 503;
                  return reject(error)
                };
            });
        })
    }

    return {
        campaignMonthlyEmail: campaignMonthlyEmail,
        campaignActualCpi: campaignActualCpi,
        campaignAverageMonthlyDrop: campaignAverageMonthlyDrop
    }
})();
  
module.exports = campaignEmailAlert;