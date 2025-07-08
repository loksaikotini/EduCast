import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // NEW: State for success messages
  const [success, setSuccess] = useState('');

  const navigate = useNavigate();
  const { API_URL } = useContext(AuthContext);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (password.length < 6) {
      // REPLACED: alert() with setError()
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      
      // REPLACED: alert() with setSuccess() and a delayed navigation
      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (err) {
      console.error("Register error:", err);
      setError(err.message || 'Server error or network issue');
    } finally {
      // Don't set loading to false if we are navigating away
      if (!success) {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 space-y-6">
        <h2 className="text-3xl font-bold text-center text-indigo-600">Create an Account</h2>

        <div className="flex justify-center space-x-6 border-b pb-4">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="role"
              value="student"
              className="form-radio h-5 w-5 text-indigo-600"
              checked={role === 'student'}
              onChange={() => setRole('student')}
            />
            <span className="text-gray-700">I am a Student</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="role"
              value="teacher"
              className="form-radio h-5 w-5 text-indigo-600"
              checked={role === 'teacher'}
              onChange={() => setRole('teacher')}
            />
            <span className="text-gray-700">I am a Teacher</span>
          </label>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Form inputs are unchanged */}
          <div>
            <label htmlFor="name" className="text-sm font-medium text-gray-700">Full Name</label>
            <input id="name" type="text" placeholder="John Doe" className="mt-1 w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="email_register" className="text-sm font-medium text-gray-700">Email</label>
            <input id="email_register" type="email" placeholder="you@example.com" className="mt-1 w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="password_register" className="text-sm font-medium text-gray-700">Password</label>
            <input id="password_register" type="password" placeholder="Minimum 6 characters" className="mt-1 w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          
          {/* NEW: Display for success or error messages */}
          {error && <p className="text-red-600 text-sm text-center bg-red-100 p-2 rounded-md">{error}</p>}
          {success && <p className="text-green-600 text-sm text-center bg-green-100 p-2 rounded-md">{success}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-md font-semibold transition duration-150 ease-in-out disabled:opacity-50"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
