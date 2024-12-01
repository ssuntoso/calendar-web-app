require('dotenv').config()
const express = require('express')
const cors = require('cors')
const cron = require('node-cron');
const morgan = require('morgan')

const userRoutes = require('./src/routes/userRoutes')
const eventRoutes = require('./src/routes/eventRoutes');
const reminder = require('./src/function-lib/reminder');

const app = express()
const port = process.env.PORT || 3000

app.use(express.json())
app.use(cors())
app.use(morgan('combined'))

//schedule task to look for events that will start in 15 mins
cron.schedule('* * * * *', reminder);

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.use('/api/v1/user', userRoutes)
app.use('/api/v1/event', eventRoutes)

app.listen(port, () => {
  console.log(`listening on port ${port}`)
})