const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Khởi tạo Knex kết nối với Database Supabase
const knexConfig = require('./knexfile');
const knex = require('knex')(knexConfig.development);

const app = express();

// Middleware
app.use(cors()); // Cho phép Frontend (port 5173) gọi API
app.use(express.json()); // Đọc dữ liệu JSON từ body request

const JWT_SECRET = process.env.JWT_SECRET || 'BiMatCuaBan2026';

// ==========================================
// RESTful API: ĐĂNG KÝ (REGISTER)
// ==========================================
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Backend Validation (Bảo mật 2 lớp)
    if (!username || !password || username.length < 3 || password.length < 6) {
      return res.status(400).json({ message: 'DỮ LIỆU ĐẦU VÀO KHÔNG HỢP LỆ' });
    }

    // Kiểm tra trùng lặp
    const existingUser = await knex('users').where({ username }).first();
    if (existingUser) {
      return res.status(400).json({ message: 'TÊN TÀI KHOẢN ĐÃ TỒN TẠI' });
    }

    // Mã hóa mật khẩu trước khi lưu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Lưu vào database Supabase
    await knex('users').insert({
      username,
      password: hashedPassword,
      role: 'CLIENT'
    });

    res.status(201).json({ message: 'ĐĂNG KÝ THÀNH CÔNG' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'LỖI MÁY CHỦ BACKEND' });
  }
});

// ==========================================
// RESTful API: ĐĂNG NHẬP (LOGIN)
// ==========================================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Tìm user trong database
    const user = await knex('users').where({ username }).first();
    
    // So sánh mật khẩu băm
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: 'SAI TÊN ĐĂNG NHẬP HOẶC MẬT KHẨU' });
    }

    // Cấp Token (Hết hạn sau 1 ngày)
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    
    // Trả dữ liệu về cho Frontend
    res.status(200).json({
      message: 'ĐĂNG NHẬP THÀNH CÔNG',
      token,
      user: { id: user.id, username: user.username, role: user.role }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'LỖI MÁY CHỦ BACKEND' });
  }
});

// ==========================================
// API: ĐÁNH GIÁ & BÌNH LUẬN GAME (RATING)
// ==========================================

// 1. API: Lưu đánh giá mới từ người chơi
app.post('/api/games/rating', async (req, res) => {
  try {
    const { user_id, game_name, rating, comment } = req.body;
    
    // Kiểm tra dữ liệu đầu vào
    if (!user_id || !game_name || !rating) {
      return res.status(400).json({ message: 'THIẾU THÔNG TIN ĐÁNH GIÁ' });
    }

    // Lưu vào database (bảng game_ratings)
    await knex('game_ratings').insert({
      user_id,
      game_name,
      rating: Number(rating),
      comment: comment || '' // Nếu không nhập comment thì lưu chuỗi rỗng
    });

    res.status(201).json({ message: 'LƯU ĐÁNH GIÁ THÀNH CÔNG' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'LỖI SERVER KHI LƯU ĐÁNH GIÁ' });
  }
});

// 2. API: Lấy danh sách đánh giá của một game (Dùng để hiển thị sau này nếu cần)
app.get('/api/games/rating/:game_name', async (req, res) => {
  try {
    const { game_name } = req.params;
    
    const ratings = await knex('game_ratings')
      .join('users', 'game_ratings.user_id', '=', 'users.id')
      .select(
        'game_ratings.id', 
        'users.username', 
        'game_ratings.rating', 
        'game_ratings.comment', 
        'game_ratings.created_at'
      )
      .where('game_ratings.game_name', game_name)
      .orderBy('game_ratings.created_at', 'desc'); // Mới nhất lên đầu
      
    res.status(200).json({ data: ratings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'LỖI LẤY DỮ LIỆU ĐÁNH GIÁ' });
  }
});

// 3. API: Lấy 10 đánh giá mới nhất toàn hệ thống (Dùng cho RatingPanel)
app.get('/api/games/ratings/latest', async (req, res) => {
  try {
    const ratings = await knex('game_ratings')
      .join('users', 'game_ratings.user_id', '=', 'users.id')
      .select(
        'game_ratings.id', 
        'users.username', 
        'game_ratings.game_name', 
        'game_ratings.rating', 
        'game_ratings.comment', 
        'game_ratings.created_at'
      )
      .orderBy('game_ratings.created_at', 'desc')
      .limit(10);
      
    res.status(200).json({ data: ratings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'LỖI LẤY ĐÁNH GIÁ MỚI NHẤT' });
  }
});

// ==========================================
// --- RANKING & MATCHES (XẾP HẠNG & LƯU ĐIỂM) ---
// ==========================================

// 1. API: LƯU ĐIỂM KHI CHƠI XONG (TỪ GAME CONSOLE)
app.post('/api/matches', async (req, res) => {
  try {
    const { user_id, game_name, score, time_elapsed } = req.body;
    await knex('matches').insert({ user_id, game_name, score, time_elapsed });
    res.status(201).json({ message: 'LƯU ĐIỂM THÀNH CÔNG' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'LỖI SERVER KHI LƯU ĐIỂM' });
  }
});

// 2. API: LẤY BẢNG XẾP HẠNG (CÓ LỌC THEO YÊU CẦU RUBRIC)
app.get('/api/ranking', async (req, res) => {
  try {
    const { user_id, scope, game } = req.query;
    
    // Câu query cơ bản lấy điểm và tên người chơi, sắp xếp giảm dần
    let query = knex('matches')
      .join('users', 'matches.user_id', '=', 'users.id')
      .select('matches.id', 'users.username as player', 'matches.game_name as game', 'matches.score')
      .orderBy('matches.score', 'desc');

    // LỌC THEO GAME (Bỏ qua nếu chọn ALL)
    if (game && game !== 'ALL') {
      query = query.where('matches.game_name', game);
    }

    // LỌC THEO PHẠM VI (Toàn hệ thống / Cá nhân / Bạn bè)
    if (scope === 'PERSONAL') {
      // Chỉ lấy điểm của chính mình
      query = query.where('matches.user_id', user_id);
    } else if (scope === 'FRIENDS') {
      // Tìm danh sách ID bạn bè đã kết bạn
      const friends = await knex('friends')
        .where({ status: 'accepted' })
        .andWhere(function() {
          this.where('user_id_1', user_id).orWhere('user_id_2', user_id);
        });
      
      // Gom ID của bạn bè và ID của bản thân vào một mảng
      const friendIds = friends.map(f => f.user_id_1 == user_id ? f.user_id_2 : f.user_id_1);
      friendIds.push(Number(user_id)); 
      
      // Chỉ lấy điểm của những người trong mảng này
      query = query.whereIn('matches.user_id', friendIds);
    }

    const data = await query;
    res.status(200).json({ data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'LỖI LẤY DỮ LIỆU RANKING' });
  }
});

// ==========================================
// --- ADMIN: QUẢN LÝ NGƯỜI DÙNG ---
// ==========================================

// 1. Lấy danh sách người dùng (kèm số ván đã chơi)
app.get('/api/admin/users', async (req, res) => {
  try {
    const usersList = await knex('users')
      .select('users.id', 'users.username', 'users.status', 'users.role')
      .count('matches.id as matches')
      .leftJoin('matches', 'users.id', 'matches.user_id')
      .where('users.role', 'CLIENT') // Chỉ lấy người chơi, không hiển thị Admin
      .groupBy('users.id')
      .orderBy('users.id', 'asc');
    
    res.status(200).json({ data: usersList });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'LỖI LẤY DANH SÁCH USER' });
  }
});

// 2. Cập nhật trạng thái Khóa / Mở khóa
app.put('/api/admin/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await knex('users').where({ id }).update({ status });
    res.status(200).json({ message: 'CẬP NHẬT THÀNH CÔNG' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'LỖI CẬP NHẬT TRẠNG THÁI' });
  }
});

// ==========================================
// --- API ĐỔI TÊN NGƯỜI DÙNG (PROFILE) ---
// ==========================================
app.put('/api/users/:id/name', async (req, res) => {
  try {
    const { id } = req.params;
    const { new_username } = req.body;

    if (!new_username || new_username.trim().length < 3) {
      return res.status(400).json({ message: 'TÊN KHÔNG HỢP LỆ (TỐI THIỂU 3 KÝ TỰ)' });
    }

    // Kiểm tra xem tên mới đã có ai xài chưa (trừ chính mình)
    const existing = await knex('users').where({ username: new_username.trim() }).whereNot({ id }).first();
    if (existing) {
      return res.status(400).json({ message: 'TÊN NÀY ĐÃ CÓ NGƯỜI SỬ DỤNG' });
    }

    // Cập nhật tên mới vào Database
    await knex('users').where({ id }).update({ username: new_username.trim() });
    res.status(200).json({ message: 'ĐỔI TÊN THÀNH CÔNG' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'LỖI CẬP NHẬT TÊN VÀO DATABASE' });
  }
});

// ==========================================
// --- API LẤY THÀNH TỰU NGƯỜI DÙNG (LƯU VÀO DB SUPABASE) ---
// ==========================================
app.get('/api/users/:id/achievements', async (req, res) => {
  try {
    const { id } = req.params;
    let newlyUnlockedIds = []; // Mảng chứa ID thành tựu vừa đạt được

    // 1. Kiểm tra TÂN THỦ SNAKE (ID: 10) - Đạt >= 20 điểm
    const snakeScore = await knex('matches')
      .where({ user_id: id, game_name: 'RẮN SĂN MỒI' })
      .where('score', '>=', 20)
      .first();
    if (snakeScore) newlyUnlockedIds.push(10);

    // 2. Kiểm tra CHIẾN THẦN CARO (ID: 11) - Thắng 2 ván liên tiếp
    const caroMatches = await knex('matches')
      .where({ user_id: id, game_name: 'CARO HÀNG 5' })
      .orderBy('created_at', 'asc');
      
    let currentStreak = 0;
    let maxStreak = 0;
    for (let match of caroMatches) {
      if (match.score === 100) { 
        currentStreak++;
        if (currentStreak > maxStreak) maxStreak = currentStreak;
      } else {
        currentStreak = 0; // Thua hoặc hòa là đứt chuỗi
      }
    }
    if (maxStreak >= 2) newlyUnlockedIds.push(11);

    // 3. Kiểm tra NGƯỜI CHƠI HỆ CHUYÊN CẦN (ID: 12) - Chơi 50 ván
    const matchCount = await knex('matches')
      .where({ user_id: id })
      .count('id as total')
      .first();
    if (parseInt(matchCount.total) >= 50) newlyUnlockedIds.push(12);

    // --- BẮT ĐẦU LƯU VÀO BẢNG user_achievements ---
    if (newlyUnlockedIds.length > 0) {
      // Tìm xem DB đã lưu những thành tựu nào cho user này rồi
      const existingUserAchs = await knex('user_achievements')
        .where({ user_id: id })
        .select('achievement_id');
      
      const existingIds = existingUserAchs.map(a => a.achievement_id);

      // Lọc ra các ID thành tựu MỚI (đạt được nhưng chưa có trong DB)
      const idsToInsert = newlyUnlockedIds.filter(achId => !existingIds.includes(achId));

      // Insert vào bảng user_achievements
      if (idsToInsert.length > 0) {
        const insertData = idsToInsert.map(achId => ({
          user_id: id,
          achievement_id: achId
        }));
        await knex('user_achievements').insert(insertData);
      }
    }

    // --- LẤY DỮ LIỆU TỪ DB TRẢ VỀ FRONTEND ---
    const userAchievements = await knex('user_achievements')
      .join('achievements', 'user_achievements.achievement_id', '=', 'achievements.id')
      .select(
        'achievements.id',
        'achievements.title as name',
        'achievements.description as desc'
      )
      .where('user_achievements.user_id', id);

    res.status(200).json({ data: userAchievements });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'LỖI LẤY THÀNH TỰU' });
  }
});

// ==========================================
// --- SOCIAL (FRIENDS & CHAT) ---
// ==========================================

// 1. API GỬI YÊU CẦU KẾT BẠN
app.post("/api/friends/add", async (req, res) => {
  try {
    const { user_id, friend_username } = req.body;
    const friend = await knex("users").where({ username: friend_username }).first();

    if (!friend) return res.status(404).json({ message: "KHÔNG TÌM THẤY TÀI KHOẢN!" });
    if (friend.id === user_id) return res.status(400).json({ message: "KHÔNG THỂ TỰ KẾT BẠN!" });
    if (friend.role === "ADMIN") return res.status(403).json({ message: "KHÔNG THỂ KẾT BẠN VỚI ADMIN!" });

    const existing = await knex("friends").where(function () {
      this.where({ user_id_1: user_id, user_id_2: friend.id })
          .orWhere({ user_id_1: friend.id, user_id_2: user_id });
    }).first();

    if (existing) {
      if (existing.status === "accepted") return res.status(400).json({ message: "ĐÃ LÀ BẠN BÈ TỪ TRƯỚC!" });
      else return res.status(400).json({ message: "ĐÃ GỬI LỜI MỜI RỒI!" });
    }

    await knex("friends").insert({ user_id_1: user_id, user_id_2: friend.id, status: "pending" });
    res.status(200).json({ message: "ĐÃ GỬI LỜI MỜI KẾT BẠN!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "LỖI SERVER!" });
  }
});

// 2. API LẤY DANH SÁCH BẠN BÈ ĐÃ KẾT BẠN
app.get("/api/friends/:user_id", async (req, res) => {
  const { user_id } = req.params;
  const data = await knex("friends")
    .join("users", function () {
      this.on("users.id", "=", "friends.user_id_2").andOn("friends.user_id_1", "=", knex.raw("?", [user_id]))
        .orOn("users.id", "=", "friends.user_id_1").andOn("friends.user_id_2", "=", knex.raw("?", [user_id]));
    })
    .select("users.id", "users.username")
    .where("friends.status", "accepted")
    .whereNot("users.id", user_id);
  res.json({ data });
});

// 3. API LẤY LỜI MỜI KẾT BẠN (ĐÃ FIX LỖI AMBIGUOUS COLUMN)
app.get("/api/friends/requests/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;
    const requests = await knex("friends")
      .join("users", "friends.user_id_1", "=", "users.id")
      .select("friends.id as request_id", "users.id as sender_id", "users.username")
      // FIX LỖI Ở ĐÂY: Phải chỉ định rõ 'friends.status' thay vì 'status' chung chung
      .where({ "friends.user_id_2": user_id, "friends.status": "pending" });
    res.json(requests);
  } catch (error) {
    console.error("Lỗi lấy lời mời:", error);
    res.status(500).json([]);
  }
});

// 4. API DUYỆT LỜI MỜI
app.put("/api/friends/accept", async (req, res) => {
  const { request_id } = req.body;
  await knex("friends").where({ id: request_id }).update({ status: "accepted" });
  res.json({ message: "OK" });
});

// 5. API XÓA BẠN (XÓA CẢ TIN NHẮN)
app.delete("/api/friends/:u_id/:f_id", async (req, res) => {
  const { u_id, f_id } = req.params;
  await knex("messages").where(function() { this.where({ sender_id: u_id, receiver_id: f_id }).orWhere({ sender_id: f_id, receiver_id: u_id }); }).del();
  await knex("friends").where(function() { this.where({ user_id_1: u_id, user_id_2: f_id }).orWhere({ user_id_1: f_id, user_id_2: u_id }); }).del();
  res.json({ message: "XÓA XONG" });
});

// 6. LẤY TIN NHẮN
app.get("/api/messages/:u1/:u2", async (req, res) => {
  const { u1, u2 } = req.params;
  const msgs = await knex("messages")
    .where(function () { this.where({ sender_id: u1, receiver_id: u2 }).orWhere({ sender_id: u2, receiver_id: u1 }); })
    .orderBy("created_at", "asc");
  res.json({ data: msgs });
});

// 7. GỬI TIN NHẮN
app.post("/api/messages", async (req, res) => {
  const { sender_id, receiver_id, content } = req.body;
  await knex("messages").insert({ sender_id, receiver_id, content });
  res.json({ message: "GỬI XONG" });
});

// --- ADMIN: QUẢN LÝ NGƯỜI DÙNG ---
app.get('/api/admin/users', async (req, res) => {
  try {
    const usersList = await knex('users').select('users.id', 'users.username', 'users.status', 'users.role').count('matches.id as matches').leftJoin('matches', 'users.id', 'matches.user_id').where('users.role', 'CLIENT').groupBy('users.id').orderBy('users.id', 'asc');
    res.status(200).json({ data: usersList });
  } catch (error) { res.status(500).json({ message: 'LỖI LẤY DANH SÁCH USER' }); }
});

app.put('/api/admin/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await knex('users').where({ id }).update({ status });
    res.status(200).json({ message: 'CẬP NHẬT THÀNH CÔNG' });
  } catch (error) { res.status(500).json({ message: 'LỖI CẬP NHẬT TRẠNG THÁI' }); }
});

// ==========================================
// KHỞI ĐỘNG SERVER
// ==========================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(` Server Backend RESTful API đang chạy tại cổng ${PORT}`);
});