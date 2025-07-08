import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FiLogOut, FiPlusCircle, FiArrowRight, FiTrash2 } from 'react-icons/fi';

export default function StudentDashboard() {
  const [classCode, setClassCode] = useState('');
  const [classroomCodeInput, setClassroomCodeInput] = useState('');
  const [enrolledClassrooms, setEnrolledClassrooms] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [joinLoading, setJoinLoading] = useState(false); 

  const navigate = useNavigate();
  const { user, logout, fetchWithAuth } = useContext(AuthContext);

  const fetchEnrolledClassrooms = useCallback(async () => {
    setError('');
    try {
      const res = await fetchWithAuth('/classroom/student/enrolled');
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch enrolled classrooms');
      }
      setEnrolledClassrooms(data.classrooms || []);
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false); 
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    if (user) {
      fetchEnrolledClassrooms();
    }
  }, [user, fetchEnrolledClassrooms]);

  const handleJoinVideoClass = async () => {
    if (!classCode.trim()) return alert('Enter a class code for the video meeting');
    setJoinLoading(true);
    setError('');
    try {
      const res = await fetchWithAuth(`/meetings/check/${classCode.trim()}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Meeting not found.');
      }
      navigate(`/meeting/${classCode.trim()}`);
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setJoinLoading(false);
    }
  };

  const handleJoinClassroom = async (e) => {
    e.preventDefault();
    if (!classroomCodeInput.trim()) return alert('Enter a classroom code to join');
    setError('');
    setJoinLoading(true); 
    try {
      const res = await fetchWithAuth(`/classroom/${classroomCodeInput.trim()}/join`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to join classroom');
      setClassroomCodeInput('');
      fetchEnrolledClassrooms();
      alert(data.message || 'Successfully joined classroom!');
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setJoinLoading(false);
    }
  };

  const handleLeaveClassroom = async (classroom_code) => {
    if (!window.confirm("Are you sure you want to leave this classroom?")) return;
    setError('');
    setJoinLoading(true);
    try {
        const res = await fetchWithAuth(`/classroom/${classroom_code}/leave`, { method: 'POST' });
        const data = await res.json();
        if(!res.ok) throw new Error(data.message || "Failed to leave classroom");
        alert(data.message || "Successfully left classroom");
        fetchEnrolledClassrooms();
    } catch (err) {
        setError(err.message);
        console.error(err);
    } finally {
        setJoinLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex justify-center items-center"><p>Loading dashboard...</p></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-4 md:p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Welcome, {user?.name}!</h1>
        <button
          onClick={logout}
          className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg shadow flex items-center"
        >
          <FiLogOut className="mr-2" /> Logout
        </button>
      </header>

      {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-sm">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <section className="bg-white/20 backdrop-blur-md p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold mb-3 text-indigo-100">Join Live Class (Video)</h2>
            <input
              type="text"
              placeholder="Enter live class code"
              className="w-full border border-indigo-300 bg-white/80 text-gray-800 p-3 rounded-md mb-3 focus:ring-2 focus:ring-yellow-400"
              value={classCode}
              onChange={e => setClassCode(e.target.value.toUpperCase())}
            />
            <button
              onClick={handleJoinVideoClass}
              disabled={joinLoading}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-800 font-bold py-3 rounded-md transition duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {joinLoading ? 'Checking...' : 'Join Live Class'}
            </button>
          </section>

          <section className="bg-white/20 backdrop-blur-md p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold mb-3 text-indigo-100">Join a Classroom</h2>
            <form onSubmit={handleJoinClassroom} className="space-y-3">
              <input
                type="text"
                placeholder="Enter classroom code"
                className="w-full border border-indigo-300 bg-white/80 text-gray-800 p-3 rounded-md focus:ring-2 focus:ring-green-400"
                value={classroomCodeInput}
                onChange={e => setClassroomCodeInput(e.target.value.toUpperCase())}
              />
              <button
                type="submit"
                disabled={joinLoading}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-md transition duration-150 disabled:opacity-60 flex items-center justify-center"
              >
                <FiPlusCircle className="mr-2"/> Join Classroom
              </button>
            </form>
          </section>
        </div>

        <div className="md:col-span-2 bg-white/10 backdrop-blur-md p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-semibold mb-6 text-indigo-100 border-b border-white/20 pb-3">My Enrolled Classrooms</h2>
          {!loading && enrolledClassrooms.length === 0 && (
            <p className="text-center text-indigo-200 py-8">You haven't joined any classrooms yet. <br/>Use the form on the left to join one!</p>
          )}
          <div className="space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto pr-2">
            {enrolledClassrooms.map((room) => (
              <div key={room.code} className="bg-white/20 hover:bg-white/30 p-4 rounded-lg shadow-md transition-all duration-200 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-white">{room.name}</h3>
                  <p className="text-sm text-indigo-200">Subject: {room.subject}</p>
                  <p className="text-xs text-indigo-300">Code: {room.code} | Teacher: {room.teacher?.name || 'N/A'}</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Link
                    to={`/classroom/${room.code}`}
                    className="bg-indigo-500 hover:bg-indigo-400 text-white font-semibold py-2 px-4 rounded-md transition duration-150 flex items-center text-sm"
                    >
                    View <FiArrowRight className="ml-2"/>
                    </Link>
                    <button
                        onClick={() => handleLeaveClassroom(room.code)}
                        title="Leave Classroom"
                        disabled={joinLoading}
                        className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-md transition duration-150 disabled:opacity-60"
                    >
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