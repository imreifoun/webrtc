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

const usersSQL = []

io.on('connect', (socket) => {
    console.log('[new] socket id : ', socket.id)
    usersSQL.push(socket.id)
    console.log('usersSQL : ', usersSQL)

    socket.on('get', () => {
        
        let data = {local:null, remote: null}
        if (usersSQL.length >= 2)
        {
           
        }
        else
        {

        }

    })

    socket.on('disconnect', () => {
        usersSQL.splice(usersSQL.indexOf(socket.id), 1)
    })
})