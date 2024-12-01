require('dotenv').config()
const nodemailer = require('nodemailer');

function sendEmail(email, subject, message) {
    console.log(`sending email to ${email}`)
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL,
            pass: process.env.EMAIL_PASS
        }
    });

    const mailOptions = {
        from: `"Calendar App" <${process.env.EMAIL}>`,
        to: email,
        subject: subject,
        html: message
    };

    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}

module.exports = sendEmail