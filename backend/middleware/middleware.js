require('dotenv').config()
const jwt = require('jsonwebtoken')

const authenticateToken = (req, res, next) => {
    console.log('authenticating request')
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

module.exports = authenticateToken