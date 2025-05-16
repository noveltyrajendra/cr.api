const { resolve } = require("path");
const { exit } = require("process");

let config = require("../config");
let mysqlService = require("./mysqlService");
let moment = require("moment");
const { GoogleSpreadsheet } = require("google-spreadsheet");
const fs = require("fs");
//const creds = JSON.parse(fs.readFileSync('google-generated-creds.json', 'utf-8'));
const creds = require("../google-generated-creds.json");
let googleSheetConstant = require("../constants/googleSheetConstant");
let json2csv = require("json2csv").parse;
var googleDrive = require("../googledrive.js");
let Client = require("ssh2-sftp-client");
var qs = require("qs");
var stringUtil = require("../utils/stringUtil");
const stateConstant = require("../constants/stateConstant");
let requestlogger = require("../utils/requestInfoLog");

const { insertIntoLogEntry } = require('../utils/integrationUtils');

const googleSheetService = (function () {
  function addVeteranGooleSheet(
    sid,
    cid,
    specificId,
    parentId,
    collegeName,
    uuid
  ) {
    return new Promise(async function (resolve, reject) {
      const nodeEnv = process.env.NODE_ENV;
      if (nodeEnv == "production") {
        const isDegreeSpecific = parentId ? true : false;
        const sendingId = isDegreeSpecific ? parentId : cid;
        const checkQuery = "select count(id) as total from google_sheet_colleges_log where parent_id=" + sendingId + " and student_id='" + sid + "'";
        await mysqlService.query(checkQuery).then(
          async function (cresponse) {
            if (cresponse[0] && cresponse[0].total == 0) {
              requestlogger.log(
                "info",
                "New Google sheet for College ID:" +
                  cid +
                  " and Student Id:" +
                  sid
              );
              const getQuery =
                "SELECT ss.first_name,ss.last_name,ss.email,DATE_FORMAT(ss.date_created, '%Y-%m-%d %H:%i:%s') as date_created, sp.address,sp.city,sp.level_id,sp.bucket_id,sp.secondary_bucket_id,sp.jst_transcript_file,sp.state,sp.dob,sp.postal_code,sp.phone_number,sp.military_status, (select branch_short_name from branches where id=sp.military_branch) as military_branch, (SELECT name from college_ranks where id=sp.military_rank) as military_rank, (SELECT title FROM levels WHERE id=sp.level_id) as degree_level, (SELECT title FROM bucket_degree WHERE id=sp.bucket_id) as primary_bucket, (SELECT GROUP_CONCAT(title) FROM bucket_secondary_degree WHERE id IN(sp.secondary_bucket_id)) as secondary_bucket FROM students as ss LEFT JOIN student_profile as sp ON ss.uuid=sp.uuid WHERE ss.user_account_status='active' and ss.uuid= '" +
                sid +
                "'";
              //console.log("QQ:",getQuery);
              mysqlService.query(getQuery).then(
                async function (response) {
                  let primaryId = "";
                  if (response[0].bucket_id && response[0].bucket_id.indexOf(",") > -1) {
                    let pData = response[0].bucket_id.split(",");
                    primaryId = pData[0];
                  } else {
                    primaryId = response[0].bucket_id;
                  }
                  let secondaryId = "";
                  if (response[0].secondary_bucket_id && response[0].secondary_bucket_id.indexOf(",") > -1) {
                    let sData = response[0].secondary_bucket_id.split(",");
                    secondaryId = sData[0];
                  } else {
                    secondaryId = response[0].secondary_bucket_id;
                  }

                  if (response) {
                    let userData = [];
                    let excelId = "";
                    if (specificId == 0) {
                      userData = [
                        response[0].first_name,
                        response[0].last_name,
                        response[0].email,
                        response[0].address,
                        response[0].city,
                        response[0].state,
                        response[0].postal_code,
                        response[0].phone_number,
                        response[0].military_status,
                        response[0].military_branch,
                        response[0].military_rank,
                        response[0].degree_level,
                        response[0].primary_bucket,
                        response[0].secondary_bucket,
                        response[0].jst_transcript_file ? "yes" : "no",
                        response[0].date_created,
                      ];
                      excelId =
                        googleSheetConstant.parentCollegesWithExcelIdConstant.find(
                          (x) => x.cid == cid
                        ).excelid;
                    } else if (specificId > 0) {
                      userData = [
                        response[0].first_name,
                        response[0].last_name,
                        response[0].email,
                        response[0].address,
                        response[0].city,
                        response[0].state,
                        response[0].postal_code,
                        response[0].phone_number,
                        response[0].military_status,
                        response[0].military_branch,
                        response[0].military_rank,
                        response[0].degree_level,
                        response[0].primary_bucket,
                        response[0].secondary_bucket,
                        response[0].jst_transcript_file ? "yes" : "no",
                        response[0].date_created,
                        collegeName,
                      ];
                      if (cid == "3623") { // Georgetown University MSB
                        excelId =
                        googleSheetConstant.specificCollegesWithExcelIdConstant.find(
                          (x) => x.cid == cid
                        ).excelid;
                      } else if (
                        googleSheetConstant.specificCollegesWithExcelIdConstant.find(
                          (x) => x.cid == parentId
                        )
                      ) {
                        excelId =
                          googleSheetConstant.specificCollegesWithExcelIdConstant.find(
                            (x) => x.cid == parentId
                          ).excelid;
                      } else {
                        excelId =
                          googleSheetConstant.parentCollegesWithExcelIdConstant.find(
                            (x) => x.cid == parentId
                          ).excelid;
                      }
                    } else {
                      return resolve("success");
                    }
                    const iBody = {
                      log_uuid: uuid,
                      student_id: sid,
                      college_id: cid,
                      stage: "google sheets",
                      message: "Before adding to google sheets",
                      attributes: JSON.stringify(userData),
                      status: "success",
                    };

                    await insertIntoLogEntry(iBody);
                    //console.log("TopExcelId:",excelId);
                    const doc = new GoogleSpreadsheet(excelId);
                    await doc.useServiceAccountAuth(creds);
                    await doc.loadInfo();
                    if (cid == "2312") { //University Of Cincinnati Online
                      //if(degreeName){
                      const sheet1 = doc.sheetsByIndex[0];
                      await sheet1.addRow(userData);
                      const sheet2 = doc.sheetsByIndex[1];
                      await sheet2.addRow(userData);
                      requestlogger.log(
                        "info",
                        "Google sheet row added for Student Id:" +
                          sid +
                          " and sheet Id:" +
                          excelId
                      );
                      /*}else{
                            return "";
                          }*/
                    } else {
                      const sheet1 = doc.sheetsByIndex[0];
                      await sheet1.addRow(userData);
                      requestlogger.log(
                        "info",
                        "Google sheet row added for Student Id:" +
                          sid +
                          " and sheet Id:" +
                          excelId
                      );
                    }
                    let googleLogData = {
                      college_id: cid,
                      student_id: sid,
                      parent_id: isDegreeSpecific ? parentId : cid,
                      date_created: moment(new Date()).format(
                        "YYYY-MM-DD HH:mm:ss"
                      ),
                    };

                    mysqlService
                      .query(
                        "INSERT INTO google_sheet_colleges_log SET ?",
                        googleLogData
                      )
                      .then(async (iresponse) => {
                        const body = {
                          log_uuid: uuid,
                          student_id: sid,
                          college_id: cid,
                          stage: "google sheets",
                          message: "After adding to google sheets",
                          attributes: JSON.stringify(userData),
                          status: "success",
                        };
                        const returnData = await insertIntoLogEntry(body);
                        return resolve(returnData);
                      });
                  } else {
                    resolve("fail");
                  }
                },
                function (err) {
                  if (err) {
                    var error = err;
                    error.status = 503;
                    // INSERT LOG
                    return reject(error);
                  }
                }
              );
            } else {
              requestlogger.log(
                "info",
                "Already Exist Google sheet for College ID:" +
                  cid +
                  " and Student Id:" +
                  sid
              );
              // INSERT LOG
              return resolve("success");
            }
          },
          function (err) {
            if (err) {
              var error = err;
              error.status = 503;
              // INSERT LOG
              return reject(error);
            }
          }
        );
      } else {
        return resolve("success");
      }
    });
  }

  return {
    addVeteranGooleSheet: addVeteranGooleSheet,
  };
})();
module.exports = { googleSheetService };
