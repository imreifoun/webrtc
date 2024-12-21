const HOST = 'https://webrtc-1-sgbm.onrender.com';
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

let StreamLocal = null, StreamRemote = null, PC;

// Prepare local video stream
const prepare = async () => {
    try{
        const stream = await navigator.mediaDevices.getUserMedia({ video : true, audio: false});
        StreamLocal = stream
        Vlocal.srcObject = stream;
        OnInit()
    }
    catch (err){}
};

prepare();

const config = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
    ],
};

const OnInit = () => {
    PC = new RTCPeerConnection(config)

    StreamLocal.getTracks().forEach((track) => {
        PC.addTrack(track, StreamLocal)
    });
    
    PC.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
            Vremote.srcObject = event.streams[0];
        } else {
            // Fallback: Create a new MediaStream and add the track
            const stream = new MediaStream();
            stream.addTrack(event.track);
            Vremote.srcObject = stream;
        }
    };

    PC.onicecandidate = (event) => {if (event.candidate) socket.emit('route', {to:remoteSK, route: event.candidate})}
}

document.getElementById("call").addEventListener('click', async () => {

    console.log('remoteSK : ', remoteSK)
    if (remoteSK)
    {
        const offer = await PC.createOffer()
        await PC.setLocalDescription(offer) 

        socket.emit('offer', {to:remoteSK, offer: offer})
    }
})

socket.on('ice', async ({ route }) => {
    if (route) {
        await PC.addIceCandidate(new RTCIceCandidate(route));
    }
});

socket.on('answer', async (answer)=>{
    await PC.setRemoteDescription(answer)
})

socket.on('offer', async (offer) => {

    await PC.setRemoteDescription(offer)

    const answer = await PC.createAnswer()
    await PC.setLocalDescription(answer)
    socket.emit('answer', {to:remoteSK, answer: answer})
})




/*

The RTCPeerConnection represents a WebRTC connection between the local computer and a remote peer.
- It provides methods to connect to a remote peer, maintain and monitor the connection, and close the connection once it's no longer needed.

*/
