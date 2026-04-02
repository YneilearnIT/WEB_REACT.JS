const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const knex = require('../config/db');
const JWT_SECRET = process.env.JWT_SECRET || 'BiMatCuaBan2026';

exports.register = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password || username.length < 3 || password.length < 6) 
      return res.status(400).json({ message: 'DỮ LIỆU KHÔNG HỢP LỆ' });

    const existingUser = await knex('users').where({ username }).first();
    if (existingUser) return res.status(400).json({ message: 'TÊN ĐÃ TỒN TẠI' });

    const hashedPassword = await bcrypt.hash(password, 10);
    await knex('users').insert({ username, password: hashedPassword, role: 'CLIENT' });
    res.status(201).json({ message: 'ĐĂNG KÝ THÀNH CÔNG' });
  } catch (error) { res.status(500).json({ message: 'LỖI SERVER' }); }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await knex('users').where({ username }).first();
    
    if (!user || !(await bcrypt.compare(password, user.password))) 
      return res.status(400).json({ message: 'SAI THÔNG TIN' });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    res.status(200).json({ message: 'OK', token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (error) { res.status(500).json({ message: 'LỖI SERVER' }); }
};