// file: [timestamp]_create_achievements_tables.js

exports.up = function(knex) {
  return knex.schema
    // 1. Tạo bảng danh mục Thành tựu (achievements)
    .createTable('achievements', function (table) {
      table.increments('id').primary(); // ID tự tăng
      table.string('title', 255).notNullable(); // Tên thành tựu (VD: "Chuỗi thắng 10")
      table.text('description'); // Mô tả điều kiện đạt được
      table.string('game_category', 50); // Phân loại game (VD: 'caro_5', 'snake', 'general')
      table.string('condition_type', 50).notNullable(); // Loại điều kiện (VD: 'win_count', 'score', 'play_count')
      table.integer('condition_value').notNullable(); // Mốc cần đạt (VD: 10, 500, 100)
      table.string('icon_url'); // Đường dẫn ảnh icon (tuỳ chọn để UI đẹp hơn)
      table.timestamps(true, true); // created_at, updated_at
    })
    
    // 2. Tạo bảng Quản lý Thành tựu của Người dùng (user_achievements)
    .createTable('user_achievements', function (table) {
      table.increments('id').primary();
      
      // Khoá ngoại liên kết với bảng users (đã có sẵn trong DB của bạn)
      table.integer('user_id').unsigned().notNullable()
           .references('id').inTable('users').onDelete('CASCADE');
           
      // Khoá ngoại liên kết với bảng achievements
      table.integer('achievement_id').unsigned().notNullable()
           .references('id').inTable('achievements').onDelete('CASCADE');
           
      table.timestamp('unlocked_at').defaultTo(knex.fn.now()); // Thời điểm mở khoá
      
      // Đảm bảo 1 user chỉ nhận 1 thành tựu cụ thể 1 lần duy nhất
      table.unique(['user_id', 'achievement_id']); 
    });
};

exports.down = function(knex) {
  // Thứ tự drop phải ngược lại với lúc tạo để tránh lỗi khoá ngoại
  return knex.schema
    .dropTableIfExists('user_achievements')
    .dropTableIfExists('achievements');
};