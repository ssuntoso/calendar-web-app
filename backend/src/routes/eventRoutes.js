const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/middleware');

const {
    getSubject,
    addSubject,
    updateSubject,
    deleteSubject
} = require('../controllers/eventManagement');

router.get('/getSubjects', authenticateToken, getSubject);
router.post('/addSubject', authenticateToken, addSubject);
router.put('/updateSubject', authenticateToken, updateSubject);
router.delete('/deleteSubject', authenticateToken, deleteSubject);

module.exports = router;