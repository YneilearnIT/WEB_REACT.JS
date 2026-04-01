// File: server/db/migrations/xxxx_create_missing_tables.js

exports.up = function(knex) {
  return Promise.all([
    // TODO: Thiết kế bảng Đánh giá (reviews)
    knex.schema.createTable('reviews', table => {
      table.increments('id').primary();
      // Code tiếp ở đây... (Gợi ý: user_id, game_name, rating, comment)
    }),

    // TODO: Thiết kế bảng Kết bạn (friends)
    knex.schema.createTable('friends', table => {
      table.increments('id').primary();
      // Code tiếp ở đây... (Gợi ý: user_id_1, user_id_2, status)
    }),

    // TODO: Thiết kế bảng Tin nhắn (messages)
    knex.schema.createTable('messages', table => {
      table.increments('id').primary();
      // Code tiếp ở đây... (Gợi ý: sender_id, receiver_id, content)
    })
  ]);
};

exports.down = function(knex) {
  return Promise.all([
    knex.schema.dropTableIfExists('messages'),
    knex.schema.dropTableIfExists('friends'),
    knex.schema.dropTableIfExists('reviews')
  ]);
};