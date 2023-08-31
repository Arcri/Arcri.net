const express = require("express");
const bodyParser = require("body-parser");
const cors = require('cors');
const bcrypt = require('bcrypt');
const db = require("./db"); // Your db.js file
const User = require("./User"); // Your User.js file

const app = express();
const port = 8081;
console.log("moneyballs")
app.use(bodyParser.json());

app.use(cors({
    origin: '*',
}));

// Registration endpoint
app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Hash the password before storing it
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user and save to the database
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