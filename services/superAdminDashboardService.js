let superAdminDashboardService = (function () {

	let mysqlService = require('./mysqlService');
	let sha1 = require('sha1');
	let moment = require('moment');
	let stringUtil = require('../utils/stringUtil');
	let reportVeteraninfoModel = require('../models/reportVeteraninfoModel');
	let reportCommunicationstatModel = require('../models/reportCommunicationstatModel');
	let superAdminUserActivityModel = require('../models/superAdminUserActivityModel');
	let superAdminCollegeDetailUserActivityModel = require('../models/superAdminCollegeDetailUserActivityModel');
	let superAdminCollegeActivityEmailModel = require('../models/superAdminCollegeActivityEmailModel');
	let superAdminPartnerCollegeUserActivityModel =require('../models/superAdminPartnerCollegeUserActivityModel');
	let superAdminBounceActivityEmailModel = require('../models/superAdminBounceActivityEmailModel');
	let registerMessageInfoModel = require('../models/registerMessageInfoModel');
	let campaignReportModel = require('../models/campaignReportModel');
	let campaignIndividualModel = require('../models/campaignIndividualModel');
	let NodeCache = require("node-cache");
	let myCache = new NodeCache({ stdTTL: 60 * 60 * 1 * 24 * 30, checkperiod: 0 });

	function listVeteranList() {
		return new Promise(function (resolve, reject) {

			let listQuery = 'SELECT s.uuid,s.first_name,s.middle_initial,s.last_name,s.email,DATE_FORMAT(s.date_created, "%Y-%m-%d") as date_created,DATE_FORMAT(s.last_login, "%Y-%m-%d") as last_login,s.site_source,rc.c_contacts FROM students as s LEFT JOIN student_profile as sp ON s.uuid = sp.uuid LEFT JOIN (SELECT student_id,count(distinct(college_id)) as c_contacts FROM `recon_messages` GROUP BY student_id) as rc ON s.uuid=rc.student_id  WHERE s.user_account_status = "ACTIVE" ORDER BY date_created DESC';

			mysqlService.query(listQuery)
				.then(function (response) {
					resolve(response);
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}

	function dashboardReportList(reportData) {
		return new Promise(function (resolve, reject) {

			let listQuery = 'SELECT s.uuid,s.first_name,s.middle_initial,s.last_name,s.email,DATE_FORMAT(s.date_created, "%Y-%m-%d") as date_created,DATE_FORMAT(s.last_login, "%Y-%m-%d") as last_login,s.site_source,rc.c_contacts FROM students as s LEFT JOIN student_profile as sp ON s.uuid = sp.uuid LEFT JOIN (SELECT student_id,count(distinct(college_id)) as c_contacts FROM `recon_messages` GROUP BY student_id) as rc ON s.uuid=rc.student_id  WHERE s.user_account_status = "ACTIVE" AND MONTH(s.date_created)=' + reportData.month + ' AND YEAR(s.date_created)=' + reportData.year + ' ORDER BY date_created DESC';

			mysqlService.query(listQuery)
				.then(function (response) {
					resolve(response);
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}

	function VeteraninfoReportList(reportData) {
		return new Promise(function (resolve, reject) {
			let listQuery = 'SELECT s.uuid,sp.state,sp.military_status,sp.phone_number,s.first_name,s.middle_initial,s.last_name,s.email,s.nag_email_subscription,DATE_FORMAT(s.date_created, "%Y-%m-%d") as date_created,DATE_FORMAT(s.last_login, "%Y-%m-%d") as last_login,s.site_source,rc.schools ,comm.pschools FROM students as s LEFT JOIN student_profile as sp ON s.uuid = sp.uuid LEFT JOIN (SELECT student_id,count(distinct(college_id)) as schools FROM `recon_messages` GROUP BY student_id) as rc ON s.uuid=rc.student_id LEFT JOIN (SELECT r.student_id, count(distinct (r.college_id)) as pschools from recon_messages r join colleges c on r.college_id = c.id where c.access_level = "Patriot" group by r.student_id ) as comm ON s.uuid = comm.student_id WHERE s.user_account_status = "ACTIVE"';
			if (reportData.type == 'default') {
				listQuery += ' AND s.date_created >= "2018-01-01"';
			}
			if (reportData.type == 'search') {
				if (reportData.name) {
					listQuery += ' AND (s.first_name like "%' + reportData.name + '%" OR s.last_name like "%' + reportData.name + '%")';
				}
				if (reportData.state) {
					listQuery += ' AND (sp.state = "' + reportData.state + '")';
				}
				if (reportData.dateFrom && reportData.dateTo) {
					listQuery += ' AND date(s.date_created) BETWEEN "' + reportData.dateFrom + '" AND "' + reportData.dateTo + '"'
				}
			}
			listQuery += ' ORDER BY s.date_created  DESC';
			//console.log("QQ:",listQuery);
			mysqlService.query(listQuery)
				.then(function (response) {
					resolve(reportVeteraninfoModel(response));
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}

	function ComminicationstatsReportList(reportData) {
		return new Promise(function (resolve, reject) {
			let searchlist = "";
			let dateSet = "";
			if (reportData.dateFrom && reportData.dateTo) {
				searchlist = "SELECT * from (SELECT c.id,c.college_name , c.status,  (	SELECT nomess from (select college_id, count(DISTINCT(student_id)) as nomess from recon_messages where date(date_created) BETWEEN '" + reportData.dateFrom + "' AND '" + reportData.dateTo + "' AND responder = 'USER' group by college_id) a where a.college_id = c.id ) as nomess ,( 	SELECT received_date from (SELECT college_id , max(date_created) as received_date from recon_messages where recipient = 'College' AND date(date_created) BETWEEN '" + reportData.dateFrom + "' AND '" + reportData.dateTo + "' GROUP by college_id) b where b.college_id = c.id ) as received_date ,( select noreply from (SELECT m.college_id,count(distinct(m.student_id)) as noreply FROM recon_messages  m JOIN  ( SELECT message_id FROM recon_messages GROUP BY message_id HAVING count(responder) = 1 ) mm on m.message_id = mm.message_id AND m.responder = 'USER' AND m.recipient = 'COLLEGE' AND date(m.date_created) BETWEEN '" + reportData.dateFrom + "' AND '" + reportData.dateTo + "' GROUP BY m.college_id) d  where d.college_id = c.id) as noreply FROM colleges c where c.status = 'ACTIVE')aa where aa.nomess is not null  ORDER BY `aa`.`nomess`  DESC";
			} else {
				dateSet = "2018-01-01";
				searchlist = "SELECT * from (SELECT c.id,c.college_name , c.status,  (	SELECT nomess from (select college_id, count(DISTINCT(student_id)) as nomess from recon_messages where date_created >= '" + dateSet + "' AND responder = 'USER' group by college_id) a where a.college_id = c.id ) as nomess ,( 	SELECT received_date from (SELECT college_id , max(date_created) as received_date from recon_messages where recipient = 'College' AND date_created >= '" + dateSet + "' GROUP by college_id) b where b.college_id = c.id ) as received_date ,( select noreply from (SELECT m.college_id,count(distinct(m.student_id)) as noreply FROM recon_messages  m JOIN  ( SELECT message_id FROM recon_messages GROUP BY message_id HAVING count(responder) = 1 ) mm on m.message_id = mm.message_id AND m.responder = 'USER' AND m.recipient = 'COLLEGE' AND m.date_created >= '" + dateSet + "' GROUP BY m.college_id) d  where d.college_id = c.id) as noreply FROM colleges c where c.status = 'ACTIVE')aa where aa.nomess is not null  ORDER BY `aa`.`nomess`  DESC";
			}

			//console.log('QQ:',searchlist);
			mysqlService.query(searchlist)
				.then(function (response) {
					resolve(reportCommunicationstatModel(response));
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}
	function listVeteranColleges(sid) {
		return new Promise(function (resolve, reject) {
			var list = "SELECT rc.college_id,max(rc.date_created) as date_received,c.college_name FROM recon_messages as rc LEFT JOIN colleges as c ON c.id = rc.college_id  WHERE rc.student_id='" + sid + "' group by college_id order by date_received desc";
			mysqlService.query(list)
				.then(function (response) {
					resolve(response);
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}

	function listPartnerVeteranColleges(sid) {
		return new Promise(function (resolve, reject) {
			var list = "SELECT rc.college_id,max(rc.date_created) as date_received,c.college_name FROM recon_messages as rc LEFT JOIN colleges as c ON c.id = rc.college_id  WHERE rc.student_id='" + sid + "' AND c.access_level='Patriot' group by college_id order by date_received desc";
			mysqlService.query(list)
				.then(function (response) {
					resolve(response);
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}

	function VeteranByMilitaryStatus(reportData) {
		return new Promise(function (resolve, reject) {
			var list = "";
			if (reportData.dateFrom && reportData.dateTo) {
				list = "select count(*),sum(case when military_status = 'Active' then 1 else 0 end) as `Active Duty`, sum(case when military_status = 'Guard' then 1 else 0 end) as `National Guard`, sum(case when military_status = 'Reserve' then 1 else 0 end) as Reserve, sum(case when military_status = 'Retired' then 1 else 0 end) as Retired, sum(case when military_status = 'Veteran' then 1 else 0 end) as Veteran, sum(case when military_status = 'Spouse' then 1 else 0 end) as Spouse, sum(case when military_status = 'Dependent' then 1 else 0 end) as Dependent, sum(case when military_status = 'Other' then 1 else 0 end) as Other,COUNT(*) AS Total from student_profile where date(date_created) BETWEEN '" + reportData.dateFrom + "' AND '" + reportData.dateTo + "' and military_status is not null and military_status<> ''  and military_status not in ('Military Family Member','Prospective ROTC')";
			} else {
				list = "select count(*),sum(case when military_status = 'Active' then 1 else 0 end) as `Active Duty`, sum(case when military_status = 'Guard' then 1 else 0 end) as `National Guard`, sum(case when military_status = 'Reserve' then 1 else 0 end) as Reserve, sum(case when military_status = 'Retired' then 1 else 0 end) as Retired, sum(case when military_status = 'Veteran' then 1 else 0 end) as Veteran, sum(case when military_status = 'Spouse' then 1 else 0 end) as Spouse, sum(case when military_status = 'Dependent' then 1 else 0 end) as Dependent, sum(case when military_status = 'Other' then 1 else 0 end) as Other,COUNT(*) AS Total from student_profile where date_created >= '2018-01-01' and military_status is not null and military_status<> '' and military_status not in ('Military Family Member','Prospective ROTC')";
			}
			mysqlService.query(list)
				.then(function (response) {
					resolve(response);
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}

	function CollegeReceivedMostMessage(reportData) {
		return new Promise(function (resolve, reject) {
			let searchlist = "";
			let dateSet = "";
			if (reportData.dateFrom && reportData.dateTo) {
				searchlist = "SELECT * from (SELECT c.id,c.college_name , c.status,  (	SELECT nomess from (select college_id, count(DISTINCT(student_id)) as nomess from recon_messages where date(date_created) BETWEEN '" + reportData.dateFrom + "' AND '" + reportData.dateTo + "' AND responder = 'USER' group by college_id) a where a.college_id = c.id ) as nomess ,( 	SELECT received_date from (SELECT college_id , max(date_created) as received_date from recon_messages where recipient = 'College' AND date(date_created) BETWEEN '" + reportData.dateFrom + "' AND '" + reportData.dateTo + "' GROUP by college_id) b where b.college_id = c.id ) as received_date FROM colleges c where c.status = 'ACTIVE')aa where aa.nomess is not null  ORDER BY `aa`.`nomess`  DESC LIMIT 50";
			} else {
				dateSet = "2018-01-01";
				searchlist = "SELECT * from (SELECT c.id,c.college_name , c.status,  (	SELECT nomess from (select college_id, count(DISTINCT(student_id)) as nomess from recon_messages where date_created >= '" + dateSet + "' AND responder = 'USER' group by college_id) a where a.college_id = c.id ) as nomess ,( 	SELECT received_date from (SELECT college_id , max(date_created) as received_date from recon_messages where recipient = 'College' AND date_created >= '" + dateSet + "' GROUP by college_id) b where b.college_id = c.id ) as received_date FROM colleges c where c.status = 'ACTIVE')aa where aa.nomess is not null  ORDER BY `aa`.`nomess`  DESC LIMIT 50";
			}

			//console.log('QQ:',searchlist);
			mysqlService.query(searchlist)
				.then(function (response) {
					resolve(reportCommunicationstatModel(response));
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}

	function CollegeNoReplyMessage(reportData) {
		return new Promise(function (resolve, reject) {
			let searchlist = "";
			let dateSet = "";
			if (reportData.dateFrom && reportData.dateTo) {
				searchlist = "SELECT * from (SELECT c.id,c.college_name , c.status,  (	SELECT nomess from (select college_id, count(DISTINCT(message_id)) as nomess from recon_messages where date(date_created) BETWEEN '" + reportData.dateFrom + "' AND '" + reportData.dateTo + "' group by college_id) a where a.college_id = c.id ) as nomess ,( 	SELECT received_date from (SELECT college_id , max(date_created) as received_date from recon_messages where recipient = 'College' AND date(date_created) BETWEEN '" + reportData.dateFrom + "' AND '" + reportData.dateTo + "' GROUP by college_id) b where b.college_id = c.id ) as received_date ,( select noreply from (SELECT m.college_id,count(distinct(m.message_id)) as noreply FROM recon_messages  m JOIN  ( SELECT message_id FROM recon_messages GROUP BY message_id HAVING count(responder) = 1 ) mm on m.message_id = mm.message_id AND m.responder = 'USER' AND m.recipient = 'COLLEGE' AND date(m.date_created) BETWEEN '" + reportData.dateFrom + "' AND '" + reportData.dateTo + "' GROUP BY m.college_id) d  where d.college_id = c.id) as noreply FROM colleges c where c.status = 'ACTIVE')aa where aa.nomess is not null  AND aa.nomess >=5 AND aa.noreply = aa.nomess ORDER BY `aa`.`nomess`  DESC";
			} else {
				dateSet = "2018-01-01";
				searchlist = "SELECT * from (SELECT c.id,c.college_name , c.status,  (	SELECT nomess from (select college_id, count(DISTINCT(message_id)) as nomess from recon_messages where date_created >= '" + dateSet + "' group by college_id) a where a.college_id = c.id ) as nomess ,( 	SELECT received_date from (SELECT college_id , max(date_created) as received_date from recon_messages where recipient = 'College' AND date_created >= '" + dateSet + "' GROUP by college_id) b where b.college_id = c.id ) as received_date ,( select noreply from (SELECT m.college_id,count(distinct(m.message_id)) as noreply FROM recon_messages  m JOIN  ( SELECT message_id FROM recon_messages GROUP BY message_id HAVING count(responder) = 1 ) mm on m.message_id = mm.message_id AND m.responder = 'USER' AND m.recipient = 'COLLEGE' AND m.date_created >= '" + dateSet + "' GROUP BY m.college_id) d  where d.college_id = c.id) as noreply FROM colleges c where c.status = 'ACTIVE')aa where aa.nomess is not null  AND aa.nomess >=5 AND aa.noreply = aa.nomess ORDER BY `aa`.`nomess`  DESC";
			}

			//console.log('QQ:',searchlist);
			mysqlService.query(searchlist)
				.then(function (response) {
					resolve(reportCommunicationstatModel(response));
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}

	function veteranByMessageSource(reportData) {
		return new Promise(function (resolve, reject) {
			let searchlist = "";
			let dateSet = "";
			if (reportData.dateFrom && reportData.dateTo) {
				searchlist = "SELECT s.primary_source, s.secondary_source, count(DISTINCT s.uuid) as veteran_count, count(DISTINCT msg.college_id) as college_count,count(distinct msg.pcount) as patriotcount from students s LEFT JOIN (SELECT id, college_id, student_id,primary_source,secondary_source, (select c.id from colleges c where c.access_level='Patriot' and c.id= r.college_id) as pcount from recon_messages r where r.responder ='USER' and primary_source is not null and secondary_source like '/register%' and date(date_created) BETWEEN '" + reportData.dateFrom + "' AND '" + reportData.dateTo + "') as msg on msg.student_id = s.uuid and s.primary_source = msg.primary_source and s.secondary_source = msg.secondary_source where s.primary_source is not null";
				if (reportData.primarySource) {
					searchlist += " and s.primary_source= '" + reportData.primarySource + "'";
				}
				if (reportData.secondarySource) {
					if (reportData.secondarySource == '/register') {
						if (reportData.primarySource && reportData.primarySource == 'vaClaims') {
							searchlist += " and s.secondary_source like '" + reportData.secondarySource + "%'";
						}else{
							if(!reportData.primarySource){
								searchlist += " and (s.secondary_source = '" + reportData.secondarySource + "' or s.secondary_source like '/register/?q=%')";
							}else{
								searchlist += " and s.secondary_source = '" + reportData.secondarySource + "'";
							}
						}
					} else if (reportData.secondarySource == '/register/request-info') {
						searchlist += " and s.secondary_source like '" + reportData.secondarySource + "%' and s.secondary_source not like '/register/request-info/getstarted%' and s.secondary_source not like '/register/request-info/calcmatch%'";
					} else if (reportData.secondarySource == '/register/request-info/calcmatch') {
						searchlist += " and s.secondary_source like '" + reportData.secondarySource + "%'";
					}  else if (reportData.secondarySource == '/register/request-info/getstarted') {
						searchlist += " and (s.secondary_source like '" + reportData.secondarySource + "%' or s.secondary_source like '/register/request-info/?q=getstarted%')";
					}  else if (reportData.secondarySource == '/register/utmsource/bold') {
						searchlist += " and s.secondary_source like '" + reportData.secondarySource + "%'";
					} else {
						searchlist += " and s.secondary_source like '" + reportData.secondarySource + "%'";
					}
				}
				searchlist += " and date(s.date_created) BETWEEN '" + reportData.dateFrom + "' AND '" + reportData.dateTo + "' and s.user_account_status = 'ACTIVE' group by s.primary_source, s.secondary_source";
			} else {
				dateSet = "2018-01-01";
				searchlist = "SELECT s.primary_source, s.secondary_source, count(DISTINCT s.uuid) as veteran_count, count(DISTINCT msg.college_id) as college_count,count(distinct msg.pcount) as patriotcount from students s LEFT JOIN (SELECT id, college_id, student_id,primary_source,secondary_source, (select c.id from colleges c where c.access_level='Patriot' and c.id= r.college_id) as pcount from recon_messages r where r.responder ='USER' and primary_source is not null and secondary_source like '/register%' and date_created >= '" + dateSet + "') as msg on msg.student_id = s.uuid and s.primary_source = msg.primary_source and s.secondary_source = msg.secondary_source where s.primary_source is not null";
				if (reportData.primarySource) {
					searchlist += " and s.primary_source= '" + reportData.primarySource + "'";
				}
				if (reportData.secondarySource) {
					if (reportData.secondarySource == '/register') {
						if (reportData.primarySource && reportData.primarySource == 'vaClaims') {
							searchlist += " and s.secondary_source like '" + reportData.secondarySource + "'";
						}else{
							if(!reportData.primarySource){
								searchlist += " and (s.secondary_source = '" + reportData.secondarySource + "' or s.secondary_source like '/register/?q=%')";
							}else{
								searchlist += " and s.secondary_source = '" + reportData.secondarySource + "'";
							}
						}
					} else if (reportData.secondarySource == '/register/request-info') {
						searchlist += " and s.secondary_source like '" + reportData.secondarySource + "%' and s.secondary_source not like '/register/request-info/getstarted%'  and s.secondary_source not like '/register/request-info/calcmatch%'";
					} else if (reportData.secondarySource == '/register/request-info/calcmatch') {
						searchlist += " and s.secondary_source like '" + reportData.secondarySource + "%'";
					} else if (reportData.secondarySource == '/register/request-info/getstarted') {
						searchlist += " and (s.secondary_source like '" + reportData.secondarySource + "%' or s.secondary_source like '/register/request-info/?q=getstarted%')";
					} else if (reportData.secondarySource == '/register/utmsource/bold') {
						searchlist += " and s.secondary_source like '" + reportData.secondarySource + "%'";
					} else {
						searchlist += " and s.secondary_source like '" + reportData.secondarySource + "%'";
					}
				}
				searchlist += " and s.date_created >= '" + dateSet + "' and s.user_account_status = 'ACTIVE' group by s.primary_source, s.secondary_source";
			}

			// console.log('QQ:',searchlist);
			mysqlService.query(searchlist)
				.then(function (response) {
					resolve(response);
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}

	function collegeUserActivity(reportData) {
		return new Promise(function (resolve, reject) {
			let searchlist = "";
			let dateSet = "";
			let checkCache = "";
			/*console.log("Month:",reportData.mname);
			mykeys = myCache.keys();
			console.log("Cache List:",mykeys);*/
			//let cmonth = myCache.get("monthName");
			if (reportData.mname) {
				checkCache = myCache.get(reportData.mname);
			}

			if (reportData.type && reportData.type == "cachemonth" && reportData.mname && checkCache) {
				resolve(checkCache);
			} else {
				let noreplyQuery = "";
				let scontactQuery = "";
				let searchQuery = "";
				let filterQuery = "";
				let registerQuery = "";
				let bookmarkQuery = "";
				let contactinfoQuery = "";
				let tabQuery = "";
				if (reportData.dateFrom && reportData.dateTo) {
					noreplyQuery = "select c.id, college_name, max(t.noreply) as noreply from colleges c left JOIN (select college_id ,count(distinct student_id) as noreply from recon_messages a join (SELECT college_id as col,message_id, max(date_created) as maxdate from recon_messages where date_created BETWEEN '" + reportData.dateFrom + "' AND '" + reportData.dateTo + "' group by college_id,message_id) b on a.college_id = b.col and a.message_id = b.message_id and a.date_created = b.maxdate where a.responder = 'USER' GROUP by college_id) t on c.id = t.college_id where c.status ='ACTIVE' group by c.id ,college_name ORDER BY college_name ASC";

					scontactQuery = "select c.id, college_name,r.scount from colleges c LEFT JOIN (SELECT college_id,count(distinct student_id) as scount FROM recon_messages where responder= 'USER' and date_created  BETWEEN '" + reportData.dateFrom + "' AND '" + reportData.dateTo + "' GROUP BY college_id) r on c.id = r.college_id where c.status ='ACTIVE' group by c.id ,c.college_name ORDER BY college_name ASC";

					searchQuery = "select c.id, college_name,max(ct.cn) as searchboxtotal from colleges c left JOIN (SELECT college_id,count(*) as cn FROM college_search_tracking where date_created BETWEEN '" + reportData.dateFrom + "' AND '" + reportData.dateTo + "' and secondary_source in ('url','list') group by college_id) ct on c.id = ct.college_id where c.status ='ACTIVE' group by c.id ,c.college_name ORDER BY college_name ASC";

					filterQuery = "select c.id, college_name,count(sct.id) as searchresult from colleges c left join searchresult_colleges_tracking as sct on sct.college_id=c.id where c.status ='ACTIVE' AND sct.date_created BETWEEN '" + reportData.dateFrom + "' AND '" + reportData.dateTo + "' AND sct.secondary_source = 'filter' group by c.id ,college_name ORDER BY college_name ASC";

					registerQuery = "select c.id, college_name,count(sct.id) as savedschool from colleges c left join searchresult_colleges_tracking as sct on sct.college_id=c.id where c.status ='ACTIVE' AND sct.date_created BETWEEN '" + reportData.dateFrom + "' AND '" + reportData.dateTo + "' AND sct.secondary_source = 'register' group by c.id ,college_name ORDER BY college_name ASC";

					bookmarkQuery = "select c.id, college_name,count(bt.id) as bookmarkschool from colleges c left join bookmark_tracking as bt ON bt.college_id = c.id where c.status ='ACTIVE' AND date(bt.date_clicked) BETWEEN '" + reportData.dateFrom + "' AND '" + reportData.dateTo + "' AND FIND_IN_SET(c.id,bt.college_id) group by c.id ,college_name ORDER BY college_name ASC";

					contactinfoQuery = "select c.id, college_name,count(cit.id) as contactinfo from colleges c left join contactinfo_tracking as cit ON cit.college_id = c.id where c.status ='ACTIVE' AND date(cit.date_created) BETWEEN '" + reportData.dateFrom + "' AND '" + reportData.dateTo + "' AND FIND_IN_SET(c.id,cit.college_id) group by c.id ,college_name ORDER BY college_name ASC";

					tabQuery = "select c.id, college_name,count(tct.id) as tabsclicked from colleges c left join tab_click_tracking as tct ON tct.college_id = c.id where c.status ='ACTIVE' AND date(tct.date_clicked) BETWEEN '" + reportData.dateFrom + "' AND '" + reportData.dateTo + "' AND FIND_IN_SET(c.id,tct.college_id) group by c.id ,college_name ORDER BY college_name ASC";
				} else {
					dateSet = "2018-01-01";
					noreplyQuery = "select c.id, college_name, max(t.noreply) as noreply from colleges c left JOIN (select college_id ,count(distinct student_id) as noreply from recon_messages a join (SELECT college_id as col,message_id, max(date_created) as maxdate from recon_messages where date_created >= '" + dateSet + "' group by college_id,message_id) b on a.college_id = b.col and a.message_id = b.message_id and a.date_created = b.maxdate where a.responder = 'USER' GROUP by college_id) t on c.id = t.college_id where c.status ='ACTIVE' group by c.id ,college_name ORDER BY college_name ASC";

					scontactQuery = "select c.id, college_name,r.scount from colleges c LEFT JOIN (SELECT college_id,count(distinct student_id) as scount FROM recon_messages where responder= 'USER' and date_created  >= '" + dateSet + "' GROUP BY college_id) r on c.id = r.college_id where c.status ='ACTIVE' group by c.id ,c.college_name ORDER BY college_name ASC";

					searchQuery = "select c.id, college_name,max(ct.cn) as searchboxtotal from colleges c left JOIN (SELECT college_id,count(*) as cn FROM college_search_tracking where date_created >= '" + dateSet + "' and secondary_source in ('url','list') group by college_id) ct on c.id = ct.college_id where c.status ='ACTIVE' group by c.id ,c.college_name ORDER BY college_name ASC";

					filterQuery = "select c.id, college_name,count(sct.id) as searchresult from colleges c left join searchresult_colleges_tracking as sct on sct.college_id=c.id where c.status ='ACTIVE' AND sct.date_created >= '" + dateSet + "' AND sct.secondary_source = 'filter' group by c.id ,college_name ORDER BY college_name ASC";

					registerQuery = "select c.id, college_name,count(sct.id) as savedschool from colleges c left join searchresult_colleges_tracking as sct on sct.college_id=c.id where c.status ='ACTIVE' AND sct.date_created >= '" + dateSet + "' AND sct.secondary_source = 'register' group by c.id ,college_name ORDER BY college_name ASC";

					bookmarkQuery = "select c.id, college_name,count(bt.id) as bookmarkschool from colleges c left join bookmark_tracking as bt ON bt.college_id = c.id where c.status ='ACTIVE' AND date(bt.date_clicked) >= '" + dateSet + "' AND FIND_IN_SET(c.id,bt.college_id) group by c.id ,college_name ORDER BY college_name ASC";

					contactinfoQuery = "select c.id, college_name,count(cit.id) as contactinfo from colleges c left join contactinfo_tracking as cit ON cit.college_id = c.id where c.status ='ACTIVE' AND date(cit.date_created) >= '" + dateSet + "' AND FIND_IN_SET(c.id,cit.college_id) group by c.id ,college_name ORDER BY college_name ASC";

					tabQuery = "select c.id, college_name,count(tct.id) as tabsclicked from colleges c left join tab_click_tracking as tct ON tct.college_id = c.id where c.status ='ACTIVE' AND date(tct.date_clicked) >= '" + dateSet + "' AND FIND_IN_SET(c.id,tct.college_id) group by c.id ,college_name ORDER BY college_name ASC";
				}
				// console.log('QQ:',contactinfoQuery);
				mysqlService.query1(noreplyQuery)
					.then(function (response) {
						mysqlService.query1(scontactQuery)
						.then(function (response1) {
							mysqlService.query1(searchQuery)
							.then(function (response2) {
								mysqlService.query1(filterQuery)
								.then(function (response3) {
									mysqlService.query1(registerQuery)
									.then(function (response4) {
										mysqlService.query1(bookmarkQuery)
										.then(function (response5) {
											mysqlService.query1(contactinfoQuery)
											.then(function (response6) {
												mysqlService.query1(tabQuery)
												.then(function (response7) {
													if (reportData.type == "cachemonth") {
														myCache.set(reportData.mname, superAdminUserActivityModel(response,response1,response2,response3,response4,response5,response6,response7));
													}
													resolve(superAdminUserActivityModel(response,response1,response2,response3,response4,response5,response6,response7));	
												}, function (err) {
													if (err) {
														var error = err;
														error.status = 503;
														return reject(error)
													};
												})
											}, function (err) {
												if (err) {
													var error = err;
													error.status = 503;
													return reject(error)
												};
											})
											}, function (err) {
											if (err) {
												var error = err;
												error.status = 503;
												return reject(error)
											};
										}, function (err) {
											if (err) {
												var error = err;
												error.status = 503;
												return reject(error)
											};
										})
									}, function (err) {
										if (err) {
											var error = err;
											error.status = 503;
											return reject(error)
										};
									});
									
								}, function (err) {
									if (err) {
										var error = err;
										error.status = 503;
										return reject(error)
									};
								});
								
							}, function (err) {
								if (err) {
									var error = err;
									error.status = 503;
									return reject(error)
								};
							});
							
						}, function (err) {
							if (err) {
								var error = err;
								error.status = 503;
								return reject(error)
							};
						});
					}, function (err) {
						if (err) {
							var error = err;
							error.status = 503;
							return reject(error)
						};
					});
			}
		});
	}

	function partnerCollegeUserActivity(reportData) {
		return new Promise(function (resolve, reject) {
			let thisMonthFirstDay = reportData.thisMonthFirstDay;
			let thisMonthLastDay = reportData.thisMonthLastDay;
			let lastMonthFirstDay = reportData.lastMonthFirstDay;
			let lastMonthLastDay =reportData.lastMonthLastDay;
			let lastTwoMonthFirstDay = reportData.lastTwoMonthFirstDay;
			let lastTwoMonthLastDay = reportData.lastTwoMonthLastDay;
			let lastThreeMonthFirstDAy = reportData.lastThreeMonthFirstDAy;
			let lastThreeMonthLastDAy = reportData.lastThreeMonthLastDAy;
			let searchlist = "";
			/*searchlist = "SELECT  id,college_name, group_concat(searchboxtotal3) as searchboxtotal3, group_concat(searchboxtotal2) as searchboxtotal2, group_concat(searchboxtotal1) as searchboxtotal1, group_concat(searchboxtotal) as searchboxtotal, group_concat(scount3)  as scount3,	group_concat(scount2)  as scount2, group_concat(scount1)  as scount1, group_concat(scount)  as scount from (select c.id, college_name, max(ct.cn) as searchboxtotal, max(ct1.cn1) as searchboxtotal1, max(ct2.cn2) as searchboxtotal2, max(ct3.cn3) as searchboxtotal3, count(distinct r.student_id) as scount, count(distinct r1.student_id) as scount1, count(distinct r2.student_id) as scount2,	count(distinct r3.student_id) as scount3 from colleges c left JOIN (SELECT  college_id,count(*) as cn FROM college_search_tracking where date(date_created) BETWEEN '" + thisMonthFirstDay  + "' AND '" + thisMonthLastDay  + "' group by college_id) ct on c.id = ct.college_id left JOIN (SELECT  college_id,count(*) as cn1 FROM college_search_tracking where date(date_created) BETWEEN '" + lastMonthFirstDay  + "' AND '" + lastMonthLastDay  + "' group by college_id) ct1 on c.id = ct1.college_id left JOIN (SELECT  college_id,count(*) as cn2 FROM college_search_tracking where date(date_created) BETWEEN '" + lastTwoMonthFirstDay  + "' AND '" + lastTwoMonthLastDay  + "' group by college_id) ct2 on c.id = ct2.college_id left JOIN (SELECT  college_id,count(*) as cn3 FROM college_search_tracking where date(date_created) BETWEEN '" + lastThreeMonthFirstDAy  + "' AND '" + lastThreeMonthLastDAy  + "' group by college_id) ct3 on c.id = ct3.college_id LEFT JOIN recon_messages r on c.id = r.college_id and r.responder= 'USER' and date(r.date_created) BETWEEN '" + thisMonthFirstDay   + "' AND '" + thisMonthLastDay   + "' LEFT JOIN recon_messages r1 on c.id = r1.college_id and r1.responder= 'USER' and date(r1.date_created) BETWEEN '" + lastMonthFirstDay  + "' AND '" + lastMonthLastDay  + "' LEFT JOIN recon_messages r2 on c.id = r2.college_id and r2.responder= 'USER' and date(r2.date_created) BETWEEN '" + lastTwoMonthFirstDay  + "' AND '" + lastTwoMonthLastDay  + "' LEFT JOIN recon_messages r3 on c.id = r3.college_id and r3.responder= 'USER' and date(r3.date_created) BETWEEN '" + lastThreeMonthFirstDAy  + "' AND '" + lastThreeMonthLastDAy  + "' where c.status ='ACTIVE' and c.access_level = 'Patriot' group by c.id ,c.college_name)a group by id,college_name order by college_name ASC";*/
			let filterType = " and 1=1 ";
			if(reportData.searchType == "patriot"){
				filterType = " and c.specific_profile_id=0 ";
			}else if(reportData.searchType == "specific"){
				filterType = " and c.specific_profile_id!=0 ";;
			}
			let monthQuery = "select c.id, (SELECT college_name FROM colleges where id=cdsi.college_id) as specificname, college_name,max(ct.cn) as searchboxtotal,count(distinct r.student_id) as scount from colleges c left JOIN (SELECT college_id,count(*) as cn FROM college_search_tracking where date(date_created) BETWEEN '" + thisMonthFirstDay  + "' AND '" + thisMonthLastDay  + "' and secondary_source in ('url','list') group by college_id) ct on c.id = ct.college_id LEFT JOIN recon_messages r on c.id = r.college_id and r.responder= 'USER' and date(r.date_created) BETWEEN '" + thisMonthFirstDay  + "' AND '" + thisMonthLastDay  + "' LEFT JOIN college_degree_specific_info as cdsi ON c.specific_profile_id=cdsi.id where c.status ='ACTIVE' and c.access_level = 'Patriot' "+filterType+" group by c.id ,cdsi.college_id,c.college_name order by c.college_name ASC ";
			let lastmonthQuery = "select c.id, (SELECT college_name FROM colleges where id=cdsi.college_id) as specificname, college_name,max(ct.cn) as searchboxtotal1,count(distinct r.student_id) as scount1 from colleges c left JOIN (SELECT college_id,count(*) as cn FROM college_search_tracking where date(date_created) BETWEEN '" + lastMonthFirstDay  + "' AND '" + lastMonthLastDay  + "' and secondary_source in ('url','list') group by college_id) ct on c.id = ct.college_id LEFT JOIN recon_messages r on c.id = r.college_id and r.responder= 'USER' and date(r.date_created) BETWEEN '" + lastMonthFirstDay  + "' AND '" + lastMonthLastDay  + "' LEFT JOIN college_degree_specific_info as cdsi ON c.specific_profile_id=cdsi.id where c.status ='ACTIVE' and c.access_level = 'Patriot' "+filterType+" group by c.id ,cdsi.college_id,c.college_name order by c.college_name ASC ";
			let twomonthQuery = "select c.id, (SELECT college_name FROM colleges where id=cdsi.college_id) as specificname, college_name,max(ct.cn) as searchboxtotal2,count(distinct r.student_id) as scount2 from colleges c left JOIN (SELECT college_id,count(*) as cn FROM college_search_tracking where date(date_created) BETWEEN '" + lastTwoMonthFirstDay  + "' AND '" + lastTwoMonthLastDay  + "' and secondary_source in ('url','list') group by college_id) ct on c.id = ct.college_id LEFT JOIN recon_messages r on c.id = r.college_id and r.responder= 'USER' and date(r.date_created) BETWEEN '" + lastTwoMonthFirstDay  + "' AND '" + lastTwoMonthLastDay  + "' LEFT JOIN college_degree_specific_info as cdsi ON c.specific_profile_id=cdsi.id where c.status ='ACTIVE' and c.access_level = 'Patriot' "+filterType+" group by c.id ,cdsi.college_id,c.college_name order by c.college_name ASC ";
			let threemonthQuery = "select c.id, (SELECT college_name FROM colleges where id=cdsi.college_id) as specificname, college_name,max(ct.cn) as searchboxtotal3,count(distinct r.student_id) as scount3 from colleges c left JOIN (SELECT college_id,count(*) as cn FROM college_search_tracking where date(date_created) BETWEEN '" + lastThreeMonthFirstDAy  + "' AND '" + lastThreeMonthLastDAy  + "' and secondary_source in ('url','list') group by college_id) ct on c.id = ct.college_id LEFT JOIN recon_messages r on c.id = r.college_id and r.responder= 'USER' and date(r.date_created) BETWEEN '" + lastThreeMonthFirstDAy  + "' AND '" + lastThreeMonthLastDAy  + "' LEFT JOIN college_degree_specific_info as cdsi ON c.specific_profile_id=cdsi.id where c.status ='ACTIVE' and c.access_level = 'Patriot' "+filterType+" group by c.id ,cdsi.college_id,c.college_name order by c.college_name ASC ";
			//  console.log("qq:",searchlist);
			mysqlService.query1(monthQuery)
				.then(function (response) {
					mysqlService.query1(lastmonthQuery)
					.then(function (response1) {
						mysqlService.query1(twomonthQuery)
						.then(function (response2) {
							mysqlService.query1(threemonthQuery)
							.then(function (response3) {
								resolve(superAdminPartnerCollegeUserActivityModel(response,response1,response2,response3));
								//resolve(response);
							}, function (err) {
								if (err) {
									var error = err;
									error.status = 503;
									return reject(error)
								};
							});
						}, function (err) {
							if (err) {
								var error = err;
								error.status = 503;
								return reject(error)
							};
						});
					}, function (err) {
						if (err) {
							var error = err;
							error.status = 503;
							return reject(error)
						};
					});
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}

	function veteranBySourceFilterTotal(reportData) {
		return new Promise(function (resolve, reject) {
			let searchlist = "";
			let dateSet = "";
			if (reportData.dateFrom && reportData.dateTo) {
				searchlist = "SELECT COUNT(*) as total";

				if (reportData.primarySource && reportData.secondarySource) {
					let priname = "searchtotal";
					if (reportData.primarySource == 'app' || reportData.primarySource == 'legion' || reportData.primarySource == 'military') {
						priname = reportData.primarySource + "total";
					}else if(reportData.primarySource == 'vaClaims'){
						priname = "claimtotal";
					}else if(reportData.primarySource == 'mymilitarybenefits'){
						priname = "benefittotal";
					}else if(reportData.primarySource == 'careerrecon'){
						priname = "careertotal";
					}
					searchlist += ",SUM(CASE WHEN primary_source = '" + reportData.primarySource + "' THEN 1 ELSE 0 END) as " + priname;
					if (reportData.secondarySource == '/register') {
						if(reportData.primarySource == 'vaClaims'){
							searchlist += ",SUM(CASE WHEN primary_source = '" + reportData.primarySource + "' AND secondary_source like '/register%' THEN 1 ELSE 0 END) as registertotal";
						}else if(reportData.primarySource == 'careerrecon'){
							searchlist += ",SUM(CASE WHEN primary_source = '" + reportData.primarySource + "' AND secondary_source like '/register%' THEN 1 ELSE 0 END) as registertotal";
						}else{
							searchlist += ",SUM(CASE WHEN primary_source = '" + reportData.primarySource + "' AND secondary_source = '/register' THEN 1 ELSE 0 END) as registertotal";
						}
					} else if (reportData.secondarySource == '/register/request-info') {
						searchlist += ",SUM(CASE WHEN primary_source = '" + reportData.primarySource + "' AND secondary_source LIKE '/register/request-info%' AND secondary_source  NOT LIKE '/register/request-info/getstarted%' AND secondary_source  NOT LIKE '/register/request-info/calcmatch%' AND secondary_source  NOT LIKE '/register/request-info/?q=%' THEN 1 ELSE 0 END) as requesttotal";
					} else if (reportData.secondarySource == '/register/contact-info') {
						searchlist += ",SUM(CASE WHEN primary_source = '" + reportData.primarySource + "' AND secondary_source LIKE '/register/contact-info%' THEN 1 ELSE 0 END) as contacttotal";
					} else if (reportData.secondarySource == '/register/request-info/calcmatch') {
						searchlist += ",SUM(CASE WHEN primary_source = '" + reportData.primarySource + "' AND secondary_source like '/register/request-info/calcmatch%' THEN 1 ELSE 0 END) as matchtotal";
					} else if (reportData.secondarySource == '/register/request-info/calcmatch/app') {
						searchlist += ",SUM(CASE WHEN primary_source = '" + reportData.primarySource + "' AND secondary_source like '/register/request-info/calcmatch/app%' THEN 1 ELSE 0 END) as appmatchtotal";
					} else if (reportData.secondarySource == '/register/request-info/calcmatch/legion') {
						searchlist += ",SUM(CASE WHEN primary_source = '" + reportData.primarySource + "' AND secondary_source like '/register/request-info/calcmatch/legion%' THEN 1 ELSE 0 END) as legionmatchtotal";
					} else if (reportData.secondarySource == '/register/request-info/calcmatch/mbinfo') {
						searchlist += ",SUM(CASE WHEN primary_source = '" + reportData.primarySource + "' AND secondary_source like '/register/request-info/calcmatch/mbinfo%' THEN 1 ELSE 0 END) as mbinfomatchtotal";
					} else if (reportData.secondarySource == '/register/request-info/getstarted') {
                        searchlist += ",SUM(CASE WHEN primary_source = '" + reportData.primarySource + "' AND (secondary_source LIKE '/register/request-info/getstarted%' or secondary_source like '/register/request-info/?q=getstarted%') THEN 1 ELSE 0 END) as startedtotal";
                    } else if (reportData.secondarySource == '/register/request-info/?q=cr-wgt') {
						searchlist += ",SUM(CASE WHEN primary_source = '" + reportData.primarySource + "' AND secondary_source LIKE '/register/request-info/?q=cr-wgt%' THEN 1 ELSE 0 END) as crtotal";
					} else if (reportData.secondarySource == '/register/request-info/?q=mmb-wgt') {
						searchlist += ",SUM(CASE WHEN primary_source = '" + reportData.primarySource + "' AND secondary_source LIKE '/register/request-info/?q=mmb-wgt%' THEN 1 ELSE 0 END) as mmbtotal";
					} else if (reportData.secondarySource == '/question') {
						searchlist += ",SUM(CASE WHEN primary_source = '" + reportData.primarySource + "' AND secondary_source LIKE '/question%' THEN 1 ELSE 0 END) as bentotal";
					} else if (reportData.secondarySource == '/register/utmsource/bold') {
						searchlist += ",SUM(CASE WHEN primary_source = '" + reportData.primarySource + "' AND secondary_source LIKE '/register/utmsource/bold%' THEN 1 ELSE 0 END) as boldtotal";
					} else{
						searchlist += ",SUM(CASE WHEN primary_source = '" + reportData.primarySource + "' AND secondary_source LIKE '/register/request-info/?q=mbi-wgt%' THEN 1 ELSE 0 END) as mbinfototal";
					}

				} else if (reportData.primarySource) {
					if (reportData.primarySource == 'app') {
						searchlist += ",SUM(CASE WHEN primary_source = 'app' THEN 1 ELSE 0 END) as apptotal,SUM(CASE WHEN primary_source = 'app' AND secondary_source = '/register' THEN 1 ELSE 0 END) as registertotal,SUM(CASE WHEN primary_source = 'app' AND secondary_source LIKE '/register/contact-info%' THEN 1 ELSE 0 END) as contacttotal,SUM(CASE WHEN primary_source = 'app' AND secondary_source LIKE '/register/request-info%' AND secondary_source  NOT LIKE '/register/request-info/getstarted%' THEN 1 ELSE 0 END) as requesttotal";
					} else if (reportData.primarySource == 'legion') {
						searchlist += ",SUM(CASE WHEN primary_source = 'legion' THEN 1 ELSE 0 END) as legiontotal,SUM(CASE WHEN primary_source = 'legion' AND secondary_source = '/register' THEN 1 ELSE 0 END) as registertotal,SUM(CASE WHEN primary_source = 'legion' AND secondary_source LIKE '/register/contact-info%' THEN 1 ELSE 0 END) as contacttotal,SUM(CASE WHEN primary_source = 'legion' AND secondary_source LIKE '/register/request-info%' AND secondary_source  NOT LIKE '/register/request-info/getstarted%' THEN 1 ELSE 0 END) as requesttotal";
					} else if(reportData.primarySource == 'military') {
						searchlist += ",SUM(CASE WHEN primary_source = 'military' THEN 1 ELSE 0 END) as militarytotal,SUM(CASE WHEN primary_source = 'military' AND secondary_source = '/register' THEN 1 ELSE 0 END) as registertotal,SUM(CASE WHEN primary_source = 'military' AND secondary_source LIKE '/register/contact-info%' THEN 1 ELSE 0 END) as contacttotal,SUM(CASE WHEN primary_source = 'military' AND secondary_source LIKE '/register/request-info%' AND secondary_source  NOT LIKE '/register/request-info/getstarted%' THEN 1 ELSE 0 END) as requesttotal";
					} else if(reportData.primarySource == 'vaClaims'){
						searchlist += ",SUM(CASE WHEN primary_source = 'vaClaims' THEN 1 ELSE 0 END) as claimtotal,SUM(CASE WHEN primary_source = 'vaClaims' AND secondary_source like '/register%' THEN 1 ELSE 0 END) as registertotal";
					}else if(reportData.primarySource == 'careerrecon'){
						searchlist += ",SUM(CASE WHEN primary_source = 'careerrecon' THEN 1 ELSE 0 END) as careertotal,SUM(CASE WHEN primary_source = 'careerrecon' AND secondary_source like '/register%' THEN 1 ELSE 0 END) as registertotal";
					}else if(reportData.primarySource == 'mymilitarybenefits'){
						searchlist += ",SUM(CASE WHEN primary_source = 'mymilitarybenefits' THEN 1 ELSE 0 END) as benefittotal,SUM(CASE WHEN primary_source = 'mymilitarybenefits' AND secondary_source like '/question%' THEN 1 ELSE 0 END) as bentotal";
					}else {
						searchlist += ",SUM(CASE WHEN primary_source = 'program matcher' THEN 1 ELSE 0 END) as searchtotal,SUM(CASE WHEN primary_source = 'program matcher' AND secondary_source LIKE '/register/request-info%' AND secondary_source  NOT LIKE '/register/request-info/getstarted%' AND secondary_source  NOT LIKE '/register/request-info/calcmatch%' AND secondary_source  NOT LIKE '/register/request-info/?q=%' THEN 1 ELSE 0 END) as requesttotal,SUM(CASE WHEN primary_source = 'program matcher' AND (secondary_source LIKE '/register/request-info/getstarted%' or secondary_source like '/register/request-info/?q=getstarted%') THEN 1 ELSE 0 END) as startedtotal,SUM(CASE WHEN primary_source = 'program matcher' AND secondary_source LIKE '/register/request-info/calcmatch%' THEN 1 ELSE 0 END) as matchtotal,SUM(CASE WHEN primary_source = 'program matcher' AND secondary_source LIKE '/register/request-info/calcmatch/app%' THEN 1 ELSE 0 END) as appmatchtotal,SUM(CASE WHEN primary_source = 'program matcher' AND secondary_source LIKE '/register/request-info/calcmatch/legion%' THEN 1 ELSE 0 END) as legionmatchtotal,SUM(CASE WHEN primary_source = 'program matcher' AND secondary_source LIKE '/register/request-info/calcmatch/mbinfo%' THEN 1 ELSE 0 END) as mbinfomatchtotal,SUM(CASE WHEN secondary_source like '/register/request-info/?q=cr-wgt%' THEN 1 ELSE 0 END) as crtotal,SUM(CASE WHEN secondary_source like '/register/request-info/?q=mmb-wgt%' THEN 1 ELSE 0 END) as mmbtotal,SUM(CASE WHEN secondary_source like '/register/request-info/?q=mbi-wgt%' THEN 1 ELSE 0 END) as mbinfototal,SUM(CASE WHEN secondary_source like '/register/utmsource/bold%' THEN 1 ELSE 0 END) as boldtotal";
					}
				} else if (reportData.secondarySource) {
					searchlist += ",SUM(CASE WHEN primary_source = 'app' THEN 1 ELSE 0 END) as apptotal,SUM(CASE WHEN primary_source = 'legion' THEN 1 ELSE 0 END) as legiontotal,SUM(CASE WHEN primary_source = 'military' THEN 1 ELSE 0 END) as militarytotal,SUM(CASE WHEN primary_source = 'program matcher' THEN 1 ELSE 0 END) as searchtotal,SUM(CASE WHEN primary_source = 'vaClaims' THEN 1 ELSE 0 END) as claimtotal,SUM(CASE WHEN primary_source = 'mymilitarybenefits' THEN 1 ELSE 0 END) as benefittotal,SUM(CASE WHEN primary_source = 'careerrecon' THEN 1 ELSE 0 END) as careertotal";
					if (reportData.secondarySource == '/register') {
						searchlist += ",SUM(CASE WHEN (secondary_source = '/register' OR secondary_source like '/register/?q%') THEN 1 ELSE 0 END) as registertotal";
					} else if (reportData.secondarySource == '/register/request-info') {
						searchlist += ",SUM(CASE WHEN secondary_source LIKE '/register/request-info%' AND secondary_source  NOT LIKE '/register/request-info/getstarted%' AND secondary_source  NOT LIKE '/register/request-info/calcmatch%' AND secondary_source  NOT LIKE '/register/request-info/?q=%' THEN 1 ELSE 0 END) as requesttotal";
					} else if (reportData.secondarySource == '/register/contact-info') {
						searchlist += ",SUM(CASE WHEN secondary_source LIKE '/register/contact-info%' THEN 1 ELSE 0 END) as contacttotal";
					} else if (reportData.secondarySource == '/register/request-info/calcmatch') {
						searchlist += ",SUM(CASE WHEN secondary_source like '/register/request-info/calcmatch%' THEN 1 ELSE 0 END) as matchtotal";
					} else if (reportData.secondarySource == '/register/request-info/calcmatch/app') {
						searchlist += ",SUM(CASE WHEN secondary_source like '/register/request-info/calcmatch/app%' THEN 1 ELSE 0 END) as appmatchtotal";
					} else if (reportData.secondarySource == '/register/request-info/calcmatch/legion') {
						searchlist += ",SUM(CASE WHEN secondary_source like '/register/request-info/calcmatch/legion%' THEN 1 ELSE 0 END) as legionmatchtotal";
					} else if (reportData.secondarySource == '/register/request-info/calcmatch/mbinfo') {
						searchlist += ",SUM(CASE WHEN secondary_source like '/register/request-info/calcmatch/mbinfo%' THEN 1 ELSE 0 END) as mbinfomatchtotal";
					} else if (reportData.secondarySource == '/register/request-info/getstarted'){
						searchlist += ",SUM(CASE WHEN (secondary_source LIKE '/register/request-info/getstarted%' or secondary_source like '/register/request-info/?q=getstarted%') THEN 1 ELSE 0 END) as startedtotal";
					} else if (reportData.secondarySource == '/register/request-info/?q=cr-wgt') {
						searchlist += ",SUM(CASE WHEN secondary_source like '/register/request-info/?q=cr-wgt%' THEN 1 ELSE 0 END) as crtotal";
					} else if (reportData.secondarySource == '/register/request-info/?q=mmb-wgt') {
						searchlist += ",SUM(CASE WHEN secondary_source like '/register/request-info/?q=mmb-wgt%' THEN 1 ELSE 0 END) as mmbtotal";
					} else if (reportData.secondarySource == '/question') {
						searchlist += ",SUM(CASE WHEN secondary_source like '/question%' THEN 1 ELSE 0 END) as bentotal";
					} else if (reportData.secondarySource == '/register/utmsource/bold') {
						searchlist += ",SUM(CASE WHEN secondary_source like '/register/utmsource/bold%' THEN 1 ELSE 0 END) as boldtotal";
					} else{
						searchlist += ",SUM(CASE WHEN secondary_source like '/register/request-info/?q=mbi-wgt%' THEN 1 ELSE 0 END) as mbinfototal";
					}
				} else {
					searchlist += ",SUM(CASE WHEN primary_source = 'app' THEN 1 ELSE 0 END) as apptotal,SUM(CASE WHEN primary_source = 'legion' THEN 1 ELSE 0 END) as legiontotal,SUM(CASE WHEN primary_source = 'military' THEN 1 ELSE 0 END) as militarytotal,SUM(CASE WHEN primary_source = 'program matcher' THEN 1 ELSE 0 END) as searchtotal,SUM(CASE WHEN primary_source = 'vaClaims' THEN 1 ELSE 0 END) as claimtotal,SUM(CASE WHEN primary_source = 'mymilitarybenefits' THEN 1 ELSE 0 END) as benefittotal,SUM(CASE WHEN primary_source = 'careerrecon' THEN 1 ELSE 0 END) as careertotal,SUM(CASE WHEN (secondary_source = '/register' OR secondary_source like '/register/?q%') THEN 1 ELSE 0 END) as registertotal,SUM(CASE WHEN secondary_source LIKE '/register/contact-info%' THEN 1 ELSE 0 END) as contacttotal,SUM(CASE WHEN secondary_source LIKE '/register/request-info%' AND secondary_source  NOT LIKE '/register/request-info/getstarted%' AND secondary_source  NOT LIKE '/register/request-info/calcmatch%' AND secondary_source  NOT LIKE '/register/request-info/?q=%' THEN 1 ELSE 0 END) as requesttotal,SUM(CASE WHEN (secondary_source LIKE '/register/request-info/getstarted%' or secondary_source like '/register/request-info/?q=getstarted%') THEN 1 ELSE 0 END) as startedtotal,SUM(CASE WHEN secondary_source like '/register/request-info/calcmatch%' THEN 1 ELSE 0 END) as matchtotal,SUM(CASE WHEN secondary_source like '/register/request-info/calcmatch/app%' THEN 1 ELSE 0 END) as appmatchtotal,SUM(CASE WHEN secondary_source like '/register/request-info/calcmatch/legion%' THEN 1 ELSE 0 END) as legionmatchtotal,SUM(CASE WHEN secondary_source like '/register/request-info/calcmatch/mbinfo%' THEN 1 ELSE 0 END) as mbinfomatchtotal,SUM(CASE WHEN secondary_source like '/register/request-info/?q=cr-wgt%' THEN 1 ELSE 0 END) as crtotal,SUM(CASE WHEN secondary_source like '/register/request-info/?q=mmb-wgt%' THEN 1 ELSE 0 END) as mmbtotal,SUM(CASE WHEN secondary_source like '/register/request-info/?q=mbi-wgt%' THEN 1 ELSE 0 END) as mbinfototal,SUM(CASE WHEN secondary_source like '/question%' THEN 1 ELSE 0 END) as bentotal,SUM(CASE WHEN secondary_source like '/register/utmsource/bold%' THEN 1 ELSE 0 END) as boldtotal";
				}
				searchlist += " FROM students WHERE date(date_created) BETWEEN '" + reportData.dateFrom + "' AND '" + reportData.dateTo + "' and user_account_status = 'ACTIVE'";
			} else {
				dateSet = "2018-01-01";

				searchlist = "SELECT COUNT(*) as total";

				if (reportData.primarySource && reportData.secondarySource) {
					let priname = "searchtotal";
					if (reportData.primarySource == 'app' || reportData.primarySource == 'legion' || reportData.primarySource == 'military') {
						priname = reportData.primarySource + "total";
					}else if(reportData.primarySource == 'vaClaims'){
						priname = "claimtotal";
					}else if(reportData.primarySource == 'mymilitarybenefits'){
						priname = "benefittotal";
					}else if(reportData.primarySource == 'careerrecon'){
						priname = "careertotal";
					}
					searchlist += ",SUM(CASE WHEN primary_source = '" + reportData.primarySource + "' THEN 1 ELSE 0 END) as " + priname;
					if (reportData.secondarySource == '/register') {
						if(reportData.primarySource == 'vaClaims'){
							searchlist += ",SUM(CASE WHEN primary_source = '" + reportData.primarySource + "' AND secondary_source like '/register%' THEN 1 ELSE 0 END) as registertotal";
						}else if(reportData.primarySource == 'careerrecon'){
							searchlist += ",SUM(CASE WHEN primary_source = '" + reportData.primarySource + "' AND secondary_source like '/register%' THEN 1 ELSE 0 END) as registertotal";
						}else{
							searchlist += ",SUM(CASE WHEN primary_source = '" + reportData.primarySource + "' AND secondary_source = '/register' THEN 1 ELSE 0 END) as registertotal";
						}
					} else if (reportData.secondarySource == '/register/request-info') {
						searchlist += ",SUM(CASE WHEN primary_source = '" + reportData.primarySource + "' AND secondary_source LIKE '/register/request-info%' AND secondary_source  NOT LIKE '/register/request-info/getstarted%' AND secondary_source  NOT LIKE '/register/request-info/calcmatch%' AND secondary_source  NOT LIKE '/register/request-info/q=%' THEN 1 ELSE 0 END) as requesttotal";
					} else if (reportData.secondarySource == '/register/contact-info') {
						searchlist += ",SUM(CASE WHEN primary_source = '" + reportData.primarySource + "' AND secondary_source LIKE '/register/contact-info%' THEN 1 ELSE 0 END) as contacttotal";
					} else if (reportData.secondarySource == '/register/request-info/calcmatch') {
						searchlist += ",SUM(CASE WHEN primary_source = '" + reportData.primarySource + "' AND secondary_source like '/register/request-info/calcmatch%' THEN 1 ELSE 0 END) as matchtotal";
					} else if (reportData.secondarySource == '/register/request-info/calcmatch/app') {
						searchlist += ",SUM(CASE WHEN primary_source = '" + reportData.primarySource + "' AND secondary_source like '/register/request-info/calcmatch/app%' THEN 1 ELSE 0 END) as appmatchtotal";
					} else if (reportData.secondarySource == '/register/request-info/calcmatch/legion') {
						searchlist += ",SUM(CASE WHEN primary_source = '" + reportData.primarySource + "' AND secondary_source like '/register/request-info/calcmatch/legion%' THEN 1 ELSE 0 END) as legionmatchtotal";
					} else if (reportData.secondarySource == '/register/request-info/calcmatch/mbinfo') {
						searchlist += ",SUM(CASE WHEN primary_source = '" + reportData.primarySource + "' AND secondary_source like '/register/request-info/calcmatch/mbinfo%' THEN 1 ELSE 0 END) as mbinfomatchtotal";
					} else if (reportData.secondarySource == '/register/request-info/getstarted') {
                        searchlist += ",SUM(CASE WHEN primary_source = '" + reportData.primarySource + "' AND (secondary_source LIKE '/register/request-info/getstarted%' or secondary_source like '/register/request-info/?q=getstarted%') THEN 1 ELSE 0 END) as startedtotal";
                    } else if (reportData.secondarySource == '/register/request-info/?q=cr-wgt') {
						searchlist += ",SUM(CASE WHEN primary_source = '" + reportData.primarySource + "' AND secondary_source LIKE '/register/request-info/?q=cr-wgt%' THEN 1 ELSE 0 END) as crtotal";
					} else if (reportData.secondarySource == '/register/request-info/?q=mmb-wgt') {
						searchlist += ",SUM(CASE WHEN primary_source = '" + reportData.primarySource + "' AND secondary_source LIKE '/register/request-info/?q=mmb-wgt%' THEN 1 ELSE 0 END) as mmbtotal";
					} else if (reportData.secondarySource == '/question') {
						searchlist += ",SUM(CASE WHEN primary_source = '" + reportData.primarySource + "' AND secondary_source LIKE '/question%' THEN 1 ELSE 0 END) as bentotal";
					} else if (reportData.secondarySource == '/register/utmsource/bold') {
						searchlist += ",SUM(CASE WHEN primary_source = '" + reportData.primarySource + "' AND secondary_source LIKE '/register/utmsource/bold%' THEN 1 ELSE 0 END) as boldtotal";
					} else{
						searchlist += ",SUM(CASE WHEN primary_source = '" + reportData.primarySource + "' AND secondary_source LIKE '/register/request-info/?q=mbi-wgt%' THEN 1 ELSE 0 END) as mbinfototal";
					}

				} else if (reportData.primarySource) {
					if (reportData.primarySource == 'app') {
						searchlist += ",SUM(CASE WHEN primary_source = 'app' THEN 1 ELSE 0 END) as apptotal,SUM(CASE WHEN primary_source = 'app' AND secondary_source = '/register' THEN 1 ELSE 0 END) as registertotal,SUM(CASE WHEN primary_source = 'app' AND secondary_source LIKE '/register/contact-info%' THEN 1 ELSE 0 END) as contacttotal,SUM(CASE WHEN primary_source = 'app' AND secondary_source LIKE '/register/request-info%' AND secondary_source  NOT LIKE '/register/request-info/getstarted%' THEN 1 ELSE 0 END) as requesttotal";
					} else if (reportData.primarySource == 'legion') {
						searchlist += ",SUM(CASE WHEN primary_source = 'legion' THEN 1 ELSE 0 END) as legiontotal,SUM(CASE WHEN primary_source = 'legion' AND secondary_source = '/register' THEN 1 ELSE 0 END) as registertotal,SUM(CASE WHEN primary_source = 'legion' AND secondary_source LIKE '/register/contact-info%' THEN 1 ELSE 0 END) as contacttotal,SUM(CASE WHEN primary_source = 'legion' AND secondary_source LIKE '/register/request-info%' AND secondary_source  NOT LIKE '/register/request-info/getstarted%' THEN 1 ELSE 0 END) as requesttotal";
					} else if (reportData.primarySource == 'military') {
						searchlist += ",SUM(CASE WHEN primary_source = 'military' THEN 1 ELSE 0 END) as militarytotal,SUM(CASE WHEN primary_source = 'military' AND secondary_source = '/register' THEN 1 ELSE 0 END) as registertotal,SUM(CASE WHEN primary_source = 'military' AND secondary_source LIKE '/register/contact-info%' THEN 1 ELSE 0 END) as contacttotal,SUM(CASE WHEN primary_source = 'military' AND secondary_source LIKE '/register/request-info%' AND secondary_source  NOT LIKE '/register/request-info/getstarted%' THEN 1 ELSE 0 END) as requesttotal";
					} else if(reportData.primarySource == 'vaClaims'){
						searchlist += ",SUM(CASE WHEN primary_source = 'vaClaims' THEN 1 ELSE 0 END) as claimtotal,SUM(CASE WHEN primary_source = 'vaClaims' AND secondary_source like '/register%' THEN 1 ELSE 0 END) as registertotal";
					} else if(reportData.primarySource == 'mymilitarybenefits'){
						searchlist += ",SUM(CASE WHEN primary_source = 'mymilitarybenefits' THEN 1 ELSE 0 END) as benefittotal,SUM(CASE WHEN primary_source = 'mymilitarybenefits' AND secondary_source like '/question%' THEN 1 ELSE 0 END) as bentotal";
					} else if(reportData.primarySource == 'careerrecon'){
						searchlist += ",SUM(CASE WHEN primary_source = 'careerrecon' THEN 1 ELSE 0 END) as careertotal,SUM(CASE WHEN primary_source = 'careerrecon' AND secondary_source like '/register%' THEN 1 ELSE 0 END) as registertotal";
					}else {
						searchlist += ",SUM(CASE WHEN primary_source = 'program matcher' THEN 1 ELSE 0 END) as searchtotal,SUM(CASE WHEN primary_source = 'program matcher' AND secondary_source LIKE '/register/request-info%' AND secondary_source  NOT LIKE '/register/request-info/getstarted%' AND secondary_source  NOT LIKE '/register/request-info/calcmatch%' AND secondary_source  NOT LIKE '/register/request-info/?q=%' THEN 1 ELSE 0 END) as requesttotal,SUM(CASE WHEN primary_source = 'program matcher' AND (secondary_source LIKE '/register/request-info/getstarted%' or secondary_source like '/register/request-info/?q=getstarted%') THEN 1 ELSE 0 END) as startedtotal,SUM(CASE WHEN primary_source = 'program matcher' AND secondary_source LIKE '/register/request-info/calcmatch%' THEN 1 ELSE 0 END) as matchtotal,SUM(CASE WHEN primary_source = 'program matcher' AND secondary_source LIKE '/register/request-info/calcmatch/app%' THEN 1 ELSE 0 END) as appmatchtotal,SUM(CASE WHEN primary_source = 'program matcher' AND secondary_source LIKE '/register/request-info/calcmatch/legion%' THEN 1 ELSE 0 END) as legionmatchtotal,SUM(CASE WHEN primary_source = 'program matcher' AND secondary_source LIKE '/register/request-info/calcmatch/mbinfo%' THEN 1 ELSE 0 END) as mbinfomatchtotal,SUM(CASE WHEN secondary_source like '/register/request-info/?q=cr-wgt%' THEN 1 ELSE 0 END) as crtotal,SUM(CASE WHEN secondary_source like '/register/request-info/?q=mmb-wgt%' THEN 1 ELSE 0 END) as mmbtotal,SUM(CASE WHEN secondary_source like '/register/request-info/?q=mbi-wgt%' THEN 1 ELSE 0 END) as mbinfototal,SUM(CASE WHEN secondary_source like '/register/utmsource/bold%' THEN 1 ELSE 0 END) as boldtotal";
					}
				} else if (reportData.secondarySource) {
					searchlist += ",SUM(CASE WHEN primary_source = 'app' THEN 1 ELSE 0 END) as apptotal,SUM(CASE WHEN primary_source = 'legion' THEN 1 ELSE 0 END) as legiontotal,SUM(CASE WHEN primary_source = 'military' THEN 1 ELSE 0 END) as militarytotal,SUM(CASE WHEN primary_source = 'program matcher' THEN 1 ELSE 0 END) as searchtotal,SUM(CASE WHEN primary_source = 'vaClaims' THEN 1 ELSE 0 END) as claimtotal,SUM(CASE WHEN primary_source = 'mymilitarybenefits' THEN 1 ELSE 0 END) as benefittotal,SUM(CASE WHEN primary_source = 'careerrecon' THEN 1 ELSE 0 END) as careertotal";
					if (reportData.secondarySource == '/register') {
						searchlist += ",SUM(CASE WHEN (secondary_source = '/register' OR secondary_source like '/register/?q%') THEN 1 ELSE 0 END) as registertotal";
					} else if (reportData.secondarySource == '/register/request-info') {
						searchlist += ",SUM(CASE WHEN secondary_source LIKE '/register/request-info%' AND secondary_source  NOT LIKE '/register/request-info/getstarted%' AND secondary_source  NOT LIKE '/register/request-info/calcmatch%' AND secondary_source  NOT LIKE '/register/request-info/?q=%' THEN 1 ELSE 0 END) as requesttotal";
					} else if (reportData.secondarySource == '/register/contact-info') {
						searchlist += ",SUM(CASE WHEN secondary_source LIKE '/register/contact-info%' THEN 1 ELSE 0 END) as contacttotal";
					} else if (reportData.secondarySource == '/register/request-info/calcmatch') {
						searchlist += ",SUM(CASE WHEN secondary_source like '/register/request-info/calcmatch%' THEN 1 ELSE 0 END) as matchtotal";
					} else if (reportData.secondarySource == '/register/request-info/calcmatch/app') {
						searchlist += ",SUM(CASE WHEN secondary_source like '/register/request-info/calcmatch/app%' THEN 1 ELSE 0 END) as appmatchtotal";
					} else if (reportData.secondarySource == '/register/request-info/calcmatch/legion') {
						searchlist += ",SUM(CASE WHEN secondary_source like '/register/request-info/calcmatch/legion%' THEN 1 ELSE 0 END) as legionmatchtotal";
					} else if (reportData.secondarySource == '/register/request-info/calcmatch/mbinfo') {
						searchlist += ",SUM(CASE WHEN secondary_source like '/register/request-info/calcmatch/mbinfo%' THEN 1 ELSE 0 END) as mbinfomatchtotal";
					} else if (reportData.secondarySource == '/register/request-info/getstarted'){
						searchlist += ",SUM(CASE WHEN (secondary_source LIKE '/register/request-info/getstarted%' or secondary_source like '/register/request-info/?q=getstarted%') THEN 1 ELSE 0 END) as startedtotal";
					} else if (reportData.secondarySource == '/register/request-info/?q=cr-wgt') {
						searchlist += ",SUM(CASE WHEN secondary_source like '/register/request-info/?q=cr-wgt%' THEN 1 ELSE 0 END) as crtotal";
					} else if (reportData.secondarySource == '/register/request-info/?q=mmb-wgt') {
						searchlist += ",SUM(CASE WHEN secondary_source like '/register/request-info/?q=mmb-wgt%' THEN 1 ELSE 0 END) as mmbtotal";
					} else if (reportData.secondarySource == '/question') {
						searchlist += ",SUM(CASE WHEN secondary_source like '/question%' THEN 1 ELSE 0 END) as bentotal";
					} else if (reportData.secondarySource == '/register/utmsource/bold') {
						searchlist += ",SUM(CASE WHEN secondary_source like '/register/utmsource/bold%' THEN 1 ELSE 0 END) as boldtotal";
					} else{
						searchlist += ",SUM(CASE WHEN secondary_source like '/register/request-info/?q=mbi-wgt%' THEN 1 ELSE 0 END) as mbinfototal";
					}
				} else {
					searchlist += ",SUM(CASE WHEN primary_source = 'app' THEN 1 ELSE 0 END) as apptotal,SUM(CASE WHEN primary_source = 'legion' THEN 1 ELSE 0 END) as legiontotal,SUM(CASE WHEN primary_source = 'military' THEN 1 ELSE 0 END) as militarytotal,SUM(CASE WHEN primary_source = 'program matcher' THEN 1 ELSE 0 END) as searchtotal,SUM(CASE WHEN primary_source = 'vaClaims' THEN 1 ELSE 0 END) as claimtotal,SUM(CASE WHEN primary_source = 'mymilitarybenefits' THEN 1 ELSE 0 END) as benefittotal,SUM(CASE WHEN primary_source = 'careerrecon' THEN 1 ELSE 0 END) as careertotal,SUM(CASE WHEN (secondary_source = '/register' OR secondary_source like '/register/?q%') THEN 1 ELSE 0 END) as registertotal,SUM(CASE WHEN secondary_source LIKE '/register/contact-info%' THEN 1 ELSE 0 END) as contacttotal,SUM(CASE WHEN secondary_source LIKE '/register/request-info%' AND secondary_source  NOT LIKE '/register/request-info/getstarted%' AND secondary_source  NOT LIKE '/register/request-info/calcmatch%' AND secondary_source  NOT LIKE '/register/request-info/?q=%' THEN 1 ELSE 0 END) as requesttotal,SUM(CASE WHEN (secondary_source LIKE '/register/request-info/getstarted%' or secondary_source like '/register/request-info/?q=getstarted%') THEN 1 ELSE 0 END) as startedtotal,SUM(CASE WHEN secondary_source like '/register/request-info/calcmatch%' THEN 1 ELSE 0 END) as matchtotal,SUM(CASE WHEN secondary_source like '/register/request-info/calcmatch/app%' THEN 1 ELSE 0 END) as appmatchtotal,SUM(CASE WHEN secondary_source like '/register/request-info/calcmatch/legion%' THEN 1 ELSE 0 END) as legionmatchtotal,SUM(CASE WHEN secondary_source like '/register/request-info/calcmatch/mbinfo%' THEN 1 ELSE 0 END) as mbinfomatchtotal,SUM(CASE WHEN secondary_source like '/register/request-info/?q=cr-wgt%' THEN 1 ELSE 0 END) as crtotal,SUM(CASE WHEN secondary_source like '/register/request-info/?q=mmb-wgt%' THEN 1 ELSE 0 END) as mmbtotal,SUM(CASE WHEN secondary_source like '/register/request-info/?q=mbi-wgt%' THEN 1 ELSE 0 END) as mbinfototal,SUM(CASE WHEN secondary_source like '/question%' THEN 1 ELSE 0 END) as bentotal,SUM(CASE WHEN secondary_source like '/register/utmsource/bold%' THEN 1 ELSE 0 END) as boldtotal";
				}
				searchlist += " FROM students WHERE date_created >= '" + dateSet + "' and user_account_status = 'ACTIVE'";
				/*if(reportData.primarySource){
					searchlist += " AND primary_source= '"+reportData.primarySource+"'";
				}
				if(reportData.secondarySource){
					if(reportData.secondarySource == '/register'){
						searchlist += " AND secondary_source = '"+reportData.secondarySource+"'";
					}else if(reportData.secondarySource == '/register/request-info'){
						searchlist += " AND secondary_source like '"+reportData.secondarySource+"%' AND secondary_source not like '/register/request-info/getstarted%'";
					}else{
						searchlist += " AND secondary_source like '"+reportData.secondarySource+"%'";
					}
				}*/
			}

			// console.log('QQ:',searchlist);
			mysqlService.query(searchlist)
				.then(function (response) {
					resolve(response[0]);
					//resolve(response);
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}

	function manageVeteranDegreeRelation() {
		return new Promise(function (resolve, reject) {
			let vetlist = "SELECT ss.uuid,sp.academic_interest_1,sp.academic_interest_2,sp.academic_interest_3,sp.academic_interest_4,sp.academic_interest_5 FROM students as ss LEFT JOIN student_profile as sp ON ss.uuid = sp.uuid WHERE sp.academic_interest_1 IS NOT NULL and sp.academic_interest_1 != 0";

			mysqlService.query(vetlist)
				.then(function (response) {
					//resolve(reportCommunicationstatModel(response));
					let insertQuery = "";
					insertQuery = "Insert into student_degree_relation (student_id,major_id) values ";
					for (let i = 0; i < response.length; i++) {
						if (response[i].academic_interest_1 && response[i].academic_interest_1 != 0) {
							if (i == response.length - 1) {
								if (response[i].academic_interest_2 && response[i].academic_interest_2 != 0) {
									insertQuery += "('" + response[i].uuid + "'," + response[i].academic_interest_1 + "),";
								} else {
									insertQuery += "('" + response[i].uuid + "'," + response[i].academic_interest_1 + ");";
								}
							} else {
								insertQuery += "('" + response[i].uuid + "'," + response[i].academic_interest_1 + "),";
							}
						}
						if (response[i].academic_interest_2 && response[i].academic_interest_2 != 0) {
							if (i == response.length - 1) {
								if (response[i].academic_interest_3 && response[i].academic_interest_3 != 0) {
									insertQuery += "('" + response[i].uuid + "'," + response[i].academic_interest_2 + "),";
								} else {
									insertQuery += "('" + response[i].uuid + "'," + response[i].academic_interest_2 + ");";
								}
							} else {
								insertQuery += "('" + response[i].uuid + "'," + response[i].academic_interest_2 + "),";
							}
						}
						if (response[i].academic_interest_3 && response[i].academic_interest_3 != 0) {
							if (i == response.length - 1) {
								if (response[i].academic_interest_4 && response[i].academic_interest_4 != 0) {
									insertQuery += "('" + response[i].uuid + "'," + response[i].academic_interest_3 + "),";
								} else {
									insertQuery += "('" + response[i].uuid + "'," + response[i].academic_interest_3 + ");";
								}
							} else {
								insertQuery += "('" + response[i].uuid + "'," + response[i].academic_interest_3 + "),";
							}

						}
						if (response[i].academic_interest_4 && response[i].academic_interest_4 != 0) {
							if (i == response.length - 1) {
								if (response[i].academic_interest_5 && response[i].academic_interest_5 != 0) {
									insertQuery += "('" + response[i].uuid + "'," + response[i].academic_interest_4 + "),";
								} else {
									insertQuery += "('" + response[i].uuid + "'," + response[i].academic_interest_4 + ");";
								}
							} else {
								insertQuery += "('" + response[i].uuid + "'," + response[i].academic_interest_4 + "),";
							}

						}
						if (response[i].academic_interest_5 && response[i].academic_interest_5 != 0) {
							if (i == response.length - 1) {
								insertQuery += "('" + response[i].uuid + "'," + response[i].academic_interest_5 + ");";
							} else {
								insertQuery += "('" + response[i].uuid + "'," + response[i].academic_interest_5 + "),";
							}
						}
					}

					mysqlService.query(insertQuery)
						.then(function (response1) {
							resolve("success");
						}, function (err) {
							if (err) {
								var error = err;
								error.status = 503;
								return reject(error)
							};
						});
					//console.log("II:",insertQuery);
					//resolve("success");
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}

	function getNagEmailReportList(reportData) {
		return new Promise(function (resolve, reject) {
			let searchlist = "";
			let dateSet = "";
			if (reportData.dateFrom && reportData.dateTo) {
				searchlist = "select a.nag_email_rule,a.stotal,a.ototal,(a.ototal/a.stotal * 100) as orate,a.btotal,(a.btotal/a.stotal * 100) as brate,a.ctotal,(a.ctotal/a.ototal * 100) as crate,a.unsubtotal,(a.unsubtotal/a.stotal * 100) as unsubrate from (SELECT nag_email_rule, SUM(CASE WHEN event_type='Open' THEN 1 ELSE 0 END) as  ototal, SUM(CASE WHEN event_type='Send' THEN 1 ELSE 0 END) as  stotal, SUM(CASE WHEN event_type='Bounce' THEN 1 ELSE 0 END) as  btotal, SUM(CASE WHEN event_type='Click' THEN 1 ELSE 0 END) as  ctotal,(select count(id) from student_unsubscribe where unsubscribe_type='nag_email' and date(date_created) BETWEEN '" + reportData.dateFrom + "' AND '" + reportData.dateTo + "') as unsubtotal FROM aws_email_tracking where reference_type='nagemail' and  date(message_date)  BETWEEN '" + reportData.dateFrom + "' AND '" + reportData.dateTo + "' group by nag_email_rule) as a";
			} else {
				dateSet = "2018-01-01";
				searchlist = "select a.nag_email_rule,a.stotal,a.ototal,(a.ototal/a.stotal * 100) as orate,a.btotal,(a.btotal/a.stotal * 100) as brate,a.ctotal,(a.ctotal/a.ototal * 100) as crate,a.unsubtotal,(a.unsubtotal/a.stotal * 100) as unsubrate from (SELECT nag_email_rule, SUM(CASE WHEN event_type='Open' THEN 1 ELSE 0 END) as  ototal, SUM(CASE WHEN event_type='Send' THEN 1 ELSE 0 END) as  stotal, SUM(CASE WHEN event_type='Bounce' THEN 1 ELSE 0 END) as  btotal, SUM(CASE WHEN event_type='Click' THEN 1 ELSE 0 END) as  ctotal,(select count(id) from student_unsubscribe where unsubscribe_type='nag_email' and date(date_created) >= '" + dateSet + "') as unsubtotal FROM aws_email_tracking where reference_type='nagemail' and message_date >= '" + dateSet + "' group by nag_email_rule) as a";
			}

			//console.log('QQ:',searchlist);
			mysqlService.query(searchlist)
				.then(function (response) {
					resolve(response);
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}

	async function collegeActivityEmailReport(reportData){
		let month = reportData.month; 
		let date = new Date();
		let thisfirstDay = new Date(date.getFullYear(), date.getMonth(), 1);
		let thislastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
		let thisreportData = {
			'dateFrom': moment(thisfirstDay).format('YYYY-MM-DD'),
			'dateTo': moment(thislastDay).format('YYYY-MM-DD')
		}
		let thismonthlyCollegeActivityEmailReport = await getCollegeActivityEmailReportList(thisreportData);

		let date1 = new Date();
		let previousfirstDay = new Date(date1.getFullYear(), date1.getMonth() - 1, 1);
		let previouslastDay = new Date(date1.getFullYear(), date1.getMonth(), 0);
		let previousreportData = {
			'dateFrom': moment(previousfirstDay).format('YYYY-MM-DD'),
			'dateTo': moment(previouslastDay).format('YYYY-MM-DD')
		}
		let lastmonthlyCollegeActivityEmailReport = await getCollegeActivityEmailReportList(previousreportData);

		let date2 = new Date();
		let secondfirstDay = new Date(date2.getFullYear(), date2.getMonth() - 2, 1);
		let secondlastDay = new Date(date2.getFullYear(), date2.getMonth() -1, 0);
		let secondreportData = {
			'dateFrom': moment(secondfirstDay).format('YYYY-MM-DD'),
			'dateTo': moment(secondlastDay).format('YYYY-MM-DD')
		}
		let secondmonthlyCollegeActivityEmailReport = await getCollegeActivityEmailReportList(secondreportData);

		let date3 = new Date();
		let thirdfirstDay = new Date(date3.getFullYear(), date3.getMonth() - 3, 1);
		let thirdlastDay = new Date(date3.getFullYear(), date3.getMonth() -2, 0);
		let thirdreportData = {
			'dateFrom': moment(thirdfirstDay).format('YYYY-MM-DD'),
			'dateTo': moment(thirdlastDay).format('YYYY-MM-DD')
		}
		let thirdmonthlyCollegeActivityEmailReport = await getCollegeActivityEmailReportList(thirdreportData);

		let date4 = new Date();
		let fourthfirstDay = new Date(date4.getFullYear(), date4.getMonth() - 4, 1);
		let fourthlastDay = new Date(date4.getFullYear(), date4.getMonth() -3, 0);
		let fourthreportData = {
			'dateFrom': moment(fourthfirstDay).format('YYYY-MM-DD'),
			'dateTo': moment(fourthlastDay).format('YYYY-MM-DD')
		}
		let fourthmonthlyCollegeActivityEmailReport = await getCollegeActivityEmailReportList(fourthreportData);

		let date5 = new Date();
		let fifthfirstDay = new Date(date5.getFullYear(), date5.getMonth() - 5, 1);
		let fifthlastDay = new Date(date5.getFullYear(), date5.getMonth() -4, 0);
		let fifthreportData = {
			'dateFrom': moment(fifthfirstDay).format('YYYY-MM-DD'),
			'dateTo': moment(fifthlastDay).format('YYYY-MM-DD')
		}
		let fifthmonthlyCollegeActivityEmailReport = await getCollegeActivityEmailReportList(fifthreportData);

		let date6 = new Date();
		let sixthfirstDay = new Date(date6.getFullYear(), date6.getMonth() - 6, 1);
		let sixthlastDay = new Date(date6.getFullYear(), date6.getMonth() -5, 0);
		let sixthreportData = {
			'dateFrom': moment(sixthfirstDay).format('YYYY-MM-DD'),
			'dateTo': moment(sixthlastDay).format('YYYY-MM-DD')
		}
		let sixthmonthlyCollegeActivityEmailReport = await getCollegeActivityEmailReportList(sixthreportData);

		let date7 = new Date();
		let seventhfirstDay = new Date(date7.getFullYear(), date7.getMonth() - 7, 1);
		let seventhlastDay = new Date(date7.getFullYear(), date7.getMonth() -6, 0);
		let seventhreportData = {
			'dateFrom': moment(seventhfirstDay).format('YYYY-MM-DD'),
			'dateTo': moment(seventhlastDay).format('YYYY-MM-DD')
		}
		let seventhmonthlyCollegeActivityEmailReport = await getCollegeActivityEmailReportList(seventhreportData);

		let date8 = new Date();
		let eighthfirstDay = new Date(date8.getFullYear(), date8.getMonth() - 8, 1);
		let eighthlastDay = new Date(date8.getFullYear(), date8.getMonth() -7, 0);
		let eighthreportData = {
			'dateFrom': moment(eighthfirstDay).format('YYYY-MM-DD'),
			'dateTo': moment(eighthlastDay).format('YYYY-MM-DD')
		}
		let eighthmonthlyCollegeActivityEmailReport = await getCollegeActivityEmailReportList(eighthreportData);

		let date9 = new Date();
		let ninthfirstDay = new Date(date9.getFullYear(), date9.getMonth() - 9, 1);
		let ninthlastDay = new Date(date9.getFullYear(), date9.getMonth() -8, 0);
		let ninthreportData = {
			'dateFrom': moment(ninthfirstDay).format('YYYY-MM-DD'),
			'dateTo': moment(ninthlastDay).format('YYYY-MM-DD')
		}
		let ninthmonthlyCollegeActivityEmailReport = await getCollegeActivityEmailReportList(ninthreportData);

		let date10 = new Date();
		let tenthfirstDay = new Date(date10.getFullYear(), date10.getMonth() - 10, 1);
		let tenthlastDay = new Date(date10.getFullYear(), date10.getMonth() -9, 0);
		let tenthreportData = {
			'dateFrom': moment(tenthfirstDay).format('YYYY-MM-DD'),
			'dateTo': moment(tenthlastDay).format('YYYY-MM-DD')
		}
		let tenthmonthlyCollegeActivityEmailReport = await getCollegeActivityEmailReportList(tenthreportData);

		let date11 = new Date();
		let eleventhfirstDay = new Date(date11.getFullYear(), date11.getMonth() - 11, 1);
		let eleventhlastDay = new Date(date11.getFullYear(), date11.getMonth() -10, 0);
		let eleventhreportData = {
			'dateFrom': moment(eleventhfirstDay).format('YYYY-MM-DD'),
			'dateTo': moment(eleventhlastDay).format('YYYY-MM-DD')
		}
		let eleventhmonthlyCollegeActivityEmailReport = await getCollegeActivityEmailReportList(eleventhreportData);

		let date12 = new Date();
		let twelvethfirstDay = new Date(date12.getFullYear(), date12.getMonth() - 12, 1);
		let twelvethlastDay = new Date(date12.getFullYear(), date12.getMonth() -11, 0);
		let twelvethreportData = {
			'dateFrom': moment(twelvethfirstDay).format('YYYY-MM-DD'),
			'dateTo': moment(twelvethlastDay).format('YYYY-MM-DD')
		}
		let twelvethmonthlyCollegeActivityEmailReport = await getCollegeActivityEmailReportList(twelvethreportData);

		if (month == "this month") {
			return (thismonthlyCollegeActivityEmailReport);
		} else if (month == "last month") {
			return (lastmonthlyCollegeActivityEmailReport);
		} else if (month == "last 3 months") {
			let last3MonthsCollegeActivityEmailReport = [...thirdmonthlyCollegeActivityEmailReport,...secondmonthlyCollegeActivityEmailReport,...lastmonthlyCollegeActivityEmailReport];
			return (last3MonthsCollegeActivityEmailReport);
		} else if (month == "last 6 months") {
			last6MonthsCollegeActivityEmailReport = [...sixthmonthlyCollegeActivityEmailReport,...fifthmonthlyCollegeActivityEmailReport,...fourthmonthlyCollegeActivityEmailReport,...thirdmonthlyCollegeActivityEmailReport,...secondmonthlyCollegeActivityEmailReport,...lastmonthlyCollegeActivityEmailReport];
			return (last6MonthsCollegeActivityEmailReport);
		} else if (month == "last 9 months") {
			last9MonthsCollegeActivityEmailReport = [...ninthmonthlyCollegeActivityEmailReport,...eighthmonthlyCollegeActivityEmailReport,...seventhmonthlyCollegeActivityEmailReport,...sixthmonthlyCollegeActivityEmailReport,...fifthmonthlyCollegeActivityEmailReport,...fourthmonthlyCollegeActivityEmailReport,...thirdmonthlyCollegeActivityEmailReport,...secondmonthlyCollegeActivityEmailReport,...lastmonthlyCollegeActivityEmailReport];
			return (last9MonthsCollegeActivityEmailReport);
		} else if (month == "last 12 months") {
			last12MonthsCollegeActivityEmailReport = [...twelvethmonthlyCollegeActivityEmailReport,...eleventhmonthlyCollegeActivityEmailReport,...tenthmonthlyCollegeActivityEmailReport,...ninthmonthlyCollegeActivityEmailReport,...eighthmonthlyCollegeActivityEmailReport,...seventhmonthlyCollegeActivityEmailReport,...sixthmonthlyCollegeActivityEmailReport,...fifthmonthlyCollegeActivityEmailReport,...fourthmonthlyCollegeActivityEmailReport,...thirdmonthlyCollegeActivityEmailReport,...secondmonthlyCollegeActivityEmailReport,...lastmonthlyCollegeActivityEmailReport];
			return (last12MonthsCollegeActivityEmailReport);
		}

	}

	function getCollegeActivityEmailReportList(reportData){
		return new Promise(function (resolve, reject) {
			let searchlist = "";
			if (reportData.dateFrom && reportData.dateTo) {
				searchlist = "select  YEAR('" + reportData.dateFrom + "') as year, MONTHNAME('" + reportData.dateTo + "') as month,a.stotal,a.ototal,(a.ototal/(a.stotal-btotal) * 100) as orate,a.btotal,a.ctotal,(a.ctotal/a.stotal * 100) as crate,sum(a.ucontotal+a.uadmtotal+a.uadmmtotal+a.uvetafftotal+a.umarktotal+a.umarkktotal) as unsubtotal,((a.ucontotal+a.uadmtotal+a.uadmmtotal+a.uvetafftotal+a.umarktotal+a.umarkktotal)/a.stotal * 100) as unsubrate from (SELECT  SUM(CASE WHEN event_type='Open' THEN 1 ELSE 0 END) as  ototal, SUM(CASE WHEN event_type='Send' THEN 1 ELSE 0 END) as  stotal, SUM(CASE WHEN event_type='Bounce' THEN 1 ELSE 0 END) as  btotal, SUM(CASE WHEN event_type='Click' THEN 1 ELSE 0 END) as  ctotal,(select count(id) from college_contacts where unsubscribe_contact_email='yes' and date(unsubscribe_contact_date) BETWEEN '" + reportData.dateFrom + "' AND '" + reportData.dateTo + "') as ucontotal,(select count(id) from college_contacts where unsubscribe_admission_email1='yes' and date(unsubscribe_admission_date) BETWEEN '" + reportData.dateFrom + "' AND '" + reportData.dateTo + "') as uadmtotal,(select count(id) from college_contacts where unsubscribe_admission_email2='yes' and date(unsubscribe_admission1_date) BETWEEN '" + reportData.dateFrom + "' AND '" + reportData.dateTo + "') as uadmmtotal,(select count(id) from college_contacts where unsubscribe_vet_affairs_email='yes' and date(unsubscribe_vet_affairs_date) BETWEEN '" + reportData.dateFrom + "' AND '" + reportData.dateTo + "') as uvetafftotal,(select count(id) from college_contacts where unsubscribe_marketing_email1='yes' and date(unsubscribe_marketing_date) BETWEEN '" + reportData.dateFrom + "' AND '" + reportData.dateTo + "') as umarktotal,(select count(id) from college_contacts where unsubscribe_marketing_email2='yes' and date(unsubscribe_marketing1_date) BETWEEN '" + reportData.dateFrom + "' AND '" + reportData.dateTo + "') as umarkktotal FROM aws_email_tracking where reference_type in ('collegeactivity','partnercollege') and date(message_date)  BETWEEN '" + reportData.dateFrom + "' AND '" + reportData.dateTo + "') as a";
			}
		
			//console.log('QQ:',searchlist);
			mysqlService.query(searchlist)
				.then(function (response) {
					resolve(superAdminCollegeActivityEmailModel(response));
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}

	function getUserRegistrationReport(reportData) {
		return new Promise(function (resolve, reject) {
			let searchlist = "";
			let dateSet = "";
			if (reportData.dateFrom && reportData.dateTo) {
				searchlist = "SELECT s.uuid as id,(CASE WHEN s.middle_initial IS NULL OR TRIM(s.middle_initial) ='' THEN CONCAT_WS( ' ', s.first_name, s.last_name ) ELSE CONCAT_WS( ' ', s.first_name, s.middle_initial, s.last_name ) END) as name,s.email,sp.military_status,sp.state,(SELECT title FROM bucket_degree WHERE id=sp.bucket_id) as pbucket,(SELECT GROUP_CONCAT(title) FROM bucket_secondary_degree WHERE FIND_IN_SET(id,sp.secondary_bucket_id)) as sbucket,(SELECT branch_short_name FROM branches WHERE id=sp.military_branch) as branch,(SELECT title FROM levels WHERE id=sp.level_id) as education,DATE_FORMAT(s.date_created, '%Y-%m-%d') as regDate FROM students as s LEFT JOIN student_profile as sp ON s.uuid=sp.uuid WHERE s.user_account_status='ACTIVE' AND date(s.date_created) BETWEEN '" + reportData.dateFrom + "' AND '" + reportData.dateTo + "' ORDER BY s.date_created DESC";
			} else {
				dateSet = "2018-01-01";
				searchlist = "SELECT s.uuid as id,(CASE WHEN s.middle_initial IS NULL OR TRIM(s.middle_initial) ='' THEN CONCAT_WS( ' ', s.first_name, s.last_name ) ELSE CONCAT_WS( ' ', s.first_name, s.middle_initial, s.last_name ) END) as name,s.email,sp.military_status,sp.state,(SELECT title FROM bucket_degree WHERE id=sp.bucket_id) as pbucket,(SELECT GROUP_CONCAT(title) FROM bucket_secondary_degree WHERE FIND_IN_SET(id,sp.secondary_bucket_id)) as sbucket,(SELECT branch_short_name FROM branches WHERE id=sp.military_branch) as branch,(SELECT title FROM levels WHERE id=sp.level_id) as education,DATE_FORMAT(s.date_created, '%Y-%m-%d') as regDate FROM students as s LEFT JOIN student_profile as sp ON s.uuid=sp.uuid WHERE s.user_account_status='ACTIVE' AND s.date_created >= '" + dateSet + "' ORDER BY s.date_created DESC";
			}

			//console.log('QQ:',searchlist);
			mysqlService.query(searchlist)
				.then(function (response) {
					resolve(response);
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}

	function getEmploymentRegistrationReport(reportData){
		return new Promise(function (resolve, reject) {
			let searchlist = "";
			let dateSet = "";
			if (reportData.dateFrom && reportData.dateTo) {
				searchlist = "SELECT s.uuid as id,(CASE WHEN s.middle_initial IS NULL OR TRIM(s.middle_initial) ='' THEN CONCAT_WS( ' ', s.first_name, s.last_name ) ELSE CONCAT_WS( ' ', s.first_name, s.middle_initial, s.last_name ) END) as name,(SELECT branch_short_name FROM branches WHERE id=sp.military_branch) as branch,(SELECT name FROM security_clearance WHERE id=sp.security_clearance ) as sclearance,(SELECT CONCAT(rank_short_name,' ',rank_full_name) FROM ranks WHERE id=sp.military_rank) as rank,sp.mos,(SELECT level_name FROM mmb_education_levels WHERE id=sp.mmb_level_id ) as lname,(SELECT career_name FROM mmb_career WHERE id=sp.career_id ) as cname,sp.desired_salary,sp.relocate,DATE_FORMAT(s.date_created, '%Y-%m-%d') as regDate FROM students as s LEFT JOIN student_profile as sp ON s.uuid=sp.uuid WHERE s.user_account_status='ACTIVE' AND s.primary_source='mymilitarybenefits' AND date(s.date_created) BETWEEN '" + reportData.dateFrom + "' AND '" + reportData.dateTo + "' ORDER BY s.date_created DESC";
			} else {
				dateSet = "2018-01-01";
				searchlist = "SELECT s.uuid as id,(CASE WHEN s.middle_initial IS NULL OR TRIM(s.middle_initial) ='' THEN CONCAT_WS( ' ', s.first_name, s.last_name ) ELSE CONCAT_WS( ' ', s.first_name, s.middle_initial, s.last_name ) END) as name,(SELECT branch_short_name FROM branches WHERE id=sp.military_branch) as branch,(SELECT name FROM security_clearance WHERE id=sp.security_clearance ) as sclearance,(SELECT CONCAT(rank_short_name,' ',rank_full_name) FROM ranks WHERE id=sp.military_rank) as rank,sp.mos,(SELECT level_name FROM mmb_education_levels WHERE id=sp.mmb_level_id ) as lname,(SELECT career_name FROM mmb_career WHERE id=sp.career_id ) as cname,sp.desired_salary,sp.relocate,DATE_FORMAT(s.date_created, '%Y-%m-%d') as regDate FROM students as s LEFT JOIN student_profile as sp ON s.uuid=sp.uuid WHERE s.user_account_status='ACTIVE' AND s.primary_source='mymilitarybenefits' AND s.date_created >= '" + dateSet + "' ORDER BY s.date_created DESC";
			}

			//console.log('QQ:',searchlist);
			mysqlService.query(searchlist)
				.then(function (response) {
					resolve(response);
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}

	async function detailCollegeUserActivity(reportData) {
		let month = reportData.month;
		let collegeId = reportData.collegeId;

		let date = new Date();
		let thisfirstDay = new Date(date.getFullYear(), date.getMonth(), 1);
		let thislastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
		let thisreportData = {
			'collegeId': collegeId,
			'dateFrom': moment(thisfirstDay).format('YYYY-MM-DD'),
			'dateTo': moment(thislastDay).format('YYYY-MM-DD')
		}

		let date1 = new Date();
		let previousfirstDay = new Date(date1.getFullYear(), date1.getMonth() - 1, 1);
		let previouslastDay = new Date(date1.getFullYear(), date1.getMonth(), 0);
		let previousreportData = {
			'collegeId': collegeId,
			'dateFrom': moment(previousfirstDay).format('YYYY-MM-DD'),
			'dateTo': moment(previouslastDay).format('YYYY-MM-DD')
		}

		let date2 = new Date();
		let secondfirstDay = new Date(date2.getFullYear(), date2.getMonth() - 2, 1);
		let secondlastDay = new Date(date2.getFullYear(), date2.getMonth() -1, 0);
		let secondreportData = {
			'collegeId': collegeId,
			'dateFrom': moment(secondfirstDay).format('YYYY-MM-DD'),
			'dateTo': moment(secondlastDay).format('YYYY-MM-DD')
		}

		let date3 = new Date();
		let thirdfirstDay = new Date(date3.getFullYear(), date3.getMonth() - 3, 1);
		let thirdlastDay = new Date(date3.getFullYear(), date3.getMonth() -2, 0);
		let thirdreportData = {
			'collegeId': collegeId,
			'dateFrom': moment(thirdfirstDay).format('YYYY-MM-DD'),
			'dateTo': moment(thirdlastDay).format('YYYY-MM-DD')
		}

		let date4 = new Date();
		let fourthfirstDay = new Date(date4.getFullYear(), date4.getMonth() - 4, 1);
		let fourthlastDay = new Date(date4.getFullYear(), date4.getMonth() -3, 0);
		let fourthreportData = {
			'collegeId': collegeId,
			'dateFrom': moment(fourthfirstDay).format('YYYY-MM-DD'),
			'dateTo': moment(fourthlastDay).format('YYYY-MM-DD')
		}

		let date5 = new Date();
		let fifthfirstDay = new Date(date5.getFullYear(), date5.getMonth() - 5, 1);
		let fifthlastDay = new Date(date5.getFullYear(), date5.getMonth() -4, 0);
		let fifthreportData = {
			'collegeId': collegeId,
			'dateFrom': moment(fifthfirstDay).format('YYYY-MM-DD'),
			'dateTo': moment(fifthlastDay).format('YYYY-MM-DD')
		}

		let date6 = new Date();
		let sixthfirstDay = new Date(date6.getFullYear(), date6.getMonth() - 6, 1);
		let sixthlastDay = new Date(date6.getFullYear(), date6.getMonth() -5, 0);
		let sixthreportData = {
			'collegeId': collegeId,
			'dateFrom': moment(sixthfirstDay).format('YYYY-MM-DD'),
			'dateTo': moment(sixthlastDay).format('YYYY-MM-DD')
		}

		let date7 = new Date();
		let seventhfirstDay = new Date(date7.getFullYear(), date7.getMonth() - 7, 1);
		let seventhlastDay = new Date(date7.getFullYear(), date7.getMonth() -6, 0);
		let seventhreportData = {
			'collegeId': collegeId,
			'dateFrom': moment(seventhfirstDay).format('YYYY-MM-DD'),
			'dateTo': moment(seventhlastDay).format('YYYY-MM-DD')
		}

		let date8 = new Date();
		let eighthfirstDay = new Date(date8.getFullYear(), date8.getMonth() - 8, 1);
		let eighthlastDay = new Date(date8.getFullYear(), date8.getMonth() -7, 0);
		let eighthreportData = {
			'collegeId': collegeId,
			'dateFrom': moment(eighthfirstDay).format('YYYY-MM-DD'),
			'dateTo': moment(eighthlastDay).format('YYYY-MM-DD')
		}

		let date9 = new Date();
		let ninthfirstDay = new Date(date9.getFullYear(), date9.getMonth() - 9, 1);
		let ninthlastDay = new Date(date9.getFullYear(), date9.getMonth() -8, 0);
		let ninthreportData = {
			'collegeId': collegeId,
			'dateFrom': moment(ninthfirstDay).format('YYYY-MM-DD'),
			'dateTo': moment(ninthlastDay).format('YYYY-MM-DD')
		}

		let date10 = new Date();
		let tenthfirstDay = new Date(date10.getFullYear(), date10.getMonth() - 10, 1);
		let tenthlastDay = new Date(date10.getFullYear(), date10.getMonth() -9, 0);
		let tenthreportData = {
			'collegeId': collegeId,
			'dateFrom': moment(tenthfirstDay).format('YYYY-MM-DD'),
			'dateTo': moment(tenthlastDay).format('YYYY-MM-DD')
		}

		let date11 = new Date();
		let eleventhfirstDay = new Date(date11.getFullYear(), date11.getMonth() - 11, 1);
		let eleventhlastDay = new Date(date11.getFullYear(), date11.getMonth() -10, 0);
		let eleventhreportData = {
			'collegeId': collegeId,
			'dateFrom': moment(eleventhfirstDay).format('YYYY-MM-DD'),
			'dateTo': moment(eleventhlastDay).format('YYYY-MM-DD')
		}

		let date12 = new Date();
		let twelvethfirstDay = new Date(date12.getFullYear(), date12.getMonth() - 12, 1);
		let twelvethlastDay = new Date(date12.getFullYear(), date12.getMonth() -11, 0);
		let twelvethreportData = {
			'collegeId': collegeId,
			'dateFrom': moment(twelvethfirstDay).format('YYYY-MM-DD'),
			'dateTo': moment(twelvethlastDay).format('YYYY-MM-DD')
		}

		if (month == "this month") {
			let thismonthlyUserActivity = await getCollegeUserActivity(thisreportData);
			return (thismonthlyUserActivity);
		} else if (month == "last month") {
			let lastmonthlyUserActivity = await getCollegeUserActivity(previousreportData);
			return (lastmonthlyUserActivity);
		} else if (month == "last 3 months") {
			let threeMonthData = {
				'collegeId': collegeId,
				'dateFrom': moment(thirdfirstDay).format('YYYY-MM-DD'),
				'dateTo': moment(previouslastDay).format('YYYY-MM-DD')
			}
			return await getCollegeUserActivity(threeMonthData);
		} else if (month == "last 6 months") {
			let sixMonthData = {
				'collegeId': collegeId,
				'dateFrom': moment(sixthfirstDay).format('YYYY-MM-DD'),
				'dateTo': moment(previouslastDay).format('YYYY-MM-DD')
			}
			return await getCollegeUserActivity(sixMonthData);
		} else if (month == "last 9 months") {
			let nineMonthData = {
				'collegeId': collegeId,
				'dateFrom': moment(ninthfirstDay).format('YYYY-MM-DD'),
				'dateTo': moment(previouslastDay).format('YYYY-MM-DD')
			}
			return await getCollegeUserActivity(nineMonthData);
		} else if (month == "last 12 months") {
			let twelveMonthData = {
				'collegeId': collegeId,
				'dateFrom': moment(twelvethfirstDay).format('YYYY-MM-DD'),
				'dateTo': moment(previouslastDay).format('YYYY-MM-DD')
			}
			return await getCollegeUserActivity(twelveMonthData);
		}
	}

	async function getCollegeUserActivity(reportData) {
		return new Promise(function (resolve, reject) {
			let dateFrom = reportData.dateFrom;
			let dateTo = reportData.dateTo;
			let collegeId = reportData.collegeId;
			/*let ruleSql = "select YEAR('" + dateFrom + "') as year, MONTHNAME('" + dateTo + "') as month, max(t.noreply) as noreply, max(ct.cn) as searchboxtotal,count(distinct r.student_id) as scount,srtotal.total as searchresult, sstotal.total as savedschool from (select * from colleges where status = 'ACTIVE' and id = "+collegeId+") as c left join ( select college_id,count(distinct student_id) as noreply from recon_messages a join (SELECT college_id as col,message_id,max(date_created) as maxdate from recon_messages where college_id ="+collegeId+" and date_created  BETWEEN '" + dateFrom + "' AND '" + dateTo + "' group by message_id)b on a.college_id = b.col and a.message_id = b.message_id and a.date_created = b.maxdate  where a.responder = 'USER' GROUP by college_id)t on c.id = t.college_id left join (SELECT college_id, count(*) as cn FROM college_search_tracking where college_id = "+collegeId+" and date_created BETWEEN '" + dateFrom + "' AND '" + dateTo + "' and secondary_source in ('url','list'))ct on c.id = ct.college_id left join (SELECT college_id,COUNT(id) as total FROM searchresult_colleges_tracking where college_id = "+collegeId+" AND trim(secondary_source) = 'filter' and date_created BETWEEN '" + dateFrom + "' AND '" + dateTo + "')srtotal on c.id = srtotal.college_id left join (SELECT college_id,COUNT(id) as total FROM searchresult_colleges_tracking where college_id = "+collegeId+" AND trim(secondary_source) = 'register' and date_created BETWEEN '" + dateFrom + "' AND '" + dateTo + "')sstotal on c.id = sstotal.college_id left join recon_messages r  on c.id = r.college_id and r.responder = 'USER' and r.date_created BETWEEN '" + dateFrom + "' AND '" + dateTo + "'";*/
			let ruleSql = "select YYYY as year, MM as allmonth, MMonth as month,sum(noreply) as noreply,sum(regtotal) as savedschool,sum(filtot) as searchresult,sum(sboxtot) as searchboxtotal,sum(stutot) as scount,sum(pagetime) as pagetime, (sum(pagetime)/sum(sboxtot)) as averagetime,(sum(tabclick) + sum(buttonclick) + sum(contactclick)) as clicktotal from (select count(distinct student_id) as noreply,0 as regtotal,0 as filtot,0 as sboxtot,0 as stutot,0 as pagetime,0 as tabclick,0 as buttonclick,0 as contactclick,Year(date_created) as YYYY, Month(date_created) as MM, MonthName(date_created) as MMonth from recon_messages a join (SELECT college_id as col,message_id,max(date_created) as maxdate from recon_messages where college_id ="+collegeId+" and date_created  BETWEEN '" + dateFrom + "' AND '" + dateTo + "' group by message_id)b on a.college_id = b.col and a.message_id = b.message_id and a.date_created = b.maxdate  where a.responder = 'USER' group by YYYY, MM, MMonth union SELECT 0 as noreply,COUNT(id) as regtotal,0 as filtot,0 as sboxtot,0 as stutot,0 as pagetime,0 as tabclick,0 as buttonclick,0 as contactclick,Year(date_created) as YYYY, Month(date_created) as MM, MonthName(date_created) as MMonth FROM searchresult_colleges_tracking where college_id = "+collegeId+" AND secondary_source = 'register' and date_created >= '" + dateFrom + "' and date_created <= '" + dateTo + "' group by YYYY, MM, MMonth union SELECT 0 as noreply,0 as regtotal,COUNT(id) as filtot,0 as sboxtot,0 as stutot,0 as pagetime,0 as tabclick,0 as buttonclick,0 as contactclick,Year(date_created) as YYYY, Month(date_created) as MM, MonthName(date_created) as MMonth FROM searchresult_colleges_tracking where college_id = "+collegeId+" AND secondary_source = 'filter' and date_created BETWEEN '" + dateFrom + "' AND '" + dateTo + "' group by YYYY, MM, MMonth union SELECT 0 as noreply,0 as regtotal,0 as filtot,COUNT(id) as sboxtot,0 as stutot,0 as pagetime,0 as tabclick,0 as buttonclick,0 as contactclick,Year(date_created) as YYYY, Month(date_created) as MM, MonthName(date_created) as MMonth FROM college_search_tracking where college_id = "+collegeId+" and date_created BETWEEN '" + dateFrom + "' AND '" + dateTo + "' and secondary_source in ('url','list') group by YYYY, MM, MMonth union SELECT 0 as noreply,0 as regtotal,0 as filtot,0 as sboxtot,COUNT(distinct(student_id)) as stutot,0 as pagetime,0 as tabclick,0 as buttonclick,0 as contactclick,Year(date_created) as YYYY, Month(date_created) as MM, MonthName(date_created) as MMonth FROM  recon_messages where college_id = "+collegeId+" and responder = 'USER' and date_created BETWEEN '" + dateFrom + "' AND '" + dateTo + "' group by YYYY, MM, MMonth union SELECT 0 as noreply,0 as regtotal,0 as filtot,0 as stutot,0 as sboxtot,sum(associate_value) as pagetime,0 as tabclick,0 as buttonclick,0 as contactclick,Year(created_at) as YYYY, Month(created_at) as MM, MonthName(created_at) as MMonth FROM user_action_tracking where metadata="+collegeId+" and created_at BETWEEN '" + dateFrom + "' AND '" + dateTo + "' group by YYYY, MM, MMonth union SELECT 0 as noreply,0 as regtotal,0 as filtot,0 as stutot,0 as sboxtot,0 as pagetime,COUNT(id) as tabclick,0 as buttonclick,0 as contactclick,Year(date_clicked) as YYYY, Month(date_clicked) as MM, MonthName(date_clicked) as MMonth FROM tab_click_tracking where college_id="+collegeId+" and tab_name in ('overview','military','stats','degrees','review','contact') and date_clicked BETWEEN '" + dateFrom + "' AND '" + dateTo + "' group by YYYY, MM, MMonth union SELECT 0 as noreply,0 as regtotal,0 as filtot,0 as stutot,0 as sboxtot,0 as pagetime,0 as tabclick,COUNT(id) as buttonclick,0 as contactclick,Year(date_clicked) as YYYY, Month(date_clicked) as MM, MonthName(date_clicked) as MMonth FROM button_click_tracking where college_id="+collegeId+" and button_name in ('compareto','appearance','matching-score','request-info','phone','email','website') and location in ('detail','compareto','admission','college','affairs') and date_clicked BETWEEN '" + dateFrom + "' AND '" + dateTo + "' group by YYYY, MM, MMonth union SELECT 0 as noreply,0 as regtotal,0 as filtot,0 as stutot,0 as sboxtot,0 as pagetime,0 as tabclick,0 as buttonclick,COUNT(id) as contactclick,Year(date_created) as YYYY, Month(date_created) as MM, MonthName(date_created) as MMonth FROM contactinfo_tracking where college_id="+collegeId+" and date_created BETWEEN '" + dateFrom + "' AND '" + dateTo + "' group by YYYY, MM, MMonth) temp group by YYYY, MM, MMonth order by YYYY desc,MM desc";
			// console.log("QQ:", ruleSql);
			mysqlService.query(ruleSql)
				.then(function (response) {
					//  console.log("RR:", response);
					resolve(superAdminCollegeDetailUserActivityModel(response));
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}

	function getVeteranSourceTrackingReport(reportData) {
		return new Promise(function (resolve, reject) {
			let searchlist = "";
			let dateSet = "";
			if (reportData.dateFrom && reportData.dateTo) {
				searchlist = "SELECT (CASE WHEN s.middle_initial IS NULL OR TRIM(s.middle_initial) ='' THEN CONCAT_WS( ' ', s.first_name, s.last_name ) ELSE CONCAT_WS( ' ', s.first_name, s.middle_initial, s.last_name ) END) as name,s.email,DATE_FORMAT(s.date_created, '%Y-%m-%d') as date_created,s.register_source,sp.state from students s LEFT JOIN student_profile as sp ON s.uuid=sp.uuid where s.register_source  <> '' ";
				if (reportData.source) {
					searchlist += " and s.register_source= '" + reportData.source + "'";
				}
				searchlist += " and date(s.date_created) BETWEEN '" + reportData.dateFrom + "' AND '" + reportData.dateTo + "' and s.user_account_status = 'ACTIVE'";
			} else {
				dateSet = "2018-01-01";
				searchlist = "SELECT (CASE WHEN s.middle_initial IS NULL OR TRIM(s.middle_initial) ='' THEN CONCAT_WS( ' ', s.first_name, s.last_name ) ELSE CONCAT_WS( ' ', s.first_name, s.middle_initial, s.last_name ) END) as name,s.email,DATE_FORMAT(s.date_created, '%Y-%m-%d') as date_created,s.register_source,sp.state  from students s LEFT JOIN student_profile as sp ON s.uuid=sp.uuid where s.register_source <> '' ";
				if (reportData.source) {
					searchlist += " and s.register_source= '" + reportData.source + "'";
				}
				searchlist += " and s.date_created >= '" + dateSet + "' and s.user_account_status = 'ACTIVE'";
			}

			//console.log('QQ:',searchlist);
			mysqlService.query(searchlist)
				.then(function (response) {
					resolve(response);
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}

	function getVeteranSourceTrackingTotalReport(reportData) {
		return new Promise(function (resolve, reject) {
			let searchlist = "";
			let dateSet = "";
			if (reportData.dateFrom && reportData.dateTo) {
				searchlist = "SELECT COUNT(*) as total";

				if (reportData.source) {
					if (reportData.source == 'signup') {
						searchlist += ",SUM(CASE WHEN register_source = 'signup' THEN 1 ELSE 0 END) as singuptotal";
					} else if (reportData.source == 'requestinfo') {
						searchlist += ",SUM(CASE WHEN register_source = 'requestinfo' THEN 1 ELSE 0 END) as requestinfototal";
					} else if (reportData.source == 'contactinfo') {
						searchlist += ",SUM(CASE WHEN register_source = 'contactinfo' THEN 1 ELSE 0 END) as contactinfototal";
					} else if (reportData.source == 'savesearch') {
						searchlist += ",SUM(CASE WHEN register_source = 'savesearch' THEN 1 ELSE 0 END) as savesearchtotal";
					} else {
						searchlist += ",SUM(CASE WHEN register_source = 'login' THEN 1 ELSE 0 END) as logintotal";
					}
				} else {
					searchlist += ",SUM(CASE WHEN register_source = 'signup' THEN 1 ELSE 0 END) as singuptotal,SUM(CASE WHEN register_source = 'requestinfo' THEN 1 ELSE 0 END) as requestinfototal,SUM(CASE WHEN register_source = 'contactinfo' THEN 1 ELSE 0 END) as contactinfototal,SUM(CASE WHEN register_source = 'savesearch' THEN 1 ELSE 0 END) as savesearchtotal,SUM(CASE WHEN register_source = 'login' THEN 1 ELSE 0 END) as logintotal";
				}
				searchlist += " FROM students WHERE date(date_created) BETWEEN '" + reportData.dateFrom + "' AND '" + reportData.dateTo + "' and user_account_status = 'ACTIVE'";
			} else {
				dateSet = "2018-01-01";

				searchlist = "SELECT COUNT(*) as total";
				 if (reportData.source) {
					if (reportData.source == 'signup') {
						searchlist += ",SUM(CASE WHEN register_source = 'signup' THEN 1 ELSE 0 END) as singuptotal";
					} else if (reportData.source == 'requestinfo') {
						searchlist += ",SUM(CASE WHEN register_source = 'requestinfo' THEN 1 ELSE 0 END) as requestinfototal";
					} else if (reportData.source == 'contactinfo') {
						searchlist += ",SUM(CASE WHEN register_source = 'contactinfo' THEN 1 ELSE 0 END) as contactinfototal";
					} else if (reportData.source == 'savesearch') {
						searchlist += ",SUM(CASE WHEN register_source = 'savesearch' THEN 1 ELSE 0 END) as savesearchtotal";
					} else {
						searchlist += ",SUM(CASE WHEN register_source = 'login' THEN 1 ELSE 0 END) as logintotal";
					}
				} else {
					searchlist += ",SUM(CASE WHEN register_source = 'signup' THEN 1 ELSE 0 END) as singuptotal,SUM(CASE WHEN register_source = 'requestinfo' THEN 1 ELSE 0 END) as requestinfototal,SUM(CASE WHEN register_source = 'contactinfo' THEN 1 ELSE 0 END) as contactinfototal,SUM(CASE WHEN register_source = 'savesearch' THEN 1 ELSE 0 END) as savesearchtotal,SUM(CASE WHEN register_source = 'login' THEN 1 ELSE 0 END) as logintotal";
				}
				searchlist += " FROM students WHERE date_created >= '" + dateSet + "' and user_account_status = 'ACTIVE'";
			}

			//console.log('QQ:',searchlist);
			mysqlService.query(searchlist)
				.then(function (response) {
					resolve(response[0]);
					//resolve(response);
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}

	async function bounceActivityEmailReport(reportData){
		let month = reportData.month; 
		let date = new Date();
		let thisfirstDay = new Date(date.getFullYear(), date.getMonth(), 1);
		let thislastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
		let thisreportData = {
			'name': reportData.name,
			'dateFrom': moment(thisfirstDay).format('YYYY-MM-DD'),
			'dateTo': moment(thislastDay).format('YYYY-MM-DD')
		}
		let thismonthlyCollegeActivityEmailReport = await getBounceActivityEmailReportList(thisreportData);

		let date1 = new Date();
		let previousfirstDay = new Date(date1.getFullYear(), date1.getMonth() - 1, 1);
		let previouslastDay = new Date(date1.getFullYear(), date1.getMonth(), 0);
		let previousreportData = {
			'name': reportData.name,
			'dateFrom': moment(previousfirstDay).format('YYYY-MM-DD'),
			'dateTo': moment(previouslastDay).format('YYYY-MM-DD')
		}
		let lastmonthlyCollegeActivityEmailReport = await getBounceActivityEmailReportList(previousreportData);

		let date2 = new Date();
		let secondfirstDay = new Date(date2.getFullYear(), date2.getMonth() - 2, 1);
		let secondlastDay = new Date(date2.getFullYear(), date2.getMonth() -1, 0);
		let secondreportData = {
			'name': reportData.name,
			'dateFrom': moment(secondfirstDay).format('YYYY-MM-DD'),
			'dateTo': moment(secondlastDay).format('YYYY-MM-DD')
		}
		let secondmonthlyCollegeActivityEmailReport = await getBounceActivityEmailReportList(secondreportData);

		let date3 = new Date();
		let thirdfirstDay = new Date(date3.getFullYear(), date3.getMonth() - 3, 1);
		let thirdlastDay = new Date(date3.getFullYear(), date3.getMonth() -2, 0);
		let thirdreportData = {
			'name': reportData.name,
			'dateFrom': moment(thirdfirstDay).format('YYYY-MM-DD'),
			'dateTo': moment(thirdlastDay).format('YYYY-MM-DD')
		}
		let thirdmonthlyCollegeActivityEmailReport = await getBounceActivityEmailReportList(thirdreportData);

		let date4 = new Date();
		let fourthfirstDay = new Date(date4.getFullYear(), date4.getMonth() - 4, 1);
		let fourthlastDay = new Date(date4.getFullYear(), date4.getMonth() -3, 0);
		let fourthreportData = {
			'name': reportData.name,
			'dateFrom': moment(fourthfirstDay).format('YYYY-MM-DD'),
			'dateTo': moment(fourthlastDay).format('YYYY-MM-DD')
		}
		let fourthmonthlyCollegeActivityEmailReport = await getBounceActivityEmailReportList(fourthreportData);

		let date5 = new Date();
		let fifthfirstDay = new Date(date5.getFullYear(), date5.getMonth() - 5, 1);
		let fifthlastDay = new Date(date5.getFullYear(), date5.getMonth() -4, 0);
		let fifthreportData = {
			'name': reportData.name,
			'dateFrom': moment(fifthfirstDay).format('YYYY-MM-DD'),
			'dateTo': moment(fifthlastDay).format('YYYY-MM-DD')
		}
		let fifthmonthlyCollegeActivityEmailReport = await getBounceActivityEmailReportList(fifthreportData);

		let date6 = new Date();
		let sixthfirstDay = new Date(date6.getFullYear(), date6.getMonth() - 6, 1);
		let sixthlastDay = new Date(date6.getFullYear(), date6.getMonth() -5, 0);
		let sixthreportData = {
			'name': reportData.name,
			'dateFrom': moment(sixthfirstDay).format('YYYY-MM-DD'),
			'dateTo': moment(sixthlastDay).format('YYYY-MM-DD')
		}
		let sixthmonthlyCollegeActivityEmailReport = await getBounceActivityEmailReportList(sixthreportData);

		let date7 = new Date();
		let seventhfirstDay = new Date(date7.getFullYear(), date7.getMonth() - 7, 1);
		let seventhlastDay = new Date(date7.getFullYear(), date7.getMonth() -6, 0);
		let seventhreportData = {
			'name': reportData.name,
			'dateFrom': moment(seventhfirstDay).format('YYYY-MM-DD'),
			'dateTo': moment(seventhlastDay).format('YYYY-MM-DD')
		}
		let seventhmonthlyCollegeActivityEmailReport = await getBounceActivityEmailReportList(seventhreportData);

		let date8 = new Date();
		let eighthfirstDay = new Date(date8.getFullYear(), date8.getMonth() - 8, 1);
		let eighthlastDay = new Date(date8.getFullYear(), date8.getMonth() -7, 0);
		let eighthreportData = {
			'name': reportData.name,
			'dateFrom': moment(eighthfirstDay).format('YYYY-MM-DD'),
			'dateTo': moment(eighthlastDay).format('YYYY-MM-DD')
		}
		let eighthmonthlyCollegeActivityEmailReport = await getBounceActivityEmailReportList(eighthreportData);

		let date9 = new Date();
		let ninthfirstDay = new Date(date9.getFullYear(), date9.getMonth() - 9, 1);
		let ninthlastDay = new Date(date9.getFullYear(), date9.getMonth() -8, 0);
		let ninthreportData = {
			'name': reportData.name,
			'dateFrom': moment(ninthfirstDay).format('YYYY-MM-DD'),
			'dateTo': moment(ninthlastDay).format('YYYY-MM-DD')
		}
		let ninthmonthlyCollegeActivityEmailReport = await getBounceActivityEmailReportList(ninthreportData);

		let date10 = new Date();
		let tenthfirstDay = new Date(date10.getFullYear(), date10.getMonth() - 10, 1);
		let tenthlastDay = new Date(date10.getFullYear(), date10.getMonth() -9, 0);
		let tenthreportData = {
			'name': reportData.name,
			'dateFrom': moment(tenthfirstDay).format('YYYY-MM-DD'),
			'dateTo': moment(tenthlastDay).format('YYYY-MM-DD')
		}
		let tenthmonthlyCollegeActivityEmailReport = await getBounceActivityEmailReportList(tenthreportData);

		let date11 = new Date();
		let eleventhfirstDay = new Date(date11.getFullYear(), date11.getMonth() - 11, 1);
		let eleventhlastDay = new Date(date11.getFullYear(), date11.getMonth() -10, 0);
		let eleventhreportData = {
			'name': reportData.name,
			'dateFrom': moment(eleventhfirstDay).format('YYYY-MM-DD'),
			'dateTo': moment(eleventhlastDay).format('YYYY-MM-DD')
		}
		let eleventhmonthlyCollegeActivityEmailReport = await getBounceActivityEmailReportList(eleventhreportData);

		let date12 = new Date();
		let twelvethfirstDay = new Date(date12.getFullYear(), date12.getMonth() - 12, 1);
		let twelvethlastDay = new Date(date12.getFullYear(), date12.getMonth() -11, 0);
		let twelvethreportData = {
			'name': reportData.name,
			'dateFrom': moment(twelvethfirstDay).format('YYYY-MM-DD'),
			'dateTo': moment(twelvethlastDay).format('YYYY-MM-DD')
		}
		let twelvethmonthlyCollegeActivityEmailReport = await getBounceActivityEmailReportList(twelvethreportData);

		if (month == "this month") {
			return (thismonthlyCollegeActivityEmailReport);
		} else if (month == "last month") {
			return (lastmonthlyCollegeActivityEmailReport);
		} else if (month == "last 3 months") {
			let last3MonthsCollegeActivityEmailReport = [...thirdmonthlyCollegeActivityEmailReport,...secondmonthlyCollegeActivityEmailReport,...lastmonthlyCollegeActivityEmailReport];
			return (last3MonthsCollegeActivityEmailReport);
		} else if (month == "last 6 months") {
			last6MonthsCollegeActivityEmailReport = [...sixthmonthlyCollegeActivityEmailReport,...fifthmonthlyCollegeActivityEmailReport,...fourthmonthlyCollegeActivityEmailReport,...thirdmonthlyCollegeActivityEmailReport,...secondmonthlyCollegeActivityEmailReport,...lastmonthlyCollegeActivityEmailReport];
			return (last6MonthsCollegeActivityEmailReport);
		} else if (month == "last 9 months") {
			last9MonthsCollegeActivityEmailReport = [...ninthmonthlyCollegeActivityEmailReport,...eighthmonthlyCollegeActivityEmailReport,...seventhmonthlyCollegeActivityEmailReport,...sixthmonthlyCollegeActivityEmailReport,...fifthmonthlyCollegeActivityEmailReport,...fourthmonthlyCollegeActivityEmailReport,...thirdmonthlyCollegeActivityEmailReport,...secondmonthlyCollegeActivityEmailReport,...lastmonthlyCollegeActivityEmailReport];
			return (last9MonthsCollegeActivityEmailReport);
		} else if (month == "last 12 months") {
			last12MonthsCollegeActivityEmailReport = [...twelvethmonthlyCollegeActivityEmailReport,...eleventhmonthlyCollegeActivityEmailReport,...tenthmonthlyCollegeActivityEmailReport,...ninthmonthlyCollegeActivityEmailReport,...eighthmonthlyCollegeActivityEmailReport,...seventhmonthlyCollegeActivityEmailReport,...sixthmonthlyCollegeActivityEmailReport,...fifthmonthlyCollegeActivityEmailReport,...fourthmonthlyCollegeActivityEmailReport,...thirdmonthlyCollegeActivityEmailReport,...secondmonthlyCollegeActivityEmailReport,...lastmonthlyCollegeActivityEmailReport];
			return (last12MonthsCollegeActivityEmailReport);
		}

	}

	function getBounceActivityEmailReportList(reportData){
		return new Promise(function (resolve, reject) {
			let searchlist = "";
			
			if (reportData.dateFrom && reportData.dateTo) {
				let unsubType = "";
				if(reportData.name == "bouncedegree"){
					unsubType = "degree_bounce_email";
				}else{
					unsubType = "matching_email";
				}
				searchlist = "select  YEAR('" + reportData.dateFrom + "') as year, MONTHNAME('" + reportData.dateTo + "') as month,a.stotal,a.ototal,a.ctotal,a.mtotal,a.ftotal,(a.ototal/(a.stotal-btotal) * 100) as orate,a.btotal,(a.ctotal/a.ototal * 100) as crate,a.unsubtotal,((a.unsubtotal/a.stotal)*100) as unsubrate from (SELECT  SUM(CASE WHEN event_type='Open' THEN 1 ELSE 0 END) as  ototal, SUM(CASE WHEN event_type='Send' THEN 1 ELSE 0 END) as  stotal, SUM(CASE WHEN event_type='Click' THEN 1 ELSE 0 END) as  ctotal,SUM(CASE WHEN event_type='Bounce' THEN 1 ELSE 0 END) as  btotal,SUM(CASE WHEN (event_type='Click' and is_feature=1) THEN 1 ELSE 0 END) as ftotal, SUM(CASE WHEN (event_type='Click' and is_feature!=1) THEN 1 ELSE 0 END) as mtotal,(select count(id) from student_unsubscribe where unsubscribe_type='" + unsubType + "' and date(date_created) BETWEEN '" + reportData.dateFrom + "' AND '" + reportData.dateTo + "') as unsubtotal FROM aws_email_tracking where reference_type= '" + reportData.name + "' and date(message_date)  BETWEEN '" + reportData.dateFrom + "' AND '" + reportData.dateTo + "') as a";
			}
		
			//console.log('QQ:',searchlist);
			mysqlService.query(searchlist)
				.then(function (response) {
					resolve(superAdminBounceActivityEmailModel(response));
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}

	function registerMessageInfo() {
		return new Promise(function (resolve, reject) {
			let searchlist = "SELECT stt.first_name,stt.last_name,stt.email,stt.date_created,rrm.atregister,rrm1.afterregister,rrm2.collegecontact,dd.followup FROM students as stt LEFT JOIN (SELECT rr.student_id,COUNT(DISTINCT rr.college_id) as atregister FROM recon_messages as rr JOIN students as ss on rr.student_id=ss.uuid WHERE TIMESTAMPDIFF(minute,ss.date_created,rr.date_created) < 30 and rr.responder='user' GROUP BY rr.student_id) rrm on stt.uuid=rrm.student_id left JOIN (SELECT rr.student_id,COUNT(DISTINCT rr.college_id) as afterregister FROM recon_messages as rr JOIN students as ss on rr.student_id=ss.uuid WHERE TIMESTAMPDIFF(minute,ss.date_created,rr.date_created) > 30 and rr.responder='user' GROUP BY rr.student_id) rrm1 on stt.uuid=rrm1.student_id LEFT JOIN(SELECT rr.student_id,COUNT(DISTINCT rr.college_id) as collegecontact FROM recon_messages as rr JOIN students as ss on rr.student_id=ss.uuid WHERE TIMESTAMPDIFF(minute,ss.date_created,rr.date_created) > 0 and rr.responder='college' GROUP BY rr.student_id) rrm2 on stt.uuid=rrm2.student_id LEFT JOIN (SELECT a.student_id,COUNT(DISTINCT a.college_id) as followup FROM (SELECT responder,student_id,message_id,college_id  FROM recon_messages WHERE responder='user' GROUP BY responder,student_id,message_id,college_id HAVING count(responder) >1) as a GROUP BY a.student_id) as dd on stt.uuid=dd.student_id WHERE stt.user_account_status='active' and stt.last_name <> '' GROUP BY stt.first_name,stt.last_name,stt.email"
		
			//console.log('QQ:',searchlist);
			mysqlService.query(searchlist)
				.then(function (response) {
					resolve((registerMessageInfoModel(response)));
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}

	function campaignEntryReport(reportData){
		return new Promise(function (resolve, reject) {
			let date = new Date();
			let thisfirstDay = new Date(date.getFullYear(), date.getMonth(), 1);
			let thislastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
			let thisreportData = {
				'dateFrom': moment(thisfirstDay).format('YYYY-MM-DD'),
				'dateTo': moment(date).format('YYYY-MM-DD')
			}

			let date1 = new Date();
			let previousfirstDay = new Date(date1.getFullYear(), date1.getMonth() - 1, 1);
			let previouslastDay = new Date(date1.getFullYear(), date1.getMonth(), 0);
			let previousreportData = {
				'dateFrom': moment(previousfirstDay).format('YYYY-MM-DD'),
				'dateTo': moment(previouslastDay).format('YYYY-MM-DD')
			}

			let date2 = new Date();
			let secondfirstDay = new Date(date2.getFullYear(), date2.getMonth() - 2, 1);
			let secondlastDay = new Date(date2.getFullYear(), date2.getMonth() -1, 0);
			let secondreportData = {
				'dateFrom': moment(secondfirstDay).format('YYYY-MM-DD'),
				'dateTo': moment(secondlastDay).format('YYYY-MM-DD')
			}

			let searchlist = "SELECT cc.id,cc.college_id,c.college_name,cc.campaign_name,DATE_FORMAT(cc.start_date,'%Y-%m-%d') as start_date,date(cc.start_date) as cmap_startdate,DATE_FORMAT(cc.end_date,'%Y-%m-%d') as end_date,cc.amount_free_from_entry ,cc.campaign_type,cc.cpi_target_free_from_entry,cc.targeting,(SELECT COUNT(DISTINCT(student_id)) FROM recon_messages WHERE college_id =cc.college_id AND date(date_created) BETWEEN cc.start_date AND CURRENT_DATE()) as requestinfototal,(SELECT COUNT(DISTINCT(student_id)) FROM recon_messages WHERE college_id =cc.college_id AND date(date_created) BETWEEN '"+thisreportData.dateFrom+"' AND CURRENT_DATE()) as curinfototal,(SELECT COUNT(DISTINCT(student_id)) FROM recon_messages WHERE college_id =cc.college_id AND date(date_created) BETWEEN '"+previousreportData.dateFrom+"' AND '"+previousreportData.dateTo+"') as previnfototal,(SELECT COUNT(DISTINCT(student_id)) FROM recon_messages WHERE college_id =cc.college_id AND date(date_created) BETWEEN '"+secondreportData.dateFrom+"' AND '"+secondreportData.dateTo+"') as secondinfototal FROM college_campaigns as cc LEFT JOIN colleges as c ON cc.college_id=c.id WHERE cc.campaign_status='active'";
			if(reportData.filterType){
				searchlist+= " and cc.campaign_type='"+reportData.filterType+"'";
			}
			if(reportData.type == 'active'){
				searchlist+= " and cc.end_date >= CURRENT_DATE()";
			}
			if(reportData.type == 'inactive'){
				searchlist+= " and cc.end_date < CURRENT_DATE()";
			}
			if(reportData.collegeId){
				searchlist+= " and cc.college_id ="+reportData.collegeId;
			}
			if(reportData.campaignId){
				searchlist+= " and cc.id ="+reportData.campaignId;
			}
			//console.log("QQ:",searchlist);
			mysqlService.query(searchlist)
				.then(function (response) {
					resolve(campaignReportModel(response,reportData.listType));
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}

	function schoolRequestInfoList(reportData){
		return new Promise(function (resolve, reject) {
			let date = new Date();
			let thisfirstDay = new Date(date.getFullYear(), date.getMonth(), 1);
			let thisreportData = {
				'dateFrom': moment(thisfirstDay).format('YYYY-MM-DD'),
				'dateTo': moment(date).format('YYYY-MM-DD')
			}

			//let searchlist = "SELECT id,college_name,(SELECT COUNT(DISTINCT(student_id)) FROM recon_messages WHERE college_id =id AND date(date_created) BETWEEN '"+thisreportData.dateFrom+"' AND CURRENT_DATE()) as curinfototal FROM colleges WHERE status='active'";
			let searchlist = "SELECT id,college_name,city,state,college_abbreviation  FROM colleges WHERE status='active'";
			//console.log("QQ:",searchlist);
			mysqlService.query(searchlist)
				.then(function (response) {
					resolve(response);
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}

	function schoolRequestInfoUserList(reportData){
		return new Promise(function (resolve, reject) {
			let searchlist = "";
			if(reportData.dateFrom && reportData.dateTo){
				searchlist = "SELECT distinct(rm.student_id),ss.first_name,ss.last_name,ss.email,sp.state,sp.postal_code,sp.phone_number, (SELECT title FROM levels WHERE id=sp.level_id) as degree_level, (SELECT title FROM bucket_degree WHERE id=sp.bucket_id) as primary_bucket, (SELECT GROUP_CONCAT(title) FROM bucket_secondary_degree WHERE id IN(sp.secondary_bucket_id)) as secondary_bucket,ss.date_created, ss.primary_source FROM students as ss LEFT JOIN student_profile as sp ON ss.uuid=sp.uuid inner join recon_messages as rm on ss.uuid=rm.student_id WHERE rm.college_id="+reportData.cid+" and ss.user_account_status='active' and date(rm.date_created) BETWEEN '"+reportData.dateFrom+"' AND '"+reportData.dateTo+"'";
			}else{
				searchlist = "SELECT distinct(rm.student_id),ss.first_name,ss.last_name,ss.email,sp.state,sp.postal_code,sp.phone_number, (SELECT title FROM levels WHERE id=sp.level_id) as degree_level, (SELECT title FROM bucket_degree WHERE id=sp.bucket_id) as primary_bucket, (SELECT GROUP_CONCAT(title) FROM bucket_secondary_degree WHERE id IN(sp.secondary_bucket_id)) as secondary_bucket,ss.date_created, ss.primary_source FROM students as ss LEFT JOIN student_profile as sp ON ss.uuid=sp.uuid inner join recon_messages as rm on ss.uuid=rm.student_id WHERE rm.college_id="+reportData.cid+" and ss.user_account_status='active' and date(rm.date_created) >= '2018-01-01'";
			}
			//console.log("QQ:",searchlist);
			mysqlService.query(searchlist)
				.then(function (response) {
					resolve(response);
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}

	function campaignIndividualReport(reportData) {
		return new Promise(async (resolve, reject) => {
			try{
				let campaignlist = "SELECT cc.id,cc.college_id,c.college_name,cc.campaign_name,cc.amount_free_from_entry ,cc.campaign_type,cc.cpi_target_free_from_entry,cc.targeting,(SELECT COUNT(DISTINCT(student_id)) FROM recon_messages WHERE college_id =cc.college_id AND date(date_created) BETWEEN '"+reportData.dateFrom+"' AND '"+reportData.dateTo+"') as reqinfototal FROM college_campaigns as cc LEFT JOIN colleges as c ON cc.college_id=c.id WHERE cc.campaign_status='active'";
				if(reportData.collegeId){
					campaignlist+= " and cc.college_id ="+reportData.collegeId;
				}
				if(reportData.campaignId){
					campaignlist+= " and cc.id ="+reportData.campaignId;
				}
				const campaign = await mysqlService.query(campaignlist)
				if(campaign && campaign.length) return resolve(campaignIndividualModel(campaign[0],reportData.dateFrom,reportData.dateTo));
			}catch(error){
				return reject(error)
			}
		});
	}

	function campaignIndividualMonthReport(reportData) {
		return new Promise(async (resolve, reject) => {
			try{
				let campaignlist = "select Year(date_created) as yyyy,Month(date_created) as mm,MonthName(date_created) as mname,COUNT(DISTINCT(student_id)) as total FROM recon_messages WHERE date(date_created) BETWEEN '"+reportData.dateFrom+"' AND '"+reportData.dateTo+"' AND college_id ="+reportData.collegeId+" GROUP BY yyyy,mm";
				
				const campaign = await mysqlService.query(campaignlist)
				return resolve(campaign);
			}catch(error){
				return reject(error)
			}
		});
	}

	function allActivityEmailReport(reportData) {
		return new Promise(async function (resolve, reject) {
			try{
			let searchlist = "";
			let dateSet = "";
			if (reportData.dateFrom && reportData.dateTo) {
				searchlist = "select Temp.mm, Temp.year,Temp.month,Temp.stotal,Temp.ototal,Temp.ctotal,Temp.orate,Temp.btotal,Temp.brate,Temp.crate,Temp.comtotal,Temp.comrate, SUM(Temp.cc) as unsubtotal,(SUM(Temp.cc)/Temp.stotal) as unsubrate from (select sub.*, c1.*, case when (c1.a is not null and c1.a != '') then 1 else 0 end as cc from (select a.yyyy as year, a.mmmm as month,a.mm as mm,a.stotal,a.ototal,(a.ototal/(a.stotal-btotal)) as orate,a.btotal,(a.btotal/a.stotal) as brate,a.ctotal,(a.ctotal/a.ototal) as crate,a.comtotal,(a.comtotal/a.dtotal) as comrate from (SELECT YEAR(message_date) as yyyy,MONTHNAME(message_date) as mmmm,Month(message_date) as mm,SUM(CASE WHEN event_type='Open' THEN 1 ELSE 0 END) as ototal, SUM(CASE WHEN event_type='Send' THEN 1 ELSE 0 END) as stotal, SUM(CASE WHEN event_type='Bounce' THEN 1 ELSE 0 END) as btotal, SUM(CASE WHEN event_type='Click' THEN 1 ELSE 0 END) as ctotal, SUM(CASE WHEN event_type='Delivery' THEN 1 ELSE 0 END) as dtotal, SUM(CASE WHEN event_type='Complaint' THEN 1 ELSE 0 END) as comtotal FROM aws_email_tracking where  message_date  BETWEEN '" + reportData.dateFrom + "' AND '" + reportData.dateTo + "' group by yyyy, mm,mmmm order by yyyy,mm) as a ) sub left join (SELECT c.id as a, 'contact', year(c.unsubscribe_contact_date) as yy, month(c.unsubscribe_contact_date) as mon  from  `college_contacts` c  where c.unsubscribe_contact_date <> '' union SELECT c.id as a,'admission', year(c.unsubscribe_admission_date) as yy, month(c.unsubscribe_admission_date) as mon  from  `college_contacts` c  where c.unsubscribe_admission_date <> ''  union SELECT c.id as a,'admission1', year(c.unsubscribe_admission1_date) as yy, month(c.unsubscribe_admission1_date) as mon  from  `college_contacts` c  where c.unsubscribe_admission1_date <> '' union SELECT c.id as a,'vetaffairs', year(c.unsubscribe_vet_affairs_date) as yy, month(c.unsubscribe_vet_affairs_date) as mon  from  `college_contacts` c  where c.unsubscribe_vet_affairs_date <> '' union SELECT c.id as a,'marketing', year(c.unsubscribe_marketing_date) as yy, month(c.unsubscribe_marketing_date) as mon  from  `college_contacts` c  where c.unsubscribe_marketing_date <> '' union SELECT c.id as a,'marketing1', year(c.unsubscribe_marketing1_date) as yy, month(c.unsubscribe_marketing1_date) as mon  from  `college_contacts` c  where c.unsubscribe_marketing1_date <> '' union SELECT c.id as a,'unsub', year(c.date_created) as yy, month(c.date_created) as mon  from  `student_unsubscribe` c  where c.date_created  BETWEEN '" + reportData.dateFrom + "' AND '" + reportData.dateTo + "') as c1 on c1.yy = sub.year and c1.mon = sub.mm) as Temp group by Temp.year,Temp.mm";
			} else {
				dateSet = "2018-01-01";
				searchlist = "select Temp.mm, Temp.year,Temp.month,Temp.stotal,Temp.ototal,Temp.ctotal,Temp.orate,Temp.btotal,Temp.brate,Temp.crate,,Temp.comtotal,Temp.comrate, SUM(Temp.cc) as unsubtotal,(SUM(Temp.cc)/Temp.stotal) as unsubrate from (select sub.*, c1.*, case when (c1.a is not null and c1.a != '') then 1 else 0 end as cc from (select a.yyyy as year, a.mmmm as month,a.mm as mm,a.stotal,a.ototal,(a.ototal/(a.stotal-btotal)) as orate,a.btotal,(a.btotal/a.stotal) as brate,a.ctotal,(a.ctotal/a.ototal) as crate,(a.comtotal/a.dtotal) as comrate from (SELECT YEAR(message_date) as yyyy,MONTHNAME(message_date) as mmmm,Month(message_date) as mm,SUM(CASE WHEN event_type='Open' THEN 1 ELSE 0 END) as ototal, SUM(CASE WHEN event_type='Send' THEN 1 ELSE 0 END) as stotal, SUM(CASE WHEN event_type='Bounce' THEN 1 ELSE 0 END) as btotal, SUM(CASE WHEN event_type='Click' THEN 1 ELSE 0 END) as ctotal, SUM(CASE WHEN event_type='Delivery' THEN 1 ELSE 0 END) as dtotal, SUM(CASE WHEN event_type='Complaint' THEN 1 ELSE 0 END) as comtotal FROM aws_email_tracking where  message_date  > '" + dateSet + "' group by yyyy, mm,mmmm order by yyyy,mm) as a ) sub left join (SELECT c.id as a, 'contact', year(c.unsubscribe_contact_date) as yy, month(c.unsubscribe_contact_date) as mon  from  `college_contacts` c  where c.unsubscribe_contact_date <> '' union SELECT c.id as a,'admission', year(c.unsubscribe_admission_date) as yy, month(c.unsubscribe_admission_date) as mon  from  `college_contacts` c  where c.unsubscribe_admission_date <> ''  union SELECT c.id as a,'admission1', year(c.unsubscribe_admission1_date) as yy, month(c.unsubscribe_admission1_date) as mon  from  `college_contacts` c  where c.unsubscribe_admission1_date <> '' union SELECT c.id as a,'vetaffairs', year(c.unsubscribe_vet_affairs_date) as yy, month(c.unsubscribe_vet_affairs_date) as mon  from  `college_contacts` c  where c.unsubscribe_vet_affairs_date <> '' union SELECT c.id as a,'marketing', year(c.unsubscribe_marketing_date) as yy, month(c.unsubscribe_marketing_date) as mon  from  `college_contacts` c  where c.unsubscribe_marketing_date <> '' union SELECT c.id as a,'marketing1', year(c.unsubscribe_marketing1_date) as yy, month(c.unsubscribe_marketing1_date) as mon  from  `college_contacts` c  where c.unsubscribe_marketing1_date <> '' union SELECT c.id as a,'unsub', year(c.date_created) as yy, month(c.date_created) as mon  from  `student_unsubscribe` c  where c.date_created  > '" + dateSet + "') as c1 on c1.yy = sub.year and c1.mon = sub.mm) as Temp group by Temp.year,Temp.mm";
			}
			//console.log('QQ:',searchlist);
			const result = await mysqlService.query(searchlist);
			return resolve(result);
			}catch(error){
				return reject(error)
			}
		});
	}

	const getPhoneNumberProvidedReport = ({ dateFrom, dateTo }) => mysqlService.query(`select Year(date_created) as yyyy,Month(date_created) as mm,MonthName(date_created) as monthName, (sum(case when phone_number > 0 then 1 else 0 end) / count(distinct(id))) as percentOfUserWhoProvidedPhone FROM student_profile WHERE date(date_created) BETWEEN '${dateFrom}' AND '${dateTo}' and phone_number is not null GROUP BY yyyy,mm;`);

	const getNonPartnerMessageReceiving = ({ dateFrom, dateTo }) => mysqlService.query(`select a.collegeName, a.received, (a.received / (select count(rm.college_id) from colleges c join recon_messages rm on c.id = rm.college_id where c.status = 'active' and c.access_level <> 'patriot' and rm.responder = 'user' and (date(rm.date_created) BETWEEN '${dateFrom}' AND '${dateTo}'))) as receivedPercent, (select count(rm.college_id) from colleges c join recon_messages rm on c.id = rm.college_id where c.status = 'active' and c.access_level <> 'patriot' and rm.responder = 'user' and (date(rm.date_created) BETWEEN '${dateFrom}' AND '${dateTo}')) as total from (select c.college_name as collegeName, count(rm.college_id) as received from colleges c left join recon_messages as rm on c.id = rm.college_id where rm.responder = 'user' and (date(rm.date_created) BETWEEN '${dateFrom}' AND '${dateTo}') and c.status = 'active' and c.access_level <> 'patriot' group by college_id order by received desc) as a order by receivedPercent desc;`);

	const getNonPartnerMessageResponding = ({ dateFrom, dateTo }) => mysqlService.query(`select a.collegeName, a.responded, (a.responded / (select count(rm.college_id) from colleges c join recon_messages rm on c.id = rm.college_id where c.status = 'active' and c.access_level <> 'patriot' and rm.responder = 'college' and (date(rm.date_created) BETWEEN '${dateFrom}' AND '${dateTo}'))) as respondedPercent, (select count(rm.college_id) from colleges c join recon_messages rm on c.id = rm.college_id where c.status = 'active' and c.access_level <> 'patriot' and rm.responder = 'college' and (date(rm.date_created) BETWEEN '${dateFrom}' AND '${dateTo}')) as total from (select c.college_name as collegeName, count(rm.college_id) as responded from colleges c left join recon_messages as rm on c.id = rm.college_id where rm.responder = 'college' and (date(rm.date_created) BETWEEN '${dateFrom}' AND '${dateTo}') and c.status = 'active' and c.access_level <> 'patriot' group by college_id order by responded desc) as a order by respondedPercent desc;`);

	const fetchCountForTheDay = ({ date }) => mysqlService.query(`SELECT COUNT(id) as count FROM students WHERE date(date_created) = '${ date }' AND user_account_status = 'active'`);

	const fetchMemberCountToDate = ({ dateFrom, dateTo }) => mysqlService.query(`SELECT COUNT(id) as count FROM students WHERE (date(date_created) BETWEEN '${ dateFrom }' AND '${ dateTo }') AND user_account_status = 'active'`);

	const memberCountByDate = ({ dateFrom, dateTo }) => mysqlService.query(`SELECT date_generator.date as registeredDate, IFNULL(COUNT(students.id), 0) as count from ( select DATE_ADD('${dateFrom}', INTERVAL (@i:=@i+1)-1 DAY) as 'date' from information_schema.columns,(SELECT @i:=0) gen_sub  where DATE_ADD('${dateFrom}',INTERVAL @i DAY) BETWEEN '${dateFrom}' AND '${dateTo}') date_generator left join students on DATE(date_created) = date_generator.date and user_account_status = 'active' GROUP BY date;`);

	const getTotalCompareReport = ({ dateFrom, dateTo }) => mysqlService.query(`SELECT SUM(CASE WHEN bct.button_name="compareto" THEN 1 ELSE 0 END) as totalCompare,SUM(CASE WHEN bct.button_name="request-info" THEN 1 ELSE 0 END) as totalRequest,(select count(uuid) from students where register_source="compareto" and date(date_created) BETWEEN '${dateFrom}' AND '${dateTo}' and user_account_status="active") as totalRegister,SUM(CASE WHEN bct.button_name="school-link" THEN 1 ELSE 0 END) as totalClick from button_click_tracking as bct  LEFT JOIN colleges as cc ON bct.college_id = cc.id  where date(bct.date_clicked) BETWEEN '${dateFrom}' AND '${dateTo}' and cc.status="active";`);

	const getCollegewiseCompareReport = ({ dateFrom, dateTo }) => mysqlService.query(`SELECT cc.id,cc.college_name as collegeName,SUM(CASE WHEN bct.button_name="compareto" THEN 1 ELSE 0 END) as totalCompareClick,SUM(CASE WHEN bct.button_name="request-info" THEN 1 ELSE 0 END) as totalRequestClick,SUM(CASE WHEN bct.button_name="register" THEN 1 ELSE 0 END) as totalRegisterClick,SUM(CASE WHEN bct.button_name="school-link" THEN 1 ELSE 0 END) as totalSchoolClick from button_click_tracking as bct  LEFT JOIN colleges as cc ON bct.college_id = cc.id WHERE date(bct.date_clicked) BETWEEN '${dateFrom}' AND '${dateTo}' and cc.status="active" GROUP BY cc.id order by cc.college_name;`);

	const getButtonClickReport = async (reportData) => {
		const resultArray=[];
		const thisfirstDay = new Date(reportData.year, (reportData.month-1), 1);
		const dateFrom = moment(thisfirstDay).format('YYYY-MM-DD');
		const thislastDay = new Date(reportData.year, reportData.month, 1);
		const dateTo = moment(thislastDay).format('YYYY-MM-DD');
		
		let tabClick = await mysqlService.query(`select sum(case when tab_name='overview' then 1 else 0 end) as overviewtotal,sum(case when tab_name='military' then 1 else 0 end) as militarytotal,sum(case when tab_name='stats' then 1 else 0 end) as statstotal,sum(case when tab_name='degrees' then 1 else 0 end) as degreetotal,sum(case when tab_name='review' then 1 else 0 end) as reviewtotal,sum(case when tab_name='contact' then 1 else 0 end) as tcontacttotal from tab_click_tracking where date_clicked between '${dateFrom}' and '${dateTo}' and college_id=${reportData.collegeId}`);
		resultArray.push(tabClick[0]);
		let buttonClick = await mysqlService.query(`select sum(case when button_name='compareto' and location='detail' then 1 else 0 end) as comparetotal,sum(case when button_name='appearance' and location='compareto' then 1 else 0 end) as appeartotal,sum(case when button_name='matching-score' and location='detail' then 1 else 0 end) as matchingtotal,sum(case when button_name='request-info' and location='detail' then 1 else 0 end) as requesttotal,sum(case when button_name='phone' and location='admission' then 1 else 0 end) as phoneadmtotal,sum(case when button_name='email' and location='admission' then 1 else 0 end) as emailadmtotal,sum(case when button_name='website' and location='college' then 1 else 0 end) as webadmtotal,sum(case when button_name='phone' and location='affairs' then 1 else 0 end) as phoneafftotal,sum(case when button_name='email' and location='affairs' then 1 else 0 end) as emailafftotal,sum(case when button_name='website' and location='affairs' then 1 else 0 end) as webafftotal from button_click_tracking where date_clicked between '${dateFrom}' and '${dateTo}' and college_id=${reportData.collegeId}`);
		resultArray.push(buttonClick[0]);
		let contactClick = await mysqlService.query(`select count(id) as contacttotal from contactinfo_tracking where date_created between '${dateFrom}' and '${dateTo}' and college_id=${reportData.collegeId}`);
		resultArray.push(contactClick[0]);
		return resultArray;
	}


	return {
		listVeteranList: listVeteranList,
		dashboardReportList: dashboardReportList,
		VeteraninfoReportList: VeteraninfoReportList,
		ComminicationstatsReportList: ComminicationstatsReportList,
		listVeteranColleges: listVeteranColleges,
		listPartnerVeteranColleges: listPartnerVeteranColleges,
		VeteranByMilitaryStatus: VeteranByMilitaryStatus,
		CollegeReceivedMostMessage: CollegeReceivedMostMessage,
		CollegeNoReplyMessage: CollegeNoReplyMessage,
		veteranByMessageSource: veteranByMessageSource,
		collegeUserActivity: collegeUserActivity,
		veteranBySourceFilterTotal: veteranBySourceFilterTotal,
		manageVeteranDegreeRelation: manageVeteranDegreeRelation,
		getNagEmailReportList: getNagEmailReportList,
		getUserRegistrationReport: getUserRegistrationReport,
		detailCollegeUserActivity: detailCollegeUserActivity,
		collegeActivityEmailReport: collegeActivityEmailReport,
		getEmploymentRegistrationReport: getEmploymentRegistrationReport,
		partnerCollegeUserActivity: partnerCollegeUserActivity,
		getVeteranSourceTrackingReport: getVeteranSourceTrackingReport,
		getVeteranSourceTrackingTotalReport: getVeteranSourceTrackingTotalReport,
		bounceActivityEmailReport : bounceActivityEmailReport,
		registerMessageInfo: registerMessageInfo,
		campaignEntryReport: campaignEntryReport,
		schoolRequestInfoList: schoolRequestInfoList,
		schoolRequestInfoUserList: schoolRequestInfoUserList,
		campaignIndividualReport: campaignIndividualReport,
		campaignIndividualMonthReport: campaignIndividualMonthReport,
		allActivityEmailReport: allActivityEmailReport,
		getPhoneNumberProvidedReport,
		getNonPartnerMessageReceiving,
		getNonPartnerMessageResponding,
		fetchCountForTheDay,
		memberCountByDate,
		fetchMemberCountToDate,
		getTotalCompareReport,
		getCollegewiseCompareReport,
		getButtonClickReport,
	}

})();

module.exports = superAdminDashboardService;