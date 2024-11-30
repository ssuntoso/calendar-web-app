require('dotenv').config()
const express = require('express')
const jwt = require('jsonwebtoken')
const { Pool } = require('pg')
const app = express()
const cors = require('cors')
const port = 3000

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT || 5432,
})

app.use(express.json())
app.use(cors())

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (token == null) {
        return res.sendStatus(401)
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.sendStatus(403)
        }
        if (user.exp < Math.floor(Date.now() / 1000)) {
            return res.sendStatus(403)
        }
        req.user = user
        next()
    })
}

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
            return res.status(409).json({message: 'User already exists, please login'})
        }
        const result = await pool.query(
            'INSERT INTO "user" (email, password) VALUES ($1, $2) RETURNING user_id, email',
            [email, password]
        )
        console.log(`user with user_id ${result.rows[0].user_id} and email ${result.rows[0].email} added to database`)
        res.status(201).json(result.rows[0])
    } catch (err) {
        console.error(err)
        res.status(500).json({message: 'Error adding user to database'})
    }
})

app.post('/googleSignup', async(req, res) => {
    const token = req.body.token
    const google_data = jwt.decode(token)
    const email = google_data.email
    try {
        const checkUser = await pool.query(
            'SELECT email FROM "user" WHERE email = $1',
            [email]
        )
        if (checkUser.rows.length > 0) {
            return res.status(409).json({message: 'User already exists, please login'})
        }
        const result = await pool.query(
            'INSERT INTO "user" (email, google_token) VALUES ($1, $2) RETURNING user_id, email',
            [email, token]
        )
        console.log(`user with user_id ${result.rows[0].user_id} and email ${result.rows[0].email} added to database`)
        const token_jwt = jwt.sign({user_id: result.rows[0].user_id}, process.env.JWT_SECRET, {expiresIn: '30d'})
        res.status(201).json({
            token: token_jwt,
            user_id: result.rows[0].user_id
        })
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
        const token = jwt.sign({user_id: result.rows[0].user_id}, process.env.JWT_SECRET, {expiresIn: '30d'})
        res.json({
            token: token,
            user_id: result.rows[0].user_id
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({message: 'Error checking user in database'})
    }
})

app.post('/googleLogin', async(req, res) => {
    //  check if user exists in database
    const token = req.body.token
    const google_data = jwt.decode(token)
    const email = google_data.email

    try {
        const result = await pool.query(
            'SELECT user_id, email FROM "user" WHERE email = $1',
            [email]
        )
        if (result.rows.length === 0) {
            return res.status(401).json({message: 'Email not found, please sign up'})
        } 
        const token_jwt = jwt.sign({user_id: result.rows[0].user_id}, process.env.JWT_SECRET, {expiresIn: '30d'})
        res.json({
            token: token_jwt,
            user_id: result.rows[0].user_id
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({message: 'Error checking user in database'})
    }
})

app.post('/addSubject', authenticateToken, async(req, res) => {
    //  add subject to database
    const { user_id, subject_id, subject, start_time_zone, start_time, end_time_zone, end_time, all_day_event, description, location } = req.body

    try {
        const result = await pool.query(
            'INSERT INTO calendar (user_id, subject_id, subject, start_time_zone, start_time, end_time_zone, end_time, all_day_event, description, location) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING subject_id, subject',
            [user_id, subject_id, subject, start_time_zone, start_time, end_time_zone, end_time, all_day_event, description, location]
        )
        res.status(201).json(result.rows[0])
    } catch (err) {
        console.error(err)
        res.status(500).json({message: 'Error adding subject to database'})
    }
})

app.get('/getSubjects', authenticateToken, async(req, res) => {
    //  get all subjects from database
    try {
        const result = await pool.query(
            'SELECT user_id, subject_id, subject, start_time_zone, CAST(start_time AS varchar), end_time_zone, CAST(end_time AS varchar), all_day_event, description, location FROM calendar WHERE user_id = $1',
            [req.query.user_id]
        )
        res.json(result.rows)
    } catch (err) {
        console.error(err)
        res.status(500).json({message: 'Error getting subjects from database'})
    }
})

app.put('/updateSubject', authenticateToken, async(req, res) => {
    authenticateToken(req, res)
    //  update subject in database
    const { user_id, subject_id, subject, start_time_zone, start_time, end_time_zone, end_time, all_day_event, description, location } = req.body

    try {
        const result = await pool.query(
            'UPDATE calendar SET user_id = $1, subject_id = $2, subject = $3, start_time_zone = $4, start_time = $5, end_time_zone = $6, end_time = $7, all_day_event = $8, description = $10, location = $11 WHERE subject_id = $2 RETURNING subject_id, subject',
            [user_id, subject_id, subject, start_time_zone, start_time, end_time_zone, end_time, all_day_event, description, location]
        )
        res.json(result.rows[0])
    } catch (err) {
        console.error(err)
        res.status(500).json({message: 'Error updating subject in database'})
    }
})

app.delete('/deleteSubject', authenticateToken, async(req, res) => {
    authenticateToken(req, res)
    //  delete subject from database
    const { subject_id, user_id } = req.body
    try {
        const result = await pool.query(
            'DELETE FROM calendar WHERE subject_id = $1 AND user_id = $2 RETURNING subject_id, subject',
            [subject_id, user_id]
        )
        if (result.rows.length === 0) {
            return res.status(404).json({message: 'Subject or User not found'})
        }
        res.json(result.rows[0])
    } catch (err) {
        console.error(err)
        res.status(500).json({message: 'Error deleting subject from database'})
    }
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})