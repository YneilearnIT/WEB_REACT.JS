exports.up = function(knex) {
  return knex.schema.createTable('games_config', table => {
    table.string('id').primary(); // ID của game (VD: CARO_5, SNAKE...)
    table.string('name').notNullable(); // Tên hiển thị của game
    table.boolean('enabled').defaultTo(true); // Trạng thái mở/khóa game
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('games_config');
};