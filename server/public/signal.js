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

// Get video elements
const Alocal = document.getElementById('local');
const Aremote = document.getElementById('remote');

// Prepare local video stream
const prepare = async () => {
    try{
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true});
        Alocal.srcObject = stream;
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
