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

// --- AUTH ---
app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    await knex("users").insert({
      username,
      password: hashedPassword,
      role: "CLIENT",
    });
    res.status(201).json({ message: "ĐĂNG KÝ THÀNH CÔNG" });
  } catch (error) {
    res.status(500).json({ message: "LỖI" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await knex("users").where({ username }).first();
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(400).json({ message: "SAI TÀI KHOẢN" });
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: "1d",
    });
    res.status(200).json({
      token,
      user: { id: user.id, username: user.username, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ message: "LỖI" });
  }
});

// --- RANKING & MATCHES (CÓ PHÂN TRANG & ÉP KIỂU SỐ) ---
app.post("/api/matches", async (req, res) => {
  try {
    const { user_id, game_name, score, time_elapsed } = req.body;
    await knex("matches").insert({
      user_id,
      game_name,
      score: Number(score),
      time_elapsed: Number(time_elapsed),
    });
    res.status(201).json({ message: "LƯU ĐIỂM THÀNH CÔNG" });
  } catch (error) {
    res.status(500).json({ message: "LỖI" });
  }
});

app.get("/api/rankings", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 5,
      game = "ALL",
      mode = "GLOBAL",
      user_id,
    } = req.query;
    const offset = (page - 1) * limit;
    let query = knex("matches").join(
      "users",
      "matches.user_id",
      "=",
      "users.id",
    );

    if (game !== "ALL") query = query.where("matches.game_name", game);
    if (mode === "FRIENDS" && user_id) {
      const friends = await knex("friends")
        .where("status", "accepted")
        .andWhere(function () {
          this.where("user_id_1", user_id).orWhere("user_id_2", user_id);
        });
      const ids = friends.map((f) =>
        f.user_id_1 == user_id ? f.user_id_2 : f.user_id_1,
      );
      query = query.whereIn("matches.user_id", [user_id, ...ids]);
    }

    let myBest = null;
    if (user_id) {
      const all = await knex("matches")
        .where(game !== "ALL" ? { game_name: game } : {})
        .orderBy("score", "desc")
        .orderBy("time_elapsed", "asc");
      const idx = all.findIndex((m) => m.user_id == user_id);
      if (idx !== -1) myBest = { rank: idx + 1, score: all[idx].score };
    }

    const count = await query.clone().count("matches.id as total").first();
    const data = await query
      .select(
        "matches.id",
        "users.username as player",
        "matches.game_name as game",
        knex.raw("CAST(matches.score AS INTEGER) as score"),
        knex.raw("CAST(matches.time_elapsed AS INTEGER) as time"),
      )
      .orderBy("score", "desc")
      .orderBy("time", "asc")
      .limit(limit)
      .offset(offset);

    res.status(200).json({
      data,
      pagination: { totalPages: Math.ceil(count.total / limit) },
      myBest,
    });
  } catch (error) {
    res.status(500).json({ message: "LỖI" });
  }
});

// --- RATING & COMMENT ---
app.post("/api/games/rating", async (req, res) => {
  try {
    const { user_id, game_name, rating, comment } = req.body;
    await knex("game_ratings").insert({ user_id, game_name, rating, comment });
    res.status(201).json({ message: "OK" });
  } catch (error) {
    res.status(500).json({ message: "LỖI" });
  }
});

// --- SOCIAL (FRIENDS & CHAT) ---
app.get("/api/friends/:user_id", async (req, res) => {
  const { user_id } = req.params;
  const page = req.query.page || 1;
  const data = await knex("friends")
    .join("users", function () {
      this.on("users.id", "=", "friends.user_id_2")
        .andOn("friends.user_id_1", "=", knex.raw("?", [user_id]))
        .orOn("users.id", "=", "friends.user_id_1")
        .andOn("friends.user_id_2", "=", knex.raw("?", [user_id]));
    })
    .select("users.id", "users.username")
    .where("friends.status", "accepted")
    .whereNot("users.id", user_id)
    .limit(10)
    .offset((page - 1) * 10);
  res.json({ data });
});

app.get("/api/friends/requests/:user_id", async (req, res) => {
  const { user_id } = req.params;
  const requests = await knex("friends")
    .join("users", "friends.user_id_1", "=", "users.id")
    .select(
      "friends.id as request_id",
      "users.id as sender_id",
      "users.username",
    )
    .where({ user_id_2: user_id, status: "pending" });
  res.json(requests);
});

app.put("/api/friends/accept", async (req, res) => {
  const { request_id } = req.body;
  await knex("friends")
    .where({ id: request_id })
    .update({ status: "accepted" });
  res.json({ message: "OK" });
});

app.delete("/api/friends/:u_id/:f_id", async (req, res) => {
  const { u_id, f_id } = req.params;
  await knex("messages")
    .where({ sender_id: u_id, receiver_id: f_id })
    .orWhere({ sender_id: f_id, receiver_id: u_id })
    .del();
  await knex("friends")
    .where({ user_id_1: u_id, user_id_2: f_id })
    .orWhere({ user_id_1: f_id, user_id_2: u_id })
    .del();
  res.json({ message: "XÓA XONG" });
});

app.get("/api/messages/:u1/:u2", async (req, res) => {
  const { u1, u2 } = req.params;
  const page = req.query.page || 1;
  const msgs = await knex("messages")
    .where(function () {
      this.where({ sender_id: u1, receiver_id: u2 }).orWhere({
        sender_id: u2,
        receiver_id: u1,
      });
    })
    .orderBy("created_at", "desc")
    .limit(20)
    .offset((page - 1) * 20);
  res.json({ data: msgs.reverse() });
});

app.post("/api/messages", async (req, res) => {
  const { sender_id, receiver_id, content } = req.body;
  await knex("messages").insert({ sender_id, receiver_id, content });
  res.json({ message: "GỬI XONG" });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`BACKEND RUNNING ON ${PORT}`));
