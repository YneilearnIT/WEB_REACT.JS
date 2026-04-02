const express = require('express');
const router = express.Router();

const { verifyToken, verifyAdmin } = require('../middlewares/auth');
const authController = require('../controllers/authController');
const gameController = require('../controllers/gameController');
const socialController = require('../controllers/socialController');
const adminController = require('../controllers/adminController');
const userController = require('../controllers/userController');

// --- AUTH ---
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);

// --- GAME (RANKING, CONFIG) ---
router.get('/games/config', gameController.getConfig);
router.put('/admin/games/config', verifyAdmin, gameController.updateConfig);
router.post('/matches', gameController.saveMatch);
router.get('/ranking', gameController.getRanking);

// --- SOCIAL (FRIENDS & CHAT) ---
router.post('/friends/add', socialController.addFriend);
router.get('/friends/:user_id', socialController.getFriends);
router.get('/friends/requests/:user_id', socialController.getRequests);
router.put('/friends/accept', socialController.acceptRequest);
router.delete('/friends/:u_id/:f_id', socialController.removeFriend);
router.post('/messages', socialController.sendMessage);
router.get('/messages/:u1/:u2', socialController.getMessages);

// --- USER (PROFILE, RATING, ACHIEVEMENTS) ---
router.put('/users/:id/name', userController.updateName);
router.post('/games/rating', userController.saveRating);
router.get('/games/ratings/latest', userController.getLatestRatings);
router.get('/users/:user_id/achievements', userController.getUserAchievements);

// --- ADMIN (QUẢN TRỊ) ---
router.get('/admin/stats', verifyAdmin, adminController.getStats);
router.get('/admin/users', verifyAdmin, adminController.getUsers);
router.put('/admin/users/:id/role', verifyAdmin, adminController.updateRole);
router.delete('/admin/users/:id', verifyAdmin, adminController.deleteUser);
router.delete('/admin/ratings/:id', verifyAdmin, adminController.deleteRating);

module.exports = router;