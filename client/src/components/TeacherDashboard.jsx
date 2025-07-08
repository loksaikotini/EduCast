import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import CreateClassroomModal from './CreateClassroomModal';
import { FiLogOut, FiPlusSquare, FiArrowRight, FiTrash2 } from 'react-icons/fi';

export default function TeacherDashboard() {
  const [createdClassCode, setCreatedClassCode] = useState('');
  const [ownedClassrooms, setOwnedClassrooms] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const navigate = useNavigate();
  const { user, logout, fetchWithAuth } = useContext(AuthContext);

  const showSuccessMessage = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(''), 3000);
  };
  
  const fetchOwnedClassrooms = useCallback(async () => {
    setError('');
    try {
      const res = await fetchWithAuth('/classroom/teacher/owned');
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch owned classrooms');
      setOwnedClassrooms(data.classrooms || []);
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    if (user) fetchOwnedClassrooms();
  }, [user, fetchOwnedClassrooms]);

  const generateVideoCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

  const handleCreateVideoClass = () => {
    const code = generateVideoCode();
    setCreatedClassCode(code);
    navigate(`/meeting/${code}`);
  };

  const handleOpenCreateClassroomModal = () => setIsModalOpen(true);
  const handleCloseCreateClassroomModal = () => setIsModalOpen(false);

  const handleCreatePersistentClassroom = async ({ name, subject }) => {
    setError('');
    setActionLoading(true);
    try {
      const res = await fetchWithAuth('/classroom/create', { method: 'POST', body: JSON.stringify({ name, subject }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create classroom');
      handleCloseCreateClassroomModal();
      fetchOwnedClassrooms();
      navigate(`/classroom/${data.classroom.code}`);
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteClassroom = async (classroom_code) => {
    if (!window.confirm("Are you sure you want to delete this classroom? This action is irreversible and will remove all associated materials and chat history.")) return;
    setError('');
    setActionLoading(true);
    try {
      const res = await fetchWithAuth(`/classroom/${classroom_code}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete classroom");
      showSuccessMessage(data.message || "Classroom deleted successfully");
      fetchOwnedClassrooms();
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex justify-center items-center"><p>Loading dashboard...</p></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-pink-500 text-white p-4 md:p-8">
      <CreateClassroomModal isOpen={isModalOpen} onClose={handleCloseCreateClassroomModal} onCreate={handleCreatePersistentClassroom} />
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Teacher Dashboard: {user?.name}</h1>
        <button onClick={logout} className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg shadow flex items-center">
          <FiLogOut className="mr-2" /> Logout
        </button>
      </header>
      
      {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-sm">{error}</p>}
      {success && <p className="bg-green-100 text-green-700 p-3 rounded-md mb-4 text-sm">{success}</p>}
      {actionLoading && <p className="bg-blue-100 text-blue-700 p-3 rounded-md mb-4 text-sm">Processing your request...</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <section className="bg-white/20 backdrop-blur-md p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold mb-3 text-pink-100">Create Live Class (Video)</h2>
            <button onClick={handleCreateVideoClass} className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-800 font-bold py-3 rounded-md transition duration-150">
              Start New Video Class
            </button>
            {createdClassCode && (<p className="mt-3 text-sm text-green-200 bg-green-700/50 p-2 rounded">Live class started! Code: <span className="font-mono">{createdClassCode}</span> (Navigating...)</p>)}
          </section>
          <section className="bg-white/20 backdrop-blur-md p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold mb-3 text-pink-100">Manage Classrooms</h2>
            <button onClick={handleOpenCreateClassroomModal} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-md transition duration-150 flex items-center justify-center">
              <FiPlusSquare className="mr-2"/> Create New Classroom
            </button>
          </section>
        </div>
        <div className="md:col-span-2 bg-white/10 backdrop-blur-md p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-semibold mb-6 text-pink-100 border-b border-white/20 pb-3">My Created Classrooms</h2>
          {!loading && ownedClassrooms.length === 0 && (<p className="text-center text-pink-200 py-8">You haven't created any classrooms yet. <br/>Use the button on the left to create one!</p>)}
          <div className="space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto pr-2">
            {ownedClassrooms.map((room) => (
              <div key={room.code} className="bg-white/20 hover:bg-white/30 p-4 rounded-lg shadow-md transition-all duration-200 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-white">{room.name}</h3>
                  <p className="text-sm text-pink-200">Subject: {room.subject}</p>
                  <p className="text-xs text-pink-300">Code: {room.code}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Link to={`/classroom/${room.code}`} className="bg-indigo-500 hover:bg-indigo-400 text-white font-semibold py-2 px-4 rounded-md transition duration-150 flex items-center text-sm">
                    Manage <FiArrowRight className="ml-2"/>
                  </Link>
                  <button onClick={() => handleDeleteClassroom(room.code)} title="Delete Classroom" className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-md transition duration-150" disabled={actionLoading}>
                    <FiTrash2 size={16}/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
