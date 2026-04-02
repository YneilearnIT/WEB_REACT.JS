const db = require('../db/knex'); // Đường dẫn gọi cấu hình knex

// 1. LẤY DANH SÁCH GAME ĐỂ HIỂN THỊ LÊN MÀN HÌNH CHÍNH
exports.getConfig = async (req, res) => {
  try {
    const configs = await db('games_config').select('*');
    res.json(configs);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy cấu hình game' });
  }
};

// 2. ADMIN BẬT/TẮT GAME
exports.updateConfig = async (req, res) => {
  try {
    const { id, enabled } = req.body;
    await db('games_config').where({ id }).update({ enabled });
    res.json({ message: 'Đã cập nhật trạng thái game' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// 3. LƯU ĐIỂM SAU MỖI VÁN CHƠI
exports.saveMatch = async (req, res) => {
  try {
    const { user_id, game_name, score, time_elapsed } = req.body;
    await db('matches').insert({ user_id, game_name, score, time_elapsed });
    res.json({ message: 'Lưu điểm thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lưu điểm' });
  }
};

// 4. LẤY DỮ LIỆU BẢNG XẾP HẠNG (CÓ BỘ LỌC)
exports.getRanking = async (req, res) => {
  try {
    const { user_id, scope, game } = req.query;
    
    // Câu query cơ bản: Nối bảng matches với users để lấy tên người chơi
    let query = db('matches')
      .join('users', 'matches.user_id', '=', 'users.id')
      .select('matches.id', 'users.username as player', 'matches.game_name as game', 'matches.score')
      .orderBy('matches.score', 'desc');

    // Lọc theo Game
    if (game && game !== 'ALL') {
      query = query.where('matches.game_name', game);
    }

    // Lọc theo Phạm vi (Cá nhân, Bạn bè, Toàn hệ thống)
    if (scope === 'PERSONAL') {
      query = query.where('matches.user_id', user_id);
    } else if (scope === 'FRIENDS') {
      // Tìm danh sách bạn bè đã Accept
      const friends = await db('friends')
        .where('status', 'accepted')
        .andWhere(function() {
          this.where('user_id_1', user_id).orWhere('user_id_2', user_id);
        });
      
      const friendIds = friends.map(f => f.user_id_1 == user_id ? f.user_id_2 : f.user_id_1);
      friendIds.push(user_id); // Cho phép xem cả điểm của chính mình trong bảng bạn bè
      
      query = query.whereIn('matches.user_id', friendIds);
    }

    const data = await query.limit(50); // Chỉ lấy Top 50 cho nhẹ
    res.json({ data });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi tải bảng xếp hạng' });
  }
};