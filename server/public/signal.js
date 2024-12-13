
const HOST = 'localhost:4000'
const socket = io(HOST)

let remoteSK;
let localSK;

socket.emit('get')
socket.on('ready', (data) => {
    remoteSK = data.remote
    localSK = data.local

    console.log('local : ', remoteSK)
    console.log('remote : ', localSK)
})

