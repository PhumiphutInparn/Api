const express = require("express");
const bodyParser = require("body-parser");
const bookRoutes = require('./routes/bookRoutes')
const userRoutes = require('./routes/userRoutes')
const rentalRoutes = require('./routes/rentalRoutes')
const authRoutes = require('./routes/authRoutes');
require('dotenv').config();
const bulkRoutes = require('./routes/bulkRoutes');
const path = require('path');
const app = express();

const cors = require('cors'); 
app.use(cors()); // อนุญาตให้ทุกหน้าบ้านดึงข้อมูล API ได้


app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))

const fullPath = path.join(__dirname, '..', 'uploads');
app.use('/uploads', express.static('uploads'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(bookRoutes)
app.use(userRoutes)
app.use(rentalRoutes)
app.use(authRoutes);
app.use('/bulk', bulkRoutes);

app.get("/", (req, res) => {
    res.send({ error: false, message: "Welcome to Library API (Modular Structure)" });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
});