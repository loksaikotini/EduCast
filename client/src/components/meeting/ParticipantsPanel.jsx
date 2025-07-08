import React from 'react';
import { FiThumbsUp } from 'react-icons/fi';

const ParticipantsPanel = ({ participants }) => {
  return (
    <ul className="text-sm">
      {participants.map(p => (
        <li key={p.id} className="flex items-center justify-between p-2 border-b border-gray-700 last:border-b-0">
          <span>{p.name}</span>
          {p.handRaised && <FiThumbsUp title="Hand Raised" className="text-yellow-400" />}
        </li>
      ))}
    </ul>
  );
};

export default ParticipantsPanel;