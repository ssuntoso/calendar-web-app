require('dotenv').config()
const jwt = require('jsonwebtoken')
const pool = require('../config/db')
const sendEmail = require('../function-lib/sendEmail')
const generateAlphanumericCode = require('../function-lib/generateAlphanumericCode')

const signup = async(req, res) => {
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
        console.log(`signup requested by ${email}`)
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
        console.log(`successfully signup requested by ${email}`)
        res.status(201).json(result.rows[0])
    } catch (err) {
        console.error(err)
        res.status(500).json({message: 'Error adding user to database'})
    }
}

const googleSignup = async(req, res) => {
    const token = req.body.token
    const google_data = jwt.decode(token)
    const email = google_data.email
    try {
        console.log(`signup with Google requested by ${email}`)
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
        console.log(`successfully signup with Google requested by ${email}`)
        res.status(201).json({
            token: token_jwt,
            user_id: result.rows[0].user_id
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({message: 'Error adding user to database'})
    }
}

const verifyEmail = async(req, res) => {
    const email = req.query.email
    const code = req.query.code
    try {
        console.log(`verifying email for ${email}`)
        const result = await pool.query(
            'UPDATE "user" SET verify = true WHERE email = $1 AND verification_code = $2 RETURNING user_id, email',
            [email, code]
        )
        if (result.rows.length === 0) {
            return res.status(404).json({message: 'Invalid email or verification code'})
        }
        console.log(`successfully verified email for ${email}`)
        res.json({message: 'Verification successful!'})
    } catch (err) {
        console.error(err)
        res.status(500).json({message: 'Error verifying email in database'})
    }
}

const login = async(req, res) => {
    //  check if user exists in database
    const { email, password } = req.body
    if (!email || !password) {
        return res.status(400).json({message: 'email and password are required'})
    }

    try {
        console.log(`login requested by ${email}`)
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
        console.log(`successfully login requested by ${email}`)
        res.json({
            token: token,
            user_id: result.rows[0].user_id
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({message: 'Error checking user in database'})
    }
}

const googleLogin = async(req, res) => {
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
}

const forgotPassword = async(req, res) => {
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
}

const resetPassword = async(req, res) => {
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
}

module.exports = { 
    signup, 
    googleSignup,
    verifyEmail,
    login,
    googleLogin,
    forgotPassword,
    resetPassword
}