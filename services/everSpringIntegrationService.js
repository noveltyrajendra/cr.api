const axios = require("axios");
const qs = require("qs");

const {
    checkIfVeteranExists,
    getEverspringDegree,
    insertIntoLogEntry,
    saveThirdPartyResponse,
    getDegreeSpecificBuckets,
  } = require("../utils/integrationUtils");
const stringUtil = require("../utils/stringUtil");
const {
    integrationConstant,
    collegeConstant,
  } = require("../constants/integrationConstants");

const { levelConstant, certificateLevelData } = require("../constants/levelConstant");

const everSpringIntegration = async (
    studentId,
    parentId,
    data,
    collegeId,
    uuid
  ) => {
    return new Promise(async (resolve, reject) => {
        const isDegreeSpecific = parentId ? true : false;

        const checkQueryResult = await checkIfVeteranExists(
            studentId,
            isDegreeSpecific ? parentId : collegeId,
            integrationConstant.INTEGRATION_TYPE.EVERSPRING
        );
        
        if (checkQueryResult && checkQueryResult.length) {
            const iBody = {
                log_uuid: uuid,
                student_id: studentId,
                college_id: collegeId,
                stage: integrationConstant.INTEGRATION_STAGE,
                message: integrationConstant.DUPLICATE_MESSAGE,
                attributes: JSON.stringify(data),
                response: "",
                status: integrationConstant.STATUS_FAILURE,
            };
            await insertIntoLogEntry(iBody);
            return resolve(integrationConstant.DUPLICATE_MESSAGE);
        }

        const isDuplicateRequestBody = {
            log_uuid: uuid,
            student_id: studentId,
            college_id: collegeId,
            stage: integrationConstant.INTEGRATION_STAGE,
            message: integrationConstant.VETERAN_REQUEST_MESSAGE,
            attributes: "",
            response: "",
            status: integrationConstant.STATUS_SUCCESS,
        };
        await insertIntoLogEntry(isDuplicateRequestBody);

        /*const { level, primaryBucket, secondaryBucket } = isDegreeSpecific
        ? await getDegreeSpecificBuckets(collegeId)
        : {
            level: data.level,
            primaryBucket: data.priBucket,
            secondaryBucket: data.secBucket,
            };*/
        const { level, primaryBucket, secondaryBucket } = {
          level: data.level,
          primaryBucket: data.priBucket,
          secondaryBucket: data.secBucket,
        };

        const everSpringCollegeData = Object.values(collegeConstant).find(
            (college) =>
              college.collegeId == collegeId
        );
        //console.log("DDDD:",secondaryBucket);
        const requiredParamsLogBody = {
            log_uuid: uuid,
            student_id: studentId,
            college_id: collegeId,
            stage: integrationConstant.INTEGRATION_STAGE,
            message: integrationConstant.REQUIRED_PARAMETER_PASS,
            attributes: "",
            response: "",
            status: integrationConstant.STATUS_SUCCESS,
        };
        await insertIntoLogEntry(requiredParamsLogBody);
        //console.log("Level:",data.level);
        if (
            !everSpringCollegeData.defaultDegree &&
            everSpringCollegeData.levels.length &&
            !everSpringCollegeData.levels.includes(data.level)
          ) {
            const body = {
                log_uuid: uuid,
                student_id: studentId,
                college_id: collegeId,
                stage: integrationConstant.INTEGRATION_STAGE,
                message: integrationConstant.DEGREE_LABEL_NOT_MATCH,
                attributes: "",
                response: "",
                status: integrationConstant.STATUS_FAILURE,
            };
            return resolve(await insertIntoLogEntry(body));
        }

        const levelLogBody = {
            log_uuid: uuid,
            student_id: studentId,
            college_id: collegeId,
            stage: integrationConstant.INTEGRATION_STAGE,
            message: integrationConstant.DEGREE_LABEL_MATCH,
            attributes: data.level,
            response: "",
            status: integrationConstant.STATUS_SUCCESS,
        };
        await insertIntoLogEntry(levelLogBody);

        let mappedDegree = await getEverspringDegree(
            primaryBucket,
            secondaryBucket,
            level,
            everSpringCollegeData.collegeId
        );
        //console.log("MD:",mappedDegree);
        if (!mappedDegree) {
            const body = {
                log_uuid: uuid,
                student_id: studentId,
                college_id: collegeId,
                stage: integrationConstant.INTEGRATION_STAGE,
                message: integrationConstant.PROGRAM_NOT_MATCH,
                attributes: "",
                response: "",
                status: integrationConstant.STATUS_FAILURE,
            };
            return resolve(await insertIntoLogEntry(body));
        }

        const isProgramFoundLogBody = {
            log_uuid: uuid,
            student_id: studentId,
            college_id: collegeId,
            stage: integrationConstant.INTEGRATION_STAGE,
            message: integrationConstant.PROGRAM_MATCH,
            attributes: mappedDegree,
            response: "",
            status: integrationConstant.STATUS_SUCCESS,
        };
        await insertIntoLogEntry(isProgramFoundLogBody);

        let requestBody = {};
        let postUrl = "";

        if (
            collegeConstant.WILLIAM_AND_MARY_MBA && 
            (parentId == collegeConstant.WILLIAM_AND_MARY_MBA.collegeId ||
            collegeId == collegeConstant.WILLIAM_AND_MARY_MBA.collegeId)
            ) {
              postUrl = mappedDegree.post_url;
              
              let fullName = data.firstName +" "+data.lastName;
              requestBody = {
                fullname: fullName,
                email: data.email ? data.email : "",
                phone: data.phone ?  data.phone : "",
                street: data.address ? data.address : "",
                city: data.city ? data.city : "",
                country: "USA",
                postal_code: data.zip ? data.zip : "",
              }
        }else if(
          collegeConstant.WILLIAM_AND_MARY_MSBA && 
          (parentId == collegeConstant.WILLIAM_AND_MARY_MSBA.collegeId ||
          collegeId == collegeConstant.WILLIAM_AND_MARY_MSBA.collegeId)
        ){
          postUrl = mappedDegree.post_url;
          
          let fullName = data.firstName +" "+data.lastName;
          requestBody = {
            fullname: fullName,
            email: data.email ? data.email : "",
            phone: data.phone ?  data.phone : "",
            street: data.address ? data.address : "",
            city: data.city ? data.city : "",
            country: "USA",
            postal_code: data.zip ? data.zip : "",
          }
        }else if(
            collegeConstant.KENT_STATE_MS_HEALTH && 
            (parentId == collegeConstant.KENT_STATE_MS_HEALTH.collegeId ||
            collegeId == collegeConstant.KENT_STATE_MS_HEALTH.collegeId)
        ){
          postUrl = mappedDegree.post_url;
          
          let fullName = data.firstName +" "+data.lastName;
          requestBody = {
            fullname: fullName,
            email: data.email ? data.email : "",
            phone: data.phone ?  data.phone : "",
            street: data.address ? data.address : "",
            city: data.city ? data.city : "",
            country: "USA",
            postal_code: data.zip ? data.zip : "",
          }
        }else if(
          collegeConstant.KENT_STATE_MS_GEOGRAPHIC && 
          (parentId == collegeConstant.KENT_STATE_MS_GEOGRAPHIC.collegeId ||
          collegeId == collegeConstant.KENT_STATE_MS_GEOGRAPHIC.collegeId)
        ){
          postUrl = mappedDegree.post_url;
          
          requestBody = {
            first_name: data.firstName,
            last_name: data.lastName,
            email: data.email ? data.email : "",
            phone: data.phone ?  data.phone : "",
            street: data.address ? data.address : "",
            city: data.city ? data.city : "",
            country: "USA",
            postal_code: data.zip ? data.zip : "",
          }
        }else if(
          collegeConstant.KENT_STATE_MS_CRIMINOLOGY && 
          (parentId == collegeConstant.KENT_STATE_MS_CRIMINOLOGY.collegeId ||
          collegeId == collegeConstant.KENT_STATE_MS_CRIMINOLOGY.collegeId)
        ){
          postUrl = mappedDegree.post_url;
          
          requestBody = {
            first_name: data.firstName,
            last_name: data.lastName,
            email: data.email ? data.email : "",
            phone: data.phone ?  data.phone : "",
            street: data.address ? data.address : "",
            city: data.city ? data.city : "",
            country: "USA",
            postal_code: data.zip ? data.zip : "",
          }
        }else if(
          collegeConstant.KENT_STATE_MPH && 
          (parentId == collegeConstant.KENT_STATE_MPH.collegeId ||
          collegeId == collegeConstant.KENT_STATE_MPH.collegeId)
        ){
          postUrl = mappedDegree.post_url;
          
          let fullName = data.firstName +" "+data.lastName;
          requestBody = {
            fullname: fullName,
            email: data.email ? data.email : "",
            phone: data.phone ?  data.phone : "",
            street: data.address ? data.address : "",
            city: data.city ? data.city : "",
            country: "USA",
            postal_code: data.zip ? data.zip : "",
          }
        }else if(
          collegeConstant.MARQUETTE_MS_COMPUTING && 
          (parentId == collegeConstant.MARQUETTE_MS_COMPUTING.collegeId ||
          collegeId == collegeConstant.MARQUETTE_MS_COMPUTING.collegeId)
        ){
          postUrl = mappedDegree.post_url;
          
          let fullName = data.firstName +" "+data.lastName;
          requestBody = {
            fullname: fullName,
            email: data.email ? data.email : "",
            phone: data.phone ?  data.phone : "",
            street: data.address ? data.address : "",
            city: data.city ? data.city : "",
            country: "USA",
            postal_code: data.zip ? data.zip : "",
          }
        }else if(
          collegeConstant.MARQUETTE_MS_HEALTH && 
          (parentId == collegeConstant.MARQUETTE_MS_HEALTH.collegeId ||
          collegeId == collegeConstant.MARQUETTE_MS_HEALTH.collegeId)
        ){
          postUrl = mappedDegree.post_url;
          
          let fullName = data.firstName +" "+data.lastName;
          requestBody = {
            fullname: fullName,
            email: data.email ? data.email : "",
            phone: data.phone ?  data.phone : "",
            street: data.address ? data.address : "",
            city: data.city ? data.city : "",
            country: "USA",
            postal_code: data.zip ? data.zip : "",
          }
        }
        
        requestBody["lead_source_detail"] =  "CollegeRecon";
        const thirdPartyResponse = await everSpringThirdPartyRequest(
            requestBody,
            studentId,
            collegeId,
            isDegreeSpecific ? parentId : collegeId,
            uuid,
            postUrl
        );
        return resolve(thirdPartyResponse);
        /*console.log("CollegeId:",collegeId);
        console.log("PostUrl:", postUrl);
        console.log("RRR:",requestBody);
        return resolve("success");*/
    });
  };

  const everSpringThirdPartyRequest = (
    requestBody,
    studentId,
    collegeId,
    parentCollegeId,
    uuid,
    postUrl
  ) => {
    return new Promise(async (resolve, reject) => {
      //console.log("RB:",requestBody);
      try {
        const thirdPartyResponse = await axios({
          method: "post",
          url: postUrl,
          data: qs.stringify(requestBody),
        }).catch((error) => console.error(error));

        const result = thirdPartyResponse;
        const formattedResponseBody = {
          uuid: studentId,
          college_id: collegeId,
          parent_college_id: parentCollegeId,
          status_code: result && result.status ? result.status : "",
          message: result && result.data? JSON.stringify(result.data) : "",
          result: result && result.statusText ? result.statusText : "",
          source: integrationConstant.INTEGRATION_TYPE.EVERSPRING,
        };
  
        await saveThirdPartyResponse(formattedResponseBody).catch((error) =>
          console.error(error)
        );
        
        const logBody = {
          log_uuid: uuid,
          student_id: studentId,
          college_id: collegeId,
          stage: integrationConstant.INTEGRATION_STAGE,
          message: integrationConstant.AFTER_INTEGRATION,
          attributes: JSON.stringify(requestBody),
          response: result && result.data? JSON.stringify(result.data) : "",
          status: integrationConstant.STATUS_SUCCESS,
        };
        const returnData = await insertIntoLogEntry(logBody);
        return resolve(returnData);
      } catch (err) {
        var error = err;
        error.status = 503;
        const body = {
          log_uuid: uuid,
          student_id: studentId,
          college_id: collegeId,
          stage: integrationConstant.INTEGRATION_STAGE,
          message: JSON.stringify(error),
          attributes: JSON.stringify(requestBody),
          response: "",
          status: integrationConstant.STATUS_FAILURE,
        };
        await insertIntoLogEntry(body);
        console.error(err);
        return reject(error);
      }
    });
  };
  
  module.exports = { everSpringIntegration };