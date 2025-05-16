var express = require('express');
var bodyParser = require('body-parser');
var config = require('./config');
var requestIp = require('request-ip');
var logger = require('./utils/userActivityHandler');
var path = require('path');
var schedule = require('node-schedule');
var nagSchedule = require('node-schedule');
var cmonthSchedule = require('node-schedule');
var testSchedule = require('node-schedule');
var vsdSchedule = require('node-schedule');
var collegeContactSchedule = require('node-schedule');
var gmailData = require('./gmailreader.js');
var compression = require('compression');
var minify = require('express-minify');
var cors = require('cors');
var clientNag = require('./clientNagEmail.js');
var collegeMonthlyReport = require('./collegeMonthlyReport.js');
var veteranVsdEmail = require('./veteranVsdEmail.js');
var scholarshipFollowEmail = require('./scholarshipFollowEmail.js');
var followupSchedule = require('node-schedule');
var matchingSchedule = require('node-schedule');
var autorenewSchedule = require('node-schedule');
var matchingemailSchedule = require('node-schedule');
var degreebounceSchedule = require('node-schedule');
var candemceEmail = require('./degreeCandenceEmail.js');
var collegeEmailSend = require('./collegeEmailSend.js');
var collegeEmailSchedule = require('node-schedule');
var registerUserEmail = require('./registerUserEmail.js');
var registerEmailSchedule = require('node-schedule');
var campaignEmailAlert = require('./campaignEmailAlert');
var campaignSchedule = require('node-schedule');
var stringUtil = require('./utils/stringUtil');
const { validateSsoClient } = require('./middleware/sso-client-validation');
var savedschoolFollowEmail = require('./savedschoolFollowEmail.js');
var requestinfoFollowEmail = require('./requestinfoFollowEmail.js');

var app = express();
var port = config.PORT;

//Schedule the job
var rule = new schedule.RecurrenceRule();
rule.second = 1;
var j = schedule.scheduleJob(rule, function () {
  console.log("cronjob Execute.");
  gmailData.readGmailInbox();
});

// Schedule cron job for Nag emails
var rule1 = new nagSchedule.RecurrenceRule();
rule1.hour = 11;
rule1.minute = 1;
//rule1.second = 30;
var j = nagSchedule.scheduleJob(rule1, function () {
  console.log("Nagemail cronjob Execute.");
  clientNag.sendClientNagEmail();
});

// Schedule cron job for School Monthly Reporting
var rule2 = new cmonthSchedule.RecurrenceRule();
rule2.hour = 3;
rule2.minute = 1;
rule2.date = new schedule.Range(8, 14);
rule2.dayOfWeek = 2;
//rule2.second = 1;
var k = cmonthSchedule.scheduleJob(rule2, function () {
  //console.log("cronjob monthly");
  //collegeMonthlyReport.sendMonthlyReportCollege();
});

// Schedule cron job for Scholarship Followup email
var rule3 = new followupSchedule.RecurrenceRule();
rule3.hour = 1;
rule3.minute = 1;
var j = followupSchedule.scheduleJob(rule3, function () {
  console.log("Scholarship Followup cronjob Execute.");
  scholarshipFollowEmail.veteranFollowEmail();
});

// Schedule cron job for matching Scholarship email
var rule4 = new matchingSchedule.RecurrenceRule();
rule4.hour = 2;
rule4.minute = 1;
var j = matchingSchedule.scheduleJob(rule4, function () {
  console.log("Scholarship matching cronjob Execute.");
  scholarshipFollowEmail.veteranMatchingEmail();
});

// Schedule cron job for matching Scholarship email
var rule5 = new autorenewSchedule.RecurrenceRule();
rule5.hour = 2;
rule5.minute = 30;
var j = autorenewSchedule.scheduleJob(rule5, function () {
  console.log("Auto Renew Scholarship cronjob Execute.");
  scholarshipFollowEmail.autoUpdateScholarship();
});

// Schedule cron job for matching college list email
var rule6 = new matchingemailSchedule.RecurrenceRule();
rule6.hour = 23;
rule6.minute = 1;
var j = matchingemailSchedule.scheduleJob(rule6, function () {
  console.log("Matching college lists cronjob Execute.");
  candemceEmail.emailMatchingCandenceList();
});

// Schedule cron job for bounce degree email
var rule7 = new degreebounceSchedule.RecurrenceRule();
rule7.hour = 23;
rule7.minute = 30;
var j = degreebounceSchedule.scheduleJob(rule7, function () {
  console.log("Bounce degree emails cronjob Execute.");
  candemceEmail.emailDegreebounceCandenceList();
});

// Schedule cron job for College Email
var rule8 = new collegeEmailSchedule.RecurrenceRule();
rule8.hour = 3;
rule8.minute = 1;
rule8.date = new schedule.Range(15, 21);
rule8.dayOfWeek = 3;
//rule2.second = 1;
var k = collegeEmailSchedule.scheduleJob(rule8, function () {
  //console.log("cronjob monthly");
  //collegeEmailSend.sendCollegeOccassionalEmail();
});

// Schedule cron job for bounce degree email
var rule9 = new registerEmailSchedule.RecurrenceRule();
rule9.hour = 7;
rule9.minute = 57;
var j = registerEmailSchedule.scheduleJob(rule9, function () {
  //console.log("Paused Register email schedule.");
  //registerUserEmail.sendRequestInfoCollegeEmail();
});

//Schedule cron job for campaign reports
let today = new Date();
let lastDayOfMonth = new Date(
  today.getFullYear(),
  today.getMonth() + 1,
  0
).getDate();
var rule10 = new campaignSchedule.RecurrenceRule();
rule10.hour = 23;
rule10.minute = 59;
rule10.date = lastDayOfMonth;
var p = campaignSchedule.scheduleJob(rule10, function () {
  console.log("Campaign Performed Monthly Report:");
  campaignEmailAlert.campaignMonthlyEmail();
});

var rule11 = new campaignSchedule.RecurrenceRule();
rule11.hour = 23;
rule11.minute = 59;
rule11.date = 15;
var q = campaignSchedule.scheduleJob(rule11, function () {
  console.log("Campaign ActualCPI above $180:");
  campaignEmailAlert.campaignActualCpi();
});

var rule12 = new campaignSchedule.RecurrenceRule();
rule12.hour = 23;
rule12.minute = 59;
rule12.date = 21;
var r = campaignSchedule.scheduleJob(rule12, function () {
  console.log("Campaign drops by 30%: average monthly inquiry levels:");
  campaignEmailAlert.campaignAverageMonthlyDrop();
});

var rule13 = new cmonthSchedule.RecurrenceRule();
rule13.hour = 3;
rule13.minute = 1;
rule13.date = new schedule.Range(1, 3);
var p = cmonthSchedule.scheduleJob(rule13, function () {
  console.log('Partner college monthly report email:');
  let dayOfMonth = stringUtil.checkDayMonth();
  if (dayOfMonth) {
    collegeMonthlyReport.sendPartnerEmail();
  }
});

var rule14 = new campaignSchedule.RecurrenceRule();
rule14.hour = 7;
rule14.minute = 1;
rule14.date = new schedule.Range(1, 7);
rule14.dayOfWeek = 2;
var r = cmonthSchedule.scheduleJob(rule14, function () {
  //console.log("Non-Partner college monthly report email:");
  //collegeMonthlyReport.sendNonPartnerEmail();
});

// Schedule cron job for saved school email
var rule15 = new campaignSchedule.RecurrenceRule();
rule15.hour = 23;
rule15.minute = 45;
var k = campaignSchedule.scheduleJob(rule15, function () {
  console.log("Saved school first email.");
  savedschoolFollowEmail.savedSchoolSentEmail();
});

var rule16 = new campaignSchedule.RecurrenceRule();
rule16.hour = 22;
rule16.minute = 1;
var l = campaignSchedule.scheduleJob(rule16, function () {
  console.log("Saved school follow up email.");
  savedschoolFollowEmail.savedSchoolFollowup();
});

var rule17 = new campaignSchedule.RecurrenceRule();
rule17.hour = 22;
rule17.minute = 30;
var m = campaignSchedule.scheduleJob(rule17, function () {
  console.log("Saved school last email.");
  savedschoolFollowEmail.savedSchoolLastFollowup();
});

var rule18 = new campaignSchedule.RecurrenceRule();
rule18.hour = 23;
rule18.minute = 15;
var n = campaignSchedule.scheduleJob(rule18, function () {
  console.log("Request Info email.");
  requestinfoFollowEmail.requestInfoSentEmail();
});

//Schedule the test
/*var rule3 = new testSchedule.RecurrenceRule();
rule3.second = 10;
var j = testSchedule.scheduleJob(rule3, function () {
	console.log("Test email sending.");
	collegeMonthlyReport.sendTestEmail();
});

var rule4 = new vsdSchedule.RecurrenceRule();
rule4.hour = 7;
rule4.minute = 1;
rule2.date = new schedule.Range(22, 28);
rule2.dayOfWeek = 5;
var j = vsdSchedule.scheduleJob(rule4, function () {
	console.log("VSD email sending.");
	veteranVsdEmail.sendVeteranVsdEmail();
});

var rule5 = new collegeContactSchedule.RecurrenceRule();
rule5.hour = 23;
rule5.minute = 1;
rule5.date = new schedule.Range(14, 21);
rule5.dayOfWeek = 3;
var j = collegeContactSchedule.scheduleJob(rule5, function () {
    console.log("College contacts email sending.");
    collegeMonthlyReport.sendCollegeContactEmail();
});*/

app.use(cors());

app.use(function (req, res, next) {
  // if ((req.headers.origin == "http://cr-staging.collegerecon.com") || (req.headers.origin == "http://search-staging.collegerecon.com") ||
  // 	(req.headers.origin == "http://cr-admin-staging.collegerecon.com") || (req.headers.origin == "https://app.collegerecon.com") ||
  // 	(req.headers.origin == "https://legion.collegerecon.com") || (req.headers.origin == "https://search.collegerecon.com") ||
  // 	(req.headers.origin == "https://cr-admin.collegerecon.com")
  // ) {
  //res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  //res.header('Expires', '-1');
  //res.header('Pragma', 'no-cache');
  var ip =
    req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;

  if (ip) {
    var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    logger.log('info', 'clientIp - ' + ip + '|Url - ' + fullUrl);
  }
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, OPTIONS, PUT, PATCH, DELETE'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-Requested-With,content-type'
  );
  next();
  // } else {
  // 	res.status(401).send({
  // 		status: 401,
  // 		data: 'Unauthorized access'
  // 	});
  // }
});

// app.use(compression());
// app.use(minify());
app.use(
  bodyParser.urlencoded({
    extended: true,
    limit: '50mb',
  })
);
app.use(
  bodyParser.json({
    limit: '50mb',
  })
);

app.use(express.static(__dirname + '/'));

app.use('/api', require('./routes/studentRoute'));
app.use('/api', require('./routes/collegeRoute'));
app.use('/api', require('./routes/levelRoute'));
app.use('/api', require('./routes/majorRoute'));
app.use('/api', require('./routes/branchRoute'));
app.use('/api', require('./routes/emailRoute'));
app.use('/api', require('./routes/adRoute'));
app.use('/api', require('./routes/legionPostRoute'));
app.use('/api', require('./routes/authenicateRoute'));
app.use('/api', require('./routes/usageStatisticsRoute'));
app.use('/api', require('./routes/rankRoute'));
app.use('/api', require('./routes/awardRoute'));
app.use('/api', require('./routes/reconMessageRoute'));
app.use('/api', require('./routes/settingRoute'));
app.use('/api', require('./routes/searchRoute'));
app.use('/api', require('./routes/superAdminRoute'));
app.use('/api', require('./routes/superAdminCollegeRoute'));
app.use('/api', require('./routes/superAdminKeywordRoute.js'));
app.use('/api', require('./routes/superAdminCommunicationRoute'));
app.use('/api', require('./routes/superAdminDashboardRoute'));
app.use('/api', require('./routes/sourceTrackingRoute'));
app.use('/api', require('./routes/nagEmailRoute'));
app.use('/api', require('./routes/militaryBenefitRoute'));
app.use('/api', require('./routes/reviewRoute'));
app.use('/api', require('./routes/scholarshipRoute'));
app.use('/api', require('./routes/careerreconCompanyRoute'));
app.use('/api', require('./routes/public'));
app.use(
  '/api/superadmin/setting',
  require('./routes/superadmin-setting-route')
);
app.use('/api', require('./routes/coppperRoute'));
app.use('/api', validateSsoClient, require('./routes/sso'));

/*app.get('/*', function(req, res) {
	res.sendFile(path.join(__dirname +'/'));
 });*/

app.listen(port);

module.exports = app;
