const http = require('http')
const {Server} = require('socket.io')
const express = require('express')

const PORT = 4000
const config = {
    cors:{
        origin: "*"
    }
}

const app = express()  
const server = http.createServer(app)
const io = new Server(server, config)

app.use(express.static('public'))


server.listen(PORT, () => {
    console.log('server is runing on : ', PORT)   
})