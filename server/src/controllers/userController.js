const knex = require('../config/db');

exports.updateName = async (req, res) => {
  try {
    const { id } = req.params;
    const { new_username } = req.body;
    if (!new_username || new_username.trim().length < 3) return res.status(400).json({ message: 'TÊN TỐI THIỂU 3 KÝ TỰ' });

    const existing = await knex('users').where({ username: new_username.trim() }).whereNot({ id }).first();
    if (existing) return res.status(400).json({ message: 'TÊN ĐÃ CÓ NGƯỜI DÙNG' });

    await knex('users').where({ id }).update({ username: new_username.trim() });
    res.status(200).json({ message: 'ĐỔI TÊN THÀNH CÔNG' });
  } catch (error) { res.status(500).json({ message: 'LỖI SERVER' }); }
};

exports.saveRating = async (req, res) => {
  try {
    const { user_id, game_name, rating, comment } = req.body;
    await knex('game_ratings').insert({ user_id, game_name, rating: Number(rating), comment: comment || '' });
    res.status(201).json({ message: 'LƯU ĐÁNH GIÁ THÀNH CÔNG' });
  } catch (error) { res.status(500).json({ message: 'LỖI SERVER' }); }
};

exports.getLatestRatings = async (req, res) => {
  try {
    const ratings = await knex('game_ratings').join('users', 'game_ratings.user_id', '=', 'users.id')
      .select('game_ratings.id', 'users.username', 'game_ratings.game_name', 'game_ratings.rating', 'game_ratings.comment', 'game_ratings.created_at')
      .orderBy('game_ratings.created_at', 'desc').limit(10);
    res.status(200).json({ data: ratings });
  } catch (error) { res.status(500).json({ message: 'LỖI LẤY ĐÁNH GIÁ' }); }
};

// Lấy danh sách thành tựu của 1 user
exports.getUserAchievements = async (req, res) => {
  try {
    const { user_id } = req.params;
    const data = await knex("user_achievements").join("achievements", "user_achievements.achievement_id", "=", "achievements.id")
      .select("achievements.*").where("user_achievements.user_id", user_id);
    res.status(200).json({ data });
  } catch (error) { res.status(500).json({ message: "LỖI LẤY THÀNH TỰU" }); }
};