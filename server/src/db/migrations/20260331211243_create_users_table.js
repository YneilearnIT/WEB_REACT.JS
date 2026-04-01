exports.up = function(knex) {
  return knex.schema.createTable('users', table => {
    table.increments('id').primary(); // ID tự tăng
    table.string('username').notNullable().unique(); // Tên tài khoản (duy nhất)
    table.string('password').notNullable(); // Mật khẩu (sẽ được mã hóa)
    table.string('role').defaultTo('CLIENT'); // Quyền: ADMIN hoặc CLIENT
    table.timestamps(true, true); // Thời gian tạo/cập nhật
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('users');
};