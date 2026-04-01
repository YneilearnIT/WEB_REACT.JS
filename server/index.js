const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const knexConfig = require('./knexfile');
const knex = require('knex')(knexConfig.development);

const app = express();

app.use(cors()); 
app.use(express.json()); 

const JWT_SECRET = process.env.JWT_SECRET || 'BiMatCuaBan2026';

// --- BIẾN LƯU TRỮ CẤU HÌNH GAME TRÊN RAM CỦA SERVER ---
let globalGamesConfig = [
  { id: 'CARO_5', name: 'CARO HÀNG 5', enabled: true, size: 10 },
  { id: 'CARO_4', name: 'CARO HÀNG 4', enabled: true, size: 10 },
  { id: 'TICTACTOE', name: 'TIC-TAC-TOE', enabled: true, size: 3 },
  { id: 'DRAWING', name: 'BẢNG VẼ TỰ DO', enabled: true, size: 15 },
  { id: 'MEMORY', name: 'CỜ TRÍ NHỚ', enabled: true, size: 4 },
  { id: 'SNAKE', name: 'RẮN SĂN MỒI', enabled: true, size: 15 },
  { id: 'MATCH3', name: 'GHÉP HÀNG 3', enabled: true, size: 8 }
];

// ==========================================
// MIDDLEWARE BẢO MẬT
// ==========================================
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; 
  if (!token) return res.status(401).json({ message: 'VUI LÒNG ĐĂNG NHẬP (Thiếu Token)' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'TOKEN KHÔNG HỢP LỆ HOẶC ĐÃ HẾT HẠN' });
    req.user = user; 
    next();
  });
};

const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'TRUY CẬP BỊ TỪ CHỐI' });
    }
    next();
  });
};

// ==========================================
// API: CẤU HÌNH GAME (CHO PHÉP CROSS-DEVICE)
// ==========================================
// Mọi người (Client) đều được lấy danh sách cấu hình
app.get('/api/games/config', (req, res) => {
  res.status(200).json(globalGamesConfig);
});

// Chỉ Admin mới được lưu cấu hình mới
app.put('/api/admin/games/config', verifyAdmin, (req, res) => {
  const { config } = req.body;
  if (config && Array.isArray(config)) {
    globalGamesConfig = config;
    res.status(200).json({ message: 'ĐÃ LƯU CẤU HÌNH LÊN SERVER' });
  } else {
    res.status(400).json({ message: 'DỮ LIỆU KHÔNG HỢP LỆ' });
  }
});

// ==========================================
// API: ĐĂNG KÝ / ĐĂNG NHẬP
// ==========================================
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password || username.length < 3 || password.length < 6) return res.status(400).json({ message: 'DỮ LIỆU KHÔNG HỢP LỆ' });
    const existingUser = await knex('users').where({ username }).first();
    if (existingUser) return res.status(400).json({ message: 'TÊN TÀI KHOẢN ĐÃ TỒN TẠI' });
    const hashedPassword = await bcrypt.hash(password, 10);
    await knex('users').insert({ username, password: hashedPassword, role: 'CLIENT' });
    res.status(201).json({ message: 'ĐĂNG KÝ THÀNH CÔNG' });
  } catch (error) { res.status(500).json({ message: 'LỖI SERVER' }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await knex('users').where({ username }).first();
    if (!user || !(await bcrypt.compare(password, user.password))) return res.status(400).json({ message: 'SAI THÔNG TIN' });
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    res.status(200).json({ message: 'ĐĂNG NHẬP THÀNH CÔNG', token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (error) { res.status(500).json({ message: 'LỖI SERVER' }); }
});

// ==========================================
// API: LƯU ĐIỂM & TIẾN TRÌNH GAME
// ==========================================
app.post('/api/matches', verifyToken, async (req, res) => {
  try {
    const { game_name, score, time_elapsed } = req.body;
    await knex('matches').insert({ user_id: req.user.id, game_name, score, time_elapsed, created_at: new Date() });
    res.status(201).json({ message: 'ĐÃ LƯU ĐIỂM' });
  } catch (error) { res.status(500).json({ message: 'LỖI SERVER' }); }
});

app.post('/api/saved_games', verifyToken, async (req, res) => {
  try {
    const user_id = req.user.id;
    const game_state = JSON.stringify(req.body.game_state);
    const existingSave = await knex('saved_games').where({ user_id }).first();
    if (existingSave) await knex('saved_games').where({ user_id }).update({ game_state, updated_at: new Date() });
    else await knex('saved_games').insert({ user_id, game_state, updated_at: new Date() });
    res.status(200).json({ message: 'ĐÃ LƯU TIẾN TRÌNH' });
  } catch (error) { res.status(500).json({ message: 'LỖI SERVER' }); }
});

app.get('/api/saved_games', verifyToken, async (req, res) => {
  try {
    const savedData = await knex('saved_games').where({ user_id: req.user.id }).first();
    if (!savedData) return res.status(404).json({ message: 'CHƯA CÓ BẢN LƯU' });
    res.status(200).json({ game_state: JSON.parse(savedData.game_state) });
  } catch (error) { res.status(500).json({ message: 'LỖI SERVER' }); }
});

// ==========================================
// API: QUẢN TRỊ ADMIN
// ==========================================
app.get('/api/admin/stats', verifyAdmin, async (req, res) => {
  try {
    const totalUsers = await knex('users').count('id as count').first();
    res.status(200).json({ users_count: totalUsers.count, reviews_count: 0 }); 
  } catch (error) { res.status(500).json({ message: 'LỖI THỐNG KÊ' }); }
});

app.get('/api/admin/users', verifyAdmin, async (req, res) => {
  try {
    const users = await knex('users').select('id', 'username', 'role', 'created_at').orderBy('created_at', 'desc');
    res.status(200).json(users);
  } catch (error) { res.status(500).json({ message: 'LỖI LẤY DANH SÁCH' }); }
});

app.put('/api/admin/users/:id/role', verifyAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['ADMIN', 'CLIENT'].includes(role.toUpperCase())) return res.status(400).json({ message: 'QUYỀN KHÔNG HỢP LỆ' });
    await knex('users').where({ id: req.params.id }).update({ role: role.toUpperCase(), updated_at: new Date() });
    res.status(200).json({ message: 'ĐÃ CẬP NHẬT QUYỀN' });
  } catch (error) { res.status(500).json({ message: 'LỖI CẬP NHẬT QUYỀN' }); }
});

app.delete('/api/admin/users/:id', verifyAdmin, async (req, res) => {
  try {
    if (req.user.id == req.params.id) return res.status(400).json({ message: 'KHÔNG THỂ TỰ XÓA MÌNH' });
    await knex('users').where({ id: req.params.id }).del();
    res.status(200).json({ message: 'ĐÃ XÓA NGƯỜI DÙNG' });
  } catch (error) { res.status(500).json({ message: 'LỖI XÓA NGƯỜI DÙNG' }); }
});

const PORT = process.env.PORT || 5000;
// Lắng nghe trên 0.0.0.0 để các máy khác trong mạng LAN có thể gọi API
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server Backend RESTful API đang chạy tại cổng ${PORT}`);
});