let usagestatisticsService = (function() {
  
    let mysqlService=require('./mysqlService');
    let usagestatisticsConstant=require('../constants/usagestatisticsConstant');

    function getCollegeContact(studentid)
    {	
      return new Promise(function(resolve, reject) {
        mysqlService.query(usagestatisticsConstant.DEFAULT_COLLEGE_CONTACT_STUDENT+"'"+studentid+"'")
        .then(function(response){
            resolve(response);
        },function(err){  
          if (err) {
            var error = err;
            error.status = 503;
            return reject(error)
          };
        });
      });
    }

    function getFavoritedColleges(studentid)
    {	
      return new Promise(function(resolve, reject) {
        mysqlService.query(usagestatisticsConstant.DEFAULT_FAVOURITE_COLLEGE_STUDENT+"'"+studentid+"'")
        .then(function(response){
          mysqlService.query(usagestatisticsConstant.DEFAULT_COLLEGE_CONTACT_STUDENT+"'"+studentid+"'").then(function(response1){
            mysqlService.query(usagestatisticsConstant.DEFAULT_SEARCH_STUDENT+"'"+studentid+"' limit 1")
            .then(function(response2){
              mysqlService.query(usagestatisticsConstant.DEFAULT_VIEW_FOR_STUDENT+"'"+studentid+"'")
              .then(function(response3){
                resolve({'favoriteCollege':response && response[0] && response[0].c_favs ? response[0].c_favs : 0,'collegeContact':response1 && response1[0] && response1[0].c_contacts ? response1[0].c_contacts : 0,'collegeSearch':response2 && response2[0] && response2[0].num_count ? response2[0].num_count : 0, 'collegeView':response3 && response3[0] && response3[0].student_views ? response3[0].student_views : 0})
              },function(err){  
                if (err) {
                  var error = err;
                  error.status = 503;
                  return reject(error)
                };
              })
             
            },function(err){  
              if (err) {
                var error = err;
                error.status = 503;
                return reject(error)
              };
            }) 
          },function(err){  
            if (err) {
              var error = err;
              error.status = 503;
              return reject(error)
            };
          })
            // resolve(response);
        },function(err){  
          if (err) {
            var error = err;
            error.status = 503;
            return reject(error)
          };
        });
      });
    }

    function getSearches(studentid)
    {	
      return new Promise(function(resolve, reject) {
        //console.log('c',usagestatisticsConstant.DEFAULT_SEARCH_STUDENT+"'"+studentid+"' limit 1")
        mysqlService.query(usagestatisticsConstant.DEFAULT_SEARCH_STUDENT+"'"+studentid+"' limit 1")
        .then(function(response){
            resolve(response);
        },function(err){  
          if (err) {
            var error = err;
            error.status = 503;
            return reject(error)
          };
        });
      });
    }

    function getViewsForStudent(studentid)
    {	
      return new Promise(function(resolve, reject) {
        mysqlService.query(usagestatisticsConstant.DEFAULT_VIEW_FOR_STUDENT+"'"+studentid+"'")
        .then(function(response){
            resolve(response);
        },function(err){  
          if (err) {
            var error = err;
            error.status = 503;
            return reject(error)
          };
        });
      });
    }

    function getSearchesForCollege(collegeid)
    {	
      return new Promise(function(resolve, reject) {
        mysqlService.query(usagestatisticsConstant.DEFAULT_SEARCH_BY_COLLEGE, collegeid)
        .then(function(response){
            resolve(response);
        },function(err){  
          if (err) {
            var error = err;
            error.status = 503;
            return reject(error)
          };
        });
      });
    }

    function getFavCollegesForColleges(collegeid)
    {	
      return new Promise(function(resolve, reject) {
        mysqlService.query(usagestatisticsConstant.DEFAULT_FAV_COLLEGE_FOR_COLLEGE, collegeid)
        .then(function(response){
            resolve(response);
        },function(err){  
          if (err) {
            var error = err;
            error.status = 503;
            return reject(error)
          };
        });
      });
    }

    function getCollegeViewStudent(collegeid)
    {	
      return new Promise(function(resolve, reject) {
        mysqlService.query(usagestatisticsConstant.DEFAULT_COLLEGE_VIEW_STUDENT, collegeid)
        .then(function(response){
            resolve(response);
        },function(err){  
          if (err) {
            var error = err;
            error.status = 503;
            return reject(error)
          };
        });
      });
    }

    function getCollegeViewPublic(collegeid)
    {	
      return new Promise(function(resolve, reject) {
        mysqlService.query(usagestatisticsConstant.DEFAULT_COLLEGE_VIEW_PUBLIC, collegeid)
        .then(function(response){
            resolve(response);
        },function(err){  
          if (err) {
            var error = err;
            error.status = 503;
            return reject(error)
          };
        });
      });
    }

    function getSearchCollegesCount(collegeid)
    {	
      return new Promise(function(resolve, reject) {
        mysqlService.query(usagestatisticsConstant.SEARCH_FOR_COLLEGE,collegeid)
        .then(function(response){
          mysqlService.query(usagestatisticsConstant.FAVOURITE_COLLEGES_FOR_COLLEGES,collegeid).then(function(response1){
            mysqlService.query(usagestatisticsConstant.DEFAULT_COLLEGE_VIEW_STUDENT,collegeid)
            .then(function(response2){
              mysqlService.query(usagestatisticsConstant.DEFAULT_COLLEGE_VIEW_PUBLIC,collegeid)
              .then(function(response3){
                let totalcount = response2[0].college_views + response3[0].num_count;
                resolve({'searchesForCollege':(response[0].num_count == '') ? 0 : response[0].num_count,'favCollegesForColleges':response1[0].num_favorited,'profileViews':totalcount})
              },function(err){  
                if (err) {
                  var error = err;
                  error.status = 503;
                  return reject(error)
                };
              })
             
            },function(err){  
              if (err) {
                var error = err;
                error.status = 503;
                return reject(error)
              };
            }) 
          },function(err){  
            if (err) {
              var error = err;
              error.status = 503;
              return reject(error)
            };
          })
            // resolve(response);
        },function(err){  
          if (err) {
            var error = err;
            error.status = 503;
            return reject(error)
          };
        });
      });
    }

    function updateViewCounter(res)
    {	
      return new Promise(function(resolve, reject) {
        let checkQuery = 'SELECT * FROM usage_statistics WHERE resource = "'+res.viewType+'" AND student_id = "'+res.studentId+'" AND college_id = "'+res.collegeId+'"';
        //console.log(checkQuery);
        mysqlService.query(checkQuery)
        .then(function(response){
          //console.log(response.length);
          let qry = "";
          if(response.length == 0){
            qry = 'INSERT INTO usage_statistics SET resource = "'+res.viewType+'",student_id = "'+res.studentId+'",num_count=1, college_id = "'+res.collegeId+'"';
          }else{
            qry = 'UPDATE usage_statistics SET num_count = num_count +1 WHERE resource = "'+res.viewType+'" AND student_id = "'+res.studentId+'" AND college_id = "'+res.collegeId+'"';
          }
          mysqlService.query(qry)
          .then(function(response1){
            resolve("success");
          },function(err){  
            if (err) {
              var error = err;
              error.status = 503;
              return reject(error)
            };
          })
        },function(err){  
          if (err) {
            var error = err;
            error.status = 503;
            return reject(error)
          };
        });
      });
    }

    function updateCollegeSearchCounter(res)
    {	
      return new Promise(function(resolve, reject) {
        let checkQuery = 'SELECT * FROM usage_statistics WHERE resource = "SEARCH" AND student_id = "'+res.studentId+'"';
        mysqlService.query(checkQuery)
        .then(function(response){
          let qry = "";
          if(response.length == 0){
            qry = 'INSERT INTO usage_statistics SET resource = "SEARCH", num_count = 1,college_id=0,student_id = "'+res.studentId+'"';
          }else{
            qry = 'UPDATE usage_statistics SET num_count = num_count+1 WHERE student_id = "'+res.studentId+'" AND resource = "SEARCH"';
          }
          mysqlService.query(qry)
          .then(function(response1){
            resolve("success");
          },function(err){  
            if (err) {
              var error = err;
              error.status = 503;
              return reject(error)
            };
          })
        },function(err){  
          if (err) {
            var error = err;
            error.status = 503;
            return reject(error)
          };
        });
      });
    }

    function updateStudentSearchCounter(res)
    {	
      return new Promise(function(resolve, reject) {
        let checkQuery = 'SELECT * FROM usage_statistics WHERE resource = "SEARCH" AND college_id = "'+res.collegeId+'"';
        mysqlService.query(checkQuery)
        .then(function(response){;
          let qry = "";
          if(response.length == 0){
            qry = 'INSERT INTO usage_statistics SET resource = "SEARCH", num_count = 1,student_id=0,college_id = "'+res.collegeId+'"';
          }else{
            qry = 'UPDATE usage_statistics SET num_count = num_count+1 WHERE college_id = "'+res.collegeId+'" AND resource = "SEARCH"';
          }
          mysqlService.query(qry)
          .then(function(response1){
            resolve("success");
          },function(err){  
            if (err) {
              var error = err;
              error.status = 503;
              return reject(error)
            };
          })
        },function(err){  
          if (err) {
            var error = err;
            error.status = 503;
            return reject(error)
          };
        });
      });
    }

    function superadminCollegeadd(collegeId){
      return new Promise(function(resolve, reject) {
        mysqlService.query('INSERT INTO usage_statistics SET college_id = "'+collegeId+'", resource = "SEARCH"')
        .then(function(response){
            resolve("success");
        },function(err){  
          if (err) {
            var error = err;
            error.status = 503;
            return reject(error)
          };
        });
      });
    }

    return {
      getCollegeContact: getCollegeContact,
      getFavoritedColleges: getFavoritedColleges,
      getSearches: getSearches,
      getViewsForStudent: getViewsForStudent,
      getSearchesForCollege: getSearchesForCollege,
      getFavCollegesForColleges: getFavCollegesForColleges,
      getCollegeViewStudent: getCollegeViewStudent,
      getCollegeViewPublic: getCollegeViewPublic,
      getSearchCollegesCount: getSearchCollegesCount,
      updateViewCounter:updateViewCounter,
      updateCollegeSearchCounter: updateCollegeSearchCounter,
      updateStudentSearchCounter:updateStudentSearchCounter,
      superadminCollegeadd:superadminCollegeadd
    }

  })();
  
module.exports = usagestatisticsService;