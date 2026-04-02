const knex = require('../config/db');

exports.getStats = async (req, res) => {
  try {
    const totalUsers = await knex('users').count('id as count').first();
    const totalMatches = await knex('matches').count('id as count').first();
    const hotGame = await knex('matches').select('game_name').count('id as play_count').groupBy('game_name').orderBy('play_count', 'desc').first();
    res.status(200).json({ users_count: totalUsers.count || 0, matches_count: totalMatches.count || 0, hot_game: hotGame ? hotGame.game_name : 'Chưa có' }); 
  } catch (error) { res.status(500).json({ message: 'LỖI THỐNG KÊ' }); }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await knex('users').select('id', 'username', 'role', 'created_at').orderBy('created_at', 'desc');
    res.status(200).json(users);
  } catch (error) { res.status(500).json({ message: 'LỖI LẤY DANH SÁCH' }); }
};

exports.updateRole = async (req, res) => {
  try {
    await knex('users').where({ id: req.params.id }).update({ role: req.body.role.toUpperCase() });
    res.status(200).json({ message: 'ĐÃ CẬP NHẬT QUYỀN' });
  } catch (error) { res.status(500).json({ message: 'LỖI CẬP NHẬT' }); }
};

exports.deleteUser = async (req, res) => {
  try {
    if (req.user.id == req.params.id) return res.status(400).json({ message: 'KHÔNG THỂ TỰ XÓA MÌNH' });
    await knex('matches').where({ user_id: req.params.id }).del();
    await knex('user_achievements').where({ user_id: req.params.id }).del();
    await knex('saved_games').where({ user_id: req.params.id }).del();
    await knex('game_ratings').where({ user_id: req.params.id }).del(); 
    await knex('users').where({ id: req.params.id }).del();
    res.status(200).json({ message: 'ĐÃ XÓA NGƯỜI DÙNG' });
  } catch (error) { res.status(500).json({ message: 'LỖI XÓA NGƯỜI DÙNG' }); }
};

exports.deleteRating = async (req, res) => {
  try {
    await knex('game_ratings').where({ id: req.params.id }).del();
    res.status(200).json({ message: 'ĐÃ XÓA BÌNH LUẬN' });
  } catch (error) { res.status(500).json({ message: 'LỖI XÓA BÌNH LUẬN' }); }
};