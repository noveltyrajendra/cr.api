const fs = require("fs");
//const creds = JSON.parse(fs.readFileSync('google-generated-creds.json', 'utf-8'));
let { integrationConstant } = require("../constants/integrationConstants");
let requestlogger = require("../utils/requestInfoLog");
const mysqlService = require("../services/mysqlService");

const {
  getExcelId,
  insertIntoLogEntry,
  filterIntegrationCollegeConstant,
} = require("../utils/integrationUtils");

const { collegeConstant, everSpringCollegeList } = require("../constants/integrationConstants");

//Third party integration imports
const { wileyIntegration } = require("./wileyIntegrationService");
const { biskIntegration } = require("./biskIntegrationService");
const { sftpIntegration } = require("./sftpIntegrationService");
const { otherIntegration } = require("./otherIntegrationService");
const { everSpringIntegration } = require("./everSpringIntegrationService");
const { noodleIntegration } = require("./noodleIntegrationService");
const { sparkroomIntegration } = require("./sparkroomIntegrationService");

const makeThirdPartyRequest = (
  studentId,
  collegeId,
  specificId,
  parentId,
  collegeName,
  uuid
) => {
  return new Promise(async (resolve, reject) => {
    // Convert collegeId to number since it comes as a string
    collegeId = +collegeId;
    parentId = +parentId;
    const nodeEnv = process.env.NODE_ENV;
    let excelId = "";
    if(!everSpringCollegeList.includes(collegeId)){
      excelId = getExcelId(collegeId, specificId, parentId).excelid;
    }
    if (nodeEnv === "production") {
      const userData = await getUserData(studentId).catch((error) =>
        console.error(error)
      );

      const data = {
        firstName: userData[0].first_name,
        lastName: userData[0].last_name,
        email: userData[0].email,
        address: userData[0].address,
        city: userData[0].city,
        state: userData[0].state,
        zip: userData[0].postal_code,
        phone: userData[0].phone_number,
        militaryStatus: userData[0].military_status,
        militaryBranch: userData[0].military_branch,
        militaryRank: userData[0].military_rank,
        degreeLevel: userData[0].degree_level,
        degreeField: userData[0].primary_bucket,
        AreaOfStudy: userData[0].secondary_bucket,
        JST: userData[0].jst_transcript_file ? "yes" : "no",
        DateCreated: userData[0].date_created,
        level: userData[0].level_id,
        priBucket: userData[0].bucket_id,
        secBucket: userData[0].secondary_bucket_id,
        mos: userData[0].mos,
      };

      const wileyCollegeIdArray = filterIntegrationCollegeConstant(
        collegeConstant,
        "type",
        "wiley",
        "collegeId"
      );

      const biskCollegeIdArray = filterIntegrationCollegeConstant(
        collegeConstant,
        "type",
        "bisk",
        "collegeId"
      );

      const otherCollegeIdArray = filterIntegrationCollegeConstant(
        collegeConstant,
        "type",
        "other",
        "collegeId"
      );

      const sftpCollegeIdArray = filterIntegrationCollegeConstant(
        collegeConstant,
        "type",
        "sftp",
        "collegeId"
      );

      const everSpringCollegeIdArray = filterIntegrationCollegeConstant(
        collegeConstant,
        "type",
        "everspring",
        "collegeId"
      );

      const noodleCollegeIdArray = filterIntegrationCollegeConstant(
        collegeConstant,
        "type",
        "noodle",
        "collegeId"
      );

      const sparkeoomCollegeIdArray = filterIntegrationCollegeConstant(
        collegeConstant,
        "type",
        "sparkroom",
        "collegeId"
      );

      const sftpData = [
        {
          "First Name": userData[0].first_name,
          "Last Name": userData[0].last_name,
          Email: userData[0].email,
          Address: userData[0].address,
          City: userData[0].city,
          State: userData[0].state,
          "Postal Code": userData[0].postal_code,
          "Phone Number": userData[0].phone_number,
          "Military Status": userData[0].military_status,
          "Military Branch": userData[0].military_branch,
          "Military Rank": userData[0].military_rank,
          "Degree Level": userData[0].degree_level,
          "Degree Field": userData[0].primary_bucket,
          "Area of Study": userData[0].secondary_bucket,
          JST: userData[0].jst_transcript_file ? "yes" : "no",
          "Date Created": userData[0].date_created,
        },
      ];

      if (
        sftpCollegeIdArray.includes(collegeId)
      ) {
        requestlogger.log(
          "info",
          "SFTP for Student Id:" + studentId + " and college Id:" + collegeId
        );
        const body = {
          log_uuid: uuid,
          student_id: studentId,
          college_id: collegeId,
          stage: integrationConstant.SFTP_STAGE,
          message: "Before posting to SFTP server",
          attributes: JSON.stringify(sftpData),
          status: integrationConstant.STATUS_SUCCESS,
        };

        await insertIntoLogEntry(body);
        resolve(
          sftpIntegration(
            collegeId,
            sftpData,
            userData[0].phone_number,
            studentId,
            uuid,
            excelId
          )
        );
      } else if(sftpCollegeIdArray.includes(parentId)) {
        const body = {
          log_uuid: uuid,
          student_id: studentId,
          college_id: collegeId,
          stage: integrationConstant.SFTP_STAGE,
          message: 'SFTP posting not required for degree specific colleges',
          attributes: JSON.stringify(sftpData),
          status: integrationConstant.STATUS_SUCCESS,
        };
        await insertIntoLogEntry(body);
        resolve('SFTP is only for parent college');
      }

      if (
        otherCollegeIdArray.includes(collegeId) ||
        otherCollegeIdArray.includes(parentId)
      ) {
        requestlogger.log(
          "info",
          "ExternalService for Student Id:" +
            studentId +
            " and college Id:" +
            collegeId +
            " Parent Id:" +
            parentId
        );
        const body = {
          log_uuid: uuid,
          student_id: studentId,
          college_id: collegeId,
          stage: "Third party integration",
          message: "Before sending api POST request",
          attributes: JSON.stringify(data),
          status: "success",
        };

        await insertIntoLogEntry(body);
        resolve(
          otherIntegration(studentId, collegeId, data, parentId, excelId, uuid)
        );
      }

      if (
        biskCollegeIdArray.includes(collegeId) ||
        biskCollegeIdArray.includes(parentId)
      ) {
        requestlogger.log(
          "info",
          "BiskService for Student Id:" +
            studentId +
            " and college Id:" +
            collegeId +
            " Parent Id:" +
            parentId
        );
        const body = {
          log_uuid: uuid,
          student_id: studentId,
          college_id: collegeId,
          stage: "Third party integration",
          message: "Before sending api POST request",
          attributes: JSON.stringify(data),
          status: "success",
        };

        await insertIntoLogEntry(body);
        resolve(
          biskIntegration(studentId, parentId, data, collegeId, excelId, uuid)
        );
      }
      if (
        wileyCollegeIdArray.includes(collegeId) ||
        wileyCollegeIdArray.includes(parentId)
      ) {
        // console.log("Wiley", data);
        requestlogger.log(
          "info",
          "WileyService for Student Id:" +
            studentId + 
            " and college Id:" +
            collegeId +
            " Parent Id:" +
            parentId
        );
        const body = {
          log_uuid: uuid,
          student_id: studentId,
          college_id: collegeId,
          stage: integrationConstant.INTEGRATION_STAGE,
          message: integrationConstant.BEFORE_INTEGRATION,
          attributes: JSON.stringify(data),
          status: integrationConstant.STATUS_SUCCESS,
        };

        await insertIntoLogEntry(body);
        const wiley = await wileyIntegration(
          studentId,
          collegeId,
          data,
          parentId,
          excelId,
          uuid
        );
        resolve(wiley);
      }
      if (
        everSpringCollegeIdArray.includes(collegeId) ||
        everSpringCollegeIdArray.includes(parentId)
      ) {
        requestlogger.log(
          "info",
          "Everspring for Student Id:" +
            studentId + 
            " and college Id:" +
            collegeId +
            " Parent Id:" +
            parentId
        );
        const body = {
          log_uuid: uuid,
          student_id: studentId,
          college_id: collegeId,
          stage: integrationConstant.INTEGRATION_STAGE,
          message: integrationConstant.BEFORE_INTEGRATION,
          attributes: JSON.stringify(data),
          status: integrationConstant.STATUS_SUCCESS,
        };

        await insertIntoLogEntry(body);
        const everSpring = await everSpringIntegration(
          studentId,
          parentId,
          data,
          collegeId,
          uuid
        );
        resolve(everSpring);
      }
      if (noodleCollegeIdArray.includes(collegeId)) {
        requestlogger.log(
          "info",
          "Noodle for Student Id:" +
            studentId + 
            " and college Id:" +
            collegeId +
            " Parent Id:" +
            parentId
        );
        const body = {
          log_uuid: uuid,
          student_id: studentId,
          college_id: collegeId,
          stage: integrationConstant.INTEGRATION_STAGE,
          message: integrationConstant.BEFORE_INTEGRATION,
          attributes: JSON.stringify(data),
          status: integrationConstant.STATUS_SUCCESS,
        };

        await insertIntoLogEntry(body);
        const noodle = await noodleIntegration(
          studentId,
          collegeId,
          data,
          parentId,
          uuid
        );
        resolve(noodle);
      }
      if (sparkeoomCollegeIdArray.includes(collegeId)) {
        requestlogger.log(
          "info",
          "Sparkroom for Student Id:" +
            studentId + 
            " and college Id:" +
            collegeId +
            " Parent Id:" +
            parentId
        );
        const body = {
          log_uuid: uuid,
          student_id: studentId,
          college_id: collegeId,
          stage: integrationConstant.INTEGRATION_STAGE,
          message: integrationConstant.BEFORE_INTEGRATION,
          attributes: JSON.stringify(data),
          status: integrationConstant.STATUS_SUCCESS,
        };

        await insertIntoLogEntry(body);
        const sparkroom = await sparkroomIntegration(
          studentId,
          collegeId,
          data,
          parentId,
          uuid
        );
        resolve(sparkroom);
      }
    }else{
      return resolve("success");
    }
  });
};

const getUserData = async (studentId) => {
  try {
    const getQuery =
      "SELECT ss.first_name,ss.last_name,ss.email,DATE_FORMAT(ss.date_created, '%Y-%m-%d %H:%i:%s') as date_created, sp.address,sp.city,sp.level_id,sp.bucket_id,sp.secondary_bucket_id,sp.jst_transcript_file,sp.state,sp.dob,sp.postal_code,sp.phone_number,sp.military_status, sp.mos, (select branch_short_name from branches where id=sp.military_branch) as military_branch, (SELECT name from college_ranks where id=sp.military_rank) as military_rank, (SELECT title FROM levels WHERE id=sp.level_id) as degree_level, (SELECT title FROM bucket_degree WHERE id=sp.bucket_id) as primary_bucket, (SELECT GROUP_CONCAT(title) FROM bucket_secondary_degree WHERE id IN(sp.secondary_bucket_id)) as secondary_bucket FROM students as ss LEFT JOIN student_profile as sp ON ss.uuid=sp.uuid WHERE ss.user_account_status='active' and ss.uuid= '" +
      studentId +
      "'";

    const userData = await mysqlService.query(getQuery);
    return userData;
  } catch (err) {
    const error = err;
    error.status = 503;
    console.log(error)
  }
};

module.exports = { makeThirdPartyRequest };
