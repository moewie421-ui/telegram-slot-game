const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database Setup (SQLite)
const db = new sqlite3.Database('./slot_game.db', (err) => {
    if (err) console.error('DB Error:', err.message);
    else console.log('Connected to SQLite Database.');
});

db.run(`CREATE TABLE IF NOT EXISTS users (
    telegram_id TEXT PRIMARY KEY,
    username TEXT,
    balance INTEGER DEFAULT 1000
)`);

// Get or Create User API
app.post('/api/user', (req, res) => {
    const { telegram_id, username } = req.body;
    if (!telegram_id) return res.status(400).json({ error: 'Missing ID' });

    db.get(`SELECT * FROM users WHERE telegram_id = ?`, [telegram_id], (err, row) => {
        if (row) {
            res.json(row);
        } else {
            db.run(`INSERT INTO users (telegram_id, username, balance) VALUES (?, ?, 1000)`, 
                [telegram_id, username || 'Player'], (err) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ telegram_id, username: username || 'Player', balance: 1000 });
            });
        }
    });
});

// Update Balance API (Spin Result)
app.post('/api/update-balance', (req, res) => {
    const { telegram_id, new_balance } = req.body;
    db.run(`UPDATE users SET balance = ? WHERE telegram_id = ?`, [new_balance, telegram_id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, balance: new_balance });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
