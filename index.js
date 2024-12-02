const express = require("express");
const bodyParser = require("body-parser");
const cors = require('cors');
const bcrypt = require('bcrypt');
const db = require("./db");
const User = require("./User");

const app = express();
const port = 8081;
app.use(bodyParser.json());

app.options('*', cors());

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            username,
            password: hashedPassword,
        });
        await user.save();

        res.status(201).json({ message: 'User registered successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});