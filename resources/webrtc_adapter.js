/*
This will determine whether the browser is chrome or FF and then migrate the browser specific API calls to generic ones so that the rest of the code doesn't have to check and, based on what browser is being used, execute a different function.
*/
var RTCPeerConnection = null;
var getUserMedia = null;
var attachMediaStream = null;
var reattachMediaStream = null;
var webrtcDetectedBrowser = null;

function trace(text) {
// This function is used for logging.
	if (text[text.length - 1] == '\n') {
		text = text.substring(0, text.length - 1);
		}
	}


if (navigator.mozGetUserMedia) {

	webrtcDetectedBrowser = "firefox";
	
	// The RTCPeerConnection object.
	RTCPeerConnection = mozRTCPeerConnection;
	
	// The RTCSessionDescription object.
	RTCSessionDescription = mozRTCSessionDescription;
	
	// The RTCIceCandidate object.
	RTCIceCandidate = mozRTCIceCandidate;
	
	// Get UserMedia (only difference is the prefix).
	// Code from Adam Barth.
	getUserMedia = navigator.mozGetUserMedia.bind(navigator);

	// Attach a media stream to an element.
	attachMediaStream = function(element, stream) {
		dump("Attaching media stream");
		element.mozSrcObject = stream;
		element.play();
		};

	reattachMediaStream = function(to, from) {
		dump("Reattaching media stream");
		to.mozSrcObject = from.mozSrcObject;
		to.play();
		};

  // Fake get{Video,Audio}Tracks
	MediaStream.prototype.getVideoTracks = function() {
		return [];
		};

	MediaStream.prototype.getAudioTracks = function() {
		return [];
		};
	}
else if (navigator.webkitGetUserMedia) {
	dump("This appears to be Chrome");
	
	webrtcDetectedBrowser = "chrome";
	
	// The RTCPeerConnection object.
	RTCPeerConnection = webkitRTCPeerConnection;
	
	// Get UserMedia (only difference is the prefix).
	// Code from Adam Barth.
	getUserMedia = navigator.webkitGetUserMedia.bind(navigator);

  // Attach a media stream to an element.
	attachMediaStream = function(element, stream) {
		if (typeof element.srcObject !== 'undefined') {element.srcObject = stream;}
		else if (typeof element.mozSrcObject !== 'undefined') {element.mozSrcObject = stream;}
		else if (typeof element.src !== 'undefined') {element.src = URL.createObjectURL(stream);}
		else {dump('Error attaching stream to element.');}
		};

	reattachMediaStream = function(to, from) {
		to.src = from.src;
		};

  // The representation of tracks in a stream is changed in M26.
  // Unify them for earlier Chrome versions in the coexisting period.
	if (!webkitMediaStream.prototype.getVideoTracks) {
		webkitMediaStream.prototype.getVideoTracks = function() {return this.videoTracks;};
	    webkitMediaStream.prototype.getAudioTracks = function() {return this.audioTracks;};
		}

// New syntax of getXXXStreams method in M26.
	if (!webkitRTCPeerConnection.prototype.getLocalStreams) {
		webkitRTCPeerConnection.prototype.getLocalStreams = function() {return this.localStreams;};
		webkitRTCPeerConnection.prototype.getRemoteStreams = function() {return this.remoteStreams;};
		}
	}
else {
	dump("Browser does not appear to be WebRTC-capable");
	}