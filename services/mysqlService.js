const mysqlService = (function () {
  const config = require('../config');
  const mysql = require('mysql');
  const Promise = require('promise');
  const pool = mysql.createPool({
    connectionLimit: 100,
    host: config.MYSQL_HOST,
    user: config.MYSQL_USERNAME,
    password: config.MYSQL_PASSWORD,
    database: config.MYSQL_DB,
  });

  const connection = mysql.createConnection({
    host: config.MYSQL_HOST,
    user: config.MYSQL_USERNAME,
    password: config.MYSQL_PASSWORD,
    database: config.MYSQL_DB,
    idleTimeoutMillis: 6000000,
    requestTimeout: 6000000,
    connectionTimeout: 6000000,
  });

  function query1(sql, params) {
    return new Promise(function (resolve, reject) {
      connection.query(sql, function (error, results, fields) {
        if (error) throw error;
        resolve(results);
      });
    });
  }

  function query(sql, params) {
    return new Promise(function (resolve, reject) {
      pool.getConnection(function (err, connection) {
        if (err) return reject(err);
        connection.query(sql, params, function (error, results, fields) {
          connection.release();
          if (error) return reject(error);
          resolve(results);
        });
      });
    });
  }

  return {
    query: query,
    query1: query1,
  };
})();

module.exports = mysqlService;
