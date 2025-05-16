const { DB_TABLE } = require('../constants/table-constant');
const { hybridDecrypt, hybridEncrypt } = require('../helpers/crypto-helper');
const { findOne, preparedCreate, query } = require('../helpers/mysql-helper');
const {
  mapDataToTableField,
  checkRequiredParameters,
} = require('../utils/commonUtils');
const { STUDENT_MAP, STUDENT_PROFILE_MAP } = require('../mapper');
const {
  STUDENT_SAVE,
  STUDENT_PROFILE_SAVE,
} = require('../constants/authenicateConstant');
const { UID } = require('../utils/stringUtil');
const { getCurrentDateInFormat } = require('../utils/momentUtility');
const { YMDT } = require('../constants/date-time-constant');
const { INFORMATION_EMAIL } = require('../constants/emailConstant');
const { addUser } = require('../services/constantContactService');
const {
  SSO_LOGIN_LOG,
  TYPE_ETS,
  REQUIRED_PARAMETERS,
  SPECIFIC_BB_BUCKETS,
  REGISTER_SOURCE,
  PRIMARY_SOURCE,
  SECONDARY_SOURCE,
} = require('../constants/sso-constant');
const { errorWithCode } = require('../utils/errorHandler');
const { DOMAIN_URL, NODE_ENV } = require('../config');
const { sendEmail } = require('./emailService');
const { basicReplyEmailTemplate } = require('../utils/messageEmail');
const {
  getBounceBackAdvertise,
  sendNewUserBounceBackEmail,
  getNewRegisteredMatchCollege,
  sendBackBucketDataEmailToNewUser,
} = require('./collegeService');
const { getMatchedCollegeList } = require('./studentService')

const validateToken = async ({ token }) => {
  try {
    const decryptedString = hybridDecrypt(token);
    const decryptedData = JSON.parse(decryptedString);
    const { isValid, fields } = checkRequiredParameters(
      decryptedData,
      REQUIRED_PARAMETERS
    );
    if (!isValid)
      throw errorWithCode(
        `Required parameters (${fields.join(',')}) are not provided`,
        400
      );
    const { clientId, secretKey } = decryptedData;
    const isTokenValid = await findOne(
      DB_TABLE.SSO_CLIENT,
      {
        client_id: clientId,
        secret_key: secretKey,
      },
      ['client_id']
    );
    // verify secretKey
    if (!isTokenValid || !isTokenValid.length)
      throw errorWithCode('Invalid Client!', 401);
    const userExists = await findOne(
      DB_TABLE.STUDENT,
      {
        email: decryptedData.email,
        user_account_status: 'ACTIVE',
      },
      [
        'id',
        'uuid',
        'email',
        'first_name as firstName',
        'last_name as lastName',
      ]
    );
    if (!userExists || !userExists.length) {
      return createSsoUser(decryptedData);
    } else {
      const ssoLog = {
        student_id: userExists[0].id,
        created_at: getCurrentDateInFormat(),
        type: TYPE_ETS,
      };
      await preparedCreate(SSO_LOGIN_LOG, ssoLog);
      return formattedOutput(userExists[0], {}, 'get');
    }
  } catch (error) {
    throw errorWithCode(
      error.message,
      error.statusCode ? error.statusCode : null
    );
  }
};

const createSsoUser = async (userData) => {
  try {
    const remappedUserData = mapSsoData(userData);
    const student = mapDataToTableField(remappedUserData, STUDENT_MAP);
    const { insertId: studentId } = await preparedCreate(STUDENT_SAVE, student);
    const studentProfile = mapDataToTableField(
      { ...remappedUserData, studentId },
      STUDENT_PROFILE_MAP
    );
    const ssoLog = {
      student_id: studentId,
      created_at: getCurrentDateInFormat(),
      type: TYPE_ETS,
    };
    const promises = [
      preparedCreate(STUDENT_PROFILE_SAVE, studentProfile),
      preparedCreate(SSO_LOGIN_LOG, ssoLog),
    ];
    if (NODE_ENV === 'production') {
      const constantContact = {
        addresses: [
          {
            address_type: 'BUSINESS',
            postal_code: userData.zipCode,
          },
        ],
        lists: [
          {
            id: '2110708446',
          },
        ],
        email_addresses: [
          {
            email_address: userData.email,
          },
        ],
        first_name: userData.firstName,
        last_name: userData.lastName,
        created_date: getCurrentDateInFormat(),
      };
      try {
        await addUser(constantContact);
      } catch (error) {
        console.log(error);
      }
    }
    await Promise.all(promises);
    // NOTICE: Remove or add comment to below function to send or unsend bouncebackemail.
    try {
      await sendBounceBackEmail(userData, student);
    } catch (error) {
      console.log(error);
    }
    return formattedOutput(student, getAdditionalData(userData), 'create');
  } catch (error) {
    throw errorWithCode(`There was an error`, 500);
  }
};

const mapSsoData = (userData) => {
  const {
    educationGoal,
    areaOfStudy,
    areaOfFocus,
    branchService,
    ...filteredData
  } = userData;
  return {
    ...filteredData,
    uuid: UID(),
    dateCreated: getCurrentDateInFormat(YMDT),
    levelId: Array.isArray(educationGoal)
      ? educationGoal.join(',')
      : educationGoal,
    bucketId: Array.isArray(areaOfStudy) ? areaOfStudy.join(',') : areaOfStudy,
    secondaryBucketId: Array.isArray(areaOfFocus)
      ? areaOfFocus.join(',')
      : areaOfFocus,
    militaryBranch: branchService,
    registerSource: REGISTER_SOURCE,
    primarySource: PRIMARY_SOURCE,
    secondarySource: SECONDARY_SOURCE,
    termsOfComm: 'N',
  };
};

const formattedOutput = (userBody, additionalData = {}, type) => {
  return {
    ...additionalData,
    uuid: userBody.uuid,
    firstName: userBody.first_name ? userBody.first_name : userBody.firstName,
    lastName: userBody.last_name ? userBody.last_name : userBody.lastName,
    email: userBody.email,
    type,
  };
};

const getAdditionalData = (userData) => {
  return {
    searchData: {
      education_goal: userData.educationGoal,
      area_focus_length: userData.areaOfFocus.length,
      college_id: 0,
      state: userData.state,
      bucket_id: userData.areaOfStudy,
      website: 'app',
      area_focus_ids: Array.isArray(userData.areaOfFocus)
        ? userData.areaOfFocus.join(',')
        : userData.areaOfFocus,
      military_status: userData.militaryStatus,
    },
  };
};

const sendBounceBackEmail = async (decryptedData, studentData) => {
  const emailTemplate = await getEmailTemplate(decryptedData, studentData.uuid);
  const from = `Collegerecon <${INFORMATION_EMAIL}>`;
  const to = [decryptedData.email];
  const subject = `${decryptedData.firstName}, here are your matched schools from Collegerecon.`;
  const messageContent = basicReplyEmailTemplate(emailTemplate);
  return sendEmail(from, to, subject, messageContent);
};

const getEmailTemplate = async (decryptedData, uuid) => {
  try {
    const {
      firstName,
      email,
      educationGoal,
      areaOfFocus,
      state,
      areaOfStudy,
      militaryStatus,
    } = decryptedData;
    const bounceBackBody = {
      education_goal: educationGoal,
      area_focus_length: areaOfFocus.length,
      college_id: 0,
      state,
      bucket_id: areaOfStudy,
      website: 'app',
      area_focus_ids: areaOfFocus.join(','),
      military_status: militaryStatus,
    };
    const [
      advertismentData,
      secondaryBucket,
      level,
      primaryBucket,
      bouncebackData,
    ] = await Promise.all([
      getBounceBackAdvertise(state),
      query(
        `SELECT title from ${
          DB_TABLE.SECONDARY_BUCKET_LIST
        } WHERE id IN (${areaOfFocus.join(',')})`
      ),
      findOne(DB_TABLE.LEVEL, { id: educationGoal }, ['title']),
      findOne(
        DB_TABLE.BUCKET_LIST,
        {
          id: areaOfStudy,
        },
        ['title']
      ),
      getNewRegisteredMatchCollege(bounceBackBody),
    ]);
    const secondaryBucketData = {
      areaOfFocus: secondaryBucket.map((sb) => sb.title),
    };
    const bounceBackEmailContent = [
      email,
      firstName,
      uuid,
      state,
      level.map((l) => l.title).join(','),
      primaryBucket.map((pb) => pb.title).join(','),
      secondaryBucketData,
      bouncebackData,
      'register',
    ];
    const specificBounceBack = SPECIFIC_BB_BUCKETS.includes(areaOfStudy);
    if (specificBounceBack) {
      const specificBounceBackEmailContent = [
        bounceBackBody,
        email,
        firstName,
        uuid,
        primaryBucket.map((pb) => pb.title).join(','),
        secondaryBucket.map((sb) => sb.title).join(','),
      ];
      await sendBackBucketDataEmailToNewUser(specificBounceBackEmailContent);
    }
    return sendNewUserBounceBackEmail(advertismentData, bounceBackEmailContent);
  } catch (error) {
    throw errorWithCode(`There was an error`, 500);
  }
};

const fetchMatchedSchools = async(email) => {
  if(!email) errorWithCode(`Email is required`, 400);
  const student = await findOne(DB_TABLE.STUDENT, { email }, ['uuid']);
  if(!student || !student.length) throw errorWithCode(`Student with ${email} not found`, 400);
  const uuid = student[0].uuid;
  studentData = await getMatchedCollegeList(uuid);
  const schoolLists ={
    "studentId": student[0].uuid,
    "matchedSchools": studentData
  }
  return schoolLists;
};

module.exports = {
  validateToken,
  fetchMatchedSchools,
};
