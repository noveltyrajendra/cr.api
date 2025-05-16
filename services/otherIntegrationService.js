const { GoogleSpreadsheet } = require("google-spreadsheet");
const axios = require("axios");
const convert = require("xml-js");
const qs = require("qs");
const Hubspot = require('hubspot');
const creds = require("../google-generated-creds.json");
const config = require('../config')
const { appendZeroToZip } = require('../utils/commonUtils')

const {
  checkIfVeteranExists,
  getDegreeWithReferenceCode,
  getDegreeWithoutReferenceCode,
  insertIntoLogEntry,
  saveThirdPartyResponse,
  updateGoogleSheetWithFailureReason,
  getDegreeSpecificBuckets,
  removeEmptyValuesFromObject,
  getGoldenGateDegree,
  formatPhoneNumber,
  getBucketNames,
} = require("../utils/integrationUtils");

const {
  integrationConstant,
  collegeConstant,
} = require("../constants/integrationConstants");

const stringUtil = require("../utils/stringUtil");
const { levelConstant } = require("../constants/levelConstant");

const otherIntegration = async (
  studentId,
  collegeId,
  data,
  parentId,
  excelId,
  uuid
) => {
  return new Promise(async function (resolve, reject) {

    // Special cases for level to map specific level even if veteran has selected different level
    if(collegeId == collegeConstant.COLORADO_STATE.collegeId || parentId == collegeConstant.COLORADO_STATE.collegeId) {
      data.level = data.level == levelConstant.ASSOCIATE ? levelConstant.BACHELOR : data.level;
    }

    if(collegeId == collegeConstant.CSU.collegeId || parentId == collegeConstant.CSU.collegeId) {
      data.level = data.level == levelConstant.CERTIFICATE ? levelConstant.BACHELOR : data.level;
    }

    // Check if college is parent or degree specific
    const isDegreeSpecific = parentId ? true : false;

    const checkQueryResult = await checkIfVeteranExists(
      studentId,
      isDegreeSpecific ? parentId : collegeId,
      integrationConstant.INTEGRATION_TYPE.INDIVIDUAL
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

    const collegeData = Object.values(collegeConstant).find(
      (college) =>
        college.collegeId == (isDegreeSpecific ? parentId : collegeId)
    );

    // Check if phone is required and validate
    if (collegeData.requiredParameters.length) {
      let message = "";
      if (
        collegeData.requiredParameters.includes("phone") &&
        !stringUtil.checkPhoneNumber(data.phone) &&
        collegeData.requiredParameters.includes("zip") &&
        !stringUtil.checkZipcode(data.zip)
      ) {
        message = integrationConstant.NO_PHONE_ZIP_MESSAGE;
      } else if (
        collegeData.requiredParameters.includes("phone") &&
        !stringUtil.checkPhoneNumber(data.phone)
      ) {
        message = integrationConstant.NO_PHONE_MESSAGE;
      } else if (
        collegeData.requiredParameters.includes("zip") &&
        !stringUtil.checkZipcode(data.zip)
      ) {
        message = integrationConstant.NO_ZIP_MESSAGE;
      }

      if (message && collegeData.collegeId == collegeConstant.SNHU.collegeId) {
        const sheetBody = {
          "First Name": data.firstName,
          "Last Name": data.lastName,
          Email: data.email,
          Address: data.address,
          City: data.city,
          State: data.state,
          "Postal Code": data.zip,
          "Phone Number": data.phone,
          "Military Status": data.militaryStatus,
          "Military Branch": data.militaryBranch,
          "Military Rank": data.militaryRank,
          "Degree Level": data.degreeLevel,
          "Degree Field": data.degreeField,
          "Area of Study": data.AreaOfStudy,
          JST: data.JST ? "yes" : "no",
          "Date Created": data.DateCreated,
          "Failure Message": message,
        };
        const doc = new GoogleSpreadsheet(
          collegeConstant.SNHU.googleSheetID[0]
        );
        await doc.useServiceAccountAuth(creds);
        await doc.loadInfo();
        const sheet1 = doc.sheetsByIndex[0];
        await sheet1.addRow(sheetBody);

        const failureInfo = {
          college_id: collegeId,
          parent_id: parentId,
          student_id: studentId,
          email: data.email,
          google_sheet_id: excelId,
          reason: message,
        };

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

        return resolve(await updateGoogleSheetWithFailureReason(failureInfo));
      } else if (message) {
        const failureInfo = {
          college_id: collegeId,
          parent_id: parentId,
          student_id: studentId,
          email: data.email,
          google_sheet_id: excelId,
          reason: message,
        };

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

        return resolve(await updateGoogleSheetWithFailureReason(failureInfo));
      }
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

    if (
      !collegeData.defaultDegree &&
      collegeData.levels.length &&
      !collegeData.levels.includes(level)
    ) {
      let failureInfo = {
        college_id: collegeId,
        parent_id: parentId,
        student_id: studentId,
        email: data.email,
        google_sheet_id: excelId,
        reason: "Degree level did not match.",
      };

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

      return resolve(await updateGoogleSheetWithFailureReason(failureInfo));
    }

    const levelLogBody = {
      log_uuid: uuid,
      student_id: studentId,
      college_id: collegeId,
      stage: integrationConstant.INTEGRATION_STAGE,
      message: "Level matched.",
      attributes: "",
      response: "",
      status: integrationConstant.STATUS_SUCCESS,
    };
    await insertIntoLogEntry(levelLogBody);

    let mappedDegree =
      collegeData.collegeId == collegeConstant.BAY_STATE.collegeId
        ? await getBucketNames(
            primaryBucket.split(',')[0],
            secondaryBucket.split(',')[0]
          )
        :  collegeData.collegeId == collegeConstant.GOLDENGATE.collegeId
        ? await getGoldenGateDegree(
            primaryBucket,
            secondaryBucket,
            getGolgenGateAcademicLevel(level)
          ):
        collegeData.singleDegree
        ? collegeData.singleDegree
        : collegeData.hasReferanceCode
        ? await getDegreeWithReferenceCode(
            primaryBucket,
            secondaryBucket,
            level,
            collegeData.collegeId
          )
        : await getDegreeWithoutReferenceCode(
            primaryBucket,
            secondaryBucket,
            level,
            collegeData.collegeId
          );
    // Check if MSU is from bisk
    /*if (
      collegeData.collegeId == collegeConstant.MSU.collegeId &&
      mappedDegree &&
      !mappedDegree.startsWith("a")
    ) {
      mappedDegree = null;
    }*/

    if (collegeId == collegeConstant.GOLDENGATE.collegeId) {
      /*mappedDegree =
        mappedDegree && mappedDegree.academicProgram
          ? mappedDegree
          : { ...collegeConstant.GOLDENGATE.defaultDegree };*/
        mappedDegree = { ...collegeConstant.GOLDENGATE.defaultDegree };
    } else if (!mappedDegree && collegeData.defaultDegree) {
      mappedDegree = collegeData.defaultDegree;
    } else if (!mappedDegree && !collegeData.defaultDegree) {
      let failureInfo = {
        college_id: collegeId,
        parent_id: parentId,
        student_id: studentId,
        email: data.email,
        google_sheet_id: excelId,
        reason: "Program name did not match.",
      };

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
      return resolve(await updateGoogleSheetWithFailureReason(failureInfo));
    }

    const programLogBody = {
      log_uuid: uuid,
      student_id: studentId,
      college_id: collegeId,
      stage: integrationConstant.INTEGRATION_STAGE,
      message: "Program matched.",
      attributes: mappedDegree,
      response: "",
      status: integrationConstant.STATUS_SUCCESS,
    };
    await insertIntoLogEntry(programLogBody);

    if (
      (collegeId == collegeConstant.COLORADO_STATE.collegeId ||
      parentId == collegeConstant.COLORADO_STATE.collegeId) && (collegeConstant.COLORADO_STATE.status)
    ) {
      return resolve(
        coloradoStateIntegration(
          studentId,
          collegeId,
          data,
          parentId,
          excelId,
          uuid,
          mappedDegree,
          collegeData
        )
      );
    } else if (
      collegeId == collegeConstant.SNHU.collegeId ||
      parentId == collegeConstant.SNHU.collegeId
    ) {
      return resolve(
        SNHUIntegration(
          studentId,
          collegeId,
          data,
          parentId,
          excelId,
          uuid,
          mappedDegree
        )
      );
    } else if (
      (collegeId == collegeConstant.CAREERSTEP.collegeId ||
      parentId == collegeConstant.CAREERSTEP.collegeId) && (collegeConstant.CAREERSTEP.status)
    ) {
      return resolve(
        careerStepIntegration(
          studentId,
          collegeId,
          data,
          parentId,
          excelId,
          uuid,
          mappedDegree,
          collegeData
        )
      );
    } else if (
      collegeId == collegeConstant.GOLDENGATE.collegeId ||
      parentId == collegeConstant.GOLDENGATE.collegeId
    ) {
      const thirdPartyResponse = await goldenGateAPIPost(
        studentId,
        collegeId,
        data,
        getGolgenGateAcademicLevel(data.level),
        mappedDegree,
        uuid
      );

      return resolve(thirdPartyResponse);
    } else if (
      (collegeId == collegeConstant.CSU.collegeId ||
      parentId == collegeConstant.CSU.collegeId) && (collegeConstant.CSU.status)
    ) {
      return resolve(
        CSUIntegration(
          studentId,
          collegeId,
          data,
          parentId,
          excelId,
          uuid,
          mappedDegree,
          collegeData
        )
      );
    } else if (
      collegeId == collegeConstant.CONCORDE.collegeId ||
      parentId == collegeConstant.CONCORDE.collegeId
    ) {
      return resolve(
        concordeIntegration(
          studentId,
          collegeId,
          data,
          parentId,
          excelId,
          uuid,
          mappedDegree,
          collegeData
        )
      );
    } else if (
      collegeId == collegeConstant.CINCINNATI.collegeId ||
      parentId == collegeConstant.CINCINNATI.collegeId
    ) {
      return resolve(
        cincinnatiIntegration(
          studentId,
          collegeId,
          data,
          parentId,
          excelId,
          uuid,
          mappedDegree,
          collegeData
        )
      );
    } else if (
      (collegeId == collegeConstant.TIFFIN.collegeId ||
      parentId == collegeConstant.TIFFIN.collegeId) && (collegeConstant.TIFFIN.status)
    ) {
      return resolve(
        tiffinIntegration(
          studentId,
          collegeId,
          data,
          parentId,
          excelId,
          uuid,
          mappedDegree,
          collegeData
        )
      );
    } else if (
      (collegeId == collegeConstant.FORT_HAYS.collegeId ||
      parentId == collegeConstant.FORT_HAYS.collegeId) && (collegeConstant.FORT_HAYS.status)
    ) {
      return resolve(
        fortHaysIntegration(
          studentId,
          collegeId,
          data,
          parentId,
          excelId,
          uuid,
          mappedDegree,
          collegeData
        )
      );
    } else if (
      (collegeId == collegeConstant.BAY_STATE.collegeId ||
      parentId == collegeConstant.BAY_STATE.collegeId) && (collegeConstant.BAY_STATE.status)
    ) {
      return resolve(
        bayStateIntegration(
          studentId,
          collegeId,
          data,
          parentId,
          excelId,
          uuid,
          mappedDegree,
          collegeData
        )
      );
    } else if (
      (collegeId == collegeConstant.POST.collegeId ||
      parentId == collegeConstant.POST.collegeId) && (collegeConstant.POST.status)
    ) {
      return resolve(
        postUniversityIntegration(
          studentId,
          collegeId,
          data,
          parentId,
          excelId,
          uuid,
          mappedDegree,
          collegeData
        )
      )
    }else{
      return resolve("success");
    }
  });
};

const coloradoStateIntegration = (
  studentId,
  collegeId,
  data,
  parentId,
  excelId,
  uuid,
  mappedDegree,
  collegeData
) => {
  return new Promise(async function (resolve, reject) {
    // pub_id and acknowledge are constant value provided by third party
    let userData = {
      remote_addr: integrationConstant.IP_ADDRESS,
      fname: data.firstName ? data.firstName : "",
      lname: data.lastName ? data.lastName : "",
      email: data.email ? data.email : "",
      homephone: data.phone.replace(/[^\d]/g, ""),
      address1: data.address ? data.address : "",
      city: data.city ? data.city : "",
      //state: data.state ? data.state : '',
      zip: data.zip ? data.zip : "",
      program: mappedDegree,
      ...collegeConstant.COLORADO_STATE.additionalParameters,
    };

    // To remove null values
    userData = removeEmptyValuesFromObject(userData);

    // console.log("UD", userData);

    try {
      const thirdPartyResponse = await axios({
        method: "post",
        url: integrationConstant.COLORADO_STATE_POST_URL,
        data: qs.stringify(userData),
      }).catch((error) => console.error(error));

      const resdata = thirdPartyResponse.data.split("|");

      const formattedResponseBody = {
        uuid: studentId,
        college_id: collegeId,
        parent_college_id: collegeConstant.COLORADO_STATE.collegeId,
        status_code: resdata[2],
        message: resdata[1],
        result: resdata[3],
        source: integrationConstant.INTEGRATION_TYPE.INDIVIDUAL,
      };

      await saveThirdPartyResponse(formattedResponseBody).catch((error) =>
        console.error(error)
      );

      const iBody = {
        log_uuid: uuid,
        student_id: studentId,
        college_id: collegeId,
        stage: integrationConstant.INTEGRATION_STAGE,
        message: integrationConstant.AFTER_INTEGRATION,
        attributes: JSON.stringify(userData),
        response: JSON.stringify(resdata),
        status: integrationConstant.STATUS_SUCCESS,
      };

      return resolve(
        await insertIntoLogEntry(iBody).catch((error) => console.error(error))
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
        status: integrationConstant.STATUS_FAILURE,
      };
      await insertIntoLogEntry(body);
      console.error(err);
      return reject(error);
    }
  });
};

const SNHUIntegration = (
  studentId,
  collegeId,
  data,
  parentId,
  excelId,
  uuid,
  mappedDegree
) => {
  return new Promise(async function (resolve, reject) {
    const userData = {
      ProgramType: 'DED',
      //Test: "Y",
      FirstName: data.firstName ? data.firstName : '',
      LastName: data.lastName ? data.lastName : '',
      Email: data.email ? data.email : '',
      Phonenumber: data.phone ? formatPhoneNumber(data.phone) : '',
      Address: data.address ? data.address : '',
      City: data.city ? data.city : '',
      //State: data.state ? data.state : '',
      Zip: data.zip ? appendZeroToZip(String(data.zip)) : '',
      ProgramofInterest: mappedDegree,
      ...collegeConstant.SNHU.additionalParameters,
    };

    const thirdPartyResponse = await snhuSparkroomAPI(
      studentId,
      collegeId,
      userData,
      uuid
    );

    return resolve(thirdPartyResponse);
  });
};

const careerStepIntegration = (
  studentId,
  collegeId,
  data,
  parentId,
  excelId,
  uuid,
  mappedDegree,
  collegeData
) => {
  return new Promise(async function (resolve, reject) {
    let userData = {
      ProgramType: mappedDegree,
      FirstName: data.firstName ? data.firstName : "",
      LastName: data.lastName ? data.lastName : "",
      Email: data.email ? data.email : "",
      ContactStreet: data.address ? data.address : "",
      ContactCity: data.city ? data.city : "",
      ContactPostalCode: data.zip ? data.zip : "",
      Phone: data.phone ? `${data.phone.replace(/[^\d]/g, "")}` : "",
      ...collegeConstant.CAREERSTEP.additionalParameters,
    };
    try {
      const thirdPartyResponse = await axios({
        method: "post",
        url: integrationConstant.CAREERSTEP_POST_URL,
        data: qs.stringify(userData),
      }).catch((error) => console.error(error));
      const formattedResponseBody = {
        uuid: studentId,
        college_id: collegeId,
        parent_college_id: collegeConstant.CAREERSTEP.collegeId,
        status_code:
          thirdPartyResponse && thirdPartyResponse.status
            ? thirdPartyResponse.status
            : "",
        message: "Need to get",
        result:
          thirdPartyResponse && thirdPartyResponse.statusText
            ? thirdPartyResponse.statusText
            : "",
        source: integrationConstant.INTEGRATION_TYPE.INDIVIDUAL,
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
        response: JSON.stringify(thirdPartyResponse),
        status: integrationConstant.STATUS_SUCCESS,
      };
      const returnData = await insertIntoLogEntry(logBody);
      return resolve(returnData);
    } catch (err) {
      if (err) {
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
          status: integrationConstant.STATUS_FAILURE,
        };
        await insertIntoLogEntry(body);
        return reject(error);
      }
      console.error(err);
    }
  });
};

const CSUIntegration = (
  studentId,
  collegeId,
  data,
  parentId,
  excelId,
  uuid,
  mappedDegree,
  collegeData
) => {
  return new Promise(async function (resolve, reject) {
    const userData = {
      FirstName: data.firstName ? data.firstName : "",
      LastName: data.lastName ? data.lastName : "",
      DayPhone: data.phone ? `${data.phone.replace(/[^\d]/g, "")}` : "",
      Email: data.email ? data.email : "",
      Zip: data.zip ? data.zip : "",
      CurriculumID: mappedDegree,
      ...collegeConstant.CSU.additionalParameters,
      //IsTest: 'Y'
    };
    // Add IsTest: 'Y' for test lead
    try {
      const thirdPartyResponse = await axios({
        url: integrationConstant.CSU_POST_URL,
        method: "post",
        data: qs.stringify(userData),
      }).catch((error) => console.error(error));

      const xmldata = thirdPartyResponse.data;
      const result = JSON.parse(
        convert.xml2json(xmldata, {
          compact: true,
          spaces: 2,
        })
      );

      const formattedResponseBody = {
        uuid: studentId,
        college_id: collegeId,
        parent_college_id: collegeConstant.CSU.collegeId,
        status_code:
          result &&
          result.DATAHQ_RESPONSE &&
          result.DATAHQ_RESPONSE.STATUS_CODE &&
          result.DATAHQ_RESPONSE.STATUS_CODE._text
            ? result.DATAHQ_RESPONSE.STATUS_CODE._text
            : "",
        message:
          result && result.DATAHQ_RESPONSE && result.DATAHQ_RESPONSE.MESSAGE
            ? `${result.DATAHQ_RESPONSE.MESSAGE._text} with reference code ${result.DATAHQ_RESPONSE.REFERENCE._text}`
            : "",
        result:
          result && result.DATAHQ_RESPONSE && result.DATAHQ_RESPONSE.RESULT
            ? result.DATAHQ_RESPONSE.RESULT._text
            : "",
        source: integrationConstant.INTEGRATION_TYPE.INDIVIDUAL,
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
      const returnData = await insertIntoLogEntry(logBody);
      return resolve(returnData);
    } catch (err) {
      console.error(err);
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
        status: integrationConstant.STATUS_FAILURE,
      };
      await insertIntoLogEntry(body);
      console.error(err);
      return reject(error);
    }
  });
};

const concordeIntegration = (
  studentId,
  collegeId,
  data,
  parentId,
  excelId,
  uuid,
  mappedDegree,
  collegeData
) => {
  return new Promise(async function (resolve, reject) {
    const userData = {
      firstname: data.firstName ? data.firstName : "",
      lastname: data.lastName ? data.lastName : "",
      email: data.email ? data.email : "",
      dayphone: data.phone ? `${data.phone.replace(/[^\d]/g, "")}` : "",
      CurriculumID: mappedDegree,
      zip: data.zip ? data.zip : "",
      ...collegeConstant.CONCORDE.additionalParameters,
    };
    try {
      const thirdPartyResponse = await axios({
        url: integrationConstant.CONCORDE_POST_URL,
        method: "post",
        data: qs.stringify(userData),
      }).catch((error) => console.error(error));

      const result = thirdPartyResponse;

      const formattedResponseBody = {
        uuid: studentId,
        college_id: collegeId,
        parent_college_id: collegeConstant.CONCORDE.collegeId,
        status_code: result && result.status ? result.status : "",
        message: result && result.data? result.data : "",
        result: result && result.statusText ? result.statusText : "",
        source: integrationConstant.INTEGRATION_TYPE.INDIVIDUAL,
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
        response: result && result.data? result.data : "",
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
        attributes: JSON.stringify(userData),
        response: "",
        status: integrationConstant.STATUS_FAILURE,
      };
      await insertIntoLogEntry(body);
      console.error(err);
      return reject(error);
    }
  });
};

const cincinnatiIntegration = (
  studentId,
  collegeId,
  data,
  parentId,
  excelId,
  uuid,
  mappedDegree,
  collegeData
) => {
  return new Promise(async function (resolve, reject) {
    const userData = {
      Recruitment_Interest__c: mappedDegree,
      //Term__c: getTerm(),
      Term__c: "a0k4T0000000oIsQAI",
      First_Name__c: data.firstName ? data.firstName : "",
      Last_Name__c: data.lastName ? data.lastName : "",
      Email__c: data.email ? data.email : "",
      //"Mailing_State__c":getState(data.state),
      Mobile_Phone__c: data.phone ? formatPhoneNumber(data.phone) : "",
      Mailing_Zip__c: data.zip ? data.zip : "",
      Military_Affiliation__c: getCincinnatiMilitaryAffiliation(data.militaryStatus, data.militaryBranch),
      ...collegeConstant.CINCINNATI.additionalParameters.requestBodyConstant,
    };
    try {
      const accessTokenBody = await axios({
        method: "post",
        url: "https://login.salesforce.com/services/oauth2/token",
        data: qs.stringify(
          collegeConstant.CINCINNATI.additionalParameters.accessTokenData
        ),
      }).catch((error) => console.error(error));

      const accessToken = accessTokenBody.data.access_token;

      const thirdPartyResponse = await axios({
        url: integrationConstant.CINCINNATI_POST_URL,
        method: "post",
        data: userData,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: "Bearer " + accessToken,
        },
      }).catch((error) => console.error(error));

      const result = thirdPartyResponse.data;

      const formattedResponseBody = {
        uuid: studentId,
        college_id: collegeId,
        parent_college_id: collegeConstant.CINCINNATI.collegeId,
        status_code: result && result.id ? result.id : "",
        result: result && result.success ? result.success : "",
        source: integrationConstant.INTEGRATION_TYPE.INDIVIDUAL,
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
        //response: JSON.stringify(thirdPartyResponse),
        response: 'success',
        status: integrationConstant.STATUS_SUCCESS,
      };
      const returnData = await insertIntoLogEntry(logBody);
      return resolve(returnData);
    } catch (error) {
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

const tiffinIntegration = (
  studentId,
  collegeId,
  data,
  parentId,
  excelId,
  uuid,
  mappedDegree,
  collegeData
) => {
  return new Promise(async function (resolve, reject) {
    let level = "";
    if (data.level == levelConstant.BACHELOR) {
      level = "Bachelor";
    } else if (data.level == levelConstant.MASTER) {
      level = "Master";
    } else if (data.level == levelConstant.CERTIFICATE) {
      level = "Certificate";
    } else if (data.level == levelConstant.POST_BACHELOR) {
      level = "Post-Bachelor";
    } else if (data.level == levelConstant.POST_MASTER) {
      level = "Post-Master";
    } else if (dota.level == levelConstant.DOCTORATE) {
      level = "Doctorate";
    }

    const xmlUserData = `<?xml version="1.0" encoding="utf-8"?>
          <persons>
          <person>
          <first>${data.firstName ? data.firstName : ""}</first>
          <last>${data.lastName ? data.lastName : ""}</last>
          <program>${mappedDegree}</program>
          <level>${level}</level>
          <birthdate>${data.dateOfBirth ? data.dateOfBirth : ""}</birthdate>
          <email>${data.email ? data.email : ""}</email>
          <address>${data.address ? data.address : ""}</address>
          <city>${data.city ? data.city : ""}</city>
          <zip>${data.zip ? data.zip : ""}</zip>
          </person>
          </persons>`;

    try {
      const basicAuth = {
        ...collegeConstant.TIFFIN.additionalParameters.authenticationParameters,
      };
      const thirdPartyResponse = await axios({
        method: "post",
        url: integrationConstant.TIFFIN_POST_URL,
        data: xmlUserData,
        auth: basicAuth,
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });

      const formattedResponseBody = {
        uuid: studentId,
        college_id: collegeId,
        parent_college_id: collegeConstant.TIFFIN.collegeId,
        status_code:
          thirdPartyResponse && thirdPartyResponse.status
            ? thirdPartyResponse.status
            : thirdPartyResponse.status,
        result:
          thirdPartyResponse && thirdPartyResponse.statusText
            ? thirdPartyResponse.statusText
            : "",
        source: integrationConstant.INTEGRATION_TYPE.INDIVIDUAL,
      };

      await saveThirdPartyResponse(formattedResponseBody).catch((error) =>
        console.error(error)
      );

      // console.log("Result; ",result)

      const logBody = {
        log_uuid: uuid,
        student_id: studentId,
        college_id: collegeId,
        stage: integrationConstant.INTEGRATION_STAGE,
        message: integrationConstant.AFTER_INTEGRATION,
        attributes: JSON.stringify(xmlUserData),
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
        attributes: JSON.stringify(xmlUserData),
        response: "",
        status: integrationConstant.STATUS_FAILURE,
      };
      await insertIntoLogEntry(body);
      console.error(err);
      return reject(error);
      console.error(err);
    }
  });
};

const fortHaysIntegration = (
  studentId,
  collegeId,
  data,
  parentId,
  excelId,
  uuid,
  mappedDegree,
  collegeData
) => {
  return new Promise(async function (resolve, reject) {
    let level = "";
    if (data.level == levelConstant.BACHELOR) {
      level = "Undergraduate";
    } else if (data.level == levelConstant.MASTER) {
      level = "Master's";
    } else if (data.level == levelConstant.ASSOCIATE) {
      level = "Undergraduate";
    }
    const contactObj = {
      properties: [
        {
          property: "firstname",
          value: data.firstName ? data.firstName : "",
        },
        {
          property: "lastname",
          value: data.lastName ? data.lastName : "",
        },
        {
          property: "email",
          value: data.email ? data.email : "",
        },
        {
          property: "address",
          value: data.address ? data.address : "",
        },
        {
          property: "city",
          value: data.city ? data.city : "",
        },
        { property: "zip", value: data.zip ? data.zip : "" },
        {
          property: "phone",
          value: data.phone ? formatPhoneNumber(data.phone) : "",
        },
        {
          property:
            "are_you_currently_on_active_duty_veteran_of_the_u_s_military_or_a_military_dependent_",
          value: getVeteranActiveDuty(data.militaryStatus),
        },
        { property: "degree_level", value: level },
        {
          property: "anticipated_major_at_fhsu",
          value: mappedDegree,
        },
        {
          property: "third_party_referrals",
          value: "CollegeRecon",
        },
      ],
    };
    try {
      const hubspot = new Hubspot({
        apiKey: collegeConstant.FORT_HAYS.additionalParameters.apiKey,
      });

      const hubspotContact = await hubspot.contacts
        .create(contactObj)
        .catch((error) => console.error(error));

      const formattedResponseBody = {
        uuid: studentId,
        college_id: collegeId,
        parent_college_id: collegeConstant.FORT_HAYS.collegeId,
        result: hubspotContact && hubspotContact.vid ? hubspotContact.vid : "",
        source: integrationConstant.INTEGRATION_TYPE.INDIVIDUAL,
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
        attributes: JSON.stringify(contactObj),
        response: JSON.stringify(hubspotContact),
        status: integrationConstant.STATUS_SUCCESS,
      };
      const returnData = await insertIntoLogEntry(logBody);
      return resolve(returnData);
    } catch (error) {
      var error = err;
      error.status = 503;
      const body = {
        log_uuid: uuid,
        student_id: studentId,
        college_id: collegeId,
        stage: integrationConstant.INTEGRATION_STAGE,
        message: JSON.stringify(error),
        attributes: JSON.stringify(contactObj),
        response: "",
        status: integrationConstant.STATUS_FAILURE,
      };
      await insertIntoLogEntry(body);
      console.error(err);
      return reject(error);
    }
  });
};

const bayStateIntegration = (
  studentId,
  collegeId,
  data,
  parentId,
  excelId,
  uuid,
  mappedDegree,
  collegeData
) => {
  return new Promise(async function (resolve, reject) {
    const userData = {
      row: [
        {
          FirstName: data.firstName ? data.firstName : "",
          LastName: data.lastName ? data.lastName : "",
          Email: data.email ? data.email : "",
          Phone: data.phone ? `${data.phone.replace(/[^\d]/g, "")}` : "",
          Address: data.address ? data.address : "",
          City: data.city ? data.city : "",
          //"State": data.state ? data.state : '',
          Zipcode: data.zip ? data.zip : "",
          Areaofstudy: mappedDegree.primaryBucket,
          Areaoffocus: mappedDegree.secondaryBucket,
        },
      ],
    };

    const basicAuth = {
      ...collegeConstant.BAY_STATE.additionalParameters.basicAuth,
    };
    // password: 'XSS7AT7bZr-HHk!Fp8ujtyf*'  // STAGING URL
    try {
      const thirdPartyResponse = await axios({
        method: "post",
        url: integrationConstant.BAYSTATE_POST_URL,
        data: userData,
        auth: basicAuth,
      });
      const formattedResponseBody = {
        uuid: studentId,
        college_id: collegeId,
        parent_college_id: collegeConstant.BAY_STATE.collegeId,
        status_code:
          thirdPartyResponse && thirdPartyResponse.status
            ? thirdPartyResponse.status
            : "",
        result:
          thirdPartyResponse && thirdPartyResponse.statusText
            ? thirdPartyResponse.statusText
            : "",
        source: integrationConstant.INTEGRATION_TYPE.INDIVIDUAL,
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
        attributes: JSON.stringify(data),
        response: "",
        status: "failure",
      };
      await insertIntoLogEntry(body);
      console.error(err);
      return reject(error);
    }
  });
};

const postUniversityIntegration = (
  studentId,
  collegeId,
  data,
  parentId,
  excelId,
  uuid,
  mappedDegree,
  collegeData
) => {
  return new Promise(async function (resolve, reject) {
    const userData = {
      ProgramId: mappedDegree,
      FirstName: data.firstName ? data.firstName : "",
      LastName: data.lastName ? data.lastName : "",
      Email: data.email ? data.email : "",
      Phone: data.phone ? `${data.phone.replace(/[^\d]/g, "")}` : config.POST_DEFAULT_PHONE,
      PostalCode: data.zip ? data.zip : "",
      State: data.state && data.state.toLowerCase() !== "online" ? data.state : "TX",
      MilitaryStatus: data.militaryStatus ? data.militaryStatus : "",
      MilitaryBranch: data.militaryBranch ? data.militaryBranch : "",
      MilitaryRank: data.militaryRank ? data.militaryRank : "",
      Mos: data.mos ? data.mos : "",
      ...collegeConstant.POST.additionalParameters
    };

    try {
      const thirdPartyResponse = await axios({
        method: "post",
        url: integrationConstant.POST_UNIVERSITY_URL,
        data: userData,
      });
      const formattedResponseBody = {
        uuid: studentId,
        college_id: collegeId,
        parent_college_id: collegeConstant.POST.collegeId,
        status_code:
          thirdPartyResponse && thirdPartyResponse.status
            ? thirdPartyResponse.status
            : "",
        result:
          thirdPartyResponse && thirdPartyResponse.statusText
            ? thirdPartyResponse.statusText
            : "",
        source: integrationConstant.INTEGRATION_TYPE.INDIVIDUAL,
      };

      await saveThirdPartyResponse(formattedResponseBody)
      const logBody = {
        log_uuid: uuid,
        student_id: studentId,
        college_id: collegeId,
        stage: integrationConstant.INTEGRATION_STAGE,
        message: integrationConstant.AFTER_INTEGRATION,
        attributes: JSON.stringify(userData),
        response: JSON.stringify(thirdPartyResponse && thirdPartyResponse.data),
        status: integrationConstant.STATUS_SUCCESS,
      };
      const returnData = await insertIntoLogEntry(logBody);
      return resolve(returnData);
    } catch (error) {
      error.status = 503;
      const body = {
        log_uuid: uuid,
        student_id: studentId,
        college_id: collegeId,
        stage: integrationConstant.INTEGRATION_STAGE,
        message: JSON.stringify(error),
        attributes: JSON.stringify(data),
        response: "",
        status: "failure",
      };
      await insertIntoLogEntry(body);
      return reject(error);
    }
  });
};

const getTerm = () => {
  const currentDate = new Date().toISOString();
  const endOfSummer2022 = new Date("09 August 2022").toISOString();

  const endOfFall2022 = new Date("11 December 2022").toISOString();

  const endOfSpring2023 = new Date("28 April 2023").toISOString();

  const endOfSummer2023 = new Date("6 August 2023").toISOString();

  if (currentDate < endOfSummer2022) {
    return "a0k4T0000000oIi";
  } else if (currentDate > endOfSummer2022 && currentDate < endOfFall2022) {
    return "a0k4T0000000oIrQAI";
  } else if (currentDate > endOfFall2022 && currentDate < endOfSpring2023) {
    return "a0k4T0000000oIaQAI";
  } else if (currentDate > endOfSpring2023 && currentDate < endOfSummer2023) {
    return "a0k4T0000000oIjQAI";
  } else {
    return "";
  }
};

// Academic level for Golden gate
const getGolgenGateAcademicLevel = (level) => {
  const academicLevel =
    level == levelConstant.BACHELOR ||
    level == levelConstant.ASSOCIATE ||
    level == levelConstant.CERTIFICATE
      ? "UG"
      : "GR";

  return academicLevel;
};

// Veteran active duty for Fort Hays
const getVeteranActiveDuty = (militaryStatus) => {
  if (
    militaryStatus.toLowerCase() == "active" ||
    militaryStatus.toLowerCase() == "veteran"
  ) {
    return "Yes, Active or Veteran";
  } else if (
    militaryStatus.toLowerCase() == "dependent" ||
    militaryStatus.toLowerCase() == "spouse"
  ) {
    return "Yes, Spouse or Dependent";
  } else {
    return "No";
  }
};

// Cincinnati military affiliation
const getCincinnatiMilitaryAffiliation = (militaryStatus, militaryBranch) => {
  if(!militaryStatus) return "Not Affiliated";
  switch (militaryStatus.toLowerCase()) {
    case 'active':
      return getMilitaryBranchForCincinnati(militaryBranch);

    case 'guard':
      return 'Reserve/National Guard';

    case 'reserve':
      return 'Reserve/National Guard';

    case 'retired':
      return 'Veteran';

    case 'veteran':
      return 'Veteran';

    case 'spouse':
      return 'Spouse';

    case 'dependent':
      return 'Dependent';

    case 'veteran':
      return 'Veteran';

    default:
      return "Not Affiliated";
  }
}

const getMilitaryBranchForCincinnati = (militaryBranch) => {
  if(!militaryBranch) return "Not Affiliated";
  switch (militaryBranch.toLowerCase()) {
    case 'army':
      return 'Army'

    case 'navy':
      return 'Navy';

    case 'coast guard':
      return 'Coast Guard';

    case 'marine corps':
      return 'Marines';

    case 'air force':
      return 'Air Force';

    case 'space force':
      return 'Air Force';

    default:
      return 'Not Affiliated';
  }
}

const goldenGateAPIPost = (
  studentId,
  collegeId,
  data,
  academicLevel,
  degreeInfo,
  uuid
) => {
  return new Promise(async function (resolve, reject) {
    const userData = {
      firstname: data.firstName ? data.firstName : "",
      lastname: data.lastName ? data.lastName : "",
      emailaddress1: data.email ? data.email : "",
      mobile: data.phone ? `${data.phone.replace(/[^\d]/g, "")}` : "",
      ggu_phone: "",
      ggu_gguzipcode: data.zip ? `${data.zip}` : "",
      academiclevel: academicLevel,
      ggu_programtype: degreeInfo.programType,
      ggu_AreaofInterest: degreeInfo.areaOfInterest,
      programofinterest: degreeInfo.academicProgram,
      inquiry_date: new Date().toLocaleString().split(",")[0],
      ...collegeConstant.GOLDENGATE.additionalParameters.constantParameters,
    };
    try {
      const thirdPartyResponse = await axios({
        method: "post",
        url: integrationConstant.GOLDENGATE_POST_URL,
        data: userData,
      });

      const result = thirdPartyResponse.data;

      const formattedResponseBody = {
        uuid: studentId,
        college_id: collegeId,
        parent_college_id: collegeConstant.GOLDENGATE.collegeId,
        result: result.success,
        source: integrationConstant.INTEGRATION_TYPE.INDIVIDUAL,
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

const snhuSparkroomAPI = async (studentId, collegeId, userData, uuid) => {
  //console.log("GG:",userData);
  try {
    const thirdPartyResponse = await axios({
      method: "post",
      url: integrationConstant.WILEY_POST_URL,
      data: qs.stringify(userData),
    }).catch((error) => console.error(error));

    const xmldata = thirdPartyResponse.data;
    const result = JSON.parse(
      convert.xml2json(xmldata, {
        compact: true,
        spaces: 2,
      })
    );

    const formattedResponseBody = {
      uuid: studentId,
      college_id: collegeId,
      parent_college_id: collegeConstant.SNHU.collegeId,
      status_code: result.SPARKROOM_RESPONSE.STATUS_CODE._text,
      message: result.SPARKROOM_RESPONSE.MESSAGE._text,
      result: result.SPARKROOM_RESPONSE.RESULT._text,
      source: integrationConstant.INTEGRATION_TYPE.INDIVIDUAL,
    };

    await saveThirdPartyResponse(formattedResponseBody).catch((error) =>
      console.error(error)
    );

    const iBody = {
      log_uuid: uuid,
      student_id: studentId,
      college_id: collegeId,
      stage: integrationConstant.INTEGRATION_STAGE,
      message: integrationConstant.AFTER_INTEGRATION,
      attributes: JSON.stringify(userData),
      response: JSON.stringify(result),
      status: integrationConstant.STATUS_SUCCESS,
    };
    return await insertIntoLogEntry(iBody);
  } catch (err) {
    console.error(err);
    if (err) {
      var error = err;
      error.status = 503;
      const body = {
        log_uuid: uuid,
        student_id: studentId,
        college_id: collegeId,
        stage: integrationConstant.INTEGRATION_STAGE,
        message: JSON.stringify(error),
        attributes: "",
        response: "",
        status: integrationConstant.STATUS_FAILURE,
      };
      await insertIntoLogEntry(body);
      throw new Error(error);
    }
  }
};

module.exports = { otherIntegration };
