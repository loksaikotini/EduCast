import React, { useState } from 'react';

export default function CreateClassroomModal({ isOpen, onClose, onCreate }) {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !subject.trim()) {
      setError('Name and Subject are required.');
      return;
    }
    setError('');
    onCreate({ name, subject });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800">Create New Classroom</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="classroomName" className="block text-sm font-medium text-gray-700">Classroom Name</label>
            <input
              type="text"
              id="classroomName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
              placeholder="e.g., Morning Physics Batch A"
              required
            />
          </div>
          <div>
            <label htmlFor="classroomSubject" className="block text-sm font-medium text-gray-700">Subject</label>
            <input
              type="text"
              id="classroomSubject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
              placeholder="e.g., Physics"
              required
            />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-100 p-2 rounded">{error}</p>}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
            >
              Create Classroom
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}