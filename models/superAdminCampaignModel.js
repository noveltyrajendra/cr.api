let superAdminCampaignModel = function(src){
  
    let moment =require('moment');
    var list=[];
    src.forEach(function(obj)
    {		
        list.push({
            id: obj.id,
            campaignName:obj.campaign_name,
            collegeId: obj.college_id,
            collegeName:obj.college_name,
            startDate:obj.start_date,
            endDate:obj.end_date,
            accountType:obj.account_type,
            amountFreeFromEntry:obj.amount_free_from_entry,
            campaignType:obj.campaign_type,
            targeting:obj.targeting,
            billing:obj.billing,
            apiSetup:obj.api_setup,
            campaignStatus: obj.campaign_status,
            cpiTargetFreeFromEntry:obj.cpi_target_free_from_entry,
            DateCreated:obj.created_date
        });
    });
    return list;
  };
  
  module.exports = superAdminCampaignModel;