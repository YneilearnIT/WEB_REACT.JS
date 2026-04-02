const express = require('express');
const cors = require('cors');
require('dotenv').config();

const apiRoutes = require('./src/routes/index');

const app = express();

// Middleware cơ bản
app.use(cors()); 
app.use(express.json()); 

// Gắn toàn bộ Routes vào tiền tố /api
app.use('/api', apiRoutes);

// Khởi động Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server Backend chuẩn MVC đang chạy tại cổng ${PORT}`);
});