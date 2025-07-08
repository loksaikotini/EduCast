import React from 'react';
import { FiShare, FiCopy, FiPhoneOff } from 'react-icons/fi';

const MeetingHeader = ({ code, onLeave, onShare, copiedIndicator }) => {
  return (
    <header className="flex justify-between items-center p-3 border-b border-gray-700">
      <div className="flex items-center gap-2">
        <div className="text-lg font-semibold">Meeting: <span className="font-mono text-green-400">{code}</span></div>
        <div className="relative group">
          <button className="p-2 rounded-full hover:bg-gray-700 transition-colors" title="Share Meeting Info"><FiShare size={20} /></button>
          <div className="absolute left-0 mt-2 w-36 bg-gray-700 rounded-md shadow-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200 z-10 invisible group-hover:visible group-focus-within:visible">
            <button 
              onClick={() => onShare('code')} 
              className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-600 rounded-md flex items-center gap-2"
            >
              <FiCopy size={14} /> Copy Code
            </button>
          </div>
        </div>
        {copiedIndicator && (<span className="ml-2 px-2 py-1 bg-green-500 text-white text-xs rounded-md animate-pulse">{copiedIndicator}</span>)}
      </div>
      <button onClick={onLeave} className="bg-red-600 hover:bg-red-700 p-2 rounded-full" title="Leave Meeting"><FiPhoneOff size={24} /></button>
    </header>
  );
};

export default MeetingHeader;