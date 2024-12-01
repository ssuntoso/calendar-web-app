const pool = require('../config/db')
const sendEmail = require('../function-lib/sendEmail')
const formatDate = require('../function-lib/formatDate')

const getEvents = async () => {
    const events = await pool.query(`
        SELECT * FROM calendar
        WHERE (start_time AT TIME ZONE start_time_zone) 
        BETWEEN NOW() + INTERVAL '14 minutes' AND NOW() + INTERVAL '15 minutes';
    `)
    return events.rows
}

const reminder = async() => {
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
        console.log('sending email to', email.rows[0].email, 'for', subject)
        sendEmail(
            email.rows[0].email,
            `Reminder - ${subject} will start in 15 minutes`,
            message
        )
    })
}

module.exports = reminder