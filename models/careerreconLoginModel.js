var careerreconLoginModel = function(obj,type){
    let veteranObj = {};
    if(type == 'careerrecon'){
        veteranObj = {
            uuid:obj.uuid,
            firstName:obj.first_name,
            lastName:obj.last_name,
            email:obj.email,
            militaryBranch:obj.military_branch,
            militaryStatus:obj.military_status,
            militaryRank:obj.military_rank,
            mos:obj.mos,
            available:obj.available,
            phoneNumber:obj.phone_number,
            securityClearance:obj.security_clearance,
            mmbLevelId:obj.mmb_level_id,
            degree:obj.bucket_id,
            careerId:obj.career_id,
            expYear:obj.exp_year,
            desiredSalary:obj.desired_salary,
            relocate:obj.relocate,
            state:obj.state
        }
    }else{
        veteranObj = {
            uuid:obj.uuid,
            firstName:obj.first_name,
            lastName:obj.last_name,
            email:obj.email,
            postalCode:obj.postal_code,
            phoneNumber:obj.phone_number,
            militaryBranch:obj.military_branch,
            militaryStatus:obj.military_status,
            militaryRank:obj.military_rank,
            mos:obj.mos,
            categoryQuestion:obj.category_question,
            benefitQuestion:obj.benefit_question,
        }
    }
    return veteranObj;
};

module.exports = careerreconLoginModel;