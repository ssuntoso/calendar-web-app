require('dotenv').config()
const express = require('express')
const { Pool } = require('pg')
const app = express()
const port = 3000

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT || 5432,
})

app.use(express.json())

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.post('/signup', async(req, res) => {
    //  add user to database
    const { email, password } = req.body
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !password) {
        return res.status(400).json({message: 'email and password are required'})
    }
    if (!emailPattern.test(email)) {
        return res.status(400).json({message: 'Invalid email format'})
    }
    if (password.length < 8) {
        return res.status(400).send('Password must be at least 8 characters long')
    } else if (password.length > 20) {
        return res.status(400).json({message: 'Password must be at most 20 characters long'})
    }

    try {
        const checkUser = await pool.query(
            'SELECT email FROM "user" WHERE email = $1',
            [email]
        )
        if (checkUser.rows.length > 0) {
            return res.status(409).json({message: 'User already exists'})
        }
        const result = await pool.query(
            'INSERT INTO "user" (email, password) VALUES ($1, $2) RETURNING user_id, email',
            [email, password]
        )
        console.log(result)
        res.status(201).json(result.rows[0])
    } catch (err) {
        console.error(err)
        res.status(500).json({message: 'Error adding user to database'})
    }
})

app.post('/login', async(req, res) => {
    //  check if user exists in database
    const { email, password } = req.body
    if (!email || !password) {
        return res.status(400).json({message: 'email and password are required'})
    }

    try {
        const result = await pool.query(
            'SELECT user_id, email FROM "user" WHERE email = $1 AND password = $2',
            [email, password]
        )
        if (result.rows.length === 0) {
            return res.status(401).json({message: 'Invalid email or password'})
        } 
        res.json(result.rows[0])
    } catch (err) {
        console.error(err)
        res.status(500).json({message: 'Error checking user in database'})
    }
})

app.get('/addSubject', async(req, res) => {
    //  add subject to database
    const { subject, start_date, start_time, end_date, end_time, all_day_event, description, location } = req.body
    if (!subject_name) {
        return res.status(400).json({message: 'subject_name is required'})
    }

    try {
        const result = await pool.query(
            'INSERT INTO calendar (subject, start_date, start_time, end_date, end_time, all_day_event, description, location) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING subject_id, subject_name',
            [subject, start_date, start_time, end_date, end_time, all_day_event, description, location]
        )
        res.status(201).json(result.rows[0])
    } catch (err) {
        console.error(err)
        res.status(500).json({message: 'Error adding subject to database'})
    }
})

app.get('/getSubjects', async(req, res) => {
    //  get all subjects from database
    try {
        const result = await pool.query(
            'SELECT subject_id, subject, start_date, start_time, end_date, end_time, all_day_event, description, location FROM subject WHERE user_id = $1',
            [req.query.user_id]
        )
        res.json(result.rows)
    } catch (err) {
        console.error(err)
        res.status(500).json({message: 'Error getting subjects from database'})
    }
})

app.put('/updateSubject', async(req, res) => {
    //  update subject in database
    const { subject_id, subject, start_date, start_time, end_date, end_time, all_day_event, description, location } = req.body
    if (!subject_id) {
        return res.status(400).json({message: 'subject_id is required'})
    }

    try {
        const result = await pool.query(
            'UPDATE calendar SET subject = $1, start_date = $2, start_time = $3, end_date = $4, end_time = $5, all_day_event = $6, description = $7, location = $8 WHERE subject_id = $9 RETURNING subject_id, subject_name',
            [subject, start_date, start_time, end_date, end_time, all_day_event, description, location, subject_id]
        )
        res.json(result.rows[0])
    } catch (err) {
        console.error(err)
        res.status(500).json({message: 'Error updating subject in database'})
    }
})

app.delete('/deleteSubject', async(req, res) => {
    //  delete subject from database
    const { subject_id } = req.body
    if (!subject_id) {
        return res.status(400).json({message: 'subject_id is required'})
    }

    try {
        const result = await pool.query(
            'DELETE FROM calendar WHERE subject_id = $1 RETURNING subject_id, subject_name',
            [subject_id]
        )
        res.json(result.rows[0])
    } catch (err) {
        console.error(err)
        res.status(500).json({message: 'Error deleting subject from database'})
    }
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})