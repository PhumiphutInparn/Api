const express = require("express");
const bodyParser = require("body-parser");
const bookRoutes = require('./routes/bookRoutes')
const userRoutes = require('./routes/userRoutes')
const rentalRoutes = require('./routes/rentalRoutes')
const authRoutes = require('./routes/authRoutes');
require('dotenv').config();
const bulkRoutes = require('./routes/bulkRoutes');
const app = express();


app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))


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