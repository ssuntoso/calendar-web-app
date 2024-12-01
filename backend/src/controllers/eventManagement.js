require('dotenv').config()
const pool = require('../config/db')

const getSubject = async(req, res) => {
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
}

const addSubject = async(req, res) => {
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
}

const updateSubject = async(req, res) => {
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
}

const deleteSubject = async(req, res) => {
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
}

module.exports = {
    getSubject,
    addSubject,
    updateSubject,
    deleteSubject
}