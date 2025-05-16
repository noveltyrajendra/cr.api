const groupItemsInArray = (arr, key) => {
  return arr.reduce((acc, item) => {
    if (!acc[item[key]]) {
      acc[item[key]] = [];
    }
    acc[item[key]].push(item);
    return acc;
  }, {});
};

const isObject = (data) => {
  return data.constructor.name.toLowerCase() === 'object';
};

const mapDataToTableField = (data, mapper) => {
  const mappedData = {};
  for (const field in mapper) {
    if (!Object.keys(data).includes(mapper[field])) continue;
    Object.assign(mappedData, { [field]: data[mapper[field]] });
  }
  return mappedData;
};

const checkRequiredParameters = (data, requiredFields) => {
  const fields = [];
  for (const key in data) {
    if (requiredFields.includes(key) && !data[key]) fields.push(key);
  }
  return { isValid: !fields.length, fields };
};

const isObjectEmpty = (object) => {
  return isObject(object) && Object.keys(object).length ? false : true;
};

const checkPrivateCollege = (val) => {
  let privateData = ['private', 'private for profit', 'for profit'];
  if (privateData.includes(val)) {
    return true;
  } else {
    return false;
  }
};

function appendZeroToZip(zip) {
  if (zip.length > 4) return zip;
  while (zip.length < 5) {
    zip = '0' + zip;
  }
  return zip;
}

const getMilitaryStatusGroup = (val) =>{
  let activeData = ["Active", "Guard", "Reserve"];
  let veteranData = ["Retired", "Veteran"];
  let spouseData = ["Spouse", "Dependent"];
  let result = "";
  if (activeData.includes(val)) {
    result = "active";
  }else if(veteranData.includes(val)){
    result = "veteran";
  }else{
    result = "spouse";
  }
  return result;
}

module.exports = {
  groupItemsInArray,
  isObject,
  mapDataToTableField,
  checkRequiredParameters,
  isObjectEmpty,
  checkPrivateCollege,
  appendZeroToZip,
  getMilitaryStatusGroup,
};
