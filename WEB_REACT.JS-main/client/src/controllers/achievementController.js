const knex = require('../db/knex'); // Đường dẫn đến file cấu hình knex của bạn

exports.getMyAchievements = async (req, res) => {
    try {
        const userId = req.user.id; // Lấy ID từ token

        // Query lấy tất cả thành tựu và đánh dấu cái nào user đã đạt được
        const allAchievements = await knex('achievements').select('*');
        const userUnlocked = await knex('user_achievements')
            .where('user_id', userId)
            .select('achievement_id', 'unlocked_at');

        // Map lại dữ liệu để gửi về cho React dễ xử lý
        const result = allAchievements.map(ach => {
            const unlocked = userUnlocked.find(u => u.achievement_id === ach.id);
            return {
                ...ach,
                isUnlocked: !!unlocked,
                unlockedAt: unlocked ? unlocked.unlocked_at : null
            };
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};