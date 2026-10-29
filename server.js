require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// Read all borrowing records
app.get('/api/borrow-records', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, equipment_name, borrower_name,
              borrow_date::text AS borrow_date, status
       FROM borrow_records
       ORDER BY id`
        );

        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Create a borrowing record
app.post('/api/borrow-records', async (req, res) => {
    const { equipment_name, borrower_name, borrow_date } = req.body || {};

    if (
        typeof equipment_name !== 'string' || !equipment_name.trim() ||
        typeof borrower_name !== 'string' || !borrower_name.trim() ||
        typeof borrow_date !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(borrow_date)
    ) {
        return res.status(400).json({
            error: 'Please provide equipment_name, borrower_name, and borrow_date (YYYY-MM-DD)'
        });
    }

    try {
        const result = await pool.query(
            `INSERT INTO borrow_records (equipment_name, borrower_name, borrow_date)
       VALUES ($1, $2, $3)
       RETURNING id, equipment_name, borrower_name,
                 borrow_date::text AS borrow_date, status`,
            [equipment_name.trim(), borrower_name.trim(), borrow_date]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
});

app.put('/api/borrow-records/:id', async (req, res) => {
    const id = Number(req.params.id);
    const { equipment_name, borrower_name, borrow_date, status } = req.body || {};

    if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({ error: 'Invalid ID' });
    }

    if (
        typeof equipment_name !== 'string' || !equipment_name.trim() ||
        typeof borrower_name !== 'string' || !borrower_name.trim() ||
        typeof borrow_date !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(borrow_date) ||
        !['Borrowed', 'Returned'].includes(status)
    ) {
        return res.status(400).json({ error: 'Invalid borrowing record' });
    }

    try {
        const result = await pool.query(
            `UPDATE borrow_records
       SET equipment_name = $1, borrower_name = $2,
           borrow_date = $3, status = $4
       WHERE id = $5
       RETURNING id, equipment_name, borrower_name,
                 borrow_date::text AS borrow_date, status`,
            [equipment_name.trim(), borrower_name.trim(), borrow_date, status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Record not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
});

app.delete('/api/borrow-records/:id', async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({ error: 'Invalid ID' });
    }

    try {
        const result = await pool.query(
            'DELETE FROM borrow_records WHERE id = $1 RETURNING id',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Record not found' });
        }

        res.json({ message: 'Record deleted', id: result.rows[0].id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
});

app.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
});