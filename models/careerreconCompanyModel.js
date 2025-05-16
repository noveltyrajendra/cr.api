let careerreconCompanyModel = function(src,companyFocus,companyConus){

    let config = require('../config');
	let list = [];
    let stateData = [];
    let stateIdList = [];
    let focusDataList = [];
    let focusData = [];
    let logoUrl = "";
	src.forEach(function(obj)
	{
        for(let i=0;i<companyFocus.length;i++){
            focusDataList.push({"id":companyFocus[i]['focus_id'],"value":companyFocus[i]['value']});
        }

        if(companyConus.length > 0){
            for(let i=0;i<companyConus.length;i++){
                stateData.push({"id":companyConus[i]['conus_id'],"name":companyConus[i]['name']});
                stateIdList.push(companyConus[i]['conus_id']);
            }
        }

        if(obj.company_logo){
            logoUrl = config.AWS_COMPANY_LOGO_COLLEGE+obj.company_logo;
        }

		list.push({
			companyName:obj.company_name,
			militaryFocused: obj.military_focused,
            veteranOwned: obj.veteran_owned,
            typeOfWork: obj.type_of_work,
            type: obj.type,
            veteransTransition: obj.veterans_transition,
            officer: obj.officer,
            securityClearance: obj.security_clearance,
            enlisted: obj.enlisted,
            militarySpouse: obj.military_spouse,
            national: obj.national,
            oconus: obj.oconus,
            notes: obj.notes?obj.notes:'',
            companyDesc: obj.company_desc?obj.company_desc:'',
            companyTheyRepresent: obj.company_they_represent?obj.company_they_represent:'',
            headquater: obj.headquater,
            link: obj.link,
            companyFocusList: focusDataList,
            name: obj.name,
            role: obj.role,
            email: obj.email,
            phone: obj.phone,
            stateIds: stateIdList,
            state_list: stateData,
            companyLogo: logoUrl,
            companyLogoName: obj.company_logo
		});

	});
	return list;
};

module.exports = careerreconCompanyModel;