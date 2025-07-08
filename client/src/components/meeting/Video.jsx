import React, { useEffect, useRef } from 'react';
import { FiVideoOff } from 'react-icons/fi';

const Video = React.forwardRef(({ peer, videoOff = false, isLocal = false, muted = false }, ref) => {
  const internalRef = useRef();
  const videoRef = ref || internalRef;

  useEffect(() => {
    if (peer) {
      const handleStream = stream => { if (videoRef.current) videoRef.current.srcObject = stream; };
      peer.on('stream', handleStream);
      if (peer.streams && peer.streams[0] && videoRef.current) videoRef.current.srcObject = peer.streams[0];
      const handleClose = () => { if (videoRef.current) videoRef.current.srcObject = null; };
      const handleError = (err) => { console.error("Error on remote peer for video:", err); if (videoRef.current) videoRef.current.srcObject = null; };
      peer.on('close', handleClose);
      peer.on('error', handleError);
      return () => { peer.off('stream', handleStream); peer.off('close', handleClose); peer.off('error', handleError); };
    }
  }, [peer, videoRef]);

  return (
    <div className="relative w-full h-full bg-black rounded-lg shadow-md overflow-hidden aspect-video">
      <video ref={videoRef} muted={isLocal || muted} autoPlay playsInline className={`w-full h-full object-cover transition-opacity duration-300 ${videoOff && isLocal ? 'opacity-0' : 'opacity-100'}`} />
      {videoOff && isLocal && (<div className="absolute inset-0 flex items-center justify-center bg-gray-700/80"><FiVideoOff size={36} className="text-gray-300" /></div>)}
      {!isLocal && peer?.destroyed && (<div className="absolute inset-0 flex items-center justify-center bg-gray-700/80"><p className="text-xs text-gray-400">Stream ended</p></div>)}
    </div>
  );
});

export default Video;