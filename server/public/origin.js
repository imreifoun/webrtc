const socket = io('http://localhost:3000');

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

let localStream;
let peerConnection;

// Start call button
document.getElementById('startCall').addEventListener('click', () => {
  peerConnection = new RTCPeerConnection(config);

  // Listen for ICE candidates
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('signal', {
        to: 'other-user-id',
        type: 'ice-candidate',
        candidate: event.candidate,
      });
    }
  };

  // Create offer and send to signaling server
    peerConnection.createOffer()
    .then((offer) => {
      peerConnection.setLocalDescription(offer);
      socket.emit('signal', { to: 'other-user-id', type: 'offer', offer });
    });
});

// Handle signaling messages
socket.on('signal', async (data) => {
  if (data.type === 'offer') {
    peerConnection = new RTCPeerConnection(config);

    // Add local tracks
    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream);
    });

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('signal', {
          to: data.from,
          type: 'ice-candidate',
          candidate: event.candidate,
        });
      }
    };

    // Handle remote tracks
    peerConnection.ontrack = (event) => {
      remoteVideo.srcObject = event.streams[0];
    };

    // Set remote description and create answer
    await peerConnection.setRemoteDescription(data.offer);

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit('signal', { to: data.from, type: 'answer', answer });



  } else if (data.type === 'answer') {
    await peerConnection.setRemoteDescription(data.answer);

  } else if (data.type === 'ice-candidate') {
    await peerConnection.addIceCandidate(data.candidate);
  }
});
