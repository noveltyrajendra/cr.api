

var stringUtil = (function () {

  let sha1 = require('sha1');
  let uniqid = require('uniqid');
  let moment = require('moment-timezone');
  let authenicateConstant = require('../constants/authenicateConstant');
  let Joi = require('joi');

  function joinStringByComma(array) {
    return "'" + array.join("','") + "'";
  }

  function joinIntByComma(array) {
    return array.join(",");
  }

  function joinStringWithComma(sdata) {
    let array = [];
    let result = "";
    if (sdata.indexOf(',') > -1){
      array = sdata.split(",");
      result = "'" + array.join("','") + "'";
    }else{
      result = sdata;
    }
    return result;
  }

  function compareValues(key, order = 'asc') {
    return function innerSort(a, b) {
      if (!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
        // property doesn't exist on either object
        return 0;
      }
      const varA = (typeof a[key] === 'string')
        ? a[key].toUpperCase() : a[key];
      const varB = (typeof b[key] === 'string')
        ? b[key].toUpperCase() : b[key];
  
      let comparison = 0;
      if (varA > varB) {
        comparison = 1;
      } else if (varA < varB) {
        comparison = -1;
      }
      return (
        (order === 'desc') ? (comparison * -1) : comparison
      );
    };
  }

  function generateRandomPassword() {
    let chars = "abcdefghijkmnopqrstuvwxyz023456789";
    let result = '';
    for (var i = 9; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
  }

  function escapeHtml(text) {
    var map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function (m) { return map[m]; });
  }

  function showLineBreakHtml(text) {
    return text.replace(/(?:\r\n|\r|\n)/g, '<br />');
  }

  function UID() {
    let fstrval = sha1(uniqid(Math.random(), true));
    let sstrval = sha1(uniqid(Math.random(), true));
    let tstrval = sha1(uniqid(Math.random(), true));
    let ffstrval = sha1(uniqid(Math.random(), true));
    let firstSet = fstrval.substr(0, 6);
    let secondSet = sstrval.substr(0, 6);
    let thirdSet = tstrval.substr(0, 6);
    let fourthSet = ffstrval.substr(0, 4);
    let uuid = firstSet + '-' + secondSet + '-' + thirdSet + '-' + fourthSet;
    return uuid.toUpperCase();
  }

  function convertFromUTC(dateTime, timeZone) {
    let fmt = 'YYYY-MM-DD hh:mm:ss A';
    if (timeZone == "") {
      timeZone = "America/Chicago";
    }
    if (dateTime != "") {
      let m = moment.tz(dateTime, fmt, timeZone);
      m.utc();
      let s = m.format(fmt);
      return s;
    } else {
      return dateTime;
    }
  }

  function escapeRegExp(str) {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
  }

  function replaceAll(str, find, replace) {
    return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
  }

  const replaceAllExactWord = (str, find, replace) => {
    return str.replace(new RegExp(`\\b${escapeRegExp(find)}\\b`, 'g'), replace);
  }

  function collegeNameUrl(name) {
    let cleanUrl = (name.split(' ').join('-').toLowerCase());
    //Remove Apostrohe from string
    let apo1surl = replaceAll(cleanUrl, "/", "");
    let aposurl = replaceAll(apo1surl, '\'', "");
    //Remove : from string.
    let colonurl = replaceAll(aposurl, ":", "");
    //Remove fullstop from string.
    let fullurl = replaceAll(colonurl, ".", "");
    //Remove comma from string.
    let commaurl = replaceAll(fullurl, ",", "");
    //Remove & from string;
    let ampurl = replaceAll(commaurl, "&", "");
    //Remove &amp; from string;
    let ampurlcol = replaceAll(ampurl, "&amp;", "");
    //Remove bracket left (
    let leftbraurl = replaceAll(ampurlcol, "(", "");
    // Remove bracket right )
    let collegeurl = replaceAll(leftbraurl, ")", "");
    return collegeurl;
  }

  function collegeOverviewReplace(collegeOverview, tagList) {
    tagList.map(data => {
      let tagName = data.name;
      let globalTag = new RegExp(tagName, "g");
      let matchTag = collegeOverview.match(globalTag);
      if (matchTag) {
        matchTag.map(tag => {
          let filteredTag = tag;
          let hyperlink = `<a href=${data.action} target="_blank">`.concat(data.displayText).concat('</a>')
          collegeOverview = collegeOverview.replace(filteredTag, hyperlink);
        })
      }
    })
    return collegeOverview;

  }

  function checkDataInArray(arrdata, check) {
    let arr = arrdata.split(',');
    let result = false;
    for (var i = 0; i < arr.length; i++) {
      if (check == arr[i]) {
        result = true;
        break;
      }
    }
    return result;
  }

  function removeDuplicates(arr) {
    var obj = {};
    var ret_arr = [];
    for (var i = 0; i < arr.length; i++) {
      obj[arr[i]] = true;
    }
    for (var key in obj) {
      ret_arr.push(key);
    }
    return ret_arr;
  }

  get_random = function (array) {
    for (var i = array.length; i > 0; --i)
      array.push(array.splice(Math.random() * i | 0, 1)[0]);
    return array;
  }

  function arrayDiff(a1, a2) {
    var a = [], diff = [];
    for (var i = 0; i < a1.length; i++) {
        a[a1[i]] = true;
    }
    for (var i = 0; i < a2.length; i++) {
        if (a[a2[i]]) {
            delete a[a2[i]];
        } else {
            //a[a2[i]] = true;
        }
    }
    for (var k in a) {
        diff.push(k);
    }
    return diff;
}

  function checkValInAssociativeArray(val,assoArr){
    let result = 0;
    for (let index = 0; index < assoArr.length; index++) {
      if(assoArr[index].id == val){
        result = assoArr[index].searchresult;
        break;
      }
    }
    return result;
  }

  function checkSavedAssociativeArray(val,assoArr){
    let result = 0;
    for (let index = 0; index < assoArr.length; index++) {
      if(assoArr[index].id == val){
        result = assoArr[index].savedschool;
        break;
      }
    }
    return result;
  }

  function checkBookmarkAssociativeArray(val,assoArr) {
    let result = 0;
    for (let index = 0; index < assoArr.length; index++) {
      if(assoArr[index].id == val){
        result = assoArr[index].bookmarkschool;
        break;
      }
    }
    return result;
  }

  function checkContactInfoAssociativeArray(val,assoArr) {
    let result = 0;
    for (let index = 0; index < assoArr.length; index++) {
      if(assoArr[index].id == val){
        result = assoArr[index].contactinfo;
        break;
      }
    }
    return result;
  }

  function checkTabClickedAssociativeArray(val,assoArr) {
    let result = 0;
    for (let index = 0; index < assoArr.length; index++) {
      if(assoArr[index].id == val){
        result = assoArr[index].tabsclicked;
        break;
      }
    }
    return result;
  }



function removeDuplicateInAssociativeArray(arr, prop) {
  let obj = {};
  for ( var i = 0, len = arr.length; i < len; i++ ){
    if(!obj[arr[i][prop]]) obj[arr[i][prop]] = arr[i];
  }
  var newArr = [];
  for ( var key in obj ) newArr.push(obj[key]);
  return newArr;
}

function checkPhoneNumber(phone){
  if(phone){
    let phoneval = phone.replace(/\D/g,'');
    if(phoneval){
      if(phoneval.length == 10){
        return true;
      }else{
        return false;
      }
    }else{
      return false;
    }
  }else{
    return false;
  }
}

function checkZipcode(zip){
  if(zip){
    return true;
  }else{
    return false;
  }
}

function errorStatus(err){
  var error = err;
  error.status = 503;
  return error;
}

function checkAuthoriseUser(header){
  if(header['user-name'] == authenicateConstant.CAREERRECON_USER && header['password'] == authenicateConstant.CAREERRECON_PASSWORD){
    return true;
  }else if(header['user-name'] == authenicateConstant.MILITARYBENEFIT_USER && header['password'] == authenicateConstant.MILITARYBENEFIT_PASSWORD){
    return true;
  }else if(header['username'] == authenicateConstant.ETS_USER && header['password'] == authenicateConstant.ETS_PASSWORD){
    return true;
  }else{
    return false;
  }
}

function joiLoginValidation(req){
  const authSchema = Joi.object({
      user_email: Joi.string().min(6).required().email(),
      user_password: Joi.string().required() 
  });
  const result = authSchema.validate(req.body);
  const { value, error } = result;
  const valid = error == null;
  let retData = {};
  if(!valid){
    const { details } = result.error;
    const message = details.map(i => i.message).join(',');
    retData = {
      check: false,
      errorMessage: replaceAll(message,'"','')
    }
  }else{
    retData = {
      check: true,
      errorMessage: "success"
    }
  }
  return retData;
}

function joiVeteranDataValidation(req){
  let result = "";
  let retData = {};
  if(req.headers['user-name'] == 'careerrecon'){
    const veteranSchema = Joi.object({
      uuid: Joi.required(),
      first_name: Joi.string().required(),
      last_name: Joi.string().required(),
      password: Joi.string().required(),
      email: Joi.string().min(6).required().email(),
      state: Joi.string().required(),
      military_status: Joi.required(),
      military_branch: Joi.required(),
      phone_number: Joi.optional(),
      available: Joi.required(),
      mmb_level_id: Joi.required(),
      military_rank: Joi.required(),
      mos: Joi.optional(),
      security_clearance: Joi.required(),
      bucket_value: Joi.required(),
      career_id: Joi.required(),
      year_experience: Joi.required(),
      desired_salary: Joi.required(),
      relocate: Joi.string().required()
    });
    result = veteranSchema.validate(req.body);
  }else{
    const veteranSchema = Joi.object({
      uuid: Joi.required(),
      first_name: Joi.string().required(),
      last_name: Joi.string().required(),
      password: Joi.string().required(),
      email: Joi.string().min(6).required().email(),
      postal_code: Joi.required(),
      military_status: Joi.required(),
      military_branch: Joi.required(),
      phone_number: Joi.optional(),
      military_rank: Joi.required(),
      mos: Joi.optional(),
      category_question: Joi.required(),
      benefit_question: Joi.required()
    });
    result = veteranSchema.validate(req.body)
  } 
    const { value, error } = result;
    valid = error == null;
  if(!valid){
    const { details } = result.error;
    const message = details.map(i => i.message).join(',');
    retData = {
      check: false,
      errorMessage: replaceAll(message,'"','')
    }
  }else{
    retData = {
      check: true,
      errorMessage: "success"
    }
  }
  return retData;
}

function manageCollegeName(cname){
  let filterCollegeName = replaceAllExactWord(cname,"The","the");
  filterCollegeName = replaceAllExactWord(filterCollegeName,"At","at");
  filterCollegeName = replaceAllExactWord(filterCollegeName,"And","and");
  filterCollegeName = replaceAllExactWord(filterCollegeName,"Of","of");
  filterCollegeName = replaceAllExactWord(filterCollegeName,"For","for");
  if(filterCollegeName.startsWith("t")){
    filterCollegeName = filterCollegeName.charAt(0).toUpperCase() + filterCollegeName.slice(1);
  }
  return filterCollegeName;
}

function checkDayMonth(){
  let today = new Date();
  let day = today.getDate();
  let month = today.getMonth() + 1;
  let year = today.getFullYear();
  let weekDay = today.getDay();
  let restrictDays = [6,0];
  if(day == 1 && !restrictDays.includes(weekDay)){
    return true;
  }else if(day == 2 || day == 3){
    let firstDay = weekDay - 1;
    if(firstDay == 0){
      return true;
    }else{
      return false;
    }
  }else{
    return false;
  }
}

function formatPhoneNumber(phoneNumberString){
  let cleaned = ("" + phoneNumberString).replace(/\D/g, "");
  let match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return "(" + match[1] + ") " + match[2] + "-" + match[3];
  }
  return null;
}

function formatClaimPhoneNumber(phoneNumberString){
  let cleaned = ("" + phoneNumberString).replace(/\D/g, "");
  if(cleaned.length == 11){
    let beginNumber = cleaned.charAt();
    if(beginNumber == "1"){
      cleaned = cleaned.slice(1);
    }
  }
  let match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return "(" + match[1] + ") " + match[2] + "-" + match[3];
  }
  return cleaned;
}

function titleCase(str) {
  var splitStr = str.toLowerCase().split(' ');
  for (var i = 0; i < splitStr.length; i++) {
      splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);     
  }
  return splitStr.join(' '); 
}


  return {
    joinStringByComma: joinStringByComma,
    joinStringWithComma: joinStringWithComma,
    generateRandomPassword: generateRandomPassword,
    escapeHtml: escapeHtml,
    showLineBreakHtml: showLineBreakHtml,
    UID: UID,
    convertFromUTC: convertFromUTC,
    replaceAll: replaceAll,
    collegeNameUrl: collegeNameUrl,
    checkDataInArray: checkDataInArray,
    removeDuplicates: removeDuplicates,
    compareValues: compareValues,
    get_random: get_random,
    collegeOverviewReplace: collegeOverviewReplace,
    arrayDiff: arrayDiff,
    checkValInAssociativeArray: checkValInAssociativeArray,
    checkSavedAssociativeArray: checkSavedAssociativeArray,
    removeDuplicateInAssociativeArray:removeDuplicateInAssociativeArray,
    checkBookmarkAssociativeArray: checkBookmarkAssociativeArray,
    checkContactInfoAssociativeArray: checkContactInfoAssociativeArray,
    checkTabClickedAssociativeArray: checkTabClickedAssociativeArray,
    checkPhoneNumber: checkPhoneNumber,
    checkZipcode: checkZipcode,
    errorStatus: errorStatus,
    checkAuthoriseUser: checkAuthoriseUser,
    joiLoginValidation: joiLoginValidation,
    joiVeteranDataValidation: joiVeteranDataValidation,
    manageCollegeName: manageCollegeName,
    checkDayMonth: checkDayMonth,
    formatPhoneNumber: formatPhoneNumber,
    formatClaimPhoneNumber: formatClaimPhoneNumber,
    titleCase: titleCase,
    joinIntByComma: joinIntByComma
  }

})();

module.exports = stringUtil;
