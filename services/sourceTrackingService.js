let sourceTrackingService = (function () {
  let mysqlService = require('./mysqlService');
  let moment = require('moment');
  let sourceTrackingConstant = require('../constants/sourceTrackingConstant');
  let superAdminDashboardService = require('../services/superAdminDashboardService');
  let collegeFrequencyReportModel = require('../models/collegeFrequencyReportModel');
  const { getCurrentDateTime, convertToFormat } = require('../helpers/date-helper');

  function collegeSearchTracking(body) {
    return new Promise(function (resolve, reject) {
      var post = {
        primary_source: body.primarySource,
        secondary_source: body.secondarySource,
        college_id: body.collegeId,
        date_created: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
      };
      //console.log("PostData:",post);
      mysqlService
        .query(sourceTrackingConstant.SAVE_COLLEGE_SEARCH_TRACKING, post)
        .then((results) => {
          resolve('success');
        })
        .catch((err) => {
          console.log('error', err);
          reject(new Error(err));
        });
    });
  }

  function collegeFilterTracking(body) {
    return new Promise(function (resolve, reject) {
      var post = {
        primary_source: body.primarySource,
        secondary_source: body.secondarySource,
        filter_type: body.filterType,
        value: body.value,
        date_created: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
      };
      //console.log("PostData:",post);
      mysqlService
        .query(sourceTrackingConstant.SAVE_COLLEGE_FILTER_TRACKING, post)
        .then((results) => {
          resolve('success');
        })
        .catch((err) => {
          console.log('error', err);
          reject(new Error(err));
        });
    });
  }

  function searchresultCollegesTracking(body) {
    return new Promise(function (resolve, reject) {
      let searchData = '';
      if (body.collegeList.indexOf(',') > -1) {
        searchData = body.collegeList.split(',');
      } else {
        searchData = body.collegeList;
      }
      let insertQuery = '';
      insertQuery =
        'Insert into searchresult_colleges_tracking (primary_source,secondary_source,filters,college_id,date_created) values ';
      for (let i = 0; i < searchData.length; i++) {
        if (i == searchData.length - 1) {
          insertQuery +=
            "('" +
            body.primarySource +
            "','" +
            body.secondarySource +
            "','" +
            body.filters +
            "','" +
            searchData[i] +
            "','" +
            moment(new Date()).format('YYYY-MM-DD HH:mm:ss') +
            "');";
        } else {
          insertQuery +=
            "('" +
            body.primarySource +
            "','" +
            body.secondarySource +
            "','" +
            body.filters +
            "','" +
            searchData[i] +
            "','" +
            moment(new Date()).format('YYYY-MM-DD HH:mm:ss') +
            "'),";
        }
      }
      //console.log("II:",insertQuery);
      mysqlService
        .query(insertQuery)
        .then((results) => {
          resolve('success');
        })
        .catch((err) => {
          console.log('error', err);
          reject(new Error(err));
        });
    });
  }

  const searchFrequencyTrackingLevel = ({ dateFrom, dateTo }) =>
    mysqlService.query(
      `SELECT count(id) as filtertotal, (count(id) / (select count(id) from college_filter_tracking WHERE filter_type='level' AND  date(date_created) BETWEEN '${dateFrom}' AND '${dateTo}')) as searchPercent, COALESCE((SELECT title from levels WHERE id=value),'Not Sure') as levelname FROM college_filter_tracking WHERE filter_type='level' AND  date(date_created) BETWEEN '${dateFrom}' AND '${dateTo}' GROUP BY value ORDER BY filtertotal DESC;`
    );

  const searchFrequencyTrackingBucket = ({ dateFrom, dateTo }) =>
    mysqlService.query(
      `SELECT count(id) as filtertotal,(count(id)/(select count(id) from college_filter_tracking WHERE filter_type='bucket' AND  date(date_created) BETWEEN '${dateFrom}' AND '${dateTo}')) as searchPercent,(SELECT title from bucket_degree WHERE id=value) as bucketname FROM college_filter_tracking WHERE filter_type='bucket' AND  date(date_created) BETWEEN '${dateFrom}' AND '${dateTo}' GROUP BY value ORDER BY filtertotal DESC;`
    );

  const searchFrequencyTrackingState = ({ dateFrom, dateTo }) =>
    mysqlService.query(
      `SELECT count(id) as filtertotal,(count(id)/(SELECT count(id) FROM college_filter_tracking WHERE filter_type='state' AND  date(date_created) BETWEEN '${dateFrom}' AND '${dateTo}')) as searchPercent,value FROM college_filter_tracking WHERE filter_type='state' AND  date(date_created) BETWEEN '${dateFrom}' AND '${dateTo}' GROUP BY value ORDER BY filtertotal DESC;`
    );

  const searchFrequencyTrackingSecondaryBucket = ({ dateFrom, dateTo }) =>
    mysqlService.query(
      `SELECT count(id) as filtertotal,(count(id)/(SELECT count(id) FROM college_filter_tracking WHERE filter_type='secondary bucket' AND  date(date_created) BETWEEN '${dateFrom}' AND '${dateTo}')) as searchPercent,(SELECT title from bucket_secondary_degree WHERE id=value) as secondarybucketname FROM college_filter_tracking WHERE filter_type='secondary bucket' AND  date(date_created) BETWEEN '${dateFrom}' AND '${dateTo}' GROUP BY value ORDER BY filtertotal DESC;`
    );

  const searchFrequencyTrackingVeteranservice = ({ dateFrom, dateTo }) =>
    mysqlService.query(
      `SELECT count(id) as filtertotal,REPLACE(CONCAT(UPPER(LEFT(value, 1)), SUBSTRING(value, 2)), '_', ' ') as veteranservice,(count(id)/(SELECT count(id) FROM college_filter_tracking WHERE filter_type='military_service' AND  date(date_created) BETWEEN '${dateFrom}' AND '${dateTo}')) as searchPercent FROM college_filter_tracking WHERE filter_type='military_service' AND  date(date_created) BETWEEN '${dateFrom}' AND '${dateTo}' GROUP BY value ORDER BY filtertotal DESC`
    );

  const searchfrequencyTrackingCollegeType = ({ dateFrom, dateTo }) =>
    mysqlService.query(
      `SELECT count(id) as filtertotal,value,(count(id)/(SELECT count(id) FROM college_filter_tracking WHERE filter_type='college_type' AND  date(date_created) BETWEEN '${dateFrom}' AND '${dateTo}')) as searchPercent FROM college_filter_tracking WHERE filter_type='college_type' AND  date(date_created) BETWEEN '${dateFrom}' AND '${dateTo}' GROUP BY value ORDER BY filtertotal DESC`
    );

  const searchfrequencyTrackingReligiousAffiliation = ({ dateFrom, dateTo }) =>
    mysqlService.query(
      `SELECT count(id) as filtertotal,value,(count(id)/(SELECT count(id) FROM college_filter_tracking WHERE filter_type='religious_affiliation' AND  date(date_created) BETWEEN '${dateFrom}' AND '${dateTo}')) as searchPercent FROM college_filter_tracking WHERE filter_type='religious_affiliation' AND  date(date_created) BETWEEN '${dateFrom}' AND '${dateTo}' GROUP BY value ORDER BY filtertotal DESC`
    );

  const searchfrequencyTrackingEthnicAffiliation = ({ dateFrom, dateTo }) =>
    mysqlService.query(
      `SELECT count(id) as filtertotal,value,(count(id)/(SELECT count(id) FROM college_filter_tracking WHERE filter_type='ethnic_affiliation' AND  date(date_created) BETWEEN '${dateFrom}' AND '${dateTo}')) as searchPercent FROM college_filter_tracking WHERE filter_type='ethnic_affiliation' AND  date(date_created) BETWEEN '${dateFrom}' AND '${dateTo}' GROUP BY value ORDER BY filtertotal DESC`
    );

  const CollegesearchTracking = ({ dateFrom, dateTo }) =>
    mysqlService.query(
      `SELECT count(cst.id) as filtertotal,c.college_name as collegename,(count(cst.id)/(SELECT count(cst.id) FROM college_search_tracking as cst LEFT JOIN colleges as c ON cst.college_id=c.id WHERE  date(date_created) BETWEEN '${dateFrom}' AND '${dateTo}' AND  cst.secondary_source in ('url','list') AND c.status = 'ACTIVE')) as searchPercent FROM college_search_tracking as cst LEFT JOIN colleges as c ON cst.college_id=c.id WHERE date(date_created) BETWEEN '${dateFrom}' AND '${dateTo}' AND  cst.secondary_source in ('url','list') AND c.status = 'ACTIVE' GROUP BY college_id ORDER BY filtertotal DESC`
    );

  const employmentTrackingBranch = ({ dateFrom, dateTo }) =>
    mysqlService.query(
      `SELECT count(s.uuid) as branchtotal,(select branch_short_name from branches where id=sp.military_branch) as bname,(count(s.uuid)/(select count(s.id) from students as s LEFT JOIN student_profile as sp ON s.uuid=sp.uuid WHERE date(s.date_created) BETWEEN '${dateFrom}' AND '${dateTo}' AND s.user_account_status = 'ACTIVE' AND sp.security_clearance <> '' )) as branchpercent from students as s LEFT JOIN student_profile as sp ON s.uuid=sp.uuid WHERE date(s.date_created) BETWEEN '${dateFrom}' AND '${dateTo}' AND s.user_account_status = 'ACTIVE' AND sp.security_clearance <> '' GROUP BY sp.military_branch ORDER BY branchtotal DESC`
    );

  const employmentTrackingSecurity = ({ dateFrom, dateTo }) =>
    mysqlService.query(
      `SELECT count(s.uuid) as stotal,(select name from security_clearance where id=sp.security_clearance) as sname,(select branch_short_name from branches where id=sp.military_branch) as bname,(count(s.uuid)/(select count(s.id) from students as s LEFT JOIN student_profile as sp ON s.uuid=sp.uuid WHERE date(s.date_created) BETWEEN '${dateFrom}' AND '${dateTo}' AND s.user_account_status = 'ACTIVE' AND sp.security_clearance <> '' )) as securitypercent from students as s LEFT JOIN student_profile as sp ON s.uuid=sp.uuid WHERE date(s.date_created) BETWEEN '${dateFrom}' AND '${dateTo}' AND s.user_account_status = 'ACTIVE' AND sp.security_clearance <> '' GROUP BY sp.security_clearance ORDER BY stotal DESC`
    );

  const employmentTrackingEducation = ({ dateFrom, dateTo }) =>
    mysqlService.query(
      `SELECT count(s.uuid) as etotal,(select level_name from mmb_education_levels where id=sp.mmb_level_id) as ename,(select branch_short_name from branches where id=sp.military_branch) as bname,(count(s.uuid)/(select count(s.id) from students as s LEFT JOIN student_profile as sp ON s.uuid=sp.uuid WHERE date(s.date_created) BETWEEN '${dateFrom}' AND '${dateTo}' AND s.user_account_status = 'ACTIVE' AND sp.security_clearance <> '' )) as educationpercent from students as s LEFT JOIN student_profile as sp ON s.uuid=sp.uuid WHERE date(s.date_created) BETWEEN '${dateFrom}' AND '${dateTo}' AND s.user_account_status = 'ACTIVE' AND sp.security_clearance <> '' GROUP BY sp.mmb_level_id ORDER BY etotal DESC`
    );

  const employmentTrackingCareer = ({ dateFrom, dateTo }) =>
    mysqlService.query(
      `SELECT count(s.uuid) as ctotal,(select career_name from mmb_career where id=sp.career_id) as cname,(select branch_short_name from branches where id=sp.military_branch) as bname,(count(s.uuid)/(select count(s.id) from students as s LEFT JOIN student_profile as sp ON s.uuid=sp.uuid WHERE date(s.date_created) BETWEEN '${dateFrom}' AND '${dateTo}' AND s.user_account_status = 'ACTIVE' AND sp.security_clearance <> '' )) as careerpercent from students as s LEFT JOIN student_profile as sp ON s.uuid=sp.uuid WHERE date(s.date_created) BETWEEN '${dateFrom}' AND '${dateTo}' AND s.user_account_status = 'ACTIVE' AND sp.security_clearance <> '' GROUP BY sp.career_id ORDER BY ctotal DESC`
    );

  const employmentTrackingRelocate = ({ dateFrom, dateTo }) =>
    mysqlService.query(
      `SELECT count(s.uuid) as rtotal,sp.relocate,(count(s.uuid)/(select count(s.id) from students as s LEFT JOIN student_profile as sp ON s.uuid=sp.uuid WHERE date(s.date_created) BETWEEN '${dateFrom}' AND '${dateTo}' AND s.user_account_status = 'ACTIVE' AND sp.security_clearance <> '' )) as relocatepercent from students as s LEFT JOIN student_profile as sp ON s.uuid=sp.uuid WHERE date(s.date_created) BETWEEN '${dateFrom}' AND '${dateTo}' AND s.user_account_status = 'ACTIVE' AND sp.security_clearance <> '' GROUP BY sp.relocate ORDER BY rtotal DESC`
    );

  const employmentTrackingMstatus = ({ dateFrom, dateTo }) =>
    mysqlService.query(
      `SELECT count(s.uuid) as mtotal,(CASE WHEN sp.military_status = 'Active' then 'Active Duty' WHEN sp.military_status = 'Guard' then 'National Guard' WHEN sp.military_status = 'Retired' then 'Retiree' ELSE sp.military_status END) as mname,(count(s.uuid)/(select count(s.id) from students as s LEFT JOIN student_profile as sp ON s.uuid=sp.uuid WHERE date(s.date_created) BETWEEN '${dateFrom}' AND '${dateTo}' AND s.user_account_status = 'ACTIVE' AND sp.security_clearance <> '' )) as statuspercent from students as s LEFT JOIN student_profile as sp ON s.uuid=sp.uuid WHERE date(s.date_created) BETWEEN '${dateFrom}' AND '${dateTo}' AND s.user_account_status = 'ACTIVE' AND sp.security_clearance <> '' GROUP BY sp.military_status ORDER BY mtotal DESC`
    );

  const employmentTrackingRankPaygrade = ({ dateFrom, dateTo }) =>
    mysqlService.query(
      `SELECT count(s.uuid) as ptotal,(select name from college_ranks where id=sp.military_rank) as pname,(count(s.uuid)/(select count(s.id) from students as s LEFT JOIN student_profile as sp ON s.uuid=sp.uuid WHERE date(s.date_created) BETWEEN '${dateFrom}' AND '${dateTo}' AND s.user_account_status = 'ACTIVE' AND sp.security_clearance <> '' and sp.military_rank <> '')) as rankpercent from students as s LEFT JOIN student_profile as sp ON s.uuid=sp.uuid WHERE date(s.date_created) BETWEEN '${dateFrom}' AND '${dateTo}' AND s.user_account_status = 'ACTIVE' AND sp.security_clearance <> '' and sp.military_rank <> '' GROUP BY sp.military_rank ORDER BY ptotal DESC`
    );

  const registerTrackingBranch = ({ dateFrom, dateTo }) =>
    mysqlService.query(
      `SELECT count(s.uuid) as branchtotal,(select branch_short_name from branches where id=sp.military_branch ) as bname,(count(s.uuid)/(SELECT count(sp.id) from students as ss LEFT JOIN student_profile as sp ON ss.uuid=sp.uuid WHERE date(ss.date_created) BETWEEN '${dateFrom}' AND '${dateTo}' AND ss.user_account_status = 'ACTIVE' and sp.security_clearance is null  and sp.military_branch <> '')) as branchpercent from students as s LEFT JOIN student_profile as sp ON s.uuid=sp.uuid left JOIN branches bb ON bb.id=sp.military_branch WHERE date(s.date_created) BETWEEN '${dateFrom}' AND '${dateTo}' AND s.user_account_status = 'ACTIVE' and sp.security_clearance is null and bb.status='ACTIVE' and sp.military_branch <> '' GROUP BY sp.military_branch ORDER BY branchtotal DESC`
    );

  const registerTrackingStatus = ({ dateFrom, dateTo }) =>
    mysqlService.query(
      `SELECT count(s.uuid) as mtotal,(CASE WHEN sp.military_status = 'Active' then 'Active Duty' WHEN sp.military_status = 'Guard' then 'National Guard' WHEN sp.military_status = 'Retired' then 'Retiree' ELSE sp.military_status END) as mname,(count(s.uuid)/(SELECT count(sp.id) from students as ss LEFT JOIN student_profile as sp ON ss.uuid=sp.uuid WHERE date(ss.date_created) BETWEEN '${dateFrom}' AND '${dateTo}' AND ss.user_account_status = 'ACTIVE' and sp.security_clearance is null  and sp.military_status NOT IN('Prospective ROTC','Military Family Member',''))) as statuspercent from students as s LEFT JOIN student_profile as sp ON s.uuid=sp.uuid WHERE date(s.date_created) BETWEEN '${dateFrom}' AND '${dateTo}' AND s.user_account_status = 'ACTIVE' and sp.security_clearance is null and sp.military_status NOT IN('Prospective ROTC','Military Family Member','') GROUP BY sp.military_status ORDER BY mtotal DESC`
    );

  const registerTrackingPaygrade = ({ dateFrom, dateTo }) =>
    mysqlService.query(
      `SELECT count(s.uuid) as ptotal,rnk.name as pname,(count(s.uuid)/(SELECT count(sp.id) from students as ss LEFT JOIN student_profile as sp ON ss.uuid=sp.uuid WHERE date(ss.date_created) BETWEEN '${dateFrom}' AND '${dateTo}' AND ss.user_account_status = 'ACTIVE' and sp.security_clearance is null  and sp.military_rank <> '')) as paygradepercent from students as s LEFT JOIN student_profile as sp ON s.uuid=sp.uuid LEFT JOIN college_ranks rnk ON rnk.id=sp.military_rank WHERE date(s.date_created) BETWEEN '${dateFrom}' AND '${dateTo}' AND s.user_account_status = 'ACTIVE' AND sp.security_clearance is null and sp.military_rank <> '' GROUP BY rnk.name ORDER BY ptotal DESC`
    );

  const registerTrackingEducationLevel = ({ dateFrom, dateTo }) =>
    mysqlService.query(
      `SELECT count(s.uuid) as ltotal,(select title from levels where id=sp.level_id) as lname,(count(s.uuid)/(SELECT count(sp.id) from students as ss LEFT JOIN student_profile as sp ON ss.uuid=sp.uuid WHERE date(ss.date_created) BETWEEN '${dateFrom}' AND '${dateTo}' AND ss.user_account_status = 'ACTIVE' and sp.security_clearance is null  and sp.level_id <> '')) as levelpercent from students as s LEFT JOIN student_profile as sp ON s.uuid=sp.uuid WHERE date(s.date_created) BETWEEN '${dateFrom}' AND '${dateTo}' AND s.user_account_status = 'ACTIVE' and sp.security_clearance is null and sp.level_id <> '' GROUP BY sp.level_id ORDER BY ltotal DESC`
    );

  const registerTrackingPrimaryBucket = ({ dateFrom, dateTo }) =>
    mysqlService.query(
      `SELECT count(s.uuid) as ptotal,(select title from bucket_degree where id=sp.bucket_id ) as pname,(count(s.uuid)/(SELECT count(sp.id) from students as ss LEFT JOIN student_profile as sp ON ss.uuid=sp.uuid WHERE date(ss.date_created) BETWEEN '${dateFrom}' AND '${dateTo}' AND ss.user_account_status = 'ACTIVE' and sp.security_clearance is null  and sp.bucket_id <> '')) as bucketpercent from students as s LEFT JOIN student_profile as sp ON s.uuid=sp.uuid WHERE date(s.date_created) BETWEEN '${dateFrom}' AND '${dateTo}' AND s.user_account_status = 'ACTIVE' and sp.security_clearance is null and sp.bucket_id <> '' GROUP BY sp.bucket_id ORDER BY ptotal DESC`
    );

  const registerTrackingSecondaryBucket = ({ dateFrom, dateTo }) =>
    mysqlService.query(
      `SELECT count(s.uuid) as stotal,sb.title,(count(s.uuid)/(SELECT count(sp.id) from students as ss LEFT JOIN student_profile as sp ON ss.uuid=sp.uuid WHERE date(ss.date_created) BETWEEN '${dateFrom}' AND '${dateTo}' AND ss.user_account_status = 'ACTIVE' and sp.security_clearance is null  and sp.secondary_bucket_id <> '')) as secondarypercent from students as s LEFT JOIN student_profile as sp ON s.uuid=sp.uuid LEFT JOIN bucket_secondary_degree sb ON (FIND_IN_SET(sb.id, sp.secondary_bucket_id) > 0) WHERE date(s.date_created) BETWEEN '${dateFrom}' AND '${dateTo}' AND s.user_account_status = 'ACTIVE' and sp.security_clearance is null and sp.secondary_bucket_id <> '' GROUP BY sb.id ORDER BY stotal DESC`
    );

  const registerTrackingState = ({ dateFrom, dateTo }) =>
    mysqlService.query(
      `SELECT count(s.uuid) as stotal,sp.state,(count(s.uuid)/(SELECT count(sp.id) from students as ss LEFT JOIN student_profile as sp ON ss.uuid=sp.uuid WHERE date(ss.date_created) BETWEEN '${dateFrom}' AND '${dateTo}' AND ss.user_account_status = 'ACTIVE' and sp.security_clearance is null  and sp.state <> '')) as statepercent from students as s LEFT JOIN student_profile as sp ON s.uuid=sp.uuid  WHERE date(s.date_created) BETWEEN '${dateFrom}' AND '${dateTo}' AND s.user_account_status = 'ACTIVE' and sp.security_clearance is null and sp.state <> '' GROUP BY sp.state ORDER BY stotal DESC`
    );

  const getHomepageLinkClickReport = ({ dateFrom, dateTo }) =>
    mysqlService.query(`select a.yellowRibbon, (a.yellowRibbon / (select count(id) from homepage_link_tracking 
  WHERE date(date_clicked) BETWEEN '${dateFrom}' AND '${dateTo}')) as yellowRibbonPercent , a.forOnline, (a.forOnline / (select count(id) from homepage_link_tracking 
  WHERE date(date_clicked) BETWEEN '${dateFrom}' AND '${dateTo}')) as forOnlinePercent, a.tuitionAssistance, (a.tuitionAssistance / (select count(id) from homepage_link_tracking 
  WHERE date(date_clicked) BETWEEN '${dateFrom}' AND '${dateTo}')) as tuitionAssistancePercent, a.mbaPrograms, (a.mbaPrograms / (select count(id) from homepage_link_tracking 
  WHERE date(date_clicked) BETWEEN '${dateFrom}' AND '${dateTo}')) as mbaProgramsPercent
  from (SELECT
  sum((filter_name = 'yellowribbon')) AS yellowRibbon,
  sum((filter_name = 'online')) AS forOnline,
  sum((filter_name = 'tuitionassistance')) AS tuitionAssistance,
  sum((filter_name = 'mbaprograms')) AS mbaPrograms
  FROM homepage_link_tracking WHERE date(date_clicked) BETWEEN '${dateFrom}' AND '${dateTo}') as a;`);

  function veteransRegistrations(body) {
    return new Promise(function (resolve, reject) {
      var post = {
        student_id: body.studentId,
        track_type: body.trackType,
        state_data: body.stateData,
        date_created: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
      };
      mysqlService
        .query(sourceTrackingConstant.SAVE_VETERANS_STATE_REGISTER, post)
        .then((results) => {
          resolve('success');
        })
        .catch((err) => {
          console.log('error', err);
          reject(new Error(err));
        });
    });
  }

  function searchfrequencyPlatformData(reportData) {
    return new Promise(async (resolve, reject) => {
      try {
        let platformData = [];
        let totalSql =
          "SELECT count(id) as dtotal FROM college_filter_tracking WHERE filter_type='filtertype' AND  date(date_created) BETWEEN '" +
          reportData.dateFrom +
          "' AND '" +
          reportData.dateTo +
          "'";
        // Get search report by degree level
        let degreeTotalSql = totalSql.replace(/filtertype/gi, 'level');
        let degreeTotal = await getQueryResultData(degreeTotalSql, 'single');
        let degreeListSql =
          "SELECT count(id) as filtertotal,COALESCE((SELECT title from levels WHERE id=value),'Not Sure') as name,cast(((count(id)/" +
          degreeTotal.dtotal +
          ")*100) as DECIMAL(4,2)) as value FROM college_filter_tracking WHERE filter_type='level' AND  date(date_created) BETWEEN '" +
          reportData.dateFrom +
          "' AND '" +
          reportData.dateTo +
          "' GROUP BY value ORDER BY filtertotal DESC";
        let levelData = await getQueryResultData(degreeListSql, 'multiple');
        platformData.push({
          name: 'Degree Level',
          data: collegeFrequencyReportModel(levelData),
        });
        // Get search report by college type
        let ctypeTotalSql = totalSql.replace(/filtertype/gi, 'college_type');
        let ctypeTotal = await getQueryResultData(ctypeTotalSql, 'single');
        let ctypeListSql =
          'SELECT count(id) as filtertotal,value as name,cast(((count(id)/' +
          ctypeTotal.dtotal +
          ")*100) as DECIMAL(4,2)) as value FROM college_filter_tracking WHERE filter_type='college_type' AND  date(date_created) BETWEEN '" +
          reportData.dateFrom +
          "' AND '" +
          reportData.dateTo +
          "' GROUP BY value ORDER BY filtertotal DESC";
        let ctypeData = await getQueryResultData(ctypeListSql, 'multiple');
        platformData.push({
          name: 'College Type',
          data: collegeFrequencyReportModel(ctypeData),
        });
        // Get search report by veteran services
        let vserviceTotalSql = totalSql.replace(
          /filtertype/gi,
          'military_service'
        );
        let vserviceTotal = await getQueryResultData(
          vserviceTotalSql,
          'single'
        );
        let vserviceListSql =
          "SELECT count(id) as filtertotal,REPLACE(CONCAT(UPPER(LEFT(value, 1)), SUBSTRING(value, 2)), '_', ' ') as name,cast(((count(id)/" +
          vserviceTotal.dtotal +
          ")*100) as DECIMAL(4,2)) as value FROM college_filter_tracking WHERE filter_type='military_service' AND  date(date_created) BETWEEN '" +
          reportData.dateFrom +
          "' AND '" +
          reportData.dateTo +
          "' GROUP BY value ORDER BY filtertotal DESC";
        let vserviceData = await getQueryResultData(
          vserviceListSql,
          'multiple'
        );
        platformData.push({
          name: 'Veteran Services',
          data: collegeFrequencyReportModel(vserviceData),
        });
        // Get search report by area of study
        let bucketTotalSql =
          "select sum(temp.CC) as dtotal from (select (SELECT title FROM bucket_degree WHERE id = sb_id) as bucketTitle,count(sb_id) as CC from (SELECT college_filter_tracking.id, SUBSTRING_INDEX(SUBSTRING_INDEX(college_filter_tracking.value, ',', numbers.n), ',', -1) sb_id FROM numbers INNER JOIN college_filter_tracking ON CHAR_LENGTH(college_filter_tracking.value) -CHAR_LENGTH(REPLACE(college_filter_tracking.value, ',', ''))>=numbers.n-1 WHERE college_filter_tracking.value is not null and college_filter_tracking.value > 0 and filter_type='bucket' and date(date_created) BETWEEN '" +
          reportData.dateFrom +
          "' AND '" +
          reportData.dateTo +
          "' ORDER BY id, n) as aa where (SELECT title FROM bucket_degree WHERE id = aa.sb_id) is not null GROUP BY aa.sb_id) as temp";
        let bucketTotal = await getQueryResultData(bucketTotalSql, 'single');
        let bucketListSql =
          'select (SELECT title FROM bucket_degree WHERE id = sb_id) as name, count(sb_id) as CC,cast(((count(sb_id)/' +
          bucketTotal.dtotal +
          ")*100) as DECIMAL(4,2)) as value from (SELECT college_filter_tracking.id, SUBSTRING_INDEX(SUBSTRING_INDEX(college_filter_tracking.value, ',', numbers.n), ',', -1) sb_id FROM numbers INNER JOIN college_filter_tracking ON CHAR_LENGTH(college_filter_tracking.value) -CHAR_LENGTH(REPLACE(college_filter_tracking.value, ',', ''))>=numbers.n-1 WHERE college_filter_tracking.value is not null and college_filter_tracking.value > 0 and filter_type='bucket' and date(date_created) BETWEEN '" +
          reportData.dateFrom +
          "' AND '" +
          reportData.dateTo +
          "' ORDER BY id, n) as aa where (SELECT title FROM bucket_degree WHERE id = aa.sb_id) is not null GROUP BY aa.sb_id";
        let bucketData = await getQueryResultData(bucketListSql, 'multiple');
        platformData.push({
          name: 'Area of Study',
          data: collegeFrequencyReportModel(bucketData),
        });
        // Get search report by area of focus
        let secBucketTotalSql =
          "select sum(temp.CC) as dtotal from (select (SELECT title FROM bucket_secondary_degree WHERE id = sb_id) as bucketTitle,count(sb_id) as CC from (SELECT college_filter_tracking.id, SUBSTRING_INDEX(SUBSTRING_INDEX(college_filter_tracking.value, ',', numbers.n), ',', -1) sb_id FROM numbers INNER JOIN college_filter_tracking ON CHAR_LENGTH(college_filter_tracking.value) -CHAR_LENGTH(REPLACE(college_filter_tracking.value, ',', ''))>=numbers.n-1 WHERE college_filter_tracking.value is not null and college_filter_tracking.value > 0 and filter_type='secondary bucket' and date(date_created) BETWEEN '" +
          reportData.dateFrom +
          "' AND '" +
          reportData.dateTo +
          "' ORDER BY id, n) as aa where (SELECT title FROM bucket_secondary_degree WHERE id = aa.sb_id) is not null GROUP BY aa.sb_id) as temp";
        let secBucketTotal = await getQueryResultData(
          secBucketTotalSql,
          'single'
        );
        let secBucketListSql =
          'select (SELECT title FROM bucket_secondary_degree WHERE id = sb_id) as name, count(sb_id) as CC,cast(((count(sb_id)/' +
          secBucketTotal.dtotal +
          ")*100) as DECIMAL(4,2)) as value from (SELECT college_filter_tracking.id, SUBSTRING_INDEX(SUBSTRING_INDEX(college_filter_tracking.value, ',', numbers.n), ',', -1) sb_id FROM numbers INNER JOIN college_filter_tracking ON CHAR_LENGTH(college_filter_tracking.value) -CHAR_LENGTH(REPLACE(college_filter_tracking.value, ',', ''))>=numbers.n-1 WHERE college_filter_tracking.value is not null and college_filter_tracking.value > 0 and filter_type='secondary bucket' and date(date_created) BETWEEN '" +
          reportData.dateFrom +
          "' AND '" +
          reportData.dateTo +
          "' ORDER BY id, n) as aa where (SELECT title FROM bucket_secondary_degree WHERE id = aa.sb_id) is not null GROUP BY aa.sb_id";
        let secBucketData = await getQueryResultData(
          secBucketListSql,
          'multiple'
        );
        platformData.push({
          name: 'Area of Focus',
          data: collegeFrequencyReportModel(secBucketData),
        });

        return resolve(platformData);
        //console.log("LL:",platformData);
      } catch (error) {
        return reject(error);
      }
    });
  }

  function registerfrequencySchoolData(reportData) {
    return new Promise(async (resolve, reject) => {
      try {
        let schoolData = [];
        // Get register report by education level
        let degreeTotalSql =
          'SELECT count(s.uuid) total FROM students as s LEFT JOIN student_profile as sp ON s.uuid=sp.uuid LEFT JOIN users_matched_colleges as umc ON umc.student_id=s.uuid WHERE umc.college_id=' +
          reportData.collegeId +
          " and date(s.date_created) BETWEEN '" +
          reportData.dateFrom +
          "' AND '" +
          reportData.dateTo +
          "' AND s.user_account_status = 'ACTIVE' and sp.security_clearance is null and sp.level_id <> ''";
        let degreeTotal = await getQueryResultData(degreeTotalSql, 'single');
        let degreeListSql =
          'SELECT count(s.uuid) as stotal,(select title from levels where id=sp.level_id) as name,cast(((count(s.uuid)/' +
          degreeTotal.total +
          ')*100) as DECIMAL(4,2)) as value FROM students as s LEFT JOIN student_profile as sp ON s.uuid=sp.uuid LEFT JOIN users_matched_colleges as umc ON umc.student_id=s.uuid WHERE umc.college_id=' +
          reportData.collegeId +
          " and date(s.date_created) BETWEEN '" +
          reportData.dateFrom +
          "' AND '" +
          reportData.dateTo +
          "' AND s.user_account_status = 'ACTIVE' and sp.security_clearance is null and sp.level_id <> '' GROUP BY sp.level_id ORDER BY stotal DESC";
        let levelData = await getQueryResultData(degreeListSql, 'multiple');

        schoolData.push({
          name: 'Degree Level',
          data: collegeFrequencyReportModel(levelData),
        });
        // Get register report by area of study
        let bucketTotalSql =
          "select sum(temp.CC) as total from (select (SELECT title FROM bucket_degree WHERE id = aa.sb_id) as bucketTitle,count(sb_id) as CC from (SELECT student_profile.uuid, SUBSTRING_INDEX(SUBSTRING_INDEX(student_profile.bucket_id, ',', numbers.n), ',', -1) sb_id FROM numbers INNER JOIN student_profile ON CHAR_LENGTH(student_profile.bucket_id) -CHAR_LENGTH(REPLACE(student_profile.bucket_id, ',', ''))>=numbers.n-1 WHERE student_profile.bucket_id is not null and student_profile.bucket_id > 0 ORDER BY id, n) as aa LEFT JOIN students as ss ON ss.uuid=aa.uuid LEFT JOIN users_matched_colleges as umc ON ss.uuid=umc.student_id WHERE ss.user_account_status='active' and date(ss.date_created) BETWEEN '" +
          reportData.dateFrom +
          "' AND '" +
          reportData.dateTo +
          "' and umc.college_id=" +
          reportData.collegeId +
          ' GROUP BY aa.sb_id) as temp';

        let bucketTotal = await getQueryResultData(bucketTotalSql, 'single');
        let bucketListSql =
          'select (SELECT title FROM bucket_degree WHERE id = aa.sb_id) as name,count(sb_id) as CC,cast(((count(sb_id)/' +
          bucketTotal.total +
          ")*100) as DECIMAL(4,2)) as value from (SELECT student_profile.uuid, SUBSTRING_INDEX(SUBSTRING_INDEX(student_profile.bucket_id, ',', numbers.n), ',', -1) sb_id FROM numbers INNER JOIN student_profile ON CHAR_LENGTH(student_profile.bucket_id) -CHAR_LENGTH(REPLACE(student_profile.bucket_id, ',', ''))>=numbers.n-1 WHERE student_profile.bucket_id is not null and student_profile.bucket_id > 0 ORDER BY id, n) as aa LEFT JOIN students as ss ON ss.uuid=aa.uuid LEFT JOIN users_matched_colleges as umc ON ss.uuid=umc.student_id WHERE ss.user_account_status='active' and date(ss.date_created) BETWEEN '" +
          reportData.dateFrom +
          "' AND '" +
          reportData.dateTo +
          "' and umc.college_id=" +
          reportData.collegeId +
          ' GROUP BY aa.sb_id ORDER BY count(sb_id) DESC';
        let bucketData = await getQueryResultData(bucketListSql, 'multiple');
        schoolData.push({
          name: 'Area of Study',
          data: collegeFrequencyReportModel(bucketData),
        });
        // Get register report by area of focus
        let secBucketTotalSql =
          "select sum(temp.CC) as total from (select (SELECT title FROM bucket_secondary_degree WHERE id = aa.sb_id) as secbucketTitle,count(sb_id) as CC from (SELECT student_profile.uuid, SUBSTRING_INDEX(SUBSTRING_INDEX(student_profile.secondary_bucket_id, ',', numbers.n), ',', -1) sb_id FROM numbers INNER JOIN student_profile ON CHAR_LENGTH(student_profile.secondary_bucket_id) -CHAR_LENGTH(REPLACE(student_profile.secondary_bucket_id, ',', ''))>=numbers.n-1 WHERE student_profile.secondary_bucket_id is not null and student_profile.secondary_bucket_id > 0 ORDER BY id, n) as aa LEFT JOIN students as ss ON ss.uuid=aa.uuid LEFT JOIN users_matched_colleges as umc ON ss.uuid=umc.student_id WHERE ss.user_account_status='active' and date(ss.date_created) BETWEEN '" +
          reportData.dateFrom +
          "' AND '" +
          reportData.dateTo +
          "' and umc.college_id=" +
          reportData.collegeId +
          ' GROUP BY aa.sb_id) as temp';

        let secBucketTotal = await getQueryResultData(
          secBucketTotalSql,
          'single'
        );
        let secBucketListSql =
          'select (SELECT title FROM bucket_secondary_degree WHERE id = aa.sb_id) as name,count(sb_id) as CC,cast(((count(sb_id)/' +
          secBucketTotal.total +
          ")*100) as DECIMAL(4,2)) as value from (SELECT student_profile.uuid, SUBSTRING_INDEX(SUBSTRING_INDEX(student_profile.secondary_bucket_id, ',', numbers.n), ',', -1) sb_id FROM numbers INNER JOIN student_profile ON CHAR_LENGTH(student_profile.secondary_bucket_id) -CHAR_LENGTH(REPLACE(student_profile.secondary_bucket_id, ',', ''))>=numbers.n-1 WHERE student_profile.secondary_bucket_id is not null and student_profile.secondary_bucket_id > 0 ORDER BY id, n) as aa LEFT JOIN students as ss ON ss.uuid=aa.uuid LEFT JOIN users_matched_colleges as umc ON ss.uuid=umc.student_id WHERE ss.user_account_status='active' and date(ss.date_created) BETWEEN '" +
          reportData.dateFrom +
          "' AND  '" +
          reportData.dateTo +
          "' and umc.college_id=" +
          reportData.collegeId +
          ' GROUP BY aa.sb_id ORDER BY count(sb_id) DESC';
        let secBucketData = await getQueryResultData(
          secBucketListSql,
          'multiple'
        );
        schoolData.push({
          name: 'Area of Focus',
          data: collegeFrequencyReportModel(secBucketData),
        });
        // Get register report by paygrade
        let paygradeTotalSql =
          'SELECT count(s.uuid) total FROM students as s LEFT JOIN student_profile as sp ON s.uuid=sp.uuid LEFT JOIN users_matched_colleges as umc ON umc.student_id=s.uuid WHERE umc.college_id=' +
          reportData.collegeId +
          " and date(s.date_created) BETWEEN '" +
          reportData.dateFrom +
          "' AND '" +
          reportData.dateTo +
          "' AND s.user_account_status = 'ACTIVE' and sp.security_clearance is null and sp.military_rank <> '' and umc.college_id=" +
          reportData.collegeId;
        let paygradeTotal = await getQueryResultData(
          paygradeTotalSql,
          'single'
        );
        let paygradeListSql =
          'SELECT count(s.uuid) as stotal,rnk.name as name,cast(((count(s.uuid)/' +
          paygradeTotal.total +
          ')*100) as DECIMAL(4,2)) as value FROM students as s LEFT JOIN student_profile as sp ON s.uuid=sp.uuid LEFT JOIN users_matched_colleges as umc ON umc.student_id=s.uuid LEFT JOIN college_ranks rnk ON rnk.id=sp.military_rank WHERE umc.college_id=' +
          reportData.collegeId +
          " and date(s.date_created) BETWEEN '" +
          reportData.dateFrom +
          "' AND '" +
          reportData.dateTo +
          "' AND s.user_account_status = 'ACTIVE' and sp.security_clearance is null and sp.military_rank <> '' and umc.college_id=" +
          reportData.collegeId +
          ' GROUP BY rnk.name ORDER BY stotal DESC';
        let paygradeData = await getQueryResultData(
          paygradeListSql,
          'multiple'
        );
        schoolData.push({
          name: 'Paygrade',
          data: collegeFrequencyReportModel(paygradeData),
        });
        // Get register report by military branch
        let branchTotalSql =
          'SELECT count(s.uuid) total FROM students as s LEFT JOIN student_profile as sp ON s.uuid=sp.uuid LEFT JOIN users_matched_colleges as umc ON umc.student_id=s.uuid WHERE umc.college_id=' +
          reportData.collegeId +
          " and date(s.date_created) BETWEEN '" +
          reportData.dateFrom +
          "' AND '" +
          reportData.dateTo +
          "' AND s.user_account_status = 'ACTIVE' and sp.security_clearance is null and sp.military_branch <> '' and umc.college_id=" +
          reportData.collegeId;
        let branchTotal = await getQueryResultData(branchTotalSql, 'single');
        let branchListSql =
          'SELECT count(s.uuid) as stotal,(select branch_short_name from branches where id=sp.military_branch) as name,cast(((count(s.uuid)/' +
          branchTotal.total +
          ')*100) as DECIMAL(4,2)) as value FROM students as s LEFT JOIN student_profile as sp ON s.uuid=sp.uuid LEFT JOIN users_matched_colleges as umc ON umc.student_id=s.uuid LEFT JOIN branches bb ON bb.id=sp.military_branch WHERE umc.college_id=' +
          reportData.collegeId +
          " and date(s.date_created) BETWEEN '" +
          reportData.dateFrom +
          "' AND '" +
          reportData.dateTo +
          "' AND s.user_account_status = 'ACTIVE' and bb.status='ACTIVE' and sp.security_clearance is null and sp.military_branch <> '' and umc.college_id=" +
          reportData.collegeId +
          ' GROUP BY sp.military_branch ORDER BY stotal DESC';
        let branchData = await getQueryResultData(branchListSql, 'multiple');
        schoolData.push({
          name: 'Military Branch',
          data: collegeFrequencyReportModel(branchData),
        });
        // Get register report by military status
        let statusTotalSql =
          'SELECT count(s.uuid) total FROM students as s LEFT JOIN student_profile as sp ON s.uuid=sp.uuid LEFT JOIN users_matched_colleges as umc ON umc.student_id=s.uuid WHERE umc.college_id=' +
          reportData.collegeId +
          " and date(s.date_created) BETWEEN '" +
          reportData.dateFrom +
          "' AND '" +
          reportData.dateTo +
          "' AND s.user_account_status = 'ACTIVE' and sp.security_clearance is null and sp.military_status NOT IN('Prospective ROTC','Military Family Member','') and umc.college_id=" +
          reportData.collegeId;
        let statusTotal = await getQueryResultData(statusTotalSql, 'single');
        let statusListSql =
          "SELECT count(s.uuid) as stotal,(CASE WHEN sp.military_status = 'Active' then 'Active Duty' WHEN sp.military_status = 'Guard' then 'National Guard' WHEN sp.military_status = 'Retired' then 'Retiree' ELSE sp.military_status END) as name,cast(((count(s.uuid)/" +
          statusTotal.total +
          ')*100) as DECIMAL(4,2)) as value FROM students as s LEFT JOIN student_profile as sp ON s.uuid=sp.uuid LEFT JOIN users_matched_colleges as umc ON umc.student_id=s.uuid LEFT JOIN branches bb ON bb.id=sp.military_branch WHERE umc.college_id=' +
          reportData.collegeId +
          " and date(s.date_created) BETWEEN '" +
          reportData.dateFrom +
          "' AND '" +
          reportData.dateTo +
          "' AND s.user_account_status = 'ACTIVE' and bb.status='ACTIVE' and sp.security_clearance is null and sp.military_status NOT IN('Prospective ROTC','Military Family Member','') and umc.college_id=" +
          reportData.collegeId +
          ' GROUP BY sp.military_status ORDER BY stotal DESC';
        let statusData = await getQueryResultData(statusListSql, 'multiple');
        schoolData.push({
          name: 'Military Status',
          data: collegeFrequencyReportModel(statusData),
        });

        return resolve(schoolData);
      } catch (error) {
        return reject(error);
      }
    });
  }

  function getCollegeAdminCampaignList(collegeId, campaignId) {
    return new Promise(async (resolve, reject) => {
      try {
        let campaignList = [];
        let checkQuery =
          'select count(id) as total from college_campaigns where';
        if (collegeId) {
          checkQuery += ' college_id=' + collegeId;
        }
        if (campaignId) {
          checkQuery += ' and id=' + campaignId;
        }
        //let checkQuery = "select count(id) as total from college_campaigns where college_id="+collegeId;
        let checkData = await getQueryResultData(checkQuery, 'single');
        if (checkData && checkData.total > 0) {
          let cmpQuery = '';
          cmpQuery +=
            'select cc.*,(SELECT college_name FROM colleges where id=' +
            collegeId +
            ") as collegename,if((CURDATE() <=cc.end_date),'yes','no') as cstatus,(SELECT count(DISTINCT student_id) from recon_messages WHERE date(date_created) BETWEEN cc.start_date and cc.end_date and college_id=" +
            collegeId +
            ") as totinq,(SELECT count(*) FROM college_search_tracking where date(date_created) BETWEEN cc.start_date and cc.end_date and secondary_source in ('url','list') and college_id=" +
            collegeId +
            ') as totpro,(SELECT count(id) FROM bookmark_tracking WHERE date(date_clicked) BETWEEN cc.start_date and cc.end_date and FIND_IN_SET(' +
            collegeId +
            ',college_id)) as totbok,(SELECT count(id) FROM tab_click_tracking WHERE date(date_clicked) BETWEEN cc.start_date and cc.end_date and FIND_IN_SET(' +
            collegeId +
            ',college_id)) as tottab from college_campaigns as cc where cc.college_id = ' +
            collegeId;
          if (campaignId) {
            cmpQuery += ' and cc.id=' + campaignId;
            campaignList = await getQueryResultData(cmpQuery, 'single');
          } else {
            campaignList = await getQueryResultData(cmpQuery, 'multiple');
          }
        } else {
          campaignList.push(checkData);
        }
        return resolve(campaignList);
      } catch (error) {
        return reject(error);
      }
    });
  }

  function getCollegeAdminCampaignRangeData(reportData) {
    return new Promise(async (resolve, reject) => {
      try {
        let campaignList = [];
        let cmpQuery =
          "select '" +
          reportData.dateFrom +
          "' as startdate,'" +
          reportData.dateTo +
          "' as enddate,(SELECT count(DISTINCT student_id) from recon_messages WHERE date(date_created) BETWEEN '" +
          reportData.dateFrom +
          "' and '" +
          reportData.dateTo +
          "' and college_id=" +
          reportData.collegeId +
          ") as totinq,(SELECT count(*) FROM college_search_tracking where date(date_created) BETWEEN '" +
          reportData.dateFrom +
          "' and '" +
          reportData.dateTo +
          "' and secondary_source in ('url','list') and college_id=" +
          reportData.collegeId +
          ") as totpro,(SELECT count(id) FROM bookmark_tracking WHERE date(date_clicked) BETWEEN '" +
          reportData.dateFrom +
          "' and '" +
          reportData.dateTo +
          "' and FIND_IN_SET(" +
          reportData.collegeId +
          ",college_id)) as totbok,(SELECT count(id) FROM tab_click_tracking WHERE date(date_clicked) BETWEEN '" +
          reportData.dateFrom +
          "' and '" +
          reportData.dateTo +
          "' and FIND_IN_SET(" +
          reportData.collegeId +
          ',college_id)) as tottab from college_campaigns as cc where cc.college_id = ' +
          reportData.collegeId +
          ' and cc.id=' +
          reportData.campaignId;

        let TotalDataList = await getQueryResultData(cmpQuery, 'single');
        campaignList.push({ data: TotalDataList });

        let monthWiseDataList =
          await superAdminDashboardService.campaignIndividualMonthReport(
            reportData
          );
        campaignList.push({ data: monthWiseDataList });

        return resolve(campaignList);
      } catch (error) {
        return reject(error);
      }
    });
  }

  function getCampaignQuery(queryData) {
    let qry = '';
    if (queryData.type == 'campaign') {
      qry =
        "select *,(if((cte.totinq > 0 && cte.totmonth > 0), cte.totinq/cte.totmonth,0)) as avginq,(if((cte.totpro > 0 && cte.totmonth > 0), cte.totpro/cte.totmonth,0)) as avgpro from (select cc.*,if((CURDATE() <=cc.end_date),'yes','no') as cstatus,if((cc.end_date <= CURDATE()),TIMESTAMPDIFF(MONTH, cc.start_date,cc.end_date),TIMESTAMPDIFF(MONTH, cc.start_date,CURDATE())) as totmonth,(SELECT count(DISTINCT student_id) from recon_messages WHERE date(date_created) BETWEEN cc.start_date and cc.end_date and college_id=" +
        queryData.collegeId +
        ") as totinq,(SELECT count(*) FROM college_search_tracking where date(date_created) BETWEEN cc.start_date and cc.end_date and secondary_source in ('url','list') and college_id=" +
        queryData.collegeId +
        ') as totpro,(SELECT count(id) FROM bookmark_tracking WHERE date(date_clicked) BETWEEN cc.start_date and cc.end_date and FIND_IN_SET(' +
        queryData.collegeId +
        ',college_id)) as totbok,(SELECT count(id) FROM tab_click_tracking WHERE date(date_clicked) BETWEEN cc.start_date and cc.end_date and FIND_IN_SET(' +
        queryData.collegeId +
        ',college_id)) as tottab from college_campaigns as cc where cc.college_id = ' +
        queryData.collegeId +
        ') as cte';
    } else if (queryData.type == 'overall') {
      const startDate = '2018-01-01';
      const endDate = moment().format('YYYY-MM-DD');
      qry =
        'select cte.sdate,cte.edate,(cte.totmonth - ' +
        queryData.totalMonth +
        ') as monthtotal,(cte.totinq - ' +
        queryData.totalInq +
        ') as inqtotal,(cte.totpro - ' +
        queryData.totalProfile +
        ') as profiletotal,(cte.totbok - ' +
        queryData.totalBook +
        ') as booktotal,(cte.tottab - ' +
        queryData.totalTab +
        ') as tabtotal,(if(((cte.totinq - ' +
        queryData.totalInq +
        ') > 0), (cte.totinq - ' +
        queryData.totalInq +
        ')/(cte.totmonth - ' +
        queryData.totalMonth +
        '),0)) as avginq,(if(((cte.totpro - ' +
        queryData.totalProfile +
        ') > 0), (cte.totpro - ' +
        queryData.totalProfile +
        ')/(cte.totmonth - ' +
        queryData.totalMonth +
        "),0)) as avgpro from (select cc.id,'" +
        startDate +
        "' as sdate,'" +
        endDate +
        "' as edate,TIMESTAMPDIFF(MONTH, '" +
        startDate +
        "','" +
        endDate +
        "') as totmonth,(SELECT count(DISTINCT student_id) from recon_messages WHERE college_id=" +
        queryData.collegeId +
        ") as totinq,(SELECT count(*) FROM college_search_tracking where secondary_source in ('url','list') and college_id=" +
        queryData.collegeId +
        ') as totpro,(SELECT count(id) FROM bookmark_tracking WHERE  FIND_IN_SET(' +
        queryData.collegeId +
        ',college_id)) as totbok,(SELECT count(id) FROM tab_click_tracking WHERE FIND_IN_SET(' +
        queryData.collegeId +
        ',college_id)) as tottab from colleges as cc where cc.id = ' +
        queryData.collegeId +
        ') as cte';
    } else if (queryData.type == 'monthwise') {
      const startDate = '2018-01-01';
      const endDate = moment().format('YYYY-MM-DD');
      qry =
        'select if(A.paidinqtotal,A.paidinqtotal,0) as paidinqtotal,if(A.paidprofiletotal,A.paidprofiletotal,0) as paidprofiletotal,if(A.paidbooktotal,A.paidbooktotal,0) as paidbooktotal,if(A.paidtabtotal,A.paidtabtotal,0) as paidtabtotal,A.paidyear,A.paidmonth,A.paidmname, B.*, (B.overinqtotal-if(A.paidinqtotal,A.paidinqtotal,0)) as finalinqtotal, (B.overprofiletotal-if(A.paidprofiletotal,A.paidprofiletotal,0)) as finalprofiletotal from (select sum(scount) as paidinqtotal, sum(ccount) as paidprofiletotal, sum(bokcount) as paidbooktotal, sum(tabcount) as paidtabtotal, YYYY as paidyear, MM as paidmonth, MMonth paidmname from (select count(distinct rm.student_id) scount, 0 as ccount, 0 as bokcount,  0 as tabcount, Year(rm.date_created) as YYYY, Month(rm.date_created) as MM, MonthName(rm.date_created) as MMonth from college_campaigns cc left join recon_messages rm on cc.college_id = rm.college_id and rm.date_created >= cc.start_date and rm.date_created <= cc.end_date where cc.college_id = ' +
        queryData.collegeId +
        " and rm.date_created is not null group by cc.college_id, YYYY, MM, MMonth union select 0 as scount, count(cst.id) as ccount, 0 as bokcount,  0 as tabcount, Year(cst.date_created) as YYYY, Month(cst.date_created) as MM, MonthName(cst.date_created) as MMonth from college_campaigns cc left join college_search_tracking cst on cst.college_id = cc.college_id and cst.date_created >= cc.start_date and cst.date_created <= cc.end_date and cst.secondary_source in ('url','list') where cc.college_id = " +
        queryData.collegeId +
        ' group by cc.college_id, YYYY, MM, MMonth union select 0 as scount,  0 as ccount,count(bt.id) as bokcount,  0 as tabcount, Year(bt.date_clicked) as YYYY, Month(bt.date_clicked) as MM, MonthName(bt.date_clicked) as MMonth from college_campaigns cc left join bookmark_tracking bt on bt.college_id = cc.college_id and bt.date_clicked >= cc.start_date and bt.date_clicked <= cc.end_date and FIND_IN_SET(' +
        queryData.collegeId +
        ',bt.college_id) where cc.college_id = ' +
        queryData.collegeId +
        ' and bt.date_clicked is not null group by cc.college_id, YYYY, MM, MMonth union select 0 as scount, 0 as ccount, 0 as bokcount,count(tct.id) as tabcount, Year(tct.date_clicked) as YYYY, Month(tct.date_clicked) as MM, MonthName(tct.date_clicked) as MMonth from college_campaigns cc left join tab_click_tracking tct on tct.college_id = cc.college_id and tct.date_clicked >= cc.start_date and tct.date_clicked <= cc.end_date and FIND_IN_SET(' +
        queryData.collegeId +
        ',tct.college_id) where cc.college_id = ' +
        queryData.collegeId +
        " and tct.date_clicked is not null group by cc.college_id, YYYY, MM, MMonth) temp group by YYYY, MM, MMonth) as A right join (select sum(scount) as overinqtotal, sum(ccount) as overprofiletotal, sum(bokcount) as overbooktotal, sum(tabcount) as overtabtotal,  YYYY as allyear, MM as allmonth, MMonth as allmname from (select count(distinct rm.student_id) scount, 0 as ccount, 0 as bokcount,  0 as tabcount, Year(rm.date_created) as YYYY, Month(rm.date_created) as MM, MonthName(rm.date_created) as MMonth from recon_messages rm where rm.date_created >= '" +
        startDate +
        "' and rm.date_created <= '" +
        endDate +
        "' and rm.college_id = " +
        queryData.collegeId +
        " and rm.date_created is not null group by rm.college_id, YYYY, MM, MMonth union select 0 as scount, count(cst.id) as ccount, 0 as bokcount,  0 as tabcount, Year(cst.date_created) as YYYY, Month(cst.date_created) as MM, MonthName(cst.date_created) as MMonth from college_search_tracking cst where cst.date_created >= '" +
        startDate +
        "' and cst.date_created <= '" +
        endDate +
        "' and cst.college_id = " +
        queryData.collegeId +
        " and cst.secondary_source in ('url','list') group by cst.college_id, YYYY, MM, MMonth union select 0 as scount, 0 as ccount,count(bt.id) as bokcount,  0 as tabcount, Year(bt.date_clicked) as YYYY, Month(bt.date_clicked) as MM, MonthName(bt.date_clicked) as MMonth from bookmark_tracking bt where bt.date_clicked >= '" +
        startDate +
        "' and bt.date_clicked <= '" +
        endDate +
        "' and FIND_IN_SET(" +
        queryData.collegeId +
        ",bt.college_id) group by bt.college_id, YYYY, MM, MMonth union select 0 as scount, 0 as ccount, 0 as bokcount,count(tct.id) as tabcount, Year(tct.date_clicked) as YYYY, Month(tct.date_clicked) as MM, MonthName(tct.date_clicked) as MMonth from tab_click_tracking tct where tct.date_clicked >= '" +
        startDate +
        "' and tct.date_clicked <= '" +
        endDate +
        "' and FIND_IN_SET(" +
        queryData.collegeId +
        ',tct.college_id) group by tct.college_id, YYYY, MM, MMonth) temp group by YYYY, MM, MMonth) as B on A.paidyear = B.allyear and A.paidmonth = B.allmonth and A.paidmname = B.allmname  order by B.allyear, B.allmonth;';
    }

    return qry;
  }

  function getCollegeAdminCampaignPaidNonpaid(collegeId) {
    return new Promise(async (resolve, reject) => {
      try {
        let paidNonpaidList = [];
        let checkQuery =
          'select count(id) as total from college_campaigns where college_id=' +
          collegeId;
        let checkData = await getQueryResultData(checkQuery, 'single');
        if (checkData && checkData.total > 0) {
          let inqQuery =
            'SELECT SUM(tot) as total FROM (SELECT count(DISTINCT student_id) as tot from recon_messages as rm left join college_campaigns as cc ON rm.college_id=cc.college_id where cc.college_id = ' +
            collegeId +
            ' AND rm.date_created BETWEEN cc.start_date and cc.end_date) as A';
          let inqInfo = await getQueryResultData(inqQuery, 'single');
          let profileQuery =
            'SELECT SUM(tot) as total FROM (SELECT (count(rm.id)) as tot from college_search_tracking as rm left join college_campaigns as cc ON rm.college_id=cc.college_id where cc.college_id = ' +
            collegeId +
            " AND rm.secondary_source in ('url','list') AND rm.date_created BETWEEN cc.start_date and cc.end_date) as A";
          let profileInfo = await getQueryResultData(profileQuery, 'single');
          let bookQuery =
            'SELECT SUM(tot) as total FROM (SELECT (count(rm.id)) as tot from bookmark_tracking as rm left join college_campaigns as cc ON rm.college_id=cc.college_id where FIND_IN_SET(' +
            collegeId +
            ',rm.college_id) AND rm.date_clicked BETWEEN cc.start_date and cc.end_date) as A';
          let bookInfo = await getQueryResultData(bookQuery, 'single');
          let tabQuery =
            'SELECT SUM(tot) as total FROM (SELECT (count(rm.id)) as tot from tab_click_tracking as rm left join college_campaigns as cc ON rm.college_id=cc.college_id where FIND_IN_SET(' +
            collegeId +
            ',rm.college_id) AND rm.date_clicked BETWEEN cc.start_date and cc.end_date) as A';
          let tabInfo = await getQueryResultData(tabQuery, 'single');
          let monthQuery =
            'SELECT SUM(tot) as total FROM (SELECT TIMESTAMPDIFF(MONTH, cc.start_date,cc.end_date) as tot FROM college_campaigns as cc WHERE cc.college_id = ' +
            collegeId +
            ') as A';
          let monthInfo = await getQueryResultData(monthQuery, 'single');
          let nonCmpQueryData = {
            type: 'overall',
            collegeId: collegeId,
            totalInq: inqInfo.total,
            totalProfile: profileInfo.total,
            totalBook: bookInfo.total,
            totalTab: tabInfo.total,
            totalMonth: monthInfo.total,
          };
          let nonCmpQuery = getCampaignQuery(nonCmpQueryData);
          let nonCampignList = await getQueryResultData(nonCmpQuery, 'single');
          paidNonpaidList.push({ data: nonCampignList });
          let cmpQueryData = {
            type: 'campaign',
            collegeId: collegeId,
          };
          let cmpQuery = getCampaignQuery(cmpQueryData);
          let campaignList = await getQueryResultData(cmpQuery, 'multiple');
          paidNonpaidList.push({ data: campaignList });
          let mnthQueryData = {
            type: 'monthwise',
            collegeId: collegeId,
          };
          let mntQuery = getCampaignQuery(mnthQueryData);
          let monthwiseList = await getQueryResultData(mntQuery, 'multiple');
          paidNonpaidList.push({ data: monthwiseList });
        } else {
          paidNonpaidList.push([checkData]);
        }
        //console.log("DD:", paidNonpaidList);
        return resolve(paidNonpaidList);
      } catch (error) {
        return reject(error);
      }
    });
  }

  function getQueryResultData(sqlQuery, type) {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await mysqlService.query(sqlQuery);
        if (result) {
          if (type == 'single') {
            return resolve(result[0]);
          } else {
            return resolve(result);
          }
        }
      } catch (error) {
        return reject(error);
      }
    });
  }

  function saveUserActionTracking({
    userId,
    action,
    metadata,
    type,
    associateValue,
  }) {
    if (!action || !type) return;
    mysqlService.query(`
      INSERT INTO user_action_tracking (user_id, action, metadata, type, associate_value, created_at, updated_at)
      VALUES
      ('${userId ? userId : ''}', '${action}', '${
      metadata ? metadata : ''
    }', '${type}', '${
      associateValue ? associateValue : ''
    }', '${convertToFormat(getCurrentDateTime())}', '${convertToFormat(getCurrentDateTime())}')
    `);
  }

  return {
    collegeSearchTracking: collegeSearchTracking,
    collegeFilterTracking: collegeFilterTracking,
    searchresultCollegesTracking: searchresultCollegesTracking,
    searchFrequencyTrackingLevel,
    searchFrequencyTrackingState,
    searchFrequencyTrackingBucket,
    searchFrequencyTrackingSecondaryBucket,
    searchFrequencyTrackingVeteranservice,
    searchfrequencyTrackingCollegeType: searchfrequencyTrackingCollegeType,
    searchfrequencyTrackingReligiousAffiliation:
      searchfrequencyTrackingReligiousAffiliation,
    searchfrequencyTrackingEthnicAffiliation:
      searchfrequencyTrackingEthnicAffiliation,
    CollegesearchTracking: CollegesearchTracking,
    employmentTrackingBranch: employmentTrackingBranch,
    employmentTrackingSecurity: employmentTrackingSecurity,
    employmentTrackingEducation: employmentTrackingEducation,
    employmentTrackingCareer: employmentTrackingCareer,
    employmentTrackingRelocate: employmentTrackingRelocate,
    employmentTrackingMstatus: employmentTrackingMstatus,
    employmentTrackingRankPaygrade: employmentTrackingRankPaygrade,
    registerTrackingBranch,
    registerTrackingStatus,
    registerTrackingPaygrade,
    registerTrackingEducationLevel,
    registerTrackingPrimaryBucket,
    registerTrackingSecondaryBucket,
    registerTrackingState,
    getHomepageLinkClickReport: getHomepageLinkClickReport,
    veteransRegistrations: veteransRegistrations,
    searchfrequencyPlatformData: searchfrequencyPlatformData,
    registerfrequencySchoolData: registerfrequencySchoolData,
    getCollegeAdminCampaignList: getCollegeAdminCampaignList,
    getCollegeAdminCampaignRangeData: getCollegeAdminCampaignRangeData,
    getCollegeAdminCampaignPaidNonpaid: getCollegeAdminCampaignPaidNonpaid,
    saveUserActionTracking,
  };
})();

module.exports = sourceTrackingService;
