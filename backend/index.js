require('dotenv').config()
const express = require('express')
const jwt = require('jsonwebtoken')
const { Pool } = require('pg')
const cors = require('cors')
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const authenticateToken = require('./middleware/middleware')
const sendEmail = require('./src/sendEmail')
const generateAlphanumericCode = require('./src/generateAlphanumericCode')
const formatDate = require('./src/formatDate')

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
app.use(cors())

const getEvents = async () => {
    const events = await pool.query(`
        SELECT * FROM calendar
        WHERE (start_time AT TIME ZONE start_time_zone) 
        BETWEEN NOW() + INTERVAL '14 minutes' AND NOW() + INTERVAL '15 minutes';
    `)
    return events.rows
}

//schedule task to look for events that will start in 15 mins
cron.schedule('* * * * *', async() => {
    console.log('looking for event that will start in 15 mins')
    const events = await getEvents()
    events.map(async event => {
        const subject = event.subject
        const start_time = formatDate(new Date(event.start_time))
        const start_time_zone = event.start_time_zone
        const end_time = formatDate(new Date(event.end_time))
        const end_time_zone = event.end_time_zone
        const description = event.description
        const location = event.location

        const message = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>${subject}</h2>
            <p>Start Time: ${start_time} (${start_time_zone})</p>
            <p>End Time: ${end_time} (${end_time_zone})</p>
            <p>Description: ${description || ''}</p>
            <p>Location: ${location || ''}</p>
            </div>
        `

        // get email from database
        const email = await pool.query(
            'SELECT email FROM "user" WHERE user_id = $1',
            [event.user_id]
        )
        sendEmail(
            email.rows[0].email,
            `Reminder - ${subject} will start in 15 minutes`,
            message
        )
    })
})

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

    try {
        const checkUser = await pool.query(
            'SELECT email FROM "user" WHERE email = $1',
            [email]
        )
        if (checkUser.rows.length > 0) {
            return res.status(409).json({message: 'User already exists, please login'})
        }
        const verification_code = generateAlphanumericCode(6)
        const result = await pool.query(
            'INSERT INTO "user" (email, password, verification_code) VALUES ($1, $2, $3) RETURNING user_id, email',
            [email, password, verification_code]
        )
        console.log(`user with user_id ${result.rows[0].user_id} and email ${result.rows[0].email} added to database`)

        // send verification email
        const subject = 'Verify your email address'
        const verification_url = `${process.env.FRONTEND_URL}/verify?email=${email}&code=${verification_code}`
        const message = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>Verify Your Email Address</h2>
            <p>Thank you for signing up for our Calendar App! Please click the link below to verify your email address:</p>
            <p><a href="${verification_url}" style="color: #1a73e8; text-decoration: none;">Verify Email</a></p>
            <p>If you cannot click the link, please copy and paste the following URL into your browser:</p>
            <p>${verification_url}</p>
            <p>If you did not sign up for this account, please ignore this email.</p>
            <p>Best regards,<br>The Calendar App Team</p>
            </div>
        `
        sendEmail(email, subject, message)
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
            'INSERT INTO "user" (email, google_token, verify) VALUES ($1, $2, $3) RETURNING user_id, email',
            [email, token, true]
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

app.get('/verifyEmail', async(req, res) => {
    const email = req.query.email
    const code = req.query.code
    try {
        const result = await pool.query(
            'UPDATE "user" SET verify = true WHERE email = $1 AND verification_code = $2 RETURNING user_id, email',
            [email, code]
        )
        if (result.rows.length === 0) {
            return res.status(404).json({message: 'Invalid email or verification code'})
        }
        res.json({message: 'Verification successful!'})
    } catch (err) {
        console.error(err)
        res.status(500).json({message: 'Error verifying email in database'})
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
            'SELECT user_id, email, verify FROM "user" WHERE email = $1 AND password = $2',
            [email, password]
        )
        if (result.rows.length === 0) {
            return res.status(401).json({message: 'Invalid email or password'})
        } 
        if (!result.rows[0].verify) {
            return res.status(403).json({message: 'Please verify your email address'})
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
        console.log(`login with Google requested by ${email}`)
        const result = await pool.query(
            'SELECT user_id, email FROM "user" WHERE email = $1',
            [email]
        )
        if (result.rows.length === 0) {
            return res.status(401).json({message: 'Email not found, please sign up'})
        } 
        const token_jwt = jwt.sign({user_id: result.rows[0].user_id}, process.env.JWT_SECRET, {expiresIn: '30d'})
        console.log(`successfully login with Google requested by ${email}`)
        return res.json({
            token: token_jwt,
            user_id: result.rows[0].user_id
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({message: 'Error checking user in database'})
    }
})

app.get('/forgotPassword', async(req, res) => {
    const email = req.query.email
    console.log('forgot password requested by ' + email)
    try {
        const result = await pool.query(
            'SELECT email FROM "user" WHERE email = $1',
            [email]
        )
        if (result.rows.length === 0) {
            return res.status(404).json({message: 'Email not found, please sign up'})
        }
        const reset_code = generateAlphanumericCode(6)
        const reset_exp = Math.floor(Date.now() / 1000) + 300
        await pool.query(
            'UPDATE "user" SET reset_code = $1, reset_exp = $2 WHERE email = $3',
            [reset_code, reset_exp, email]
        )
        const subject = 'Reset Password Request'
        const reset_url = `${process.env.FRONTEND_URL}/reset?email=${email}&resetCode=${reset_code}`
        const message = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>Reset Your Password</h2>
            <p>Click the link below within 5 minutes to reset your password:</p>
            <p><a href="${reset_url}" style="color: #1a73e8; text-decoration: none;">Reset Password</a></p>
            <p>If you cannot click the link, please copy and paste the following URL into your browser:</p>
            <p>${reset_url}</p>
            <p>If you did not request a password reset, please ignore this email.</p>
            <p>Best regards,<br>The Calendar App Team</p>
            </div>
        `
        sendEmail(email, subject, message)
        res.json({message: 'Password reset email sent'})
    } catch (err) {
        console.error(err)
        res.status(500).json({message: 'Error sending password reset email'})
    }
})

app.post('/resetPassword', async(req, res) => {
    const email = req.body.email
    const reset_code = req.body.reset_code
    const password = req.body.password
    try {
        console.log(`reseting password for ${email}`)
        const reset_exp = await pool.query(
            'SELECT reset_exp FROM "user" WHERE email = $1 AND reset_code = $2',
            [email, reset_code]
        )
        if (reset_exp.rows[0]?.reset_exp > Math.floor(Date.now() / 1000)) {
            const result = await pool.query(
            'UPDATE "user" SET password = $1 WHERE email = $2 AND reset_code = $3 RETURNING user_id, email',
            [password, email, reset_code]
            )
            if (result.rows.length === 0) {
                console.log(`invalid email or rese code for ${email}`)
                return res.status(404).json({message: 'Invalid email or reset code'})
            }
            console.log(`successfully reset password for ${email}`)
            res.json({message: 'Password reset successful'})
        } else {
            console.log(`reset code expired for ${email}`)
            res.status(400).json({message: 'Reset code expired'})
        }
    } catch (err) {
        console.error(err)
        res.status(500).json({message: 'Error resetting password'})
    }
})

app.post('/addSubject', authenticateToken, async(req, res) => {
    //  add subjects to database
    const subjects = req.body

    if (!Array.isArray(subjects)) {
        return res.status(400).json({message: 'Request body must be an array of subjects'})
    }

    try {
        console.log(`add ${subjects.length} events to database`)
        const values = subjects.map(subject => [
            subject.user_id, subject.subject_id, subject.subject, subject.start_time_zone, subject.start_time, 
            subject.end_time_zone, subject.end_time, subject.all_day_event, subject.description, subject.location
        ])
        const query = `
            INSERT INTO calendar (user_id, subject_id, subject, start_time_zone, start_time, end_time_zone, end_time, all_day_event, description, location)
            VALUES ${values.map((_, i) => `($${i * 10 + 1}, $${i * 10 + 2}, $${i * 10 + 3}, $${i * 10 + 4}, $${i * 10 + 5}, $${i * 10 + 6}, $${i * 10 + 7}, $${i * 10 + 8}, $${i * 10 + 9}, $${i * 10 + 10})`).join(', ')}
            RETURNING subject_id, subject
        `
        const result = await pool.query(query, values.flat())
        console.log(`successfully add ${result.rows.length} events to database`)
        res.status(201).json(result.rows)
    } catch (err) {
        console.error(err)
        res.status(500).json({message: 'Error adding subjects to database'})
    }
})

app.get('/getSubjects', authenticateToken, async(req, res) => {
    //  get all subjects from database
    try {
        console.log(`get all event for user_id: ${req.query.user_id}`)
        const result = await pool.query(
            'SELECT user_id, subject_id, subject, start_time_zone, CAST(start_time AS varchar), end_time_zone, CAST(end_time AS varchar), all_day_event, description, location FROM calendar WHERE user_id = $1 ORDER BY subject_id ASC',
            [req.query.user_id]
        )
        console.log(`successfully get ${result.rows.length} events`)
        res.json(result.rows)
    } catch (err) {
        console.error(err)
        res.status(500).json({message: 'Error getting subjects from database'})
    }
})

app.put('/updateSubject', authenticateToken, async(req, res) => {
    //  update subject in database
    const { user_id, subject_id, subject, start_time_zone, start_time, end_time_zone, end_time, all_day_event, description, location } = req.body

    try {
        console.log(`update event for user_id: ${user_id}, subject_id: ${subject_id}`)
        const result = await pool.query(
            `
                UPDATE calendar SET user_id = $1, 
                    subject_id = $2, 
                    subject = $3, 
                    start_time_zone = $4, 
                    start_time = $5, 
                    end_time_zone = $6, 
                    end_time = $7, 
                    all_day_event = $8, 
                    description = $9, 
                    location = $10 
                WHERE user_id = $1 AND subject_id = $2 RETURNING subject_id, subject
            `,
            [user_id, subject_id, subject, start_time_zone, start_time, end_time_zone, end_time, all_day_event, description, location]
        )
        console.log(`successfully update event for user_id: ${user_id}, subject_id: ${subject_id}`)
        res.json(result.rows[0])
    } catch (err) {
        console.error(err)
        res.status(500).json({message: 'Error updating subject in database'})
    }
})

app.delete('/deleteSubject', authenticateToken, async(req, res) => {
    //  delete subject from database
    const { subject_id, user_id } = req.body
    try {
        console.log(`delete event for user_id: ${user_id}, subject_id: ${subject_id}`)
        const result = await pool.query(
            'DELETE FROM calendar WHERE subject_id = $1 AND user_id = $2 RETURNING subject_id, subject',
            [subject_id, user_id]
        )
        if (result.rows.length === 0) {
            return res.status(404).json({message: 'Subject or User not found'})
        }
        console.log(`successfully delete event for user_id: ${user_id}, subject_id: ${subject_id}`)
        res.json(result.rows[0])
    } catch (err) {
        console.error(err)
        res.status(500).json({message: 'Error deleting subject from database'})
    }
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})