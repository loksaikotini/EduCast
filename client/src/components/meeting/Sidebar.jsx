import React from 'react';
import { FiMessageCircle, FiUsers } from 'react-icons/fi';
import ChatPanel from './ChatPanel';
import ParticipantsPanel from './ParticipantsPanel';

const Sidebar = ({
  chatOpen,
  participantsOpen,
  setChatOpen,
  setParticipantsOpen,
  ...props
}) => {
  if (!chatOpen && !participantsOpen) return null;

  return (
    <aside className="w-72 md:w-80 bg-[#28292C] border-l border-gray-700 flex flex-col">
      <div className="flex border-b border-gray-700">
        <button
          className={`flex-1 p-3 flex items-center justify-center gap-2 font-semibold text-sm ${chatOpen ? 'bg-gray-600' : 'hover:bg-gray-700'}`}
          onClick={() => { setChatOpen(true); setParticipantsOpen(false); }}
        >
          <FiMessageCircle size={18} />Chat
        </button>
        <button
          className={`flex-1 p-3 flex items-center justify-center gap-2 font-semibold text-sm ${participantsOpen ? 'bg-gray-600' : 'hover:bg-gray-700'}`}
          onClick={() => { setParticipantsOpen(true); setChatOpen(false); }}
        >
          <FiUsers size={18} />Members ({props.participants.length})
        </button>
      </div>
      <div className="flex-grow overflow-y-auto p-3">
        {chatOpen && <ChatPanel {...props} />}
        {participantsOpen && <ParticipantsPanel participants={props.participants} />}
      </div>
    </aside>
  );
};

export default Sidebar;