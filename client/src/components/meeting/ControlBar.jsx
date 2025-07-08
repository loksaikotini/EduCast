import React from 'react';
import { FiMic, FiMicOff, FiVideo, FiVideoOff, FiThumbsUp, FiMessageCircle, FiUsers, FiEdit3 } from 'react-icons/fi';

const ControlBar = ({
  onToggleMute, muted,
  onToggleVideo, videoOff,
  onToggleScreenShare, screenSharing,
  onToggleHandRaise, handRaised,
  onToggleWhiteboard, isWhiteboardOpen,
  onToggleChat, chatOpen,
  onToggleParticipants, participantsOpen,
}) => {
  return (
    <footer className="flex justify-center items-center gap-2 sm:gap-4 py-2 border-t border-gray-700 bg-[#171717]">
      <button onClick={onToggleMute} className={`p-2 sm:p-3 rounded-full border ${muted ? 'bg-red-600 border-red-600' : 'bg-gray-700 border-gray-600 hover:border-green-400'}`} title={muted ? 'Unmute Mic' : 'Mute Mic'}>
        <FiMicOff size={20} className={muted ? '' : 'hidden'} /><FiMic size={20} className={muted ? 'hidden' : ''} />
      </button>
      <button onClick={onToggleVideo} disabled={screenSharing} className={`p-2 sm:p-3 rounded-full border ${videoOff || screenSharing ? 'bg-red-600 border-red-600' : 'bg-gray-700 border-gray-600 hover:border-green-400'} ${screenSharing ? 'opacity-50 cursor-not-allowed' : ''}`} title={videoOff ? 'Start Video' : 'Stop Video'}>
        <FiVideoOff size={20} className={(videoOff || screenSharing) ? '' : 'hidden'} /><FiVideo size={20} className={(videoOff || screenSharing) ? 'hidden' : ''} />
      </button>
      <button onClick={onToggleScreenShare} className={`p-2 sm:p-3 rounded-full border ${screenSharing ? 'bg-green-600 border-green-600' : 'bg-gray-700 border-gray-600 hover:border-green-400'}`} title={screenSharing ? "Stop Screen Share" : "Share Screen"}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M12 3v4M8 3h8" /></svg>
      </button>
      <button onClick={onToggleHandRaise} className={`p-2 sm:p-3 rounded-full border ${handRaised ? 'bg-yellow-500 text-black border-yellow-500' : 'bg-gray-700 border-gray-600 hover:border-yellow-400'}`} title={handRaised ? "Lower Hand" : "Raise Hand"}>
        <FiThumbsUp size={20} />
      </button>
      <button 
        onClick={onToggleWhiteboard} 
        className={`p-2 sm:p-3 rounded-full border ${isWhiteboardOpen ? 'bg-blue-500 border-blue-500' : 'bg-gray-700 border-gray-600 hover:border-blue-400'}`} 
        title="Toggle Whiteboard"
      >
        <FiEdit3 size={20}/>
      </button>
      <button onClick={onToggleChat} className={`p-2 sm:p-3 rounded-full border ${chatOpen ? 'bg-blue-500 border-blue-500' : 'bg-gray-700 border-gray-600 hover:border-blue-400'}`} title="Toggle Chat">
        <FiMessageCircle size={20} />
      </button>
      <button onClick={onToggleParticipants} className={`p-2 sm:p-3 rounded-full border ${participantsOpen ? 'bg-blue-500 border-blue-500' : 'bg-gray-700 border-gray-600 hover:border-blue-400'}`} title="Toggle Participants">
        <FiUsers size={20} />
      </button>
    </footer>
  );
};

export default ControlBar;