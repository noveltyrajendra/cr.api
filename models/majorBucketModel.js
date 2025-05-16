const { groupItemsInArray } = require('../utils/commonUtils');

const majorBucketModel = (majors, existingMajors) => {
  const majorsItems = groupItemsInArray(majors, 'primaryDegree');

  for (const item in majorsItems) {
    for (const major of majorsItems[item]) {
      for (const {
        shortTitle,
        online,
        inPerson,
        hybrid,
      } of existingMajors.filter((m) => m.majorId === major.majorId)) {
        major[shortTitle] = [
            online ? 'online' : null,
            inPerson ? 'in-person' : null,
            hybrid ? 'hybrid' : null,
        ].filter(designation => designation);
      }
    }
    majorsItems[item] = groupItemsInArray(majorsItems[item], 'secondaryDegree');
  }
  return majorsItems;
};

module.exports = majorBucketModel;
