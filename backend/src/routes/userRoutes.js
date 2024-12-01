const express = require('express');
const router = express.Router();

const {
    signup,
    googleSignup,
    login,
    googleLogin,
    verifyEmail,
    forgotPassword,
    resetPassword
} = require('../controllers/userController');

router.post('/signup', signup);
router.post('/googleSignup', googleSignup);
router.post('/login', login);
router.post('/googleLogin', googleLogin);
router.get('/verifyEmail', verifyEmail);
router.get('/forgotPassword', forgotPassword);
router.post('/resetPassword', resetPassword);

module.exports = router;