require('dotenv').config();

module.exports = {
  development: {
    client: 'pg',
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false } // BẮT BUỘC PHẢI CÓ
    },
    migrations: { directory: './src/db/migrations' },
    seeds: { directory: './src/db/seeds' }
  }
};