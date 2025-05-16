let rankService = (function() {
  
    let mysqlService=require('./mysqlService');
    let rankConstant=require('../constants/rankConstant');
    let rankModel =require('../models/rankModel');
  
    function getrankByBranch(id)
    {	
      return new Promise(function(resolve, reject) {
        mysqlService.query(rankConstant.GET_RANK_BY_BRANCH_QUERY,id)
           .then(function(response){
               resolve(rankModel(response));	
             },function(err){  
               if (err) {
                 var error = err;
                error.status = 503;
                 return reject(error)
               };
            });
        });
    }	

    function getrankInfo(id)
    {	
      return new Promise(function(resolve, reject) {
        mysqlService.query(rankConstant.GET_RANK_BY_INFO_QUERY,id)
           .then(function(response){
               resolve(rankModel(response));	
             },function(err){  
               if (err) {
                 var error = err;
                error.status = 503;
                 return reject(error)
               };
            });
        });
    }	

    function getCollegerankList()
    {	
      return new Promise(function(resolve, reject) {
        mysqlService.query("select * from college_ranks where status='active' order by id")
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
  
    return {
      getrankByBranch: getrankByBranch,
      getrankInfo: getrankInfo,
      getCollegerankList: getCollegerankList
    }
  
  })();
  
  module.exports = rankService;