require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { readdirSync } = require('fs')

const app = express()

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://insuurance-client.vercel.app')
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.header('Access-Control-Allow-Credentials', 'true')

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200)
  }

  next()
})

app.use(cors())
app.use(morgan('dev'))
app.use(express.json({ limit: '10mb'}))


readdirSync('./routes').map((item)=> app.use('/api', require('./routes/' + item)) )

app.listen(5000,()=> console.log('server is running on port 5000'))