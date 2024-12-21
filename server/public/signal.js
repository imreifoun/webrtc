const HOST = 'http://localhost:4000';
const socket = io(HOST);

let remoteSK;
let localSK;

// Emit 'get' to server and handle response
socket.emit('get');

socket.on('ready', (data) => {
    remoteSK = data.remote;
    localSK = data.local;

    console.log('local : ', localSK);
    console.log('remote : ', remoteSK);
});

// Get Audio elements
const Alocal = document.getElementById('local');
const Aremote = document.getElementById('remote');

// Get Video elements
const Vlocal = document.getElementById('vlocal');
const Vremote = document.getElementById('vremote');

// Streams

let StreamLocal, StreamRemote, PC;

// Prepare local video stream
const prepare = async () => {
    try{
        const stream = await navigator.mediaDevices.getUserMedia({ video : true, audio: false});
        StreamLocal = stream
        Vlocal.srcObject = stream;
    }
    catch (err){
        if (err.name === 'NotAllowedError') {
            console.error('Permission denied: Unable to access camera');
        } else if (err.name === 'NotFoundError') {
            console.error('No camera found on this device');
        } else {
            console.error('Error accessing media devices:', err);
        }
    }
};

prepare();

const config = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
    ],
};

document.getElementById("call").addEventListener('click', () => {
    PC = new RTCPeerConnection(config)
    
    StreamLocal.getTracks().forEach((track) => {
        PC.addTrack(track, StreamLocal)
    });

    PC.ontrack = (event) => {
        console.log('Detected ! => ', event)
    }
})

document.getElementById("answer").addEventListener('click', () => {
    PC = new RTCPeerConnection(config)

    StreamLocal.getTracks().forEach((track) => {
        PC.addTrack(track, StreamLocal)
    });

    PC.ontrack = (event) => {
        console.log('Detected ! => ', event)
    }

    PC.onicecandidate = (event) => {
        if (event.candidate)
        {
            console.log('ICE: ', event.candidate)
        }
    }

})



/*

The RTCPeerConnection represents a WebRTC connection between the local computer and a remote peer.
- It provides methods to connect to a remote peer, maintain and monitor the connection, and close the connection once it's no longer needed.

*/
