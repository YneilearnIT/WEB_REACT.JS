exports.seed = async function(knex) {
  // 1. Kiểm tra xem bảng games_config có tồn tại không
  const hasTable = await knex.schema.hasTable('games_config');
  
  if (hasTable) {
    // 2. Xóa sạch dữ liệu cũ
    await knex('games_config').del();
    
    // 3. Nạp lại đủ 7 game
    await knex('games_config').insert([
      { id: 'CARO_5', name: 'CARO HÀNG 5', enabled: true },
      { id: 'CARO_4', name: 'CARO HÀNG 4', enabled: true },
      { id: 'TICTACTOE', name: 'TIC-TAC-TOE', enabled: true },
      { id: 'DRAWING', name: 'BẢNG VẼ TỰ DO', enabled: true },
      { id: 'SNAKE', name: 'RẮN SĂN MỒI', enabled: true },
      { id: 'MATCH3', name: 'GHÉP HÀNG 3', enabled: true },
      { id: 'MEMORY', name: 'CỜ TRÍ NHỚ', enabled: true }
    ]);
    console.log("Đã nạp dữ liệu games_config thành công!");
  } else {
    console.log("Bảng games_config chưa tồn tại, hãy chạy migration trước!");
  }
};