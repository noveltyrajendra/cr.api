const { errorWithCode } = require('../utils/errorHandler');
const { getCurrentDateInFormat } = require('../utils/momentUtility');
const mysqlService = require('./mysqlService');

const getAll = (query) => {
  return mysqlService.query(
    `SELECT id, name, type, sub_type as subType, description, url, item_id as itemId FROM student_profile_setting WHERE is_active = true AND type = '${query.type}'`
  );
};

const deleteAndCreateType = async (body, type) => {
  if (!type) throw errorWithCode('Type is required', 410);
  await mysqlService.query(
    `DELETE FROM student_profile_setting WHERE type = '${type}';`
  );
  const insertQueries = [];
  for (const setting of formatBodyToPascal(body)) {
    insertQueries.push(
      mysqlService.query(`INSERT INTO student_profile_setting SET ?`, setting)
    );
  }
};

function formatBodyToPascal(body) {
  return body.map((item) => {
    return {
      type: item.type ? item.type : null,
      name: item.name ? item.name : null,
      description: item.description ? item.description : null,
      url: item.url ? item.url : null,
      sub_type: item.subType ? item.subType : null,
      created_at: getCurrentDateInFormat(),
      item_id: item.itemId,
    };
  });
}

module.exports = {
  getAll,
  deleteAndCreateType,
};
