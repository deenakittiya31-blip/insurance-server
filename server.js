require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { readdirSync } = require('fs')

const app = express()

app.use(cors())
app.use(morgan('dev'))
app.use(express.json({ limit: '10mb'}))

console.log(`Bearer ${process.env.CHANNEL_ACCESS_TOKEN}`)

readdirSync('./routes').map((item)=> app.use('/api', require('./routes/' + item)) )

app.listen(5000,()=> console.log('server is running on port 5000'))