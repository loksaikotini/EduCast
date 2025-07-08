import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-600 to-blue-400 text-white p-6 overflow-hidden">
      
      <img
        src="/EduCast.png" 
        alt="EduCast Logo"
        className="w-48 h-48 mb-8 animate-float" 
      />

      <h1 className="text-5xl font-bold mb-6 text-center">Welcome to EduCast</h1>
      
      <p className="mb-8 text-xl max-w-xl text-center">
        Seamless video classes and collaborative learning — powered by EduCast.
      </p>
      
      <div className="space-x-6">
        <Link to="/login" className="px-6 py-3 bg-white text-indigo-700 font-semibold rounded-lg shadow-lg hover:bg-indigo-100 transition-transform transform hover:scale-105">
          Login
        </Link>
        <Link to="/register" className="px-6 py-3 border-2 border-white font-semibold rounded-lg hover:bg-white hover:text-indigo-700 transition-transform transform hover:scale-105">
          Register
        </Link>
      </div>
    </div>
  );
}
