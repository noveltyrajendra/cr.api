const axios = require("axios");
const convert = require("xml-js");
const qs = require("qs");

const {
  checkIfVeteranExists,
  getDegreeWithReferenceCode,
  getDegreeSpecificBuckets,
  insertIntoLogEntry,
  saveThirdPartyResponse,
  updateGoogleSheetWithFailureReason,
  formatPhoneNumber,
} = require("../utils/integrationUtils");
const stringUtil = require("../utils/stringUtil");
const {
  integrationConstant,
  collegeConstant,
} = require("../constants/integrationConstants");

const { levelConstant } = require("../constants/levelConstant");

const wileyIntegration = (
  studentId,
  collegeId,
  data,
  parentId,
  excelId,
  uuid
) => {
  return new Promise(async function (resolve, reject) {
    // Check if college is parent or degree specific
    const isDegreeSpecific = parentId && collegeId != collegeConstant.GEORGETOWN_MSB.collegeId ? true : false;

    const checkQueryResult = await checkIfVeteranExists(
      studentId,
      isDegreeSpecific ? parentId : collegeId,
      integrationConstant.INTEGRATION_TYPE.WILEY
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

    // Check if user has phone number and zipcode
    if (
      !stringUtil.checkPhoneNumber(data.phone) ||
      !stringUtil.checkZipcode(data.zip)
    ) {
      let message = "";
      if (
        !stringUtil.checkPhoneNumber(data.phone) &&
        !stringUtil.checkZipcode(data.zip)
      ) {
        message = integrationConstant.NO_PHONE_ZIP_MESSAGE;
      } else if (!stringUtil.checkPhoneNumber(data.phone)) {
        message = integrationConstant.NO_PHONE_MESSAGE;
      } else {
        message = integrationConstant.NO_ZIP_MESSAGE;
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

      const failureInfo = {
        college_id: collegeId,
        parent_id: parentId,
        student_id: studentId,
        email: data.email,
        google_sheet_id: excelId,
        reason: message,
      };

      return resolve(updateGoogleSheetWithFailureReason(failureInfo));
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

    // Check if collegeId is for Georgetown MSB (degree specific for Georgetown but has its own request body)
    const isGeorgetownMSB =
      collegeId == collegeConstant.GEORGETOWN_MSB.collegeId ? true : false;

    const wileyCollegeData = Object.values(collegeConstant).find(
      (college) =>
        college.collegeId ==
        (!isDegreeSpecific || isGeorgetownMSB ? collegeId : parentId)
    );

    if (
      !wileyCollegeData.defaultDegree &&
      wileyCollegeData.levels.length &&
      !wileyCollegeData.levels.includes(data.level)
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
      message: "Level matched.",
      attributes: "",
      response: "",
      status: integrationConstant.STATUS_SUCCESS,
    };
    await insertIntoLogEntry(levelLogBody);

    let mappedDegree = await getDegreeWithReferenceCode(
      primaryBucket,
      secondaryBucket,
      level,
      wileyCollegeData.collegeId
    );

    // Check if MSU is from wiley
    if (
      wileyCollegeData.collegeId == collegeConstant.MSU.collegeId &&
      mappedDegree &&
      !mappedDegree.startsWith("M")
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

    const requestBody =
      collegeConstant.MSU.collegeId == (isDegreeSpecific ? parentId : collegeId)
        ? {
            ...getRequestBody(data, mappedDegree),
            ...wileyCollegeData.additionalParameters.wiley,
          }
        : {
            ...getRequestBody(data, mappedDegree),
            ...wileyCollegeData.additionalParameters,
          };

    const thirdPartyResponse = makeSparkroomPostRequest(
      studentId,
      collegeId,
      wileyCollegeData.collegeId,
      requestBody,
      uuid,
      isGeorgetownMSB,
    );
    return resolve(thirdPartyResponse);
  });
};

const getRequestBody = (data, degreeName) => {
  const body = {
    RFICampaignCode: "CollegeRecon",
    LP_UREFKEYWORD: "utm_term",
    LP_UREFMEDIATYPE: "utm_content",
    LP_UREFPROMOTION: "utm_campaign",
    Source: "collegerecon-military",
    FirstName: data.firstName,
    LastName: data.lastName,
    HomePhone: formatPhoneNumber(data.phone),
    Email: data.email,
    Street: data.address ? data.address : "",
    Zip: data.zip ? data.zip : "",
    City: data.city ? data.city : "",
    Program: degreeName,
    CountrySelection: "United States",
    HighestDegreeEarned: getHighestDegreeEarned(data.level),
    EmailOptOut: "No",
    DoNotCall: "No",
    OkToText: "Yes",
    InterestTimeframe: "In the next 3 months",
  };

  return body;
};

const getHighestDegreeEarned = (level) => {
  if (
    level == levelConstant.ASSOCIATE ||
    level == levelConstant.BACHELOR ||
    level == levelConstant.CERTIFICATE
  ) {
    return "High School Diploma or GED";
  } else if (
    level == levelConstant.MASTER ||
    level == levelConstant.POST_BACHELOR
  ) {
    return `Bachelor's Degree`;
  } else if (
    level == levelConstant.POST_MASTER ||
    level == levelConstant.DOCTORATE
  ) {
    return `Master's Degree`;
  }
};

const makeSparkroomPostRequest = async (
  studentId,
  originalCollgeId,
  collegeId,
  body,
  uuid,
  isGeorgetownMSB,
) => {
  const sparkroomResponse = await axios({
    method: "post",
    url: integrationConstant.WILEY_POST_URL,
    data: qs.stringify(body),
  }).catch(async (error) => {
    const body = {
      log_uuid: uuid,
      student_id: studentId,
      college_id: originalCollgeId,
      stage: integrationConstant.INTEGRATION_STAGE,
      message: JSON.stringify(error),
      attributes: JSON.stringify(userData),
      response: "",
      status: integrationConstant.STATUS_FAILURE,
    };
    await insertIntoLogEntry(body).catch((error) => console.error(error));
    console.error(error);
  });

  const xmldata = sparkroomResponse.data;

  const result = JSON.parse(
    convert.xml2json(xmldata, {
      compact: true,
      spaces: 2,
    })
  );

  const formattedResponseBody = {
    uuid: studentId,
    college_id: originalCollgeId,
    parent_college_id: isGeorgetownMSB ? originalCollgeId : collegeId,
    status_code: result.SPARKROOM_RESPONSE.STATUS_CODE._text,
    message: result.SPARKROOM_RESPONSE.MESSAGE._text,
    result: result.SPARKROOM_RESPONSE.RESULT._text,
    source: integrationConstant.INTEGRATION_TYPE.WILEY,
  };

  await saveThirdPartyResponse(formattedResponseBody).catch((error) =>
    console.error(error)
  );
  const iBody = {
    log_uuid: uuid,
    student_id: studentId,
    college_id: originalCollgeId,
    stage: integrationConstant.INTEGRATION_STAGE,
    message: integrationConstant.AFTER_INTEGRATION,
    attributes: JSON.stringify(body),
    response: JSON.stringify(result),
    status: integrationConstant.STATUS_SUCCESS,
  };
  return await insertIntoLogEntry(iBody).catch((error) => console.error(error));
};

module.exports = { wileyIntegration };
