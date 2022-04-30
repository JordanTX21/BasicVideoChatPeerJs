$(document).ready(function () {

    var peer;
    var conn;
    var theirStream;

    var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

    $('#initialize-form').submit(function(e){
        e.preventDefault();
        initializePeer();
    })

    function muteAudio(status) {
        if(window.localStream) {
            var audioTracks = window.localStream.getAudioTracks()
            if(audioTracks && audioTracks[0]){
                audioTracks[0].enabled = status;
                console.log('audio muted');
            }
        }
    }

    function muteVideo(status) {
        if(window.localStream) {
            var videoTracks = window.localStream.getVideoTracks()
            if(videoTracks && videoTracks[0]){
                videoTracks[0].enabled = status;
                console.log('video muted');
            }
        }
    }

    getUserMedia({ video: true, audio: true }, function (stream) {
        // Set your video displays
        window.localStream = stream;
        var video = document.getElementById('my-video');
        if (typeof video.srcObject == "object") {
            video.srcObject = stream;
            muteVideo(false);
            muteAudio(false);

        } else {
            video.src = URL.createObjectURL(stream);
        }
    }, function (err) {
        console.log("The following error occurred: " + err.name);
        alert('Unable to call ' + err.name)
    });

    function initializePeer(){
        peer = new Peer($('#user-auth').val(),{});

        peer.on('open', function (id) {
            console.log('My peer ID is: ' + id);
            $('#input-user-auth').val(id);
            $('#user-auth').val(id);
        });
    
        peer.on('connection', function (c) {
            conn = c;
            conn.on('data', function (data) {
                console.log('Received: ' + data);
                $('#messages').append(`<li class="list-group-item"><span class="badge rounded-pill bg-primary p-2">${data}</span></li>`);
            });
        });
    
        peer.on('call', function (call) {
            $('#modal-call-advert').modal('show');

            window.call = call;

            $('#btn-acept-call').click(function(){
                call.answer(window.localStream);
                call.on('stream', function (remoteStream) {
                    theirStream = remoteStream;
                    $('#modal-call-advert').modal('hide');
                    $('#modal-current-call').modal('show');
                    $('#their-video').prop('srcObject', remoteStream);
                });

            })

            call.on('close', function () {
                $('#modal-current-call').modal('hide');
                $('#end-call').click();
            });
            $('#btn-reject-call').click(function(){
                call.close();
                $('#modal-call-advert').modal('hide');
            })
            
        });
    
        peer.on('disconnected', function () {
            console.log('Connection lost. Please reconnect');
    
            // Workaround for peer.reconnect deleting previous id
            peer.reconnect();
        });
    
        peer.on('close', function () {
            conn = null;
            console.log('Connection destroyed');
        });
    }

    $('#send-message-form').submit(function (e) {
        e.preventDefault();

        let message = $('#input-send-message').val();

        if (conn && conn.open) {
            $('#input-send-message').val("");
            conn.send(message);
            $('#messages').append(`<li class="list-group-item d-flex justify-content-end"><span class="badge rounded-pill bg-success p-2">${message}</span></li>`);
        } else {
            alert('Ingresa un usario con quien hablar');
        }
    })

    $('#connect-user-form').submit(function (e) {
        e.preventDefault();
        if (conn) {
            conn.close();
        }
        var userId = $('#input-user-connect').val();
        conn = peer.connect(userId);
        conn.on('open', function () {
            console.log('Connected to ' + userId);
            //conn.send('Hello!');
        });
        conn.on('data', function (data) {
            console.log('Received: ' + data);
            $('#messages').append(`<li class="list-group-item"><span class="badge rounded-pill bg-primary p-2">${data}</span></li>`);
        });
        conn.on('close', function (){
            console.log('Connection destroyed');
        })
        peer.on('error', function (err) {
            console.log(err);
            alert('' + err);
        });
    })

    $('#btn-call-user').click(function (e) {
        e.preventDefault();
        if (window.existingCall) {
            window.existingCall.close();
        }

        $('#modal-current-call').modal('show');

        window.call = peer.call($('#input-user-connect').val(), window.localStream);
        
        window.call.on('stream', function (remoteStream) {
            theirStream = remoteStream;
            $('#their-video').prop('srcObject', remoteStream);
        });

        window.call.on('close', function () {
            $('#modal-current-call').modal('hide');
            console.log('Call ended');
        });


    });

    $('#end-call').click(function (e) {
        e.preventDefault();

        muteAudio(false);
        muteVideo(false);

        if(theirStream){
            theirStream.getAudioTracks()[0].enabled = false;
            theirStream.getVideoTracks()[0].enabled = false;
        }
        if(window.call){
            window.call.close();
        }
    })

    
    $('#btn-mute').click(function (e) {
        e.preventDefault();
        if($(this).hasClass('activado')) {
            $(this).removeClass('activado')
            // End established call
            muteAudio(false);
        } else {
            $(this).addClass('activado')
            muteAudio(true);
        }
    })
    $('#btn-camera').click(function (e) {
        e.preventDefault();
        if($(this).hasClass('activado')) {
            $(this).removeClass('activado')
            // End established call
            muteVideo(false);
        } else {
            $(this).addClass('activado')
            muteVideo(true);
        }
    })
})