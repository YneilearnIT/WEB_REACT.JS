const bcrypt = require('bcrypt');

exports.seed = async function(knex) {
  // Lệnh này giúp xóa sạch dữ liệu cũ VÀ reset bộ đếm ID tự động về 1
  await knex.raw('TRUNCATE TABLE users RESTART IDENTITY CASCADE');
  
  const adminPassword = await bcrypt.hash('admin', 10);
  const playerPassword = await bcrypt.hash('123456', 10);
  
  // Không ghi cứng id: 1 hay id: 2 nữa, để PostgreSQL tự động cấp phát
  await knex('users').insert([
    { username: 'admin', password: adminPassword, role: 'ADMIN' },
    { username: 'player1', password: playerPassword, role: 'CLIENT' }
  ]);
};