const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'BiMatCuaBan2026';

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(403).json({ message: 'CHƯA CÓ TOKEN' });
  
  const token = authHeader.split(' ')[1];
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'TOKEN HẾT HẠN' });
    req.user = decoded;
    next();
  });
};

const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ message: 'CẦN QUYỀN ADMIN' });
    next();
  });
};

module.exports = { verifyToken, verifyAdmin };