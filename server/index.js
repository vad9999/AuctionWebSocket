const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const app = express()

app.use(cors())
app.use(bodyParser.json())

const http = require('http').createServer(app)
const io = require('socket.io')(http, {
    cors: {
        origin: 'http://localhost:5173',
        methods: ['PUT', 'POST']
    }
})

io.on('connection', (socket) => {
    socket.on('message', (msg) => {
        socket.emit('console', msg)
    })
})