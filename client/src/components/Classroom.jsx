import React, { useEffect, useState, useContext, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import io from 'socket.io-client';
import { FiDownload, FiSend, FiPaperclip, FiUsers, FiMessageSquare, FiUploadCloud, FiArrowLeft, FiVideo } from 'react-icons/fi';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export default function Classroom() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user, token, fetchWithAuth, API_URL } = useContext(AuthContext);

  const [classroom, setClassroom] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('chat');
  const [materialFile, setMaterialFile] = useState(null);
  const [materialName, setMaterialName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [videoMeetingCode, setVideoMeetingCode] = useState('');
  const [success, setSuccess] = useState('');
  
  const socketRef = useRef(null);
  const chatEndRef = useRef(null);
  
  const showSuccessMessage = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(''), 3000);
  };
  
  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" });

  const fetchClassroomDetails = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchWithAuth(`/classroom/${code}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch classroom details');
      setClassroom(data.classroom);
      setMaterials(data.classroom.materials || []);
      const allParticipants = [data.classroom.teacher, ...data.classroom.students];
      setParticipants(allParticipants.filter(p => p) || []);
      const chatRes = await fetchWithAuth(`/classroom/${code}/messages`);
      const chatData = await chatRes.json();
      if(chatRes.ok) setMessages(chatData.messages || []);
      else console.warn("Could not load chat history:", chatData.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [code, fetchWithAuth]);

  useEffect(() => {
    fetchClassroomDetails();
  }, [fetchClassroomDetails]);

  useEffect(() => {
    if (!token || !classroom) return;
    socketRef.current = io(`${SOCKET_URL}/classroom-chat`, { auth: { token } });
    socketRef.current.on('connect_error', (err) => {
        console.error('Classroom Socket Connection Error:', err.message);
        setError(`Chat Error: ${err.message}. Please refresh.`);
        socketRef.current.disconnect();
    });
    socketRef.current.emit('join-classroom-chat', { classroomCode: code });
    socketRef.current.on('new-classroom-message', (newMessage) => setMessages(prevMessages => [...prevMessages, newMessage]));
    socketRef.current.on('classroom-error', (errData) => {
        console.error('Classroom Socket Error:', errData.message);
        setError(prev => `${prev ? prev + '\n' : ''}Chat Error: ${errData.message}`);
    });
    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave-classroom-chat', { classroomCode: code });
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [token, code, classroom]);

  useEffect(scrollToBottom, [messages]);

  const generateVideoCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();
  const handleCreateVideoClass = () => navigate(`/meeting/${generateVideoCode()}`);
  const handleJoinVideoClass = () => {
    if (!videoMeetingCode.trim()) return setError('Please enter a class code for the video meeting.');
    navigate(`/meeting/${videoMeetingCode.trim()}`);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (inputMsg.trim() && socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('send-classroom-message', { classroomCode: code, messageText: inputMsg.trim() });
      setInputMsg('');
    } else if (socketRef.current && !socketRef.current.connected) {
        setError("Chat not connected.");
    }
  };

  const handleFileChange = (e) => {
    setMaterialFile(e.target.files[0]);
    if (e.target.files[0] && !materialName) setMaterialName(e.target.files[0].name);
  };

  const handleMaterialUpload = async (e) => {
    e.preventDefault();
    if (!materialFile) return setError('Please select a file.');
    setUploading(true); setError('');
    const formData = new FormData();
    formData.append('materialFile', materialFile);
    formData.append('materialName', materialName || materialFile.name);
    try {
      const res = await fetchWithAuth(`/classroom/${code}/materials`, { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload failed');
      showSuccessMessage('Material uploaded!');
      setMaterialFile(null); setMaterialName('');
      const fileInput = document.getElementById('materialFile');
      if(fileInput) fileInput.value = null;
      fetchClassroomDetails(); 
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading classroom...</div>;
  if (!classroom && error) return <div className="min-h-screen flex flex-col items-center justify-center p-4"><p className="text-red-500 bg-red-100 p-4 rounded-md mb-4 text-center">{error}</p><button onClick={() => navigate(user?.role === 'teacher' ? '/teacher' : '/student')} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Dashboard</button></div>;
  if (!classroom) return <div className="min-h-screen flex items-center justify-center">Classroom data unavailable.</div>;
  
  const isTeacher = user?.role === 'teacher' && classroom?.teacher?._id === user?.id;

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-indigo-700 text-white p-4 shadow-md sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <button onClick={() => navigate(user.role === 'teacher' ? '/teacher' : '/student')} className="hover:bg-indigo-600 p-2 rounded-full mr-2 sm:mr-3" title="Back to Dashboard">
              <FiArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold">{classroom.name} <span className="text-sm font-normal hidden sm:inline">({classroom.code})</span></h1>
              <p className="text-xs sm:text-sm text-indigo-200">Subject: {classroom.subject} | Teacher: {classroom.teacher?.name}</p>
            </div>
          </div>
        </div>
      </header>
      
      <div className="container mx-auto pt-4 px-4">
        {error && !error.toLowerCase().includes("chat") && <p className="bg-red-100 text-red-700 p-3 rounded-md text-sm">{error}</p>}
        {error && error.toLowerCase().includes("chat") && <p className="bg-yellow-100 text-yellow-700 p-3 rounded-md text-sm">{error}</p>}
        {success && <p className="bg-green-100 text-green-700 p-3 rounded-md text-sm">{success}</p>}
      </div>

      <main className="container mx-auto p-4 pt-2 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4 pb-2 border-b"><FiPaperclip className="inline mr-2 text-indigo-600" />Materials</h2>
          {materials.length === 0 ? <p className="text-gray-500 py-4 text-center">No materials.</p> : (
            <ul className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {materials.map(mat => (
                <li key={mat._id} className="p-3 border rounded-md hover:shadow-md bg-gray-50 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                  <div className="flex-grow"><p className="font-medium text-indigo-700 break-all">{mat.originalName||mat.name}</p><p className="text-xs text-gray-500">By: {mat.uploadedBy?.name||'N/A'} on {new Date(mat.uploadedAt).toLocaleDateString()}</p></div>
                  <a href={`${API_URL.replace('/api', '')}${mat.url}`} target="_blank" rel="noopener noreferrer" download={mat.originalName||mat.name} className="flex-shrink-0 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-3 rounded-md text-sm flex items-center justify-center sm:justify-start"><FiDownload className="mr-1"/>Download</a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="md:col-span-1 bg-white rounded-lg shadow-lg flex flex-col" style={{maxHeight: 'calc(100vh - 120px)'}}>
          <div className="flex border-b sticky top-0 bg-white rounded-t-lg z-0">
            <button onClick={()=>setActiveTab('upload')} className={`flex-1 py-3 px-2 text-xs sm:text-sm font-medium focus:outline-none truncate ${activeTab==='upload'?'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50':'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}><FiUploadCloud className="inline mr-1"/>Upload</button>
            <button onClick={()=>setActiveTab('participants')} className={`flex-1 py-3 px-2 text-xs sm:text-sm font-medium focus:outline-none truncate ${activeTab==='participants'?'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50':'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}><FiUsers className="inline mr-1"/>Members ({participants.length})</button>
            <button onClick={()=>setActiveTab('chat')} className={`flex-1 py-3 px-2 text-xs sm:text-sm font-medium focus:outline-none truncate ${activeTab==='chat'?'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50':'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}><FiMessageSquare className="inline mr-1"/>Chat</button>
          </div>
          <div className="flex-grow p-4 overflow-y-auto">
            <section className="bg-indigo-50 p-4 rounded-lg mb-4">
              <h3 className="text-lg font-semibold text-indigo-800 mb-3 flex items-center"><FiVideo className="mr-2" /> Live Video Class</h3>
              {isTeacher ? (
                <button onClick={handleCreateVideoClass} className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-800 font-bold py-2 px-4 rounded-md transition duration-150">Start New Video Class</button>
              ) : (
                <div className="space-y-2">
                  <input type="text" placeholder="Enter live class code" className="w-full border border-gray-300 bg-white text-gray-800 p-2 rounded-md focus:ring-2 focus:ring-yellow-500" value={videoMeetingCode} onChange={e => setVideoMeetingCode(e.target.value.toUpperCase())} />
                  <button onClick={handleJoinVideoClass} className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-800 font-bold py-2 px-4 rounded-md transition duration-150">Join Live Class</button>
                </div>
              )}
            </section>
            
            <div className="mt-4 pt-4 border-t">
              {activeTab==='upload' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700">Upload Material</h3>
                  <form onSubmit={handleMaterialUpload} className="space-y-3">
                    <div><label htmlFor="materialNameUpload" className="block text-sm font-medium text-gray-700">Name (Optional)</label><input type="text" id="materialNameUpload" value={materialName} onChange={e=>setMaterialName(e.target.value)} placeholder="e.g., My Notes Ch.1" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/></div>
                    <div><label htmlFor="materialFile" className="block text-sm font-medium text-gray-700">File</label><input type="file" id="materialFile" onChange={handleFileChange} required className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/></div>
                    <button type="submit" disabled={uploading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50">{uploading?'Uploading...':'Upload'}</button>
                  </form>
                </div>
              )}
              {activeTab==='participants' && (<div className="space-y-2"><h3 className="text-lg font-semibold text-gray-700 mb-2">Members</h3><ul className="space-y-1 text-sm">{participants.map(p=>(<li key={p._id||p.id} className="p-2 rounded hover:bg-gray-100 flex justify-between items-center"><span>{p.name} <span className="text-xs text-gray-500">({p.role})</span></span>{p._id===classroom.teacher._id && <span className="text-xs text-green-600 ml-1 px-1.5 py-0.5 bg-green-100 rounded-full">(Teacher)</span>}</li>))}</ul></div>)}
              {activeTab==='chat' && (<div className="flex flex-col h-full"><div className="flex-1 overflow-y-auto border p-3 rounded-md mb-3 bg-gray-50 space-y-3">{messages.length === 0 && <p className="text-sm text-gray-400 text-center">No messages. Start chatting!</p>}{messages.map((msg,idx)=>(<div key={msg._id||idx} className={`flex ${msg.sender?._id===user?.id?'justify-end':'justify-start'}`}><div className={`max-w-[75%] p-2 rounded-lg shadow ${msg.sender?._id===user?.id?'bg-indigo-500 text-white':'bg-gray-200 text-gray-800'}`}><p className="text-xs font-semibold mb-0.5">{msg.sender?.name||msg.senderName||'User'}</p><p className="text-sm break-words">{msg.text}</p><p className="text-xs opacity-70 mt-1 text-right">{new Date(msg.timestamp).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</p></div></div>))}<div ref={chatEndRef}/></div><form onSubmit={handleSendMessage} className="flex sticky bottom-0 bg-white py-2"><input type="text" className="flex-1 border border-gray-300 rounded-l-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Message..." value={inputMsg} onChange={e=>setInputMsg(e.target.value)}/><button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 sm:px-4 py-2 rounded-r-md font-semibold flex items-center"><FiSend size={16} className="mr-0 sm:mr-2"/><span className="hidden sm:inline">Send</span></button></form></div>)}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
