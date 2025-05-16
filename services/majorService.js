var majorService = (function () {
  var mysqlService = require('./mysqlService');
  var majorConstant = require('../constants/majorConstant');
  var majorModel = require('../models/majorModel');
  var majorLevelModel = require('../models/majorLevelModel');
  var majorDetailModel = require('../models/majorDetailModel');
  var academicInterestModel = require('../models/academicInterestModel');
  var bucketModel = require('../models/bucketModel');
  var secondaryBucketModel = require('../models/secondaryBucketModel');
  const majorBucketModel = require('../models/majorBucketModel');
  const {
    inPersonAndOnlineMajorModel,
  } = require('../models/inPersonAndOnlineMajorModel');
  var stringUtil = require('../utils/stringUtil');

  function getMajors() {
    return new Promise(async function (resolve, reject) {
      try {
        const majors = await mysqlService.query(majorConstant.MAJORS_QUERY);
        return resolve(majorModel(majors));
      } catch (error) {
        return reject(error);
      }
    });
  }

  function getMajorsByTitle(title) {
    return new Promise(function (resolve, reject) {
      mysqlService.query(majorConstant.MAJORS_TITLE_QUERY, [title]).then(
        function (response) {
          resolve(majorModel(response));
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

  function getMajorsByLevel(levelId) {
    return new Promise(function (resolve, reject) {
      mysqlService.query(majorConstant.MAJORS_LEVEL_QUERY, [levelId]).then(
        function (response) {
          resolve(majorModel(response));
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

  function getMajorsByCollege(collegeId) {
    return new Promise(function (resolve, reject) {
      mysqlService.query(majorConstant.MAJORS_COLLEGE_QUERY, [collegeId]).then(
        function (response) {
          resolve(majorModel(response));
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

  function getMajorsByCollegeAndLevel(collegeId, levelId) {
    return new Promise(function (resolve, reject) {
      let selQuery =
        'select distinct m.id as majorId, m.title as majorTitle, m.description as description, cm.online, cm.in_person as inPerson, cm.hybrid from majors_new m INNER JOIN college_majors_new cm on ' +
        "m.id=cm.major_id INNER JOIN levels l on l.id=cm.aw_level where m.status='ACTIVE' and cm.`cr_id`= " +
        collegeId +
        ' and l.`id` in  (' +
        levelId +
        ') Order by m.title asc';
      //console.log("QQ:",selQuery);
      mysqlService.query(selQuery).then(
        function (response) {
          resolve(majorModel(response));
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

  function getMajorsLevelQuery() {
    return new Promise(function (resolve, reject) {
      mysqlService.query(majorConstant.MAJORS_LEVEL_MAIN_QUERY).then(
        function (response) {
          resolve(majorLevelModel(response));
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

  function getMajorsByCollegeId(collegeId) {
    return new Promise(function (resolve, reject) {
      mysqlService
        .query(majorConstant.MAJORS_COLLEGE_DETAIL_QUERY, [collegeId])
        .then(
          function (response) {
            resolve(majorDetailModel(response));
          },
          function (err) {
            if (err) {
              let error = err;
              error.status = 503;
              return reject(error);
            }
          }
        );
    });
  }

  function getMajorsDesignationByCollegeId(collegeId) {
    return new Promise(async (resolve, reject) => {
      try {
        const majorList = await mysqlService.query(
          majorConstant.MAJORS_COLLEGE_DETAIL_DESIGNATION_QUERY,
          [collegeId]
        );
        return resolve(inPersonAndOnlineMajorModel(majorList));
      } catch (error) {
        return reject(error);
      }
    });
  }

  function getAcademicInterest() {
    return new Promise(function (resolve, reject) {
      mysqlService.query(majorConstant.ACADEMIC_INTEREST_QUERY).then(
        function (response) {
          resolve(academicInterestModel(response));
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

  function getAcademicInterestByMajor(title) {
    return new Promise(function (resolve, reject) {
      mysqlService
        .query(majorConstant.ACADEMIC_INTEREST_TITLE_QUERY, [title])
        .then(
          function (response) {
            resolve(academicInterestModel(response));
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

  function getMajorLevelBucketData(levelid, bucketids) {
    return new Promise(function (resolve, reject) {
      let Qry = '';
      if (levelid != '' && bucketids == 0) {
        Qry =
          "select distinct m.id as majorId, m.title as majorTitle, m.description as description from majors_new m INNER JOIN college_majors_new cm on  m.id=cm.major_id INNER JOIN levels l on l.id=cm.aw_level where m.status='ACTIVE' and l.`id`= " +
          levelid +
          ' Order by m.title  asc';
      } else if (bucketids != '' && levelid == 0) {
        Qry =
          "select distinct m.id as majorId, m.title as majorTitle, m.description as description from majors_new m INNER JOIN bucket_degree_list bd on m.id=bd.major_id where m.status='ACTIVE' and bd.bucket_degree_id in (" +
          bucketids +
          ') Order by m.title  asc';
      } else {
        Qry =
          "select distinct m.id as majorId, m.title as majorTitle, m.description as description from majors_new m INNER JOIN college_majors_new cm on  m.id=cm.major_id INNER JOIN levels l on l.id=cm.aw_level INNER JOIN bucket_degree_list bd on m.id=bd.major_id where m.status='ACTIVE' and l.`id`= " +
          levelid +
          ' and bd.bucket_degree_id in (' +
          bucketids +
          ') Order by m.title  asc';
      }
      //console.log("QQ:", Qry);
      mysqlService.query(Qry).then(
        function (response) {
          resolve(majorModel(response));
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

  // function getMajorSecondaryBucketData(bids) {
  // 	return new Promise(function (resolve, reject) {
  // 		let Qry = "";
  // 		Qry = "select distinct m.id as majorId, m.title as majorTitle, m.description as description from majors_new m INNER JOIN bucket_secondary_degree_list bd on m.id=bd.major_id where m.status='ACTIVE' and bd.bucket_secondary_degree_id in (" + bids + ") Order by m.title  asc";
  // 		//console.log("QQ:", Qry);
  // 		mysqlService.query(Qry)
  // 			.then(function (response) {
  // 				resolve(majorModel(response));
  // 			}, function (err) {
  // 				if (err) {
  // 					var error = err;
  // 					error.status = 503;
  // 					return reject(error)
  // 				};
  // 			});
  // 	});
  // }

  function getSecondaryLevelBucketData(bucketids) {
    return new Promise(function (resolve, reject) {
      let Qry = '';
      if (bucketids == 0) {
        Qry =
          "select distinct b.id as secBucketId,b.title as secBucketTitle, b.bucket_degree_id as bucketId from bucket_secondary_degree b  where b.status = 'ACTIVE'  Order by b.title asc";
      } else {
        Qry =
          "select distinct b.id as secBucketId,b.title as secBucketTitle, b.bucket_degree_id as bucketId from bucket_secondary_degree b  where b.status = 'ACTIVE' and b.bucket_degree_id in (" +
          bucketids +
          ') Order by b.title asc';
      }
      mysqlService.query(Qry).then(
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

  function getBucketListData() {
    return new Promise(function (resolve, reject) {
      let Qry =
        "SELECT id,title FROM bucket_degree WHERE status='ACTIVE' order by title asc";
      mysqlService.query(Qry).then(
        function (response) {
          resolve(bucketModel(response));
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

  function getSecondaryBucketListData() {
    return new Promise(function (resolve, reject) {
      let Qry =
        "SELECT id,title FROM bucket_secondary_degree WHERE status='ACTIVE' order by title asc";
      mysqlService.query(Qry).then(
        function (response) {
          resolve(secondaryBucketModel(response));
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

  function getSecondaryBucketList() {
    return new Promise(function (resolve, reject) {
      let Qry =
        "SELECT id,title,bucket_degree_id as secid FROM bucket_secondary_degree WHERE status='ACTIVE' order by title asc";
      //console.log("QQ:",Qry);
      mysqlService.query(Qry).then(
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

  function getMajorDataByLevel(collegeId) {
    return new Promise(function (resolve, reject) {
      let Qry =
        "select COUNT(IF(l.id = 3, 1, NULL)) as associateTotal,COUNT(IF(l.id = 5, 1, NULL)) as bachelorTotal,COUNT(IF(l.id = 6, 1, NULL)) as pbachelorTotal,COUNT(IF(l.id = 7, 1, NULL)) as masterTotal,COUNT(IF(l.id = 8, 1, NULL)) as pmasterTotal,COUNT(IF(l.id = 17, 1, NULL)) as docrateTotal,COUNT(IF(l.id = 18, 1, NULL)) as certificateTotal from majors_new m INNER JOIN college_majors_new cm on m.id=cm.major_id INNER JOIN levels l on l.id=cm.aw_level where m.status='ACTIVE' and cm.`cr_id`=" +
        collegeId;
      //console.log("QQ:",Qry);
      mysqlService.query(Qry).then(
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

  function getSecondaryBucketListByIds(secIds) {
    return new Promise(function (resolve, reject) {
      let Qry =
        "SELECT id,title FROM bucket_secondary_degree WHERE status='ACTIVE' and id in(" +
        secIds +
        ')';
      //console.log("QQ:",Qry);
      mysqlService.query(Qry).then(
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

  function getLevelBucketRelation(levelId) {
    if (levelId) {
      for (let i = 0; i < levelId.length; i++) {
        if (levelId[i] == 18) {
          levelId.push(8, 6);
        }
      }
    }
    return new Promise(function (resolve, reject) {
      let Qry = `SELECT DISTINCT bd.id as bucketId, bd.title as bucketTitle FROM bucket_degree bd LEFT JOIN bucket_level bl ON bd.id = bl.bucket_id WHERE bd.status="ACTIVE"`;
      if (levelId.length > 0) {
        Qry += ` and level_id IN (${levelId}) `;
      }
      Qry += ` order by title asc `;
      // console.log("QQ:",Qry);
      mysqlService.query(Qry).then(
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

  function getLevelSecBucketRelation(levelId) {
    if (levelId) {
      for (let i = 0; i < levelId.length; i++) {
        if (levelId[i] == 18) {
          levelId.push(8, 6);
        }
      }
    }
    return new Promise(function (resolve, reject) {
      let Qry = `SELECT DISTINCT bsd.id as id, bsd.title as title, bsd.bucket_degree_id as secid FROM bucket_secondary_degree bsd LEFT JOIN bucket_level bl ON bsd.bucket_degree_id = bl.bucket_id WHERE bsd.status="ACTIVE" `;
      if (levelId.length == 0) {
        Qry += ` order by bsd.title `;
      }
      if (levelId.length > 0) {
        Qry += ` and level_id IN (${levelId}) order by bsd.title `;
      }
      // console.log("QQ:",Qry);
      mysqlService.query(Qry).then(
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

  function resetSavedSchool(uid) {
    return new Promise(function (resolve, reject) {
      let Qry = `UPDATE 'students' SET filters = '' WHERE uuid='${uid}' `;
      // console.log("QQ:",Qry);
      mysqlService.query(Qry).then(
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

  function getSecondaryLevelFromMultipleBucketData(bucketids) {
    return new Promise(function (resolve, reject) {
      let Qry = '';
      if (bucketids.length == 0) {
        Qry =
          "select distinct b.id as secBucketId, b.title as secBucketTitle from bucket_secondary_degree b  where b.status = 'ACTIVE'  Order by b.title asc";
      } else {
        Qry = `select distinct b.id as secBucketId, b.title as secBucketTitle from bucket_secondary_degree b  where b.status = 'ACTIVE' and b.bucket_degree_id IN (${bucketids}) Order by b.title asc`;
      }

      mysqlService.query(Qry).then(
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

  function getScholarshipDictionary(parentkey) {
    return new Promise(function (resolve, reject) {
      let Qry = `SELECT name, keyname, parentkey FROM scholarship_dictionary WHERE parentKey = '${parentkey}' AND status = 'active'`;
      mysqlService.query(Qry).then(
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

  function getPrimaryBucketListData(parentkey) {
    return new Promise(function (resolve, reject) {
      let Qry = `SELECT * from bucket_degree where status='active' order by display_order`;
      mysqlService.query(Qry).then(
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

  function getSecondaryBucketFromLevelAndPbucket(data) {
    return new Promise(function (resolve, reject) {
      if (data.level) {
        for (let i = 0; i < data.level.length; i++) {
          if (data.level[i] == 18) {
            data.level.push(8, 6);
          }
        }
      }
      let Qry = `SELECT DISTINCT bsd.id as id, bsd.title as title, bsd.bucket_degree_id as secid FROM bucket_secondary_degree bsd LEFT JOIN bucket_level bl ON bsd.bucket_degree_id = bl.bucket_id WHERE bsd.status="ACTIVE" `;
      if (data.level.length > 0) {
        Qry += ` and level_id IN (${data.level})  `;
      }

      if (data.primary.length > 0) {
        Qry += ` and bucket_degree_id IN (${data.primary})  `;
      }

      Qry += ` order by bsd.title `;
      mysqlService.query(Qry).then(
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

  function getMajorsWithPrimaryAndSecondaryBuckets(collegeId) {
    return new Promise(async function (resolve, reject) {
      try {
        const [majors, existingMajors] = await Promise.all([
          mysqlService.query(majorConstant.MAJORS_BUCKET_QUERY),
          mysqlService.query(
            majorConstant.MAJORS_COLLEGE_DETAIL_DESIGNATION_QUERY,
            [collegeId]
          ),
        ]);
        return resolve(majorBucketModel(majors, existingMajors));
      } catch (error) {
        return reject(error);
      }
    });
  }

  async function getMajorsByFilter(query) {
    const { bucketId, secondaryBucketId, keyword } = query;
    const searchQuery = `${majorConstant.MAJOR_FILTER_QUERY} ${
      bucketId ? `AND bsdl.bucket_primary_degree_id in (${bucketId})` : ''
    } ${
      secondaryBucketId
        ? `AND bsdl.bucket_secondary_degree_id IN (${secondaryBucketId})`
        : ''
    } ${keyword ? `AND mn.title LIKE '%${keyword}%'` : ''}`;
    return mysqlService.query(searchQuery);
  }

  const getFilterByNameData = async (name) => {
    const resultArray=[];
    let stateData = await mysqlService.query(`select name,short_name from bah_state where name LIKE '%${name}%'`);
    resultArray.push(stateData);
    let secBuckDate =  await mysqlService.query(`select title as text,id as value from bucket_secondary_degree where title LIKE '%${name}%' and status='active'`);
    resultArray.push(secBuckDate);
    return resultArray;
  }

  return {
    getMajors: getMajors,
    getMajorsByTitle: getMajorsByTitle,
    getMajorsByLevel: getMajorsByLevel,
    getMajorsByCollege: getMajorsByCollege,
    getMajorsByCollegeAndLevel: getMajorsByCollegeAndLevel,
    getMajorsLevelQuery: getMajorsLevelQuery,
    getMajorsByCollegeId: getMajorsByCollegeId,
    getAcademicInterest: getAcademicInterest,
    getAcademicInterestByMajor: getAcademicInterestByMajor,
    getMajorLevelBucketData: getMajorLevelBucketData,
    getBucketListData: getBucketListData,
    getSecondaryLevelBucketData: getSecondaryLevelBucketData,
    getSecondaryBucketListData: getSecondaryBucketListData,
    getSecondaryBucketList: getSecondaryBucketList,
    getMajorDataByLevel: getMajorDataByLevel,
    getSecondaryBucketListByIds: getSecondaryBucketListByIds,
    getLevelBucketRelation: getLevelBucketRelation,
    getLevelSecBucketRelation: getLevelSecBucketRelation,
    resetSavedSchool: resetSavedSchool,
    getSecondaryLevelFromMultipleBucketData:
      getSecondaryLevelFromMultipleBucketData,
    getScholarshipDictionary: getScholarshipDictionary,
    getPrimaryBucketListData: getPrimaryBucketListData,
    getSecondaryBucketFromLevelAndPbucket:
      getSecondaryBucketFromLevelAndPbucket,
    getMajorsDesignationByCollegeId: getMajorsDesignationByCollegeId,
    getMajorsWithPrimaryAndSecondaryBuckets:
      getMajorsWithPrimaryAndSecondaryBuckets,
    getMajorsByFilter,
    getFilterByNameData,
    // getMajorSecondaryBucketData: getMajorSecondaryBucketData
  };
})();

module.exports = majorService;
