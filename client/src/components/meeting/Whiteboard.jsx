import React, { useCallback, useEffect, useState } from 'react';
import { Tldraw, useEditor } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';

// The Whiteboard component receives the socket instance from Meeting.jsx
export const Whiteboard = ({ socket, roomCode }) => {
  const [editor, setEditor] = useState(null);

  // Callback to store the editor instance once it's ready
  const setApp = useCallback((editor) => {
    setEditor(editor);
  }, []);

  // Effect for sending local changes to other users
  useEffect(() => {
    if (!editor) return;

    // Function to handle changes in the editor (drawing, moving, etc.)
    const handleChange = (change) => {
      // We only want to send changes made by the user, not by receiving remote data
      if (change.source !== 'user') return;
      
      // Emit the change to the server to be broadcast
      socket.emit('drawing-change', { roomCode, change });
    };

    editor.on('change', handleChange);

    return () => {
      editor.off('change', handleChange);
    };
  }, [editor, socket, roomCode]);


  // Effect for receiving changes from other users and applying them
  useEffect(() => {
    if (!editor || !socket) return;
    
    // Function to handle receiving a change from the server
    const handleRemoteChange = (change) => {
      // Apply the received changes to the local editor instance
      // The `store.merge` method is the correct way to apply remote changes
      editor.store.merge(change);
    };

    socket.on('drawing-update', handleRemoteChange);

    return () => {
      socket.off('drawing-update', handleRemoteChange);
    };
  }, [editor, socket]);


  return (
    <div style={{ position: 'fixed', inset: 40, zIndex: 100 }}>
        <Tldraw onMount={setApp}>
            {/* You can add custom UI components inside here if needed */}
        </Tldraw>
    </div>
  );
};