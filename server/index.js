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
// KHỞI ĐỘNG SERVER
// ==========================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(` Server Backend RESTful API đang chạy tại cổng ${PORT}`);
});