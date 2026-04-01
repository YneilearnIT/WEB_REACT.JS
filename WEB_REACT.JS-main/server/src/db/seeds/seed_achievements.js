exports.seed = async function(knex) {
  // Xóa dữ liệu cũ để tránh trùng lặp
  await knex('user_achievements').del();
  await knex('achievements').del();

  // Thêm danh mục thành tựu
  await knex('achievements').insert([
    {
      title: 'Tân thủ Snake',
      description: 'Đạt 100 điểm trong trò chơi Rắn săn mồi',
      game_category: 'snake',
      condition_type: 'score',
      condition_value: 100,
      icon_url: 'https://cdn-icons-png.flaticon.com/512/528/528105.png'
    },
    {
      title: 'Chiến thần Caro',
      description: 'Thắng 10 trận Caro liên tiếp',
      game_category: 'caro_5',
      condition_type: 'win_streak',
      condition_value: 10,
      icon_url: 'https://cdn-icons-png.flaticon.com/512/1021/1021264.png'
    },
    {
      title: 'Người chơi hệ chuyên cần',
      description: 'Tham gia tổng cộng 50 ván đấu',
      game_category: 'general',
      condition_type: 'play_count',
      condition_value: 50,
      icon_url: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
    }
  ]);
};