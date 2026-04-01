// File: server/db/migrations/20260401041137_create_missing_tables.js

exports.up = async function(knex) {
  // 1. Kiểm tra và tạo bảng Kết bạn (friends)
  const hasFriends = await knex.schema.hasTable('friends');
  if (!hasFriends) {
    await knex.schema.createTable('friends', table => {
      table.increments('id').primary();
      table.integer('user_id_1').references('id').inTable('users').onDelete('CASCADE');
      table.integer('user_id_2').references('id').inTable('users').onDelete('CASCADE');
      table.string('status').defaultTo('pending');
      table.timestamps(true, true);
    });
  }

  // 2. Kiểm tra và tạo bảng Tin nhắn (messages)
  const hasMessages = await knex.schema.hasTable('messages');
  if (!hasMessages) {
    await knex.schema.createTable('messages', table => {
      table.increments('id').primary();
      table.integer('sender_id').references('id').inTable('users').onDelete('CASCADE');
      table.integer('receiver_id').references('id').inTable('users').onDelete('CASCADE');
      table.text('content');
      table.timestamps(true, true);
    });
  }

  // 3. Kiểm tra và tạo bảng Đánh giá game (game_ratings)
  // (Đổi tên từ 'reviews' thành 'game_ratings' để khớp với API gọi trong Backend)
  const hasRatings = await knex.schema.hasTable('game_ratings');
  if (!hasRatings) {
    await knex.schema.createTable('game_ratings', table => {
      table.increments('id').primary();
      table.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.string('game_name');
      table.integer('rating');
      table.text('comment');
      table.timestamps(true, true);
    });
  }

  // 4. Kiểm tra và tạo bảng Xếp hạng điểm (matches)
  const hasMatches = await knex.schema.hasTable('matches');
  if (!hasMatches) {
    await knex.schema.createTable('matches', table => {
      table.increments('id').primary();
      table.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.string('game_name');
      table.integer('score');
      table.integer('time_elapsed');
      table.timestamps(true, true);
    });
  }
};

exports.down = async function(knex) {
  // Thứ tự drop phải ngược lại với lúc tạo để không bị kẹt khóa ngoại (foreign key)
  await knex.schema.dropTableIfExists('matches');
  await knex.schema.dropTableIfExists('game_ratings');
  await knex.schema.dropTableIfExists('messages');
  await knex.schema.dropTableIfExists('friends');
};