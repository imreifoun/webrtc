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

// Get Video elements
const Vlocal = document.getElementById('vlocal');
const Vremote = document.getElementById('vremote');

// Streams
let StreamLocal = null,
    StreamRemote = null,
    PC;

// Prepare local video stream
const prepare = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        StreamLocal = stream;
        Vlocal.srcObject = stream;
        OnInit();
    } catch (err) {
        console.error("Error accessing media devices:", err);
    }
};

prepare();

const config = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

const OnInit = () => {
    PC = new RTCPeerConnection(config);

    StreamLocal.getTracks().forEach((track) => {
        PC.addTrack(track, StreamLocal);
    });

    PC.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
            Vremote.srcObject = event.streams[0];
        } else {
            const stream = new MediaStream();
            stream.addTrack(event.track);
            Vremote.srcObject = stream;
        }
    };

    PC.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('route', { to: remoteSK, route: event.candidate });
        }
    };
};

document.getElementById("call").addEventListener('click', async () => {
    if (!remoteSK) {
        console.error("Remote peer not ready. Please wait.");
        return;
    }
    const offer = await PC.createOffer();
    await PC.setLocalDescription(offer);
    socket.emit('offer', { to: remoteSK, offer });
});

socket.on('ice', async ({ route }) => {
    if (route) {
        await PC.addIceCandidate(new RTCIceCandidate(route));
    }
});

socket.on('answer', async (answer) => {
    try {
        await PC.setRemoteDescription(answer);
    } catch (err) {
        console.error("Error setting remote description:", err);
    }
});

socket.on('offer', async (offer) => {
    try {
        await PC.setRemoteDescription(offer);
        const answer = await PC.createAnswer();
        await PC.setLocalDescription(answer);
        socket.emit('answer', { to: remoteSK, answer });
    } catch (err) {
        console.error("Error handling offer:", err);
    }
});
