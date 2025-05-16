const { GoogleSpreadsheet } = require("google-spreadsheet");
const creds = require("../google-generated-creds.json");

const { integrationConstant, collegeConstant } = require("../constants/integrationConstants");
const googleSheetConstant = require("../constants/googleSheetConstant.js");
const mysqlService = require("../services/mysqlService");
let requestlogger = require("../utils/requestInfoLog");

const checkIfVeteranExists = async (studentId, collegeId, source) => {
  try {
    const checkVeteranExists = await mysqlService.query(
      integrationConstant.CHECK_VETERAN_ALREADY_EXISTS,
      [studentId, collegeId, source]
    );
    return checkVeteranExists;
  } catch (error) {
    console.error(error);
    throw new Error(error);
  }
};

const getDegreeWithReferenceCode = async (
  primaryBucketId,
  secondaryBucketId,
  level,
  collegeId
) => {
  try {
    const mappedDegree = await mysqlService.query(
      `SELECT reference_code as degreename FROM cr_bucket_degree_list as crl LEFT JOIN college_degree_mapping as mm ON crl.id=mm.bucket_degree_id WHERE crl.bucket_id IN (${primaryBucketId}) and crl.secondary_bucket_id IN (${secondaryBucketId}) and mm.level_type IN (${level}) and mm.college_id = ${collegeId}`
    );
    if (mappedDegree.length && mappedDegree[0].degreename) {
      return mappedDegree[0].degreename;
    } else {
      return mappedDegree[0];
    }
  } catch (error) {
    console.error(error);
    throw new Error(error);
  }
};

const getDegreeWithoutReferenceCode = async (
  primaryBucketId,
  secondaryBucketId,
  level,
  collegeId
) => {
  try {
    // const mappedDegree = await mysqlService.query(
    //   integrationConstant.MAPPED_DEGREE_WITHOUT_REFERENCE,
    //   [primaryBucketId, secondaryBucketId, level, collegeId]
    // );
    const mappedDegree = await mysqlService.query(
      `SELECT program_name as degreename FROM cr_bucket_degree_list as crl LEFT JOIN college_degree_mapping as mm ON crl.id=mm.bucket_degree_id WHERE crl.bucket_id IN (${primaryBucketId}) and crl.secondary_bucket_id IN (${secondaryBucketId}) and mm.level_type IN (${level}) and mm.college_id = ${collegeId}`
    );
    if (mappedDegree.length && mappedDegree[0].degreename) {
      return mappedDegree[0].degreename;
    } else {
      return mappedDegree[0];
    }
  } catch (error) {
    console.error(error);
    throw new Error(error);
  }
};

const updateGoogleSheetWithFailureReason = async (failureData) => {
  try {
    //console.log("ExcelId:",failureData.google_sheet_id);
    requestlogger.log(
      "info",
      "API failure for Student Id:" +
        failureData.student_id +
        " and college Id:" +
        failureData.college_id +
        " Parent Id:" +
        failureData.parent_id +
        " Reason:" +
        failureData.reason
    );
    let upNo = -1;
    setTimeout(async function(){
      const doc = new GoogleSpreadsheet(failureData.google_sheet_id);
      await doc.useServiceAccountAuth(creds);
      await doc.loadInfo();
      const update1 = doc.sheetsByIndex[0];
      const rows = await update1.getRows();
      
      for (let j = 0; j < rows.length; j++) {
        if (rows[j].Email == failureData.email) {
          upNo = j;
        }
      }
      if (upNo != -1) {
        rows[upNo].Reason = failureData.reason;
        await rows[upNo].save();
      }
    }, 1000);
    await mysqlService.query("INSERT INTO api_failure SET ?", failureData);
    return "success";
  } catch (err) {
    console.error(err);
  }
};

const getExcelId = (collegeId, specificId, parentId) => {
  if (specificId == 0) {
    return googleSheetConstant.parentCollegesWithExcelIdConstant.find(
      (x) => x.cid == collegeId
    );
  } else if (specificId > 0) {
    // Georgetown MSB
    if (collegeId == collegeConstant.GEORGETOWN_MSB.collegeId) {
      return googleSheetConstant.specificCollegesWithExcelIdConstant.find(
        (x) => x.cid == collegeId
      );
    } else if (
      googleSheetConstant.specificCollegesWithExcelIdConstant.find(
        (x) => x.cid == parentId
      )
    ) {
      return googleSheetConstant.specificCollegesWithExcelIdConstant.find(
        (x) => x.cid == parentId
      );
    } else {
      return googleSheetConstant.parentCollegesWithExcelIdConstant.find(
        (x) => x.cid == parentId
      );
    }
  }
};

const insertIntoLogEntry = async (body) => {
  return new Promise(async function (resolve, reject) {
    try {
      await mysqlService.query(integrationConstant.INSERT_INTO_LOG_ENTRY, body);
      resolve("success");
    } catch (err) {
      console.log("error", err);
      return reject(new Error(err));
    }
  });
};

const saveThirdPartyResponse = async (body) => {
  return new Promise(async function (resolve, reject) {
    try {
      await mysqlService.query(
        integrationConstant.INSERT_THIRD_PARTY_RESPONSE,
        body
      );
      resolve("success");
    } catch (error) {
      console.log("error", error);
      return reject(new Error(error));
    }
  });
};

const getDegreeSpecificBuckets = async (collegeId) => {
  try {
    const bucketData = await mysqlService.query(
      integrationConstant.SEPCIFIC_DEGREE_BUCKET_DATA,
      collegeId
    );
    return bucketData[0];
  } catch (error) {
    console.log("error", error);
    return reject(new Error(error));
  }
};

const removeEmptyValuesFromObject = (object) => {
  let tempObject = { ...object };
  for (var propName in tempObject) {
    if (!tempObject[propName]) {
      delete tempObject[propName];
    }
  }

  return tempObject;
};

const filterIntegrationCollegeConstant = (
  object,
  field,
  value,
  returnValue
) => {
  const filteredArray = Object.values(object)
    .filter((college) => college[field].includes(value))
    .map((filteredCollege) => filteredCollege[returnValue]);

  return filteredArray;

  // Use if multiple value is needed
  // const returnValues = {}
  // returnValue.map(returnField => {
  //   returnValues = {...returnValues,  returnField: filteredCollege[returnField] }
  // })
};

const getGoldenGateDegree = async (
  primaryBucket,
  secondaryBucket,
  academicLevel
) => {
  try {
    const degreeQuery = `SELECT area_of_interest as areaOfInterest, academic_program as academicProgram, program_type as programType FROM cr_bucket_degree_list as crl LEFT JOIN goldengate_degree_map as ggu ON crl.id = ggu.bucket_id WHERE crl.bucket_id IN (${primaryBucket}) AND crl.secondary_bucket_id IN (${secondaryBucket}) AND ggu.academic_level = '${academicLevel}'`;

    const goldenGateDegress = await mysqlService.query(degreeQuery);
    return goldenGateDegress[0];
  } catch (error) {
    console.error(error);
    throw new Error(error);
  }
};

const getBucketNames = async (primaryId, secondaryId) => {
  try {
    const degreeNames = await mysqlService.query(
      integrationConstant.DEGREE_NAMES,
      [primaryId, secondaryId]
    );

    return degreeNames[0];
  } catch (error) {
    console.error(error);
    throw new Error(error);
  }
};

const formatPhoneNumber = (phoneNumberString) => {
  let cleaned = ("" + phoneNumberString).replace(/\D/g, "");
  let match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return "(" + match[1] + ") " + match[2] + "-" + match[3];
  }
  return null;
};

const getEverspringDegree = async (
  primaryBucketId,
  secondaryBucketId,
  level,
  collegeId
) => {
  try {
    const mappedDegree = await mysqlService.query(
      `SELECT field_name,post_url FROM cr_bucket_degree_list as crl LEFT JOIN everspring_degree_mapping as mm ON crl.id=mm.bucket_degree_id WHERE crl.bucket_id IN (${primaryBucketId}) and crl.secondary_bucket_id IN (${secondaryBucketId}) and mm.level_type IN (${level}) and mm.college_id = ${collegeId}`
    );
    if (mappedDegree.length && mappedDegree.length > 1) {
      return mappedDegree[0];
    } else {
      return mappedDegree[0];
    }
  } catch (error) {
    console.error(error);
    throw new Error(error);
  }
};

module.exports = {
  checkIfVeteranExists,
  getDegreeWithReferenceCode,
  getDegreeWithoutReferenceCode,
  insertIntoLogEntry,
  getExcelId,
  saveThirdPartyResponse,
  updateGoogleSheetWithFailureReason,
  getDegreeSpecificBuckets,
  removeEmptyValuesFromObject,
  filterIntegrationCollegeConstant,
  getGoldenGateDegree,
  formatPhoneNumber,
  getBucketNames,
  getEverspringDegree,
};
