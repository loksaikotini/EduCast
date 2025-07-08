import React, { useEffect, useRef, useState, useCallback, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import Peer from 'simple-peer/simplepeer.min.js';
import { AuthContext } from '../context/AuthContext';
import MeetingHeader from './meeting/MeetingHeader';
import VideoGrid from './meeting/VideoGrid';
import Sidebar from './meeting/Sidebar';
import ControlBar from './meeting/ControlBar';
import { Whiteboard } from './meeting/Whiteboard';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

export default function Meeting() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);

  const userVideo = useRef();
  const peersRef = useRef([]);
  const streamRef = useRef(null);
  const cameraVideoTrackRef = useRef(null);
  const socketRef = useRef();
  const screenSharingRef = useRef(false);

  const [peers, setPeers] = useState([]);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [participants, setParticipants] = useState([]);
  const [handRaised, setHandRaised] = useState(false);
  const [copiedIndicator, setCopiedIndicator] = useState('');
  const [error, setError] = useState('');
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);

  const updateParticipant = useCallback((participantData) => {
    setParticipants(prev => {
      const existingIndex = prev.findIndex(p => p.id === participantData.id);
      if (existingIndex !== -1) {
        return prev.map((p, i) => (i === existingIndex ? { ...p, ...participantData } : p));
      }
      return [...prev, { handRaised: false, ...participantData }];
    });
  }, []);

  useEffect(() => {
    if (!token || !user) {
      navigate('/login', { replace: true });
      return;
    }

    socketRef.current = io(`${SOCKET_URL}/video-meeting`, {
      auth: { token }
    });
    
    socketRef.current.on('connect_error', (err) => {
        console.error('Meeting Socket Connection Error:', err.message);
        setError(`Connection failed: ${err.message}. Please try again.`);
        alert(`Connection failed: ${err.message}. You will be redirected.`);
        navigate(user.role === 'teacher' ? '/teacher' : '/student', { replace: true });
    });

    socketRef.current.on('connect', () => {
        setError('');
        updateParticipant({ id: socketRef.current.id, name: user.name, handRaised: false });

        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
            streamRef.current = stream;
            if (userVideo.current) userVideo.current.srcObject = stream;
            cameraVideoTrackRef.current = stream.getVideoTracks()[0];
            
            socketRef.current.emit('join-room', code);
        }).catch(err => {
            alert('Could not access camera/microphone. Please allow permissions and refresh.');
            console.error("getUserMedia error:", err);
            navigate(-1);
        });
    });
    
    socketRef.current.on('all-users', (usersInRoom) => {
        usersInRoom.forEach(participant => {
            updateParticipant(participant);
            const peer = createPeer(participant.id, socketRef.current.id, streamRef.current);
            if (peer) {
                peersRef.current.push({ peerID: participant.id, peer });
                setPeers(prev => [...prev, peer]);
            }
        });
    });
    
    socketRef.current.on('user-connected', ({ userID, name }) => {
        updateParticipant({ id: userID, name: name });
    });
    
    socketRef.current.on('offer-received', payload => {
        const peer = addPeer(payload.signal, payload.callerID, streamRef.current);
        if (peer) {
            peersRef.current.push({ peerID: payload.callerID, peer });
            setPeers(prev => [...prev, peer]);
        }
    });

    socketRef.current.on('answer-received', payload => {
        const item = peersRef.current.find(p => p.peerID === payload.id);
        item?.peer?.signal(payload.signal);
    });

    socketRef.current.on('user-left', id => {
        setParticipants(prev => prev.filter(p => p.id !== id));
        const peerObjIndex = peersRef.current.findIndex(p => p.peerID === id);
        if (peerObjIndex !== -1) {
            peersRef.current[peerObjIndex].peer?.destroy();
            const peerToRemove = peersRef.current[peerObjIndex].peer;
            peersRef.current.splice(peerObjIndex, 1);
            setPeers(prev => prev.filter(p => p !== peerToRemove));
        }
    });

    socketRef.current.on('receive-message', message => {
        setMessages(prev => [...prev, message])
    });

    socketRef.current.on('user-hand-raised', ({ userId, raised, name }) => {
        updateParticipant({ id: userId, handRaised: raised, name: name });
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave-room', code);
        socketRef.current.disconnect();
      }
      peersRef.current.forEach(p => p.peer?.destroy());
      peersRef.current = [];
      setPeers([]);
      streamRef.current?.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    };
  }, [code, navigate, updateParticipant, user, token]);

  function createPeer(userToSignal, callerID, currentStream) {
    if (!currentStream) { console.error("createPeer: No stream available"); return null; }
    const peer = new Peer({ initiator: true, trickle: false, stream: currentStream });
    peer.on('signal', signal => socketRef.current.emit('sending-offer', { userToSignal, callerID, signal }));
    peer.on('error', err => console.error('Peer creation error for ' + userToSignal, err));
    return peer;
  }
  function addPeer(incomingSignal, callerID, currentStream) {
    if (!currentStream) { console.error("addPeer: No stream available"); return null; }
    if (!incomingSignal) { console.error("addPeer: No incoming signal for " + callerID); return null; }
    const peer = new Peer({ initiator: false, trickle: false, stream: currentStream });
    peer.on('signal', signal => socketRef.current.emit('sending-answer', { signal, callerID }));
    peer.signal(incomingSignal);
    peer.on('error', err => console.error('Peer addition error for ' + callerID, err));
    return peer;
  }

  const toggleMute = () => { if (streamRef.current) { const nMuted = !muted; streamRef.current.getAudioTracks().forEach(track => { track.enabled = !nMuted; }); setMuted(nMuted); }};
  const toggleVideo = () => { if (streamRef.current && !screenSharing) { const nVideoOff = !videoOff; streamRef.current.getVideoTracks().forEach(track => { if (track === cameraVideoTrackRef.current) { track.enabled = !nVideoOff; } }); setVideoOff(nVideoOff); }};
  const leaveMeeting = () => { if (socketRef.current) socketRef.current.disconnect(); navigate(-1); };
  
  const replaceTrackInPeers = useCallback(async (newTrack) => { for (const { peer } of peersRef.current) { if (peer && !peer.destroyed && peer._pc) { const kind = newTrack ? newTrack.kind : (cameraVideoTrackRef.current?.kind || 'video'); const sender = peer._pc.getSenders().find(s => s.track && s.track.kind === kind); if (sender) { try { await sender.replaceTrack(newTrack); } catch(err) { console.error("Error replacing track for peer:", err); }} else if (newTrack && streamRef.current) { try { peer.addTrack(newTrack, streamRef.current); } catch(err) { console.error("Error adding track to peer:", err); }}}}}, []);
  const updateLocalStreamVideo = useCallback((newVideoTrack) => { if (!streamRef.current) return; streamRef.current.getVideoTracks().forEach(oldTrack => { if (oldTrack !== newVideoTrack) { oldTrack.stop(); streamRef.current.removeTrack(oldTrack);}}); if (newVideoTrack && newVideoTrack.readyState === 'live' && !streamRef.current.getVideoTracks().includes(newVideoTrack)) { streamRef.current.addTrack(newVideoTrack);} if (userVideo.current) { const tempStream = new MediaStream(); streamRef.current.getAudioTracks().forEach(track => tempStream.addTrack(track)); const currentVideoTracks = streamRef.current.getVideoTracks(); if (currentVideoTracks.length > 0 && currentVideoTracks[0].readyState === 'live') { tempStream.addTrack(currentVideoTracks[0]);} userVideo.current.srcObject = tempStream;}}, []);
  const toggleScreenShare = useCallback(async () => { if (!streamRef.current) return; if (screenSharingRef.current) { let targetTrack = cameraVideoTrackRef.current; if (!targetTrack || targetTrack.readyState !== 'live') { try { const camStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false }); targetTrack = camStream.getVideoTracks()[0]; cameraVideoTrackRef.current = targetTrack;} catch (err) { console.error("Failed to get camera for stopping screen share", err); targetTrack = null;}} await replaceTrackInPeers(targetTrack); updateLocalStreamVideo(targetTrack); setScreenSharing(false); screenSharingRef.current = false; setVideoOff(targetTrack ? !targetTrack.enabled : true);} else { try { const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: "always" }, audio: false }); const screenVideoTrack = screenStream.getVideoTracks()[0]; if (!cameraVideoTrackRef.current && streamRef.current.getVideoTracks().length > 0) { const currentCameraTrack = streamRef.current.getVideoTracks().find(t => t.kind === 'video' && t.id !== screenVideoTrack.id); if(currentCameraTrack) cameraVideoTrackRef.current = currentCameraTrack;} else if (cameraVideoTrackRef.current && cameraVideoTrackRef.current.readyState !== 'live') { try { const camStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false }); cameraVideoTrackRef.current = camStream.getVideoTracks()[0];} catch (err) { cameraVideoTrackRef.current = null;}} await replaceTrackInPeers(screenVideoTrack); updateLocalStreamVideo(screenVideoTrack); screenVideoTrack.onended = () => { if (screenSharingRef.current) { toggleScreenShare();}}; setScreenSharing(true); screenSharingRef.current = true; setVideoOff(false);} catch (err) { console.error('Screen share error:', err);}}}, [replaceTrackInPeers, updateLocalStreamVideo]);
  useEffect(() => { screenSharingRef.current = screenSharing; }, [screenSharing]);
  
  const sendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !socketRef.current?.connected || !user) return;
    const msgObj = { id: socketRef.current.id + Date.now(), sender: socketRef.current.id, text: messageInput.trim(), senderName: user.name };
    socketRef.current.emit('send-message', code, msgObj);
    setMessageInput('');
  };

  const toggleHandRaise = () => {
    if(!socketRef.current?.connected || !user) return;
    const nHandRaised = !handRaised;
    setHandRaised(nHandRaised);
    socketRef.current.emit('hand-raise', code, { raised: nHandRaised });
    updateParticipant({ id: socketRef.current.id, handRaised: nHandRaised, name: user.name });
  };
  
  const handleShare = async (type) => { let textToCopy = type === 'code' ? code : window.location.href; let successMessage = type === 'code' ? 'Code Copied!' : 'Link Copied!'; try { await navigator.clipboard.writeText(textToCopy); setCopiedIndicator(successMessage); } catch (err) { console.error('Failed to copy: ', err); setCopiedIndicator('Copy failed!'); } setTimeout(() => setCopiedIndicator(''), 2000); };

  if (error) {
    return <div className="min-h-screen bg-[#202124] text-white flex items-center justify-center p-4"><p className="text-red-400 text-center">{error}</p></div>;
  }

  return (
    <div className="min-h-screen bg-[#202124] text-white flex flex-col select-none">
       {isWhiteboardOpen && socketRef.current && (
        <Whiteboard socket={socketRef.current} roomCode={code} />
      )}
      <MeetingHeader
        code={code}
        onLeave={leaveMeeting}
        onShare={handleShare}
        copiedIndicator={copiedIndicator}
      />
      <main className="flex flex-grow overflow-hidden">
        <VideoGrid
          userVideoRef={userVideo}
          peers={peers}
          peersRef={peersRef}
          localVideoState={{ videoOff, screenSharing }}
        />
        <Sidebar
          chatOpen={chatOpen}
          participantsOpen={participantsOpen}
          setChatOpen={setChatOpen}
          setParticipantsOpen={setParticipantsOpen}
          messages={messages}
          messageInput={messageInput}
          onMessageChange={(e) => setMessageInput(e.target.value)}
          onSendMessage={sendMessage}
          localSocketId={socketRef.current?.id}
          participants={participants}
        />
      </main>
      <ControlBar
        onToggleMute={toggleMute} muted={muted}
        onToggleVideo={toggleVideo} videoOff={videoOff}
        onToggleScreenShare={toggleScreenShare} screenSharing={screenSharing}
        onToggleHandRaise={toggleHandRaise} handRaised={handRaised}
        onToggleWhiteboard={() => setIsWhiteboardOpen(prev => !prev)}
        isWhiteboardOpen={isWhiteboardOpen}
        onToggleChat={() => { setChatOpen(prev => !prev); setParticipantsOpen(false); }} chatOpen={chatOpen}
        onToggleParticipants={() => { setParticipantsOpen(prev => !prev); setChatOpen(false); }} participantsOpen={participantsOpen}
      />
    </div>
  );
}