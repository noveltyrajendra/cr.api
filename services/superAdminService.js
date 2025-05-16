let superAdminService = (function () {
  let mysqlService = require('./mysqlService');
  let emailService = require('./emailService');
  let sha1 = require('sha1');
  let moment = require('moment');
  let stringUtil = require('../utils/stringUtil');
  let superAdminConstant = require('../constants/superAdminConstant');
  let superAdminLoginactivityModel = require('../models/superAdminLoginactivityModel');
  let superAdminVeteranModel = require('../models/superadminVeteranModel');
  let superAdminVeteranMessageModel = require('../models/superAdminVeteranMessageModel');
  let superAdminCampaignModel = require('../models/superAdminCampaignModel');
  let messageEmail = require('../utils/messageEmail');
  let emailConstant = require('../constants/emailConstant');
  const {
    GET_SIMILAR_SCHOOL_BY_ID_QUERY,
  } = require('../constants/collegeConstants');
  let config = require('../config');
  const {
    integrationConstant,
    collegeConstant,
  } = require("../constants/integrationConstants");

  function loginSuperAdmin(userinfo) {
    return new Promise(function (resolve, reject) {
      let loginQuery =
        "select uuid, id, LOWER(admin_user_email) as email, admin_user_password as password from admin_users where status='ACTIVE' AND admin_user_email ='" +
        userinfo.email.toLowerCase() +
        "'";
      mysqlService.query(loginQuery).then(
        function (response) {
          if (response.length == 0) {
            resolve('emailnotexist');
          }
          if (response[0].password != sha1(userinfo.password)) {
            resolve('wrongpassword');
          }
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

  function resetPassword(userName) {
    return new Promise(function (resolve, reject) {
      let queryLogin =
        "select users.email, users.src from (select admin_user_email as email, 'admin' as src from admin_users ) users where users.email = '" +
        userName +
        "' limit 1";

      mysqlService.query(queryLogin).then(
        function (response) {
          if (response.length == 0) {
            resolve('usernotexist');
          }

          let newPassword = stringUtil.generateRandomPassword();
          let securePassword = sha1(newPassword);
          let updateQuery = '';
          if (response[0].src == 'admin') {
            updateQuery =
              'UPDATE admin_users SET admin_user_password = "' +
              securePassword +
              '" WHERE admin_user_email = "' +
              stringUtil.escapeHtml(userName) +
              '"';
          } else {
            resolve('nousertype');
          }
          //console.log("QQ:",updateQuery);
          mysqlService.query(updateQuery).then(
            function (response1) {
              emailPassword(userName, newPassword).then(
                function (response) {
                  if (response == 'success') {
                    resolve('emailsent');
                  }
                },
                function (err) {
                  if (err) {
                    var error = err;
                    error.status = 503;
                    return reject(error);
                  }
                }
              );
            },
            function (err) {
              if (err) {
                var error = err;
                error.status = 503;
                return reject(error);
              }
            }
          );
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

  function emailPassword(userName, newPassword) {
    return new Promise(function (resolve, reject) {
      let message = messageEmail.resetPasswordEmail(newPassword);
      let subject = emailConstant.RESET_PASSWORD_SUBJECT;
      let to = [userName];
      let from = emailConstant.NO_REPLY_EMAIL;
      emailService
        .sendEmail(
          from,
          to,
          subject,
          message,
          null,
          [],
          config.NODE_ENV === 'staging'
        )
        .then(
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

  function listSuperAdmin() {
    return new Promise(function (resolve, reject) {
      let insertQuery =
        'SELECT adm.created_by,adm.admin_user_email as email,adm.uuid,adm.id,DATE_FORMAT(adm.date_created, "%Y-%m-%d") as date_created,admn.admin_user_email as created_user FROM `admin_users` adm INNER JOIN `admin_users` admn ON adm.created_by = admn.uuid WHERE adm.status="ACTIVE" ORDER BY adm.id ASC';

      mysqlService.query(insertQuery).then(
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

  function getSuperAdmin(id) {
    return new Promise(function (resolve, reject) {
      let selectQuery = 'SELECT * from admin_users where id=' + id;

      mysqlService.query(selectQuery).then(
        function (response) {
          resolve(response[0]);
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

  function addSuperAdmin(userinfo) {
    return new Promise(function (resolve, reject) {
      let insertQuery =
        'INSERT INTO `admin_users` SET admin_user_email = "' +
        userinfo.adminEmail +
        '",admin_user_password = "' +
        sha1(userinfo.adminPassword) +
        '",uuid = "' +
        stringUtil.UID() +
        '",created_by = "' +
        userinfo.adminId +
        '", date_created = "' +
        moment(new Date()).format('YYYY-MM-DD HH:mm:ss') +
        '"';

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
    });
  }

  function editSuperAdmin(userinfo) {
    return new Promise(function (resolve, reject) {
      let updateQuery = '';
      if (userinfo.updateType == 'email') {
        updateQuery =
          'UPDATE `admin_users` SET admin_user_email = "' +
          userinfo.adminEmail +
          '" Where id=' +
          userinfo.adminId;
      } else if (userinfo.updateType == 'status') {
        updateQuery =
          'UPDATE `admin_users` SET status = "DISABLED" Where id=' +
          userinfo.adminId;
      } else {
        updateQuery =
          'UPDATE `admin_users` SET admin_user_password = "' +
          sha1(userinfo.adminPassword) +
          '" Where id=' +
          userinfo.adminId;
      }
      mysqlService.query(updateQuery).then(
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

  function searchSuperAdmin(userinfo) {
    return new Promise(function (resolve, reject) {
      let insertQuery =
        "Select * from admin_users where admin_user_email LIKE '" +
        userinfo.stext +
        "%' order by id ASC";

      mysqlService.query(insertQuery).then(
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

  function getCollegeAdmin(adminid) {
    return new Promise(function (resolve, reject) {
      let insertQuery = 'SELECT * FROM college_users WHERE id=' + adminid;

      mysqlService.query(insertQuery).then(
        function (response) {
          resolve(response[0]);
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

  function listCollegeAdmin() {
    return new Promise(function (resolve, reject) {
      let insertQuery =
        'SELECT cu.id,cu.uuid,cu.college_user_email,DATE_FORMAT(cu.date_created, "%Y-%m-%d") as date_created,admn.admin_user_email,col.college_name FROM college_users as cu LEFT JOIN admin_users as admn ON cu.created_by = admn.uuid LEFT JOIN colleges as col ON cu.college_id = col.id WHERE cu.status="ACTIVE" ORDER BY cu.id ASC';

      mysqlService.query(insertQuery).then(
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

  function addCollegeAdmin(userinfo) {
    return new Promise(function (resolve, reject) {
      let insertQuery =
        'INSERT INTO `college_users` SET college_user_email = "' +
        userinfo.collegeadminEmail +
        '",college_user_password = "' +
        sha1(userinfo.collegeadminPassword) +
        '",uuid = "' +
        stringUtil.UID() +
        '",college_id = "' +
        userinfo.collegeId +
        '",created_by = "' +
        userinfo.adminId +
        '", date_created = "' +
        moment(new Date()).format('YYYY-MM-DD HH:mm:ss') +
        '"';

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
    });
  }

  function editCollegeAdmin(userinfo) {
    return new Promise(function (resolve, reject) {
      let updateQuery = '';
      if (userinfo.updateType == 'password') {
        updateQuery =
          'UPDATE `college_users` SET college_user_password = "' +
          sha1(userinfo.collegeadminPassword) +
          '",last_updated = "' +
          moment(new Date()).format('YYYY-MM-DD HH:mm:ss') +
          '" Where id=' +
          userinfo.Id;
      } else if (userinfo.updateType == 'status') {
        updateQuery =
          'UPDATE `college_users` SET status = "DISABLED",last_updated = "' +
          moment(new Date()).format('YYYY-MM-DD HH:mm:ss') +
          '" Where id=' +
          userinfo.Id;
      } else {
        updateQuery =
          'UPDATE `college_users` SET college_user_email = "' +
          userinfo.collegeadminEmail +
          '",college_id = "' +
          userinfo.collegeId +
          '",last_updated = "' +
          moment(new Date()).format('YYYY-MM-DD HH:mm:ss') +
          '" Where id=' +
          userinfo.Id;
      }
      //console.log("QQ:",updateQuery);
      mysqlService.query(updateQuery).then(
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

  function searchCollegeAdmin(userinfo) {
    return new Promise(function (resolve, reject) {
      let insertQuery =
        "Select * from college_users where college_user_email LIKE '" +
        userinfo.stext +
        "%' order by id ASC";

      mysqlService.query(insertQuery).then(
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

  function listVeterans() {
    return new Promise(function (resolve, reject) {
      let listQuery =
        'SELECT s.uuid,s.first_name,s.middle_initial,s.last_name,s.email,s.date_created,s.last_login,s.site_source,sp.state FROM students as s,student_profile as sp WHERE s.uuid = sp.uuid AND s.user_account_status = "ACTIVE" ORDER BY date_created DESC';

      mysqlService.query(listQuery).then(
        function (response) {
          resolve(superAdminVeteranModel(response));
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

  function listVeteransByState(state) {
    return new Promise(function (resolve, reject) {
      let listQuery =
        'SELECT s.uuid,s.first_name,s.middle_initial,s.last_name,s.email,s.date_created,s.last_login,s.site_source,sp.state FROM students as s,student_profile as sp WHERE s.uuid = sp.uuid AND s.user_account_status = "ACTIVE" AND sp.state="' +
        state +
        '" ORDER BY date_created DESC';

      mysqlService.query(listQuery).then(
        function (response) {
          resolve(superAdminVeteranModel(response));
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

  function listLoginActivity() {
    return new Promise(function (resolve, reject) {
      let listQuery =
        'select concat(last_name, ", ", first_name)  As fullname, uuid AS code, last_login, "Student" as type from students union all select college_name AS fullname, edge_college_id AS code, last_login, "College" as type from colleges order by last_login DESC';

      mysqlService.query(listQuery).then(
        function (response) {
          resolve(superAdminLoginactivityModel(response));
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

  function getVeteranId(email) {
    return new Promise(function (resolve, reject) {
      let listQuery =
        'select concat(first_name, " ", last_name)  As fullname, uuid from students where email="' +
        email +
        '"';

      mysqlService.query(listQuery).then(
        function (response) {
          resolve(response[0]);
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

  function getVeteranContactCount(studentId) {
    return new Promise(function (resolve, reject) {
      let listQuery =
        'SELECT count(distinct(college_id)) as c_contacts FROM `recon_messages` WHERE student_id = "' +
        studentId +
        '"';

      mysqlService.query(listQuery).then(
        function (response) {
          resolve(response[0]['c_contacts']);
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

  function deactivateVeterans(studentId) {
    return new Promise(function (resolve, reject) {
      let listQuery =
        'UPDATE students SET user_account_status = "DISABLED", deactivation_reason = "DA0" WHERE uuid = "' +
        studentId +
        '"';

      mysqlService.query(listQuery).then(
        function (response) {
          if (response.affectedRows == 1) {
            resolve('success');
          } else {
            resolve('fail');
          }
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

  function getVeteransMessage(studentId) {
    return new Promise(function (resolve, reject) {
      let listQuery =
        "SELECT rm.id,rm.message_id,rm.student_id,rm.college_id,rm.responder,rm.message,rm.message,rm.date_created,c.id as cid,c.college_name,c.contact_email  FROM recon_messages rm,colleges c WHERE  student_id = '" +
        studentId +
        "' AND rm.college_id = c.id AND responder = 'USER' AND message_state != 'DELETED' ORDER BY date_created DESC";

      mysqlService.query(listQuery).then(
        function (response) {
          resolve(superAdminVeteranMessageModel(response));
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

  function getCollegeCampaignList(cdata) {
    return new Promise(function (resolve, reject) {
      let listQuery =
        "SELECT c.college_name,cc.id,cc.college_id,cc.campaign_name,DATE_FORMAT(cc.start_date,'%Y-%m-%d') as start_date,DATE_FORMAT(cc.end_date,'%Y-%m-%d') as end_date,cc.amount_free_from_entry ,cc.campaign_type,cc.cpi_target_free_from_entry,cc.account_type,cc.targeting,cc.billing,cc.api_setup,cc.campaign_status,cc.created_date from college_campaigns as cc left join colleges as c ON cc.college_id=c.id where ";

      if (cdata.type == 'active') {
        listQuery +=
          " cc.campaign_status='active' and cc.end_date >= CURRENT_DATE()";
      } else if (cdata.type == 'inactive') {
        listQuery +=
          " cc.campaign_status='active' and cc.end_date < CURRENT_DATE()";
      } else if (cdata.type == 'disable') {
        listQuery += " cc.campaign_status='disable'";
      }

      if (cdata.campaignType) {
        listQuery += " and cc.campaign_type='" + cdata.campaignType + "'";
      }
      if (cdata.accountType) {
        listQuery += " and cc.account_type='" + cdata.accountType + "'";
      }
      if (cdata.targetting) {
        listQuery += " and cc.targeting='" + cdata.targetting + "'";
      }
      //console.log("QQ:",listQuery);
      mysqlService.query(listQuery).then(
        function (response) {
          resolve(superAdminCampaignModel(response));
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

  function getCollegeCampaignById(campaignId) {
    return new Promise(function (resolve, reject) {
      let listQuery =
        "SELECT DATE_FORMAT(cc.start_date, '%Y-%m-%d') as start_date,DATE_FORMAT(cc.end_date, '%Y-%m-%d') as end_date,cc.id,cc.campaign_name,cc.college_id,cc.account_type,cc.amount_free_from_entry,cc.campaign_type,cc.targeting,cc.billing,cc.api_setup,cc.campaign_status,cc.cpi_target_free_from_entry,cc.created_date,c.college_name from college_campaigns as cc left join colleges as c ON cc.college_id=c.id where cc.id=" +
        campaignId;

      mysqlService.query(listQuery).then(
        function (response) {
          resolve(superAdminCampaignModel(response));
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

  function addeditCollegeCampaign(cdata) {
    return new Promise(function (resolve, reject) {
      let campData = {
        college_id: cdata.collegeId,
        account_type: cdata.accountType,
        campaign_name: cdata.campaignName,
        start_date: cdata.startDate,
        end_date: cdata.endDate,
        amount_free_from_entry: cdata.amountFreeFromEntry,
        campaign_type: cdata.campaignType,
        targeting: cdata.targeting,
        billing: cdata.billing,
        api_setup: cdata.apiSetup,
        cpi_target_free_from_entry: cdata.cpiTargetFreeFromEntry,
      };

      if (cdata.action == 'add') {
        mysqlService
          .query('INSERT INTO college_campaigns SET ?', campData)
          .then(
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
        mysqlService
          .query('UPDATE college_campaigns SET ? WHERE id = ?', [
            campData,
            cdata.id,
          ])
          .then(
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

  function deleteCampaignById(campaignId) {
    return new Promise(function (resolve, reject) {
      let listQuery =
        'UPDATE college_campaigns SET campaign_status = "disable" WHERE id = ' +
        campaignId;
      mysqlService.query(listQuery).then(
        function (response) {
          if (response.affectedRows == 1) {
            resolve('success');
          } else {
            resolve('fail');
          }
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

  function listCollegeAdminByCollegeId(cid) {
    return new Promise(function (resolve, reject) {
      let insertQuery =
        'SELECT cu.id,cu.uuid,cu.college_user_email,DATE_FORMAT(cu.date_created, "%Y-%m-%d") as date_created,admn.admin_user_email,col.college_name FROM college_users as cu LEFT JOIN admin_users as admn ON cu.created_by = admn.uuid LEFT JOIN colleges as col ON cu.college_id = col.id WHERE cu.status="ACTIVE" and col.id=' +
        cid +
        ' ORDER BY cu.id ASC';

      mysqlService.query(insertQuery).then(
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

  function sendEmailTemplateMail(emailData) {
    return new Promise(function (resolve, reject) {
      let from = 'CollegeRecon <' + emailConstant.INFORMATION_EMAIL + '>';
      let to = [emailData.to];
      let subject = emailData.subject;
      let messageContent = messageEmail.basicReplyEmailTemplate(
        emailData.emailContent
      );
      //console.log("MC:",messageContent);
      emailService.sendEmail(from, to, subject, messageContent).then(
        function (response1) {
          if (response1 == 'success') {
            resolve('success');
          } else {
            resolve('fail');
          }
        },
        function (err) {
          if (err) {
            var error = err;
            error.status = 503;
            console.log('Error sending email', err);
          }
        }
      );
    });
  }

  const getSimilarSchool = (collegeId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const similarSchools = await mysqlService.query(
          GET_SIMILAR_SCHOOL_BY_ID_QUERY,
          collegeId
        );
        return resolve(similarSchools);
      } catch (error) {
        error.status = 503;
        return reject(error);
      }
    });
  };

  const addSimilarSchool = (collegeId, similarSchools) => {
    return new Promise(async (resolve, reject) => {
      try {
        await mysqlService.query(
          `DELETE FROM similar_schools WHERE college_id = ${collegeId}`
        );
        if (!similarSchools.length) return resolve('success');
        const insertQuery = `INSERT INTO similar_schools (college_id, similar_college_id, status) VALUES ${similarSchools
          .map((school) => `(${collegeId}, ${school.collegeId}, "ACTIVE")`)
          .join(',')}`;
        await mysqlService.query(insertQuery);
        return resolve('success');
      } catch (error) {
        error.status = 503;
        return reject(error);
      }
    });
  };

  const getSimilarSchoolReport = ({ startDate, endDate }) => {
    return new Promise(async (resolve, reject) => {
      try {
        const similarSchoolList = await mysqlService.query(
          `select c.college_name as collegeName, sum(case when (cst.secondary_source like '%similar-school-clicked%' and date(cst.date_created) between '${startDate}' and '${endDate}') then 1 else 0 end) as clicked, sum(case when (cst.secondary_source like '%similar-school-appearance%' and date(cst.date_created) between '${startDate}' and '${endDate}') then 1 else 0 end) as appearance from college_search_tracking cst join colleges c on cst.college_id = c.id group by cst.college_id having ((sum(case when (cst.secondary_source like '%similar-school-clicked%' and date(cst.date_created) between '${startDate}' and '${endDate}') then 1 else 0 end) > 0) or (sum(case when (cst.secondary_source like '%similar-school-appearance%' and date(cst.date_created) between '${startDate}' and '${endDate}') then 1 else 0 end) > 0))`
        );
        return resolve(similarSchoolList);
      } catch (error) {
        error.status = 503;
        return reject(error);
      }
    });
  };

  const getProgramData = (type) => {
    return new Promise(async (resolve, reject) => {
      try {
        let sqlQuery = '';
        if (type == 'areaofstudy') {
          sqlQuery =
            "select * from bucket_degree where status='active' order by created_at desc";
        } else if (type == 'areaoffocus') {
          sqlQuery =
            "select bsd.id,bsd.title,bd.title as btitle from bucket_secondary_degree as bsd LEFT JOIN bucket_degree as bd ON bsd.bucket_degree_id=bd.id WHERE bsd.status='active' order by bsd.created_at desc";
        } else {
          sqlQuery =
            'select bsdl.id,mn.title,bsd.title as stitle,bd.title as btitle from bucket_secondary_degree_list as bsdl LEFT JOIN  bucket_secondary_degree as bsd ON bsdl.bucket_secondary_degree_id=bsd.id LEFT JOIN bucket_degree as bd ON bsdl.bucket_primary_degree_id=bd.id LEFT JOIN majors_new as mn ON bsdl.major_id=mn.id order by bsdl.created_at desc';
        }
        const programs = await mysqlService.query(sqlQuery);
        return resolve(programs);
      } catch (error) {
        error.status = 503;
        return reject(error);
      }
    });
  };

  const getDeleteProgramData = (programData) => {
    return new Promise(async (resolve, reject) => {
      try {
        let updateQuery = '';
        let updateData = [];
        let updateDate = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
        if (programData.type == 'areaofstudy') {
          updateQuery =
            'UPDATE bucket_degree SET status = ?,updated_by = ?,updated_at = ? WHERE id = ?';
          updateData = [
            'disabled',
            programData.changeUserid,
            updateDate,
            programData.id,
          ];
        } else if (programData.type == 'areaoffocus') {
          updateQuery =
            'UPDATE bucket_secondary_degree SET status = ?,updated_by = ?,updated_at = ? WHERE id = ?';
          updateData = [
            'disabled',
            programData.changeUserid,
            updateDate,
            programData.id,
          ];
        } else {
          updateQuery = 'Delete from bucket_secondary_degree_list where id=?';
          updateData = [programData.id];
        }
        const programs = await mysqlService.query(updateQuery, updateData);
        return resolve(programs);
      } catch (error) {
        error.status = 503;
        return reject(error);
      }
    });
  };

  const getEditProgramData = (type, id) => {
    return new Promise(async (resolve, reject) => {
      try {
        let sqlQuery = '';
        if (type == 'areaofstudy') {
          sqlQuery = 'select * from bucket_degree where id=' + id;
        } else if (type == 'areaoffocus') {
          sqlQuery =
            'select id,title,bucket_degree_id as bucketId from bucket_secondary_degree where id=' +
            id;
        } else {
          sqlQuery =
            'select bsdl.id,mn.title,major_id as majorId,bucket_primary_degree_id as bucketId,bucket_secondary_degree_id as sBucketId from bucket_secondary_degree_list as bsdl left join majors_new as mn ON bsdl.major_id=mn.id where bsdl.id=' +
            id;
        }
        //console.log("QQ:", sqlQuery)
        const programs = await mysqlService.query(sqlQuery);
        return resolve(programs);
      } catch (error) {
        error.status = 503;
        return reject(error);
      }
    });
  };

  const getAddProgramData = (programData) => {
    return new Promise(async (resolve, reject) => {
      try {
        let pdata = {};
        let insertQuery = '';
        if (programData.type == 'areaofstudy') {
          pdata = {
            title: programData.title,
            created_by: programData.changeUserid,
          };
          insertQuery = 'INSERT INTO bucket_degree SET ?';
        } else if (programData.type == 'areaoffocus') {
          pdata = {
            title: programData.title,
            bucket_degree_id: programData.bucketId,
            created_by: programData.changeUserid,
          };
          insertQuery = 'INSERT INTO bucket_secondary_degree SET ?';
        } else {
          let insMajor = 'INSERT INTO majors_new SET ?';
          let mdata = {
            title: programData.title,
            created_by: programData.changeUserid,
          };
          let results = await mysqlService.query(insMajor, mdata);
          pdata = {
            major_id: results['insertId'],
            bucket_primary_degree_id: programData.bucketId,
            bucket_secondary_degree_id: programData.sBucketId,
            created_by: programData.changeUserid,
          };
          insertQuery = 'INSERT INTO bucket_secondary_degree_list SET ?';
        }
        const programs = await mysqlService.query(insertQuery, pdata);
        return resolve(programs);
      } catch (error) {
        error.status = 503;
        return reject(error);
      }
    });
  };

  const getUpdateProgramData = (programData) => {
    return new Promise(async (resolve, reject) => {
      try {
        let updateQuery = '';
        let updateData = [];
        let updateDate = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
        if (programData.type == 'areaofstudy') {
          updateQuery =
            'UPDATE bucket_degree SET title = ?,updated_by = ?,updated_at = ? WHERE id = ?';
          updateData = [
            programData.title,
            programData.changeUserid,
            updateDate,
            programData.id,
          ];
        } else if (programData.type == 'areaoffocus') {
          updateQuery =
            'UPDATE bucket_secondary_degree SET title = ?, bucket_degree_id=? ,updated_by = ?,updated_at = ? WHERE id = ?';
          updateData = [
            programData.title,
            programData.bucketId,
            programData.changeUserid,
            updateDate,
            programData.id,
          ];
        } else {
          let majorQuery =
            'UPDATE majors_new SET title=? ,updated_by = ?,updated_at = ? WHERE id = ?';
          let mdata = [
            programData.title,
            programData.changeUserid,
            updateDate,
            programData.majorId,
          ];
          await mysqlService.query(majorQuery, mdata);
          updateQuery =
            'UPDATE bucket_secondary_degree_list SET bucket_primary_degree_id=? ,bucket_secondary_degree_id=? ,updated_by = ?,updated_at = ? WHERE id = ?';
          updateData = [
            programData.bucketId,
            programData.sBucketId,
            programData.changeUserid,
            updateDate,
            programData.id,
          ];
        }
        const programs = await mysqlService.query(updateQuery, updateData);
        return resolve(programs);
      } catch (error) {
        error.status = 503;
        return reject(error);
      }
    });
  };

  const getFeatureSchoolReport = ({ startDate, endDate }) => {
    return new Promise(async (resolve, reject) => {
      try {
        const clickRecordsQuery = `select c.id as collegeId, c.college_name as collegeName,sum(case when aet.reference_type = 'bouncedegree' then 1 else 0 end) as bounceClick,sum(case when aet.reference_type = 'bouncematch' then 1 else 0 end) as matchClick,sum(case when aet.reference_type = 'nagemail' then 1 else 0 end) as nagClick from colleges c join aws_email_tracking aet on c.id = aet.college_id where date(aet.message_date) between '${startDate}' and '${endDate}' and aet.event_type = 'Click' and aet.is_feature = true and aet.reference_type IN ('bouncedegree','bouncematch','nagemail') group by aet.college_id`;
        const appearanceRecordQuery = `select c.id as collegeId, c.college_name as collegeName,sum(case when cst.secondary_source = 'feature-school-bounce-appearance' then 1 else 0 end) as bounceAppearance,sum(case when cst.secondary_source = 'feature-school-match-appearance' then 1 else 0 end) as matchAppearance,sum(case when cst.secondary_source = 'feature-school-nag-appearance' then 1 else 0 end) as nagAppearance from colleges c join college_search_tracking cst on c.id = cst.college_id where cst.secondary_source IN ('feature-school-bounce-appearance','feature-school-match-appearance','feature-school-nag-appearance') and date(cst.date_created) between '${startDate}' and '${endDate}' group by cst.college_id`;
        const [clickRecords, appearanceRecords] = await Promise.all([
          mysqlService.query(clickRecordsQuery),
          mysqlService.query(appearanceRecordQuery),
        ]);
        const finalRecords = [];
        for (const {
          collegeId,
          collegeName,
          bounceClick,
          matchClick,
          nagClick,
        } of clickRecords) {
          finalRecords.push({
            collegeId,
            collegeName,
            bounceClick,
            matchClick,
            nagClick,
            bounceAppearance: 0,
            matchAppearance: 0,
            nagAppearance: 0,
          });
        }
        for (const {
          collegeId,
          collegeName,
          bounceAppearance,
          matchAppearance,
          nagAppearance,
        } of appearanceRecords) {
          if (!finalRecords.find((record) => record.collegeId === collegeId)) {
            finalRecords.push({
              collegeId,
              collegeName,
              bounceClick: 0,
              matchClick: 0,
              nagClick: 0,
              bounceAppearance,
              matchAppearance,
              nagAppearance,
            });
          }
          {
            for (const record of finalRecords) {
              if (record.collegeId === collegeId) {
                record.bounceAppearance = bounceAppearance;
                record.matchAppearance = matchAppearance;
                record.nagAppearance = nagAppearance;
              }
            }
          }
        }
        return resolve(finalRecords);
      } catch (error) {
        error.status = 503;
        return reject(error);
      }
    });
  };

  const getFilterProgramData = (filterData) => {
    return new Promise(async (resolve, reject) => {
      try {
        let sqlQuery = '';

        sqlQuery =
          'select bsdl.id,mn.title,bsd.title as stitle,bd.title as btitle from bucket_secondary_degree_list as bsdl LEFT JOIN  bucket_secondary_degree as bsd ON bsdl.bucket_secondary_degree_id=bsd.id LEFT JOIN bucket_degree as bd ON bsdl.bucket_primary_degree_id=bd.id LEFT JOIN majors_new as mn ON bsdl.major_id=mn.id Where  1=1 ';
        if (filterData.bucketId) {
          sqlQuery +=
            ' and bsdl.bucket_primary_degree_id=' + filterData.bucketId;
        }
        if (filterData.secondaryId) {
          sqlQuery +=
            ' and bsdl.bucket_secondary_degree_id=' + filterData.secondaryId;
        }
        sqlQuery += ' order by bsdl.created_at desc';
        const programs = await mysqlService.query(sqlQuery);
        return resolve(programs);
      } catch (error) {
        error.status = 503;
        return reject(error);
      }
    });
  };

  const getResponseCodeReport = ({ dateFrom, dateTo }) => {
    /*const query = `SELECT (SELECT college_name FROM colleges WHERE id = ces.college_id) as college, (SELECT concat(first_name, ' ', last_name) FROM students WHERE uuid = ces.uuid) as student, ces.message, ces.status_code as statusCode, ces.result, ces.date_created as dateCreated FROM college_external_service as ces WHERE date(ces.date_created) BETWEEN '${dateFrom}' AND '${dateTo}'`;*/
    const query = `select temp.sid,temp.student,temp.email,temp.college,if(STRCMP(temp.apistatus,"Failure") = 0,temp.apistatus,"Success") as status,temp.message as apistatus,temp.status_code as statusCode,temp.response as result,temp.postdate from (select ces.uuid as sid,concat(ss.first_name, ' ', ss.last_name) as student,ss.email,(SELECT college_name FROM colleges WHERE id = ces.college_id) as college,ces.status_code,ces.college_id,ces.message,ces.result as response,"" as attributes,"" as apistatus,DATE_FORMAT(ces.date_created,"%m/%d/%Y %H:%i:%s") as postdate,ces.date_created as defaultdate from college_external_service  as ces left join students as ss on ces.uuid=ss.uuid where ces.date_created between '${dateFrom}' AND '${dateTo}' and ces.college_id in (${superAdminConstant.API_COLLEGE_LIST}) group by ces.uuid,ces.college_id union select student_id as sid,concat(ss.first_name, ' ', ss.last_name) as student,ss.email,(SELECT college_name FROM colleges WHERE id = le.college_id) as college,"" as status_code,le.college_id,le.message,le.response,le.attributes,if(STRCMP(le.stage,"SFTP") = 0,le.stage,le.status) as apistatus,DATE_FORMAT(le.timestamp,"%m/%d/%Y %H:%i:%s") as postdate,le.timestamp as defaultdate  from log_entry as le left join students as ss on le.student_id=ss.uuid where le.timestamp BETWEEN '${dateFrom}' AND '${dateTo}' and le.college_id in (${superAdminConstant.API_COLLEGE_LIST}) and le.status='Failure' group by student_id,le.college_id ) as temp order by temp.defaultdate desc`;
    //console.log("QQ:", query)
    return mysqlService.query(query);
  };

  return {
    loginSuperAdmin: loginSuperAdmin,
    resetPassword: resetPassword,
    listSuperAdmin: listSuperAdmin,
    addSuperAdmin: addSuperAdmin,
    editSuperAdmin: editSuperAdmin,
    searchSuperAdmin: searchSuperAdmin,
    listCollegeAdmin: listCollegeAdmin,
    addCollegeAdmin: addCollegeAdmin,
    editCollegeAdmin: editCollegeAdmin,
    searchCollegeAdmin: searchCollegeAdmin,
    listVeterans: listVeterans,
    listLoginActivity: listLoginActivity,
    getSuperAdmin: getSuperAdmin,
    getCollegeAdmin: getCollegeAdmin,
    listVeteransByState: listVeteransByState,
    getVeteranId: getVeteranId,
    getVeteranContactCount: getVeteranContactCount,
    deactivateVeterans: deactivateVeterans,
    getVeteransMessage: getVeteransMessage,
    getCollegeCampaignList: getCollegeCampaignList,
    getCollegeCampaignById: getCollegeCampaignById,
    addeditCollegeCampaign: addeditCollegeCampaign,
    deleteCampaignById: deleteCampaignById,
    listCollegeAdminByCollegeId: listCollegeAdminByCollegeId,
    sendEmailTemplateMail: sendEmailTemplateMail,
    getSimilarSchool,
    addSimilarSchool,
    getSimilarSchoolReport,
    getProgramData,
    getDeleteProgramData,
    getEditProgramData,
    getAddProgramData,
    getUpdateProgramData,
    getFeatureSchoolReport,
    getFilterProgramData,
    getResponseCodeReport,
  };
})();

module.exports = superAdminService;
