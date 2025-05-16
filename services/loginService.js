const config = require('../config');
const mysqlService = require('./mysqlService');
const moment = require('moment');
const commonPortalConstant = require('../constants/commonPortalConstant');
const scholarshipService = require('./scholarshipService');
const collegeService = require('../services/collegeService');
const studentService = require('../services/studentService');

const commonLoginPortal = async (data, uuid) => {
    if(data.primary_source == "app"){
        let scholarshipData = {
          "student_id": uuid,
          "branch_of_service": getScholarshipMilitaryBranch(data.military_branch),
          "service_status": getScholarshipMilitaryStatus(data.military_status),
          "area_of_study": data.bucket_value,
          "area_of_focus": data.area_focus_ids,
          "study_states": data.state
        }
        insertScholarshipInfo(scholarshipData);
        let careerData = {
          "uuid": uuid,
          "military_status": data.military_status,
          "paygrade_id": data.military_rank,
          "degree_in": data.bucket_value,
          "mos": data.military_mos,
          "created_at": moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
        }
        insertCarerReconInfo(careerData);
    }else if(data.primary_source == "program matcher"){
        let stateval = "";
        if (data.study_state.length > 0) {
            stateval = data.study_state[0]['value'];
        }
        if(data.military_rank == ""){
            military_rank = 0;
        }else{
            military_rank = data.military_rank;
        }
        let scholarshipData = {
            "student_id": uuid,
            "branch_of_service": getScholarshipMilitaryBranch(data.military_branch),
            "service_status": getScholarshipMilitaryStatus(data.military_status),
            "area_of_study": data.bucket_id,
            "area_of_focus": data.secondary_bucket_ids,
            "study_states": data.stateval
        }
        insertScholarshipInfo(scholarshipData);
        let careerData = {
            "uuid": uuid,
            "military_status": data.military_status,
            "paygrade_id": military_rank,
            "degree_in": getBucketData(data.bucket_id),
            "mos": data.mos,
            "created_at": moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
        }
        insertCarerReconInfo(careerData);
    }else if(data.primary_source == "scholarshipfinder"){
        let careerData = {
            "uuid": uuid,
            "military_status": data.military_status,
            "paygrade_id": military_rank,
            "degree_in": getBucketData(data.bucket_id),
            "mos": data.mos,
            "created_at": moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
        }
        insertCarerReconInfo(careerData);
    }else if(data.primary_source == 'careerrecon'){
        let secondaryData = await executeQuery("select count(id) as total,group_concat(id) as focus_ids from bucket_secondary_degree where bucket_degree_id="+data.bucketId+" and status='active'");
        if(secondaryData && secondaryData.length > 0){
            const searchData = {
                education_goal: 0,
                area_focus_length: secondaryData[0].total,
                college_id: 0,
                state: data.state,
                bucket_id: data.bucketId,
                area_focus_ids: secondaryData[0].focus_ids,
                military_status: data.militaryStatus
            }
            matchedColleges = await collegeService.getNewRegisteredMatchCollege(searchData);
            const matchData = {
                studentId: data.uuid,
                collegeData: matchedColleges,
                src: 'Careerrecon',
                contacted: 'No',
            }
            await studentService.getSaveRegisterMatchCollege(matchData);
            let scholarshipData = {
                "student_id": uuid,
                "branch_of_service": getScholarshipMilitaryBranch(data.militaryBranch),
                "service_status": getScholarshipMilitaryStatus(data.militaryStatus),
                "area_of_study": data.bucketId,
                "area_of_focus": secondaryData[0].focus_ids,
                "study_states": data.state
            }
            insertScholarshipInfo(scholarshipData);
        }
    }
    return "success";
}

const getBucketData = (bucketId) => {
    let bucketInfo = "";
    if(bucketId.indexOf(",") > -1){
        let primaryData = bucketId.split(",");
        bucketInfo = primaryData[0];
    }else{
        bucketInfo = bucketId;
    }
    return bucketInfo;
}

const getScholarshipMilitaryStatus = (mstatus) => {
    let msindex = commonPortalConstant.veteranMilitaryStaus.findIndex(x => x.name.toLowerCase() == mstatus.toLowerCase());
    let militaryStatus = "";
    if(msindex > -1){
        if(commonPortalConstant.veteranMilitaryStaus[msindex].name.toLowerCase() == 'retiree'){
            militaryStatus = "Retired";
        }else{
            militaryStatus = commonPortalConstant.veteranMilitaryStaus[msindex].value;
        }
    }
    return militaryStatus;
}

const getScholarshipMilitaryBranch = (mbranch) => {
    let mbindex = commonPortalConstant.veteranMilitaryBranch.findIndex(x => x.id == mbranch);
    let militaryBranch = "";
    if(mbindex > -1){
        militaryBranch = commonPortalConstant.veteranMilitaryBranch[mbindex].name;
    }
    return militaryBranch;
}

const insertScholarshipInfo = async (scholarshipData) => {
    await insertQuery("scholarship_data", scholarshipData);
    return scholarshipService.addScholarship(scholarshipData);
}

const insertCarerReconInfo = async (careerData) => {
    return await insertQuery("filter_log", careerData);
}

const insertQuery = async (tableName, dataArr) => {
    return mysqlService.query("INSERT INTO "+tableName+" SET ?", dataArr);
}

const executeQuery = async (sql) => {
    return mysqlService.query(sql);
}

module.exports = {
    commonLoginPortal
};