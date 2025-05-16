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

const sparkroomIntegration = (
    studentId,
    collegeId,
    data,
    parentId,
    uuid
  ) => {
    return new Promise(async function (resolve, reject) {
      const isDegreeSpecific = parentId ? true : false;

      const checkQueryResult = await checkIfVeteranExists(
          studentId,
          isDegreeSpecific ? parentId : collegeId,
          integrationConstant.INTEGRATION_TYPE.SPARKROOM
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

      const sparkData = Object.values(collegeConstant).find(
        (college) =>
          college.collegeId == (isDegreeSpecific ? parentId : collegeId)
      );

      // Check if user has phone number and zipcode
      if (
          !(data.phone) ||
          !(data.zip)
        ) {
          let message = "";
          if (
              !(data.phone) &&
              !(data.zip)
            ) {
              message = integrationConstant.NO_PHONE_ZIP_MESSAGE;
            } else if (!(data.phone)) {
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

        let mappedDegree = sparkData.hasReferanceCode ? await getDegreeWithReferenceCode(
          primaryBucket,
          secondaryBucket,
          level,
          sparkData.collegeId
          )
        : await getDegreeWithoutReferenceCode(
            primaryBucket,
            secondaryBucket,
            level,
            sparkData.collegeId
          );

        if (!mappedDegree){
          mappedDegree = sparkData.defaultDegree;
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

        let programGroup = getProgramGroup(data.level);
        let educationLevel = getEducationLevel(data.level);
        let military = getMilitaryData(data.militaryStatus);

        const requestBody = {
          ...getRequestBody(data, mappedDegree, programGroup, educationLevel, military),
          ...sparkData.additionalParameters,
        };
        
        const thirdPartyResponse = makeSparkroomIntegration(
          studentId,
          collegeId,
          parentId,
          requestBody,
          uuid
        );
        return resolve(thirdPartyResponse);
    })
};

const getRequestBody = (data, degreeName, programGroup, educationLevel, military) => {
  const body = {
    FirstName: data.firstName,
    LastName: data.lastName,
    Email: data.email,
    Address: data.address ? data.address : "",
    City: data.city ? data.city : "",
    Zipcode: data.zip ? data.zip : "",
    Phone: data.phone,
    State: data.state ? data.state : '',
    Program: degreeName,
    EnrollTime: 2,
    ProgramGroup: programGroup,
    EducationLevel: educationLevel,
    Military: military,
    //Test: "Y",
  };

  return body;
};

const getProgramGroup = (level) => {
  switch (level) {
    case 3:
      return "Associate";
    case 5:
      return "Bachelors";
    case 7:
      return "Masters";
    case 17:
      return "Doctoral";
    case 6:
      return "Certificate";
    case 8:
      return "Certificate";
    case 18:
      return "Certificate";
    default:
      return "";
  }
};

const getEducationLevel = (level) => {
  switch (level) {
    case 3:
      return 3;
    case 5:
      return 4;
    case 7:
      return 5;
    case 17:
      return 6;
    default:
      return 0;
  }
};

const getMilitaryData = (miltaryStatus) => {
  switch (miltaryStatus) {
    case "Active Duty":
      return "Active Duty";
    case "National Guard":
      return "Guard";
    case "Reserve":
      return "Inactive Reserve";
    case "Retiree":
      return "Retired Military";
    case "Veteran":
      return "Veteran (Not Active)";
    case "Spouse":
      return "Dependent of Active Duty";
    case "Dependent":
      return "Dependent of Veteran";
    case "Other":
      return "Department of Defense";
    default:
      return "";
  }
};

const makeSparkroomIntegration = async (
  studentId,
  originalCollgeId,
  parentId,
  body,
  uuid
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
    parent_college_id: parentId,
    status_code: result.SPARKROOM_RESPONSE.STATUS_CODE._text,
    message: result.SPARKROOM_RESPONSE.MESSAGE._text,
    result: result.SPARKROOM_RESPONSE.RESULT._text,
    source: integrationConstant.INTEGRATION_TYPE.SPARKROOM,
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

module.exports = { sparkroomIntegration };