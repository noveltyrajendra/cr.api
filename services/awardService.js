let awardService = (function () {
  let mysqlService = require('./mysqlService');
  let awardConstant = require('../constants/awardConstant');
  let awardModel = require('../models/awardModel');

  function getAward() {
    return new Promise(function (resolve, reject) {
      mysqlService.query(awardConstant.GET_ALL_AWARD_QUERY).then(
        function (response) {
          resolve(awardModel(response));
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

  async function getAwardByTitle(title) {
    return awardModel(
      await mysqlService.query(awardConstant.GET_ALL_AWARD_TITLE_QUERY, [title])
    );
  }

  return {
    getAward: getAward,
    getAwardByTitle: getAwardByTitle,
  };
})();

module.exports = awardService;
