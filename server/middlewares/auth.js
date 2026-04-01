// server/middleware/auth.js
const jwt = require('jsonwebtoken');

// Middleware kiểm tra xem đã đăng nhập chưa
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).json({ error: 'Không tìm thấy token xác thực.' });

  try {
    // Tách chữ "Bearer " ra khỏi token
    const decoded = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET);
    req.user = decoded; // Lưu thông tin user vào request
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn.' });
  }
};

// Middleware kiểm tra quyền Admin
const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role === 'admin') {
      next();
    } else {
      res.status(403).json({ error: 'Bạn không có quyền truy cập chức năng này (Yêu cầu Admin).' });
    }
  });
};

module.exports = { verifyToken, verifyAdmin };