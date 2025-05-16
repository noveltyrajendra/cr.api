const mysqlService = require('../services/mysqlService');

const query = async (sql, params) => {
  return mysqlService.query(sql, params);
};

const createSelectPreparedStatement = (table, conditions, attributes = []) => {
  let basicQuery = `SELECT ${
    attributes.length ? attributes.join(',') : '*'
  } FROM ${table} WHERE `;
};

const findOne = async (tableName, queries, attributes = [], conditions) => {
  // const andConditions = [];
  // const orConditions = [];
  // for (const query in conditions.and) {
  //   andConditions.push(`${query} = '${queries[query]}'`);
  // }

  // for (const query in conditions.or) {
  //   orConditions.push(`${query} = '${queries[query]}'`);
  // }

  const queryConditions = [];
  for (const query in queries) {
    queryConditions.push(`${query} = '${queries[query]}'`);
  }
  let query = `SELECT ${
    attributes.length ? attributes.join(', ') : '*'
  } FROM ${tableName} WHERE ${queryConditions.join(' AND ')}`;
  return mysqlService.query(query);
};

const findAll = async (
  tableName,
  queries,
  attributes,
  conditions = { and: [], or: [] }
) => {
  const { limit = 10, offset = 0, ...remQueries } = queries;
  const queryConditions = [];
  for (const query of remQueries) {
    queryConditions.push(`${query} = '${remQueries[query]}'`);
  }
  let query = `SELECT ${attributes.join(
    ', '
  )} FROM ${tableName} WHERE ${queryConditions.join(' AND ')}`;
  if (limit) query += ` LIMIT${offset},${limit}`;
};

// const create = async (tableName, body) => {
//   const isMultiple = Array.isArray(body);
//   const attributes = isMultiple ? Object.keys(body[0]) : Object.keys(body);
//   let query = `INSERT INTO ${tableName} (${attributes.join(', ')}) VALUES`;
//   if (isMultiple) {
//     const values = [];
//     for (const field of body) {
//       const value = [];
//       for (const attr of attributes) {
//         value.push(`'${body[attributes[attr]]}'`);
//       }
//       values.push(` (${value.join(', ')}) `);
//     }
//     query += ` ${values.join(', ')} `;
//   } else {
//     const value = [];
//     for (const attr of attributes) {
//       value.push(`'${body[attr]}'`);
//     }
//     query += ` (${value.join(', ')}) `;
//   }
//   return mysqlService.query(query);
// };

const preparedFindAll = async (table, query) => {
  return mysqlService.query(createSelectPreparedStatement(table), [query]);
};

const preparedCreate = async (preparedStatement, body) => {
  return mysqlService.query(preparedStatement, body);
};

module.exports = {
  query,
  findOne,
  findAll,
  preparedCreate,
  preparedFindAll,
};
