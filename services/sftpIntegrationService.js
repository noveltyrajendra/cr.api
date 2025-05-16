const json2csv = require("json2csv").parse;
const googleDrive = require("../googledrive.js");
const Client = require("ssh2-sftp-client");
const fs = require("fs");

const sftp = new Client();

const {
  integrationConstant,
  collegeConstant,
} = require("../constants/integrationConstants");
const {
  insertIntoLogEntry,
  checkIfVeteranExists,
  saveThirdPartyResponse,
  updateGoogleSheetWithFailureReason,
} = require("../utils/integrationUtils");

const sftpIntegration = (collegeId, data, phone, studentId, uuid, excelId) => {
  return new Promise(async (resolve, reject) => {
    // Check if college is parent or degree specific

    const checkQueryResult = await checkIfVeteranExists(studentId, collegeId, integrationConstant.INTEGRATION_TYPE.SFTP);
    if (checkQueryResult && checkQueryResult.length) {
      const iBody = {
        log_uuid: uuid,
        student_id: studentId,
        college_id: collegeId,
        stage: integrationConstant.SFTP_STAGE,
        message: integrationConstant.DUPLICATE_MESSAGE,
        attributes: JSON.stringify(data),
        response: "",
        status: integrationConstant.STATUS_SUCCESS,
      };
      await insertIntoLogEntry(iBody);
      return resolve(integrationConstant.DUPLICATE_MESSAGE);
    }

    const sftpCollegeData = Object.values(collegeConstant).find(
      (college) => college.collegeId == collegeId
    );

        // Check if phone is required and validate
        if (sftpCollegeData.requiredParameters.length) {
          let message = "";
          if (
            sftpCollegeData.requiredParameters.includes("phone") &&
            !stringUtil.checkPhoneNumber(data.phone + "") &&
            sftpCollegeData.requiredParameters.includes("zip") &&
            !stringUtil.checkZipcode(data.zip)
          ) {
            message = integrationConstant.NO_PHONE_ZIP_MESSAGE;
          } else if (
            sftpCollegeData.requiredParameters.includes("phone") &&
            !stringUtil.checkPhoneNumber(data.phone + "")
          ) {
            message = integrationConstant.NO_PHONE_MESSAGE;
          } else if (
            sftpCollegeData.requiredParameters.includes("zip") &&
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
        }

    /*if (collegeId == collegeConstant.POST.collegeId) {
      fs.stat("csv/post-university-veterans.csv", async function (err, stat) {
        if (err == null) {
          const logBody = {
            log_uuid: uuid,
            student_id: studentId,
            college_id: collegeId,
            stage: integrationConstant.SFTP_STAGE,
            message: "Before posting to SFTP server",
            attributes: JSON.stringify(data),
            response: "",
            status: integrationConstant.STATUS_SUCCESS,
          };

          await insertIntoLogEntry(logBody).catch((error) =>
            console.error(error)
          );
          //write the actual data and end with newline
          //var csv = json2csv(toCsv) + newLine;
          rows = json2csv(data, { header: false });
          // Append file function can create new file too.
          fs.appendFileSync("csv/post-university-veterans.csv", rows);
          // Always add new line if file already exists.
          fs.appendFileSync("csv/post-university-veterans.csv", "\r\n");
          googleDrive.updateGDriveDataToCsv();
          if (phone) {
            let currentTimestamp = Date.now();
            let rowsWithHeader = json2csv(data, { header: true });
            fs.writeFileSync(
              `csv/post-university-veterans_${currentTimestamp}.csv`,
              rowsWithHeader
            );
            const config = {
              ...sftpCollegeData.additionalParameters,
            };
            // Create new file for each new user
            await sftp.connect(config).catch((err) => {
              console.error(err.message);
            });

            const result = await sftp
              .fastPut(
                `csv/post-university-veterans_${currentTimestamp}.csv`,
                `/Recon/post-university-veterans_${currentTimestamp}.csv`
              )
              .catch((err) => {
                console.error(err.message);
              });

            sftp.end();

            const formattedResponseBody = {
              uuid: studentId,
              college_id: collegeId,
              parent_college_id: collegeId,
              result: "",
            };

            await saveThirdPartyResponse(formattedResponseBody).catch((error) =>
              console.error(error)
            );

            const iBody = {
              log_uuid: uuid,
              student_id: studentId,
              college_id: collegeId,
              stage: integrationConstant.SFTP_STAGE,
              message: "After posting to SFTP server",
              attributes: JSON.stringify(data),
              response: JSON.stringify(result),
              status: integrationConstant.STATUS_SUCCESS,
            };
            return resolve(
              await insertIntoLogEntry(iBody).catch((error) =>
                console.error(error)
              )
            );
          }
        } else {
          console.log("File doesnot exist");
        }
      });
    } else*/ if (collegeId == collegeConstant.FAYATTEVILLE.collegeId && collegeConstant.FAYATTEVILLE.status) {
      let currentTimestamp = Date.now();
      let rowsWithHeader = json2csv(data, { header: true });
      fs.writeFileSync(
        `csv/fayetteville-state-veterans_${currentTimestamp}.csv`,
        rowsWithHeader
      );

      const config = {
        ...collegeConstant.FAYATTEVILLE.additionalParameters,
        privateKey: fs.readFileSync("/home/novelty/.ssh/id_rsa"),
      };

      sftp
        .connect(config)
        .then(async () => {
          await sftp.fastPut(
            `csv/fayetteville-state-veterans_${currentTimestamp}.csv`,
            `/home/fsuuser/FilestoAP/fayetteville-state-veterans_${currentTimestamp}.csv`
          );
          //console.log("SFTP file uploaded:")
          sftp.end();
        })
        .catch((err) => {
          console.error(err.message);
        });

      const formattedResponseBody = {
        uuid: studentId,
        college_id: collegeId,
        parent_college_id: collegeId,
        result: "",
      };

      await saveThirdPartyResponse(formattedResponseBody).catch((error) =>
        console.error(error)
      );

      const iBody = {
        log_uuid: uuid,
        student_id: studentId,
        college_id: collegeId,
        stage: integrationConstant.SFTP_STAGE,
        message: "After posting to SFTP server",
        attributes: JSON.stringify(data),
        response: "",
        status: integrationConstant.STATUS_SUCCESS,
      };
      resolve(
        await insertIntoLogEntry(iBody).catch((error) => console.error(error))
      );
    } else if(collegeId == collegeConstant.KENT_STATE.collegeId) {
      try {
        //const { JST, ["Date Created"]: dateCreated, ...veteranMappedData } = data
        data.forEach(vetdata => {
          delete vetdata['JST']
          delete vetdata["Date Created"]
        });
       
        const currentTimestamp = Date.now();
        const rowsWithHeader = json2csv(data, { header: true });
        fs.writeFileSync(
          `csv/kent-state-veterans_${currentTimestamp}.csv`,
          rowsWithHeader
        );
 
        const config = {
          ...collegeConstant.KENT_STATE.additionalParameters,
          privateKey: fs.readFileSync("/home/novelty/.ssh/id_rsa"),
        };
        await sftp.connect(config);
        await sftp.fastPut(
          `csv/kent-state-veterans_${currentTimestamp}.csv`,
          `/incoming/collegerecon/kent-state-veterans_${currentTimestamp}.csv`
        );
        sftp.end();
        const iBody = {
          log_uuid: uuid,
          student_id: studentId,
          college_id: collegeId,
          stage: integrationConstant.SFTP_STAGE,
          message: "After posting to SFTP server",
          attributes: JSON.stringify(data),
          response: "",
          status: integrationConstant.STATUS_SUCCESS,
        };
        resolve(
          await insertIntoLogEntry(iBody)
        );
      } catch (error) {
        const body = {
          log_uuid: uuid,
          student_id: studentId,
          college_id: collegeId,
          stage: integrationConstant.SFTP_STAGE,
          message: "After posting to SFTP server",
          attributes: JSON.stringify(error),
          response: "",
          status: integrationConstant.STATUS_FAILURE,
        };
        resolve(await insertIntoLogEntry(body))
      }
    } else if(+collegeId === collegeConstant.PNW.collegeId) {
      try {
        const currentTimestamp = Date.now();
        const rowsWithHeader = json2csv(data, { header: true });
        fs.writeFileSync(
          `csv/pnw-veterans_${currentTimestamp}.csv`,
          rowsWithHeader
        );
        
        const config = {
          ...collegeConstant.PNW.additionalParameters,
          privateKey: fs.readFileSync("/home/novelty/.ssh/id_rsa"),
        };
        await sftp.connect(config);
        await sftp.fastPut(
          `csv/pnw-veterans_${currentTimestamp}.csv`,
          `/incoming/collegerecon/pnw-veterans_${currentTimestamp}.csv`
        );
        sftp.end();
        const iBody = {
          log_uuid: uuid,
          student_id: studentId,
          college_id: collegeId,
          stage: integrationConstant.SFTP_STAGE,
          message: "After posting to SFTP server",
          attributes: JSON.stringify(data),
          response: "",
          status: integrationConstant.STATUS_SUCCESS,
        }
        resolve(await insertIntoLogEntry(iBody));
      } catch (error) {
        return reject(error);
      }
    } else if(+collegeId === collegeConstant.EMBRYRIDDLE.collegeId && collegeConstant.EMBRYRIDDLE.status) {
      try {
        const currentTimestamp = Date.now();
        const rowsWithHeader = json2csv(data, { header: true });
        fs.writeFileSync(
          `csv/embryriddle-veterans_${currentTimestamp}.csv`,
          rowsWithHeader
        );
        
        const config = {
          ...collegeConstant.EMBRYRIDDLE.additionalParameters,
        };
        await sftp.connect(config);
        await sftp.fastPut(
          `csv/embryriddle-veterans_${currentTimestamp}.csv`,
          `/Embry-Riddle/embryriddle-veterans_${currentTimestamp}.csv`
        );
        sftp.end();
        const iBody = {
          log_uuid: uuid,
          student_id: studentId,
          college_id: collegeId,
          stage: integrationConstant.SFTP_STAGE,
          message: "After posting to SFTP server",
          attributes: JSON.stringify(data),
          response: "",
          status: integrationConstant.STATUS_SUCCESS,
        }
        resolve(await insertIntoLogEntry(iBody));
      } catch (error) {
        return reject(error);
      }
    } else if(+collegeId === collegeConstant.ARKANSAS_STATE.collegeId && collegeConstant.ARKANSAS_STATE.status) {
      try {
        const currentTimestamp = Date.now();
        const rowsWithHeader = json2csv(data, { header: true });
        fs.writeFileSync(
          `csv/arkansas-state-veterans_${currentTimestamp}.csv`,
          rowsWithHeader
        );
        
        const config = {
          ...collegeConstant.ARKANSAS_STATE.additionalParameters,
        };
        await sftp.connect(config);
        await sftp.fastPut(
          `csv/arkansas-state-veterans_${currentTimestamp}.csv`,
          `/ArkansasStateUniversity/arkansas-state-veterans_${currentTimestamp}.csv`
        );
        sftp.end();
        const iBody = {
          log_uuid: uuid,
          student_id: studentId,
          college_id: collegeId,
          stage: integrationConstant.SFTP_STAGE,
          message: "After posting to SFTP server",
          attributes: JSON.stringify(data),
          response: "",
          status: integrationConstant.STATUS_SUCCESS,
        }
        resolve(await insertIntoLogEntry(iBody));
      } catch (error) {
        return reject(error);
      }
    } else {
      resolve("success");
    }
  });
};

module.exports = { sftpIntegration };
