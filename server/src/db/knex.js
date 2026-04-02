const environment = process.env.NODE_ENV || 'development';
const config = require('../../knexfile.js')[environment]; // Trỏ ra file knexfile.js ở thư mục gốc
const knex = require('knex')(config);

module.exports = knex;