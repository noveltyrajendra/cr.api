let careerreconCompanyService = (function () {
  let mysqlService = require('./mysqlService');
  let careerreconCompanyModel = require('../models/careerreconCompanyModel');
  let stringUtil = require('../utils/stringUtil');
  let s3Helper = require('../utils/s3Helper');
  let moment = require('moment');

  function getAllCompanies() {
    return new Promise(function (resolve, reject) {
      let getQuery = `SELECT id,company_name, convert(cast(convert(company_desc using latin1) as binary) using utf8) as company_desc, military_focused, veteran_owned, type_of_work,
			type, veterans_transition, officer, security_clearance, enlisted, military_spouse, national, oconus, link FROM careerrecon_company WHERE company_status = 'active' order by id asc`;
      // console.log("QQ:",getQuery);
      mysqlService.query(getQuery).then(
        function (response) {
          resolve(response);
        },
        function (err) {
          if (err) {
            var error = err;
            error.status = 503;
            return reject(error);
          }
        }
      );
    });
  }

  function getlookupData(type) {
    return new Promise(function (resolve, reject) {
      let getQuery =
        "SELECT id,name,value FROM careerrecon_lookup WHERE status = 'active' and type='" +
        type +
        "'";
      // console.log("QQ:",getQuery);
      mysqlService.query(getQuery).then(
        function (response) {
          resolve(response);
        },
        function (err) {
          if (err) {
            var error = err;
            error.status = 503;
            return reject(error);
          }
        }
      );
    });
  }

  function getAllFocus() {
    return new Promise(function (resolve, reject) {
      let getQuery =
        "SELECT id,career_name FROM mmb_career WHERE status = 'active'";
      // console.log("QQ:",getQuery);
      mysqlService.query(getQuery).then(
        function (response) {
          resolve(response);
        },
        function (err) {
          if (err) {
            var error = err;
            error.status = 503;
            return reject(error);
          }
        }
      );
    });
  }

  async function addCompanies(companyData) {
    try {
      let addCompany = {
        company_name: companyData.companyName,
        military_focused: companyData.militaryFocused,
        veteran_owned: companyData.veteranOwned,
        type_of_work: companyData.typeOfWork,
        type: companyData.type,
        veterans_transition: companyData.veteransTransition,
        officer: companyData.officer,
        security_clearance: companyData.securityClearance,
        enlisted: companyData.enlisted,
        military_spouse: companyData.militarySpouse,
        national: companyData.national,
        oconus: companyData.oconus,
        notes: companyData.notes ? companyData.notes : '',
        company_desc: companyData.companyDesc ? companyData.companyDesc : '',
        company_they_represent: companyData.companyTheyRepresent
          ? companyData.companyTheyRepresent
          : '',
        headquater: companyData.headquater,
        link: companyData.link,
        created_by: companyData.adminId,
      };
      let addqry = 'INSERT INTO careerrecon_company SET ? ';
      let results = await mysqlService.query(addqry, addCompany);
      let companyId = results['insertId'];
      await addCompanyFocus(companyId, companyData.companyFocusList);
      await addCompanyContact(companyId, companyData);
      await addCompanyConus(companyId, companyData.stateIds);
      return companyId;
    } catch (err) {
      console.log('error', err);
      return reject(new Error(err));
    }
  }

  async function addCompanyFocus(cId, focusData) {
    return new Promise(async function (resolve, reject) {
      if (focusData.length > 0) {
        let insertQuery =
          'Insert into careerrecon_company_focus (company_id,focus_id,value) values ';
        for (i = 0; i < focusData.length; i++) {
          if (i == focusData.length - 1) {
            insertQuery +=
              '(' +
              cId +
              ',' +
              focusData[i]['id'] +
              ",'" +
              focusData[i]['value'] +
              "');";
          } else {
            insertQuery +=
              '(' +
              cId +
              ',' +
              focusData[i]['id'] +
              ",'" +
              focusData[i]['value'] +
              "'),";
          }
        }
        //console.log("Insert:",insertQuery);
        mysqlService.query(insertQuery).then(
          function (response) {
            resolve('success');
          },
          function (err) {
            if (err) {
              var error = err;
              error.status = 503;
              return reject(error);
            }
          }
        );
      } else {
        resolve('success');
      }
    });
  }

  async function addCompanyContact(cId, cData) {
    return new Promise(async function (resolve, reject) {
      let contactData = {
        company_id: cId,
        name: cData.name,
        role: cData.role,
        email: cData.email,
        phone: cData.phone,
      };
      let addqry = 'INSERT INTO careerrecon_company_contact SET ? ';
      mysqlService.query(addqry, contactData).then(
        function (response) {
          resolve('success');
        },
        function (err) {
          if (err) {
            var error = err;
            error.status = 503;
            return reject(error);
          }
        }
      );
    });
  }

  async function addCompanyConus(cId, conusData) {
    return new Promise(async function (resolve, reject) {
      if (conusData.length > 0) {
        let insertQuery =
          'Insert into careerrecon_conus (company_id,conus_id) values ';
        for (i = 0; i < conusData.length; i++) {
          if (i == conusData.length - 1) {
            insertQuery += '(' + cId + ',' + conusData[i] + ');';
          } else {
            insertQuery += '(' + cId + ',' + conusData[i] + '),';
          }
        }
        //console.log("Insert:",insertQuery);
        mysqlService.query(insertQuery).then(
          function (response) {
            resolve('success');
          },
          function (err) {
            if (err) {
              var error = err;
              error.status = 503;
              return reject(error);
            }
          }
        );
      } else {
        resolve('success');
      }
    });
  }

  async function getCompanyData(companyId) {
    try {
      let qry =
        'SELECT com.*,comc.* FROM careerrecon_company as com LEFT JOIN careerrecon_company_contact as comc ON com.id=comc.company_id where com.id=' +
        companyId;
      let results = await mysqlService.query(qry);
      let companyFocus = await getCompanyFocus(companyId);
      let companyConus = await getCompanyConus(companyId);
      return careerreconCompanyModel(results, companyFocus, companyConus);
    } catch (err) {
      console.log('error', err);
      return reject(new Error(err));
    }
  }

  async function getCompanyFocus(cId) {
    return new Promise(async function (resolve, reject) {
      let selqry =
        'SELECT focus_id,value FROM careerrecon_company_focus where company_id=' +
        cId;
      mysqlService.query(selqry).then(
        function (response) {
          resolve(response);
        },
        function (err) {
          if (err) {
            var error = err;
            error.status = 503;
            return reject(error);
          }
        }
      );
    });
  }

  async function getCompanyConus(cId) {
    return new Promise(async function (resolve, reject) {
      let selqry =
        'SELECT cc.conus_id,cl.name FROM careerrecon_conus as cc LEFT JOIN careerrecon_lookup as cl ON cc.conus_id=cl.id where cc.company_id=' +
        cId;
      mysqlService.query(selqry).then(
        function (response) {
          resolve(response);
        },
        function (err) {
          if (err) {
            var error = err;
            error.status = 503;
            return reject(error);
          }
        }
      );
    });
  }

  async function updateCompany(companyData) {
    try {
      let updateCompany = {
        company_name: companyData.companyName,
        military_focused: companyData.militaryFocused,
        veteran_owned: companyData.veteranOwned,
        type_of_work: companyData.typeOfWork,
        type: companyData.type,
        veterans_transition: companyData.veteransTransition,
        officer: companyData.officer,
        security_clearance: companyData.securityClearance,
        enlisted: companyData.enlisted,
        military_spouse: companyData.militarySpouse,
        national: companyData.national,
        oconus: companyData.oconus,
        notes: companyData.notes ? companyData.notes : '',
        company_desc: companyData.companyDesc ? companyData.companyDesc : '',
        company_they_represent: companyData.companyTheyRepresent
          ? companyData.companyTheyRepresent
          : '',
        headquater: companyData.headquater,
        link: companyData.link,
        updated_by: companyData.adminId,
        updated_date: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
      };
      let updateqry = 'UPDATE careerrecon_company SET ? WHERE id = ? ';
      let results = await mysqlService.query(updateqry, [
        updateCompany,
        companyData.id,
      ]);
      let companyId = companyData.id;
      await updateCompanyFocus(companyId, companyData.companyFocusList);
      await updateCompanyContact(companyId, companyData);
      await updateCompanyConus(
        companyId,
        companyData.national,
        companyData.stateIds,
        companyData.prevStateIds
      );
      return 'success';
    } catch (err) {
      console.log('error', err);
      return reject(new Error(err));
    }
  }

  async function updateCompanyContact(cId, cData) {
    return new Promise(async function (resolve, reject) {
      let contactData = {
        name: cData.name,
        role: cData.role,
        email: cData.email,
        phone: cData.phone,
      };
      let updateqry =
        'UPDATE careerrecon_company_contact SET ?  WHERE company_id = ? ';
      mysqlService.query(updateqry, [contactData, cId]).then(
        function (response) {
          resolve('success');
        },
        function (err) {
          if (err) {
            var error = err;
            error.status = 503;
            return reject(error);
          }
        }
      );
    });
  }

  async function updateCompanyFocus(cId, focusData) {
    return new Promise(async function (resolve, reject) {
      let updateqry = '';
      for (i = 0; i < focusData.length; i++) {
        updateqry =
          "UPDATE careerrecon_company_focus SET value='" +
          focusData[i]['value'] +
          "'  WHERE company_id = " +
          cId +
          ' and focus_id= ' +
          focusData[i]['id'];
        //console.log("UU:",updateqry)
        mysqlService.query(updateqry).then(
          function (response) {
            resolve('success');
          },
          function (err) {
            if (err) {
              var error = err;
              error.status = 503;
              return reject(error);
            }
          }
        );
      }
    });
  }

  async function updateCompanyConus(
    cId,
    national,
    currentStates,
    prevoiusStates
  ) {
    return new Promise(async function (resolve, reject) {
      if (national == 'yes' && prevoiusStates.length > 0) {
        let result = await deleteConusData(cId, []);
        resolve(result);
      } else if (national == 'no' && currentStates.length > 0) {
        if (prevoiusStates.length > 0 && currentStates.length > 0) {
          let delData = stringUtil.arrayDiff(prevoiusStates, currentStates);
          let newData = stringUtil.arrayDiff(currentStates, prevoiusStates);
          if (delData.length > 0) {
            await deleteConusData(cId, delData);
          }
          if (newData.length > 0) {
            await addCompanyConus(cId, newData);
          }
          resolve('success');
        } else {
          let result = await addCompanyConus(cId, currentStates);
          resolve(result);
        }
      } else {
        resolve('success');
      }
    });
  }

  async function deleteConusData(cid, delData) {
    return new Promise(async function (resolve, reject) {
      let delQuery = '';
      if (delData.length > 0) {
        delQuery =
          'DELETE FROM careerrecon_conus WHERE conus_id in (' +
          stringUtil.joinStringByComma(delData) +
          ') and company_id=' +
          cid;
      } else {
        delQuery = 'DELETE FROM careerrecon_conus WHERE company_id=' + cid;
      }
      //console.log("DD:",delQuery);
      mysqlService.query(delQuery).then(
        function (response) {
          resolve('success');
        },
        function (err) {
          if (err) {
            var error = err;
            error.status = 503;
            return reject(error);
          }
        }
      );
    });
  }

  function deleteCompanyData(cid) {
    return new Promise(function (resolve, reject) {
      let getQuery =
        "UPDATE careerrecon_company SET company_status='disable' WHERE id = " +
        cid;
      mysqlService.query(getQuery).then(
        function (response) {
          resolve('success');
        },
        function (err) {
          if (err) {
            var error = err;
            error.status = 503;
            return reject(error);
          }
        }
      );
    });
  }

  async function updateCompanyLogoData(logoInfo) {
    try {
      let ext = logoInfo.fileExtension;
      let imagePath = logoInfo.logoPath.split(',');
      let currentTimestamp = Date.now();
      let base64Data = imagePath[1];
      let imageName =
        'logo' + logoInfo.companyId + '_' + currentTimestamp + '.' + ext;
      let bitmap = new Buffer.from(base64Data, 'base64');
      let delLogo = logoInfo.prevLogo;
      if (delLogo) {
        let delResult = await s3Helper.deleteS3Object(delLogo, 'company');
      }
      let result = await s3Helper.uploadCompanyLogo(bitmap, imageName);
      //console.log("RR:",result)
      await updateCompanyLogo(logoInfo.companyId, imageName);

      return 'success';
    } catch (err) {
      console.log('error', err);
      return reject(new Error(err));
    }
  }

  function updateCompanyLogo(cid, imageName) {
    return new Promise(function (resolve, reject) {
      let getQuery =
        "UPDATE careerrecon_company SET company_logo='" +
        imageName +
        "' WHERE id = " +
        cid;
      mysqlService.query(getQuery).then(
        function (response) {
          resolve('success');
        },
        function (err) {
          if (err) {
            var error = err;
            error.status = 503;
            return reject(error);
          }
        }
      );
    });
  }

  /** Start Import Company Data:: */

  async function insertCompanyData() {
    let resultData = await getAllCompanyList();
    //console.log("CD:",resultData[0]);
    for (let i = 0; i < resultData.length; i++) {
      //if(i==7){
      let result = await insertDataIntoCareerrecon(resultData[i]);
      //return result;
      if (i == resultData.length - 1) {
        //console.log("Careerrecon data import Completed.");
        return result;
      }
      //}
    }
  }

  async function insertDataIntoCareerrecon(data) {
    let companyId = await insertCareerreconCompany(data);
    await insertCareerreconContact(data, companyId);
    await insertCareerreconFocus(data, companyId);
    let conusresult = await insertCareerreconConus(data, companyId);
    return conusresult;
  }

  async function insertCareerreconCompany(data) {
    return new Promise(function (resolve, reject) {
      let insertQuery =
        "Insert into careerrecon_company (company_name,military_focused,veteran_owned,type_of_work,type,veterans_transition,officer,security_clearance,enlisted,military_spouse,national,oconus,notes,company_desc,company_they_represent,headquater,link) values ('" +
        data['col4'] +
        "','" +
        data['col1'].toLowerCase() +
        "','" +
        data['col2'].toLowerCase() +
        "','" +
        data['col3'] +
        "','" +
        data['col5'] +
        "','" +
        data['col7'] +
        "','" +
        data['col8'] +
        "','" +
        data['col9'] +
        "','" +
        data['col10'] +
        "','" +
        data['col11'] +
        "','" +
        data['col24'].toLowerCase() +
        "','" +
        data['col26'].toLowerCase() +
        "','" +
        data['col27'] +
        "','" +
        data['col28'].replace(/'/g, "''") +
        "','" +
        data['col29'].replace(/'/g, "''") +
        "','" +
        data['col30'] +
        "','" +
        data['col35'] +
        "');";
      //console.log("HH:",insertQuery);
      mysqlService.query(insertQuery).then(
        function (response2) {
          //console.log("RR:",response2.insertId);
          resolve(response2.insertId);
        },
        function (err) {
          if (err) {
            var error = err;
            error.status = 503;
            return reject(error);
          }
        }
      );
    });
  }

  async function insertCareerreconContact(data, companyId) {
    return new Promise(function (resolve, reject) {
      let insertQuery =
        'Insert into careerrecon_company_contact (company_id,name,role,email,phone) values (' +
        companyId +
        ",'" +
        data['col31'] +
        "','" +
        data['col32'] +
        "','" +
        data['col33'] +
        "','" +
        data['col34'] +
        "');";
      mysqlService.query(insertQuery).then(
        function (response2) {
          resolve('success');
        },
        function (err) {
          if (err) {
            var error = err;
            error.status = 503;
            return reject(error);
          }
        }
      );
    });
  }

  async function insertCareerreconFocus(data, companyId) {
    return new Promise(function (resolve, reject) {
      let insertQuery =
        'Insert into careerrecon_company_focus (company_id,focus_id,value) values (' +
        companyId +
        ",11,'" +
        data['col12'] +
        "'),(" +
        companyId +
        ",6,'" +
        data['col13'] +
        "'),(" +
        companyId +
        ",4,'" +
        data['col14'] +
        "'),(" +
        companyId +
        ",2,'" +
        data['col15'] +
        "'),(" +
        companyId +
        ",7,'" +
        data['col16'] +
        "'),(" +
        companyId +
        ",1,'" +
        data['col17'] +
        "'),(" +
        companyId +
        ",3,'" +
        data['col18'] +
        "'),(" +
        companyId +
        ",12,'" +
        data['col19'] +
        "'),(" +
        companyId +
        ",5,'" +
        data['col20'] +
        "'),(" +
        companyId +
        ",8,'" +
        data['col21'] +
        "'),(" +
        companyId +
        ",9,'" +
        data['col22'] +
        "'),(" +
        companyId +
        ",10,'" +
        data['col23'] +
        "');";
      mysqlService.query(insertQuery).then(
        function (response2) {
          resolve('success');
        },
        function (err) {
          if (err) {
            var error = err;
            error.status = 503;
            return reject(error);
          }
        }
      );
    });
  }

  async function insertCareerreconConus(data, companyId) {
    return new Promise(function (resolve, reject) {
      if (
        data['col24'].toLowerCase() == 'yes' &&
        data['col25'].toLowerCase() == 'nationwide'
      ) {
        let insertQuery =
          'Insert into careerrecon_conus (company_id,conus_id) values (' +
          companyId +
          ',1);';
        mysqlService.query(insertQuery).then(
          function (response2) {
            resolve('success');
          },
          function (err) {
            if (err) {
              var error = err;
              error.status = 503;
              return reject(error);
            }
          }
        );
      } else {
        if (data['col25'].indexOf(',') > -1) {
          let stateData = data['col25'].split(',');
          let insertQuery =
            'Insert into careerrecon_conus (company_id,conus_id) values ';
          for (i = 0; i < stateData.length; i++) {
            if (i == stateData.length - 1) {
              insertQuery +=
                '(' +
                companyId +
                ",(select id from careerrecon_lookup where type='state' and name like '" +
                stateData[i].trim() +
                "%'));";
            } else {
              insertQuery +=
                '(' +
                companyId +
                ",(select id from careerrecon_lookup where type='state' and name like '" +
                stateData[i].trim() +
                "%')),";
            }
          }
          //console.log("CQ:",insertQuery);
          mysqlService.query(insertQuery).then(
            function (response2) {
              resolve('success');
            },
            function (err) {
              if (err) {
                var error = err;
                error.status = 503;
                return reject(error);
              }
            }
          );
        } else {
          let insertQuery =
            'Insert into careerrecon_conus (company_id,conus_id) values (' +
            companyId +
            ",(select id from careerrecon_lookup where type='state' and name like '" +
            data['col25'].trim() +
            "%'));";
          mysqlService.query(insertQuery).then(
            function (response2) {
              resolve('success');
            },
            function (err) {
              if (err) {
                var error = err;
                error.status = 503;
                return reject(error);
              }
            }
          );
        }
      }
    });
  }

  async function getAllCompanyList() {
    return new Promise(function (resolve, reject) {
      let ruleSql = 'select * from company_final_new';
      //console.log("QQ:",ruleSql);
      mysqlService.query(ruleSql).then(
        function (response) {
          //console.log("RR:",response);
          resolve(response);
        },
        function (err) {
          if (err) {
            var error = err;
            error.status = 503;
            return reject(error);
          }
        }
      );
    });
  }

  /** End Import Company Data:: */

  return {
    getAllCompanies: getAllCompanies,
    getlookupData: getlookupData,
    getAllFocus: getAllFocus,
    addCompanies: addCompanies,
    getCompanyData: getCompanyData,
    updateCompany: updateCompany,
    deleteCompanyData: deleteCompanyData,
    updateCompanyLogoData: updateCompanyLogoData,
    insertCompanyData: insertCompanyData,
  };
})();

module.exports = careerreconCompanyService;
