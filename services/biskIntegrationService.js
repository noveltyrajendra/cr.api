const axios = require("axios");
const qs = require("qs");

const {
  checkIfVeteranExists,
  getDegreeWithReferenceCode,
  insertIntoLogEntry,
  saveThirdPartyResponse,
  updateGoogleSheetWithFailureReason,
  getDegreeSpecificBuckets,
} = require("../utils/integrationUtils");
const stringUtil = require("../utils/stringUtil");
const {
  integrationConstant,
  collegeConstant,
} = require("../constants/integrationConstants");

const { levelConstant } = require("../constants/levelConstant");

const biskIntegration = async (
  studentId,
  parentId,
  data,
  collegeId,
  excelId,
  uuid
) => {
  return new Promise(async (resolve, reject) => {
    // Check if college is parent or degree specific
    const isDegreeSpecific = parentId ? true : false;

    const checkQueryResult = await checkIfVeteranExists(
      studentId,
      isDegreeSpecific ? parentId : collegeId,
      integrationConstant.INTEGRATION_TYPE.BISK
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

    const { level, primaryBucket, secondaryBucket } = isDegreeSpecific
      ? await getDegreeSpecificBuckets(collegeId)
      : {
          level: data.level,
          primaryBucket: data.priBucket,
          secondaryBucket: data.secBucket,
        };

    const biskCollegeData = Object.values(collegeConstant).find(
      (college) =>
        college.collegeId == (!isDegreeSpecific ? collegeId : parentId)
    );

    // Check if phone is required and validate
    /*if (biskCollegeData.requiredParameters.length) {
      let message = "";
      if (
        biskCollegeData.requiredParameters.includes("phone") &&
        !stringUtil.checkPhoneNumber(data.phone + "") &&
        biskCollegeData.requiredParameters.includes("zip") &&
        !stringUtil.checkZipcode(data.zip)
      ) {
        message = integrationConstant.NO_PHONE_ZIP_MESSAGE;
      } else if (
        biskCollegeData.requiredParameters.includes("phone") &&
        !stringUtil.checkPhoneNumber(data.phone + "")
      ) {
        message = integrationConstant.NO_PHONE_MESSAGE;
      } else if (
        biskCollegeData.requiredParameters.includes("zip") &&
        !stringUtil.checkZipcode(data.zip)
      ) {
        message = integrationConstant.NO_ZIP_MESSAGE;
      }

      if (message) {
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

        const failureInfo = {
          college_id: collegeId,
          parent_id: parentId,
          student_id: studentId,
          email: data.email,
          google_sheet_id: excelId,
          reason: message,
        };

        return resolve(await updateGoogleSheetWithFailureReason(failureInfo));
      }
    }*/

    const requiredParamsLogBody = {
      log_uuid: uuid,
      student_id: studentId,
      college_id: collegeId,
      stage: integrationConstant.INTEGRATION_STAGE,
      message: "Required parameters passed",
      attributes: "",
      response: "",
      status: integrationConstant.STATUS_SUCCESS,
    };
    await insertIntoLogEntry(requiredParamsLogBody);

    if (
      !biskCollegeData.defaultDegree &&
      biskCollegeData.levels.length &&
      !biskCollegeData.levels.includes(data.level)
    ) {
      const body = {
        log_uuid: uuid,
        student_id: studentId,
        college_id: collegeId,
        stage: integrationConstant.INTEGRATION_STAGE,
        message: "Degree level did not match.",
        attributes: "",
        response: "",
        status: integrationConstant.STATUS_FAILURE,
      };
      await insertIntoLogEntry(body);

      let failureInfo = {
        college_id: collegeId,
        parent_id: parentId,
        student_id: studentId,
        email: data.email,
        google_sheet_id: excelId,
        reason: "Degree level did not match.",
      };
      return resolve(updateGoogleSheetWithFailureReason(failureInfo));
    }

    const levelLogBody = {
      log_uuid: uuid,
      student_id: studentId,
      college_id: collegeId,
      stage: integrationConstant.INTEGRATION_STAGE,
      message: "Level matched",
      attributes: data.level,
      response: "",
      status: integrationConstant.STATUS_SUCCESS,
    };
    await insertIntoLogEntry(levelLogBody);

    let mappedDegree = await getDegreeWithReferenceCode(
      primaryBucket,
      secondaryBucket,
      level,
      biskCollegeData.collegeId
    );

    // Check if MSU is from bisk
    if (
      biskCollegeData.collegeId == collegeConstant.MSU.collegeId &&
      mappedDegree &&
      !mappedDegree.startsWith("a")
    ) {
      mappedDegree = null;
    }

    if (!mappedDegree) {
      const body = {
        log_uuid: uuid,
        student_id: studentId,
        college_id: collegeId,
        stage: integrationConstant.INTEGRATION_STAGE,
        message: "Program name did not match.",
        attributes: "",
        response: "",
        status: integrationConstant.STATUS_FAILURE,
      };
      await insertIntoLogEntry(body);

      let failureInfo = {
        college_id: collegeId,
        parent_id: parentId,
        student_id: studentId,
        email: data.email,
        google_sheet_id: excelId,
        reason: "Program name did not match.",
      };
      return resolve(updateGoogleSheetWithFailureReason(failureInfo));
    }

    const isProgramFoundLogBody = {
      log_uuid: uuid,
      student_id: studentId,
      college_id: collegeId,
      stage: integrationConstant.INTEGRATION_STAGE,
      message: "Program matched.",
      attributes: mappedDegree,
      response: "",
      status: integrationConstant.STATUS_SUCCESS,
    };
    await insertIntoLogEntry(isProgramFoundLogBody);

    let requestBody = {};

    if (
      collegeConstant.FLORIDA_TECH && 
      (parentId == collegeConstant.FLORIDA_TECH.collegeId ||
      collegeId == collegeConstant.FLORIDA_TECH.collegeId)
    ) {
      requestBody = {
        "00N6100000DVxY4": mappedDegree,
        first_name: data.firstName ? data.firstName : "",
        last_name: data.lastName ? data.lastName : "",
        //first_name:"test",
        //last_name: "test",
        email: data.email ? data.email : "",
        phone: data.phone ? `${data.phone.replace(/[^\d]/g, "")}` : "",
        street: data.address ? data.address : "",
        city: data.city ? data.city : "",
        //State: data.state ? data.state : '',
        zip: data.zip ? data.zip : "",
        "00N6100000DVxXf": integrationConstant.IP_ADDRESS,
        ...collegeConstant.FLORIDA_TECH.additionalParameters,
      };
      // Notre dame discontinued
      // } else if (parentId == collegeConstant.NOTRE_DOME.collegeId || collegeId == collegeConstant.NOTRE_DOME.collegeId) {
      //       //console.log("DD:",degreeExist)
      //       requestBody = {
      //         "00N6100000DVxY4": mappedDegree[0].degreename,
      //         first_name: data.firstName ? data.firstName : "",
      //         last_name: data.lastName ? data.lastName : "",
      //         //first_name:"test",
      //         //last_name: "test",
      //         email: data.email ? data.email : "",
      //         phone: data.phone
      //           ? `${data.phone.replace(/[^\d]/g, "")}`
      //           : "",
      //         //state_code: data.state ? data.state : '',
      //         "00N6100000DVxXf": integrationConstant.IP_ADDRESS,
      //         ...collegeConstant.NOTRE_DOME.additionalParameters,
      //       };
    } else if (
      parentId == collegeConstant.MSU.collegeId ||
      collegeId == collegeConstant.MSU.collegeId
    ) {
      requestBody = {
        "00N6100000DVxY4": mappedDegree,
        first_name: data.firstName ? data.firstName : "",
        last_name: data.lastName ? data.lastName : "",
        //first_name:"test",
        //last_name: "test",
        email: data.email ? data.email : "",
        phone: data.phone ? `${data.phone.replace(/[^\d]/g, "")}` : "",
        street: data.address ? data.address : "",
        city: data.city ? data.city : "",
        //state_code: data.state ? data.state : '',
        zip: data.zip ? data.zip : "",
        "00N6100000DVxXf": integrationConstant.IP_ADDRESS,
        ...collegeConstant.MSU.additionalParameters.bisk,
      };
    } else if (
      parentId == collegeConstant.VILLANOVA.collegeId ||
      collegeId == collegeConstant.VILLANOVA.collegeId
    ) {
      requestBody = {
        "00N6100000DVxY4": mappedDegree,
        first_name: data.firstName ? data.firstName : "",
        last_name: data.lastName ? data.lastName : "",
        email: data.email ? data.email : "",
        phone: data.phone ? `${data.phone.replace(/[^\d]/g, "")}` : "",
        street: data.address ? data.address : "",
        city: data.city ? data.city : "",
        //state_code: data.state ? data.state : '',
        zip: data.zip ? data.zip : "",
        ...collegeConstant.VILLANOVA.additionalParameters,
      };
    }

    const thirdPartyResponse = await biskThirdPartyRequest(
      requestBody,
      studentId,
      collegeId,
      isDegreeSpecific ? parentId : collegeId,
      uuid
    );
    return resolve(thirdPartyResponse);
  });
};

const biskThirdPartyRequest = (
  requestBody,
  studentId,
  collegeId,
  parentCollegeId,
  uuid
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const thirdPartyResponse = await axios({
        method: "post",
        url: integrationConstant.BISK_POST_URL,
        data: qs.stringify(requestBody),
      });

      const formattedResponseBody = {
        uuid: studentId,
        college_id: collegeId,
        parent_college_id: parentCollegeId,
        result: "SUCCESS",
        source: integrationConstant.INTEGRATION_TYPE.BISK,
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
        response: JSON.stringify(thirdPartyResponse),
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

module.exports = { biskIntegration };
