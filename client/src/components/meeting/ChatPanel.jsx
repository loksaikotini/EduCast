import React from 'react';

const ChatPanel = ({ messages, messageInput, onMessageChange, onSendMessage, localSocketId, participants }) => {
  return (
    <>
      <div className="flex flex-col gap-2 mb-3 max-h-[calc(100vh-280px)] overflow-y-auto">
        {messages.length === 0 && <p className="text-gray-400 text-center text-sm">No messages yet.</p>}
        {messages.map(msg => (
          <div key={msg.id} className={`p-2 rounded-lg max-w-[85%] text-sm ${msg.sender === localSocketId ? 'bg-green-700 self-end' : 'bg-gray-600 self-start'}`}>
            <div className="text-xs text-gray-300 mb-0.5">{msg.senderName || participants.find(p => p.id === msg.sender)?.name || `User-${msg.sender?.slice(0, 4)}`}</div>
            <div>{msg.text}</div>
          </div>
        ))}
      </div>
      <form onSubmit={onSendMessage} className="flex gap-2 mt-auto sticky bottom-0 bg-[#28292C] py-2">
        <input
          type="text"
          value={messageInput}
          onChange={onMessageChange}
          placeholder="Type a message..."
          className="flex-1 rounded px-3 py-2 bg-gray-700 text-white text-sm focus:outline-none focus:ring-1 focus:ring-green-400"
        />
        <button type="submit" className="bg-green-500 px-3 rounded hover:bg-green-600 text-sm">Send</button>
      </form>
    </>
  );
};

export default ChatPanel;