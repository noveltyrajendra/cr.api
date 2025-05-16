const axios = require("axios");
const convert = require("xml-js");
const qs = require("qs");

const {
    checkIfVeteranExists,
    insertIntoLogEntry,
    saveThirdPartyResponse,
    formatPhoneNumber,
  } = require("../utils/integrationUtils");

const stringUtil = require("../utils/stringUtil");
const {
  integrationConstant,
  collegeConstant,
} = require("../constants/integrationConstants");

const noodleIntegration = (
    studentId,
    collegeId,
    data,
    parentId,
    uuid
  ) => {
    return new Promise(async function (resolve, reject) {
        const checkQueryResult = await checkIfVeteranExists(
            studentId,
            parentId,
            integrationConstant.INTEGRATION_TYPE.NOODLE
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
            message: "Veteran has not request info from this school before",
            attributes: "",
            response: "",
            status: integrationConstant.STATUS_SUCCESS,
          };
          await insertIntoLogEntry(isDuplicateRequestBody);

        // Check if user has phone number
        if (
            !stringUtil.checkPhoneNumber(data.phone)
        ) {
            let message = "";
            if (!stringUtil.checkPhoneNumber(data.phone)) {
            message = integrationConstant.NO_PHONE_MESSAGE;
            } 
            const body = {
            log_uuid: uuid,
            student_id: studentId,
            college_id: collegeId,
            stage: integrationConstant.INTEGRATION_STAGE,
            message,
            attributes: "",
            response: "",
            status: integrationConstant.STATUS_FAILURE,
            };
            await insertIntoLogEntry(body);
        }
  
        const reqParamBody = {
            log_uuid: uuid,
            student_id: studentId,
            college_id: collegeId,
            stage: integrationConstant.INTEGRATION_STAGE,
            message: "Required parameters passed",
            attributes: "",
            response: "",
            status: integrationConstant.STATUS_SUCCESS,
        };
        await insertIntoLogEntry(reqParamBody);

        const requestBody = getRequestBody(data);
        const thirdPartyResponse = makeNoodlePostRequest(
            studentId,
            collegeId,
            requestBody,
            parentId,
            uuid,
          );
          return resolve(thirdPartyResponse);

        });
    };

    const getRequestBody = (data) => {
      let stateCode = "";
      if(data.state == "Online"){
        stateCode = "TX";
      }else{
        stateCode = data.state;
      }
      const body = {
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          phone: data.phone,
          street: data.address ? data.address : "",
          zip_code: data.zip ? data.zip : "",
          city: data.city ? data.city : "",
          state: stateCode,
          program: "program|ut|scm"
      };
    
      return body;
    };

    const makeNoodlePostRequest = (
        studentId,
        collegeId,
        userData,
        parentId,
        uuid
      ) => {
        return new Promise(async function (resolve, reject) {
          try {
            const thirdPartyResponse = await axios({
              method: "post",
              url: integrationConstant.NOODLE_POST_URL,
              data: userData,
            });
      
            const result = thirdPartyResponse.data;
            //console.log("UserData:",userData)
            //console.log("RR:",result)
      
            const formattedResponseBody = {
              uuid: studentId,
              college_id: collegeId,
              parent_college_id: parentId,
              status_code: thirdPartyResponse.status,
              message: "Lead Posted With Id:"+result.id,
              result: thirdPartyResponse.statusText,
              source: integrationConstant.INTEGRATION_TYPE.NOODLE,
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
              attributes: JSON.stringify(userData),
              response: JSON.stringify(result),
              status: integrationConstant.STATUS_SUCCESS,
            };
      
            return resolve(
              await insertIntoLogEntry(logBody).catch((error) => console.error(error))
            );
          } catch (err) {
            var error = err;
            error.status = 503;
            const body = {
              log_uuid: uuid,
              student_id: studentId,
              college_id: collegeId,
              stage: integrationConstant.INTEGRATION_STAGE,
              message: JSON.stringify(error),
              attributes: JSON.stringify(userData),
              response: "",
              status: "failure",
            };
            await insertIntoLogEntry(body);
            console.error(err);
            return reject(error);
          }
        });
    };

    module.exports = { noodleIntegration };