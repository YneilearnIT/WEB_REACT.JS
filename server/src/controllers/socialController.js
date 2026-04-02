const knex = require('../config/db');

exports.addFriend = async (req, res) => {
  try {
    const { user_id, friend_username } = req.body;
    const sender = await knex("users").where({ id: user_id }).first();
    if (sender && sender.role === "ADMIN") return res.status(403).json({ message: "ADMIN KHÔNG THỂ KẾT BẠN!" });

    const friend = await knex("users").where({ username: friend_username.trim() }).first();
    if (!friend || friend.role === "ADMIN") return res.status(404).json({ message: "KHÔNG TÌM THẤY TÀI KHOẢN!" });
    if (friend.id === user_id) return res.status(400).json({ message: "KHÔNG THỂ TỰ KẾT BẠN!" });

    const existing = await knex("friends").where(function () {
      this.where({ user_id_1: user_id, user_id_2: friend.id }).orWhere({ user_id_1: friend.id, user_id_2: user_id });
    }).first();

    if (existing) {
      if (existing.status === "accepted") return res.status(400).json({ message: "ĐÃ LÀ BẠN BÈ TỪ TRƯỚC!" });
      else return res.status(400).json({ message: "ĐÃ GỬI LỜI MỜI RỒI!" });
    }

    await knex("friends").insert({ user_id_1: user_id, user_id_2: friend.id, status: "pending" });
    res.status(200).json({ message: "ĐÃ GỬI LỜI MỜI KẾT BẠN!" });
  } catch (error) { res.status(500).json({ message: "LỖI SERVER!" }); }
};

exports.getFriends = async (req, res) => {
  const { user_id } = req.params;
  const data = await knex("friends").join("users", function () {
    this.on("users.id", "=", "friends.user_id_2").andOn("friends.user_id_1", "=", knex.raw("?", [user_id]))
      .orOn("users.id", "=", "friends.user_id_1").andOn("friends.user_id_2", "=", knex.raw("?", [user_id]));
  }).select("users.id", "users.username").where("friends.status", "accepted").whereNot("users.id", user_id);
  res.json({ data });
};

exports.getRequests = async (req, res) => {
  const { user_id } = req.params;
  const requests = await knex("friends").join("users", "friends.user_id_1", "=", "users.id")
    .select("friends.id as request_id", "users.id as sender_id", "users.username")
    .where({ "friends.user_id_2": user_id, "friends.status": "pending" });
  res.json(requests);
};

exports.acceptRequest = async (req, res) => {
  const { request_id } = req.body;
  await knex("friends").where({ id: request_id }).update({ status: "accepted" });
  res.json({ message: "OK" });
};

exports.removeFriend = async (req, res) => {
  const { u_id, f_id } = req.params;
  await knex("messages").where(function() { this.where({ sender_id: u_id, receiver_id: f_id }).orWhere({ sender_id: f_id, receiver_id: u_id }); }).del();
  await knex("friends").where(function() { this.where({ user_id_1: u_id, user_id_2: f_id }).orWhere({ user_id_1: f_id, user_id_2: u_id }); }).del();
  res.json({ message: "XÓA XONG" });
};

exports.getMessages = async (req, res) => {
  const { u1, u2 } = req.params;
  const msgs = await knex("messages").where(function () {
    this.where({ sender_id: u1, receiver_id: u2 }).orWhere({ sender_id: u2, receiver_id: u1 });
  }).orderBy("created_at", "asc");
  res.json({ data: msgs });
};

exports.sendMessage = async (req, res) => {
  const { sender_id, receiver_id, content } = req.body;
  await knex("messages").insert({ sender_id, receiver_id, content });
  res.json({ message: "GỬI XONG" });
};