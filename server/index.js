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

// File: server/index.js

// ==========================================
// VỎ RỖNG API: ĐÁNH GIÁ & BÌNH LUẬN
// ==========================================
app.post('/api/reviews', async (req, res) => {
  // TODO: Viết logic nhận { user_id, game_name, rating, comment } từ req.body và lưu vào db
  res.status(501).json({ message: 'Chức năng đang được phát triển' });
});

app.get('/api/reviews/:game_name', async (req, res) => {
  // TODO: Viết logic query bảng reviews theo game_name và trả về danh sách
  res.status(501).json({ message: 'Chức năng đang được phát triển' });
});

// ==========================================
// VỎ RỖNG API: KẾT BẠN
// ==========================================
app.post('/api/friends/add', async (req, res) => {
  // TODO: Viết logic nhận { user_id_1, user_id_2 } và lưu trạng thái PENDING
  res.status(501).json({ message: 'Chức năng đang được phát triển' });
});

app.get('/api/friends/:user_id', async (req, res) => {
  // TODO: Viết logic lấy danh sách bạn bè đã kết bạn của user_id
  res.status(501).json({ message: 'Chức năng đang được phát triển' });
});

// ==========================================
// VỎ RỖNG API: CHAT (NHẮN TIN)
// ==========================================
app.post('/api/messages', async (req, res) => {
  // TODO: Viết logic nhận { sender_id, receiver_id, content } và lưu vào db
  res.status(501).json({ message: 'Chức năng đang được phát triển' });
});

app.get('/api/messages/:user1/:user2', async (req, res) => {
  // TODO: Viết logic lấy lịch sử tin nhắn giữa 2 người
  res.status(501).json({ message: 'Chức năng đang được phát triển' });
});

// ==========================================
// VỎ RỖNG API: THỐNG KÊ ADMIN (DỮ LIỆU THẬT)
// ==========================================
app.get('/api/admin/stats', async (req, res) => {
  // TODO: Viết lệnh knex đếm tổng số user, tổng số matches, ...
  res.status(501).json({ message: 'Chức năng đang được phát triển' });
});

// ==========================================
// KHỞI ĐỘNG SERVER
// ==========================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(` Server Backend RESTful API đang chạy tại cổng ${PORT}`);
});