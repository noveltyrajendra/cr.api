const inPersonAndOnlineMajorModel = (majorList) => {
  const majors = [];
  for (const major of majorList) {
    if(majors.find(m => m.majorId === major.majorId)) {
      for (const emajor of majors) {
        if(emajor.majorId !== major.majorId) continue;
        if(major.online) emajor.shortTitleOnline.push(major.shortTitle);
        if(major.hybrid) emajor.shortTitleHybrid.push(major.shortTitle);
        if(major.inPerson) emajor.shortTitleInPerson.push(major.shortTitle);
      }
    } else {
      const majorObject = {
        majorId: major.majorId,
        majorTitle: major.majorTitle,
        description: major.description,
        shortTitleInPerson: major.inPerson ? [major.shortTitle] : [],
        shortTitleOnline: major.online ? [major.shortTitle]  : [],
        shortTitleHybrid: major.hybrid ? [major.shortTitle]  : [],
      }
      majors.push(majorObject);
    }
  }
  return majors;
}

module.exports = { inPersonAndOnlineMajorModel }