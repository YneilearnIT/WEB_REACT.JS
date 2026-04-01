const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const knexConfig = require("./knexfile");
const knex = require("knex")(knexConfig.development);
const app = express();

app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "BiMatCuaBan2026";

// ==========================================
// API XÁC THỰC (AUTH)
// ==========================================
app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password || username.length < 3 || password.length < 6) {
      return res.status(400).json({ message: "DỮ LIỆU ĐẦU VÀO KHÔNG HỢP LỆ" });
    }
    const existingUser = await knex("users").where({ username }).first();
    if (existingUser)
      return res.status(400).json({ message: "TÊN TÀI KHOẢN ĐÃ TỒN TẠI" });

    const hashedPassword = await bcrypt.hash(password, 10);
    await knex("users").insert({
      username,
      password: hashedPassword,
      role: "CLIENT",
    });
    res.status(201).json({ message: "ĐĂNG KÝ THÀNH CÔNG" });
  } catch (error) {
    res.status(500).json({ message: "LỖI MÁY CHỦ BACKEND" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await knex("users").where({ username }).first();
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res
        .status(400)
        .json({ message: "SAI TÊN ĐĂNG NHẬP HOẶC MẬT KHẨU" });
    }
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: "1d",
    });
    res.status(200).json({
      message: "ĐĂNG NHẬP THÀNH CÔNG",
      token,
      user: { id: user.id, username: user.username, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ message: "LỖI MÁY CHỦ BACKEND" });
  }
});

// ==========================================
// API TRẬN ĐẤU & XẾP HẠNG
// ==========================================
app.post("/api/matches", async (req, res) => {
  try {
    const { user_id, game_name, score, time_elapsed } = req.body;
    await knex("matches").insert({ user_id, game_name, score, time_elapsed });
    res.status(201).json({ message: "ĐÃ LƯU ĐIỂM THÀNH CÔNG" });
  } catch (error) {
    res.status(500).json({ message: "LỖI LƯU TRẬN ĐẤU" });
  }
});

app.get("/api/rankings", async (req, res) => {
  try {
    const rankings = await knex("matches")
      .join("users", "matches.user_id", "=", "users.id")
      .select(
        "matches.id",
        "users.username as player",
        "matches.game_name as game",
        "matches.score",
        "matches.time_elapsed as time",
      )
      .orderBy("matches.score", "desc")
      .orderBy("matches.time_elapsed", "asc")
      .limit(100);
    res.status(200).json(rankings);
  } catch (error) {
    res.status(500).json({ message: "LỖI LẤY BẢNG XẾP HẠNG" });
  }
});

// ==========================================
// API KẾT BẠN (FRIENDS) - ĐÃ NÂNG CẤP LỜI MỜI VÀ XÓA TIN NHẮN
// ==========================================

// 1. Gửi lời mời kết bạn (Status: pending)
app.post("/api/friends/add", async (req, res) => {
  try {
    const { user_id, friend_username } = req.body;
    // Chỉ tìm những tài khoản có role là 'CLIENT' (ẩn Admin)
    const friend = await knex("users")
      .where({ username: friend_username, role: "CLIENT" })
      .first();

    if (!friend)
      return res.status(404).json({ message: "KHÔNG TÌM THẤY TÀI KHOẢN NÀY" });
    if (friend.id === user_id)
      return res.status(400).json({ message: "KHÔNG THỂ TỰ KẾT BẠN" });

    const existing = await knex("friends")
      .where({ user_id_1: user_id, user_id_2: friend.id })
      .orWhere({ user_id_1: friend.id, user_id_2: user_id })
      .first();

    if (existing) {
      if (existing.status === "pending")
        return res.status(400).json({ message: "ĐÃ GỬI HOẶC ĐANG CÓ LỜI MỜI" });
      return res.status(400).json({ message: "ĐÃ LÀ BẠN BÈ" });
    }

    await knex("friends").insert({
      user_id_1: user_id,
      user_id_2: friend.id,
      status: "pending",
    });
    res.status(201).json({ message: "ĐÃ GỬI LỜI MỜI" });
  } catch (error) {
    res.status(500).json({ message: "LỖI HỆ THỐNG BACKEND" });
  }
});

// 2. Lấy danh sách bạn bè (Chỉ lấy những người đã duyệt - status: accepted)
app.get("/api/friends/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;
    const friendsList = await knex("friends")
      .join("users", function () {
        this.on("users.id", "=", "friends.user_id_2")
          .andOn("friends.user_id_1", "=", knex.raw("?", [user_id]))
          .orOn("users.id", "=", "friends.user_id_1")
          .andOn("friends.user_id_2", "=", knex.raw("?", [user_id]));
      })
      .select("users.id", "users.username")
      .where("friends.status", "accepted")
      .whereNot("users.id", user_id);
    res.status(200).json(friendsList);
  } catch (error) {
    res.status(500).json({ message: "LỖI TẢI DANH SÁCH BẠN BÈ" });
  }
});

// 3. Lấy danh sách LỜI MỜI đang chờ duyệt
app.get("/api/friends/requests/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;
    const requests = await knex("friends")
      .join("users", "friends.user_id_1", "=", "users.id")
      .select(
        "friends.id as request_id",
        "users.id as sender_id",
        "users.username",
      )
      .where({ user_id_2: user_id, status: "pending" });
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: "LỖI TẢI LỜI MỜI" });
  }
});

// 4. Chấp nhận lời mời kết bạn
app.put("/api/friends/accept", async (req, res) => {
  try {
    const { request_id } = req.body;
    await knex("friends")
      .where({ id: request_id })
      .update({ status: "accepted" });
    res.status(200).json({ message: "ĐÃ TRỞ THÀNH BẠN BÈ" });
  } catch (error) {
    res.status(500).json({ message: "LỖI DUYỆT LỜI MỜI" });
  }
});

// 5. Từ chối lời mời HOẶC Xóa bạn bè (CÀN QUÉT SẠCH TIN NHẮN)
app.delete("/api/friends/:user_id/:friend_id", async (req, res) => {
  try {
    const { user_id, friend_id } = req.params;

    // BƯỚC 1: Xóa sạch toàn bộ lịch sử trò chuyện giữa 2 người này
    await knex("messages")
      .where(function () {
        this.where({ sender_id: user_id, receiver_id: friend_id });
      })
      .orWhere(function () {
        this.where({ sender_id: friend_id, receiver_id: user_id });
      })
      .del();

    // BƯỚC 2: Xóa quan hệ bạn bè / lời mời
    await knex("friends")
      .where(function () {
        this.where({ user_id_1: user_id, user_id_2: friend_id });
      })
      .orWhere(function () {
        this.where({ user_id_1: friend_id, user_id_2: user_id });
      })
      .del();

    res.status(200).json({ message: "ĐÃ XÓA SẠCH BẠN BÈ VÀ LỊCH SỬ CHAT" });
  } catch (error) {
    console.error("Lỗi xóa bạn bè/tin nhắn:", error);
    res.status(500).json({ message: "LỖI XÓA BẠN BÈ" });
  }
});

// ==========================================
// API TIN NHẮN (CHAT)
// ==========================================
app.post("/api/messages", async (req, res) => {
  try {
    const { sender_id, receiver_id, content } = req.body;
    if (!content.trim())
      return res.status(400).json({ message: "TIN NHẮN TRỐNG" });
    await knex("messages").insert({ sender_id, receiver_id, content });
    res.status(201).json({ message: "ĐÃ GỬI" });
  } catch (error) {
    res.status(500).json({ message: "LỖI GỬI TIN NHẮN" });
  }
});

app.get("/api/messages/:user1/:user2", async (req, res) => {
  try {
    const { user1, user2 } = req.params;
    const messages = await knex("messages")
      .where(function () {
        this.where({ sender_id: user1, receiver_id: user2 });
      })
      .orWhere(function () {
        this.where({ sender_id: user2, receiver_id: user1 });
      })
      .orderBy("created_at", "asc");
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: "LỖI TẢI TIN NHẮN" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server Backend RESTful API đang chạy tại cổng ${PORT}`);
});
