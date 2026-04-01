const express = require('express');
const router = express.Router();
const achievementController = require('../controllers/achievementController');
const { authMiddleware } = require('../middleware/auth'); // Middleware xác thực user

// API cho người dùng xem thành tựu của chính họ
router.get('/my-achievements', authMiddleware, achievementController.getMyAchievements);

// API cho Admin quản lý danh sách thành tựu
router.get('/all', authMiddleware, achievementController.getAllAchievements);
router.post('/create', authMiddleware, achievementController.createAchievement);

module.exports = router;