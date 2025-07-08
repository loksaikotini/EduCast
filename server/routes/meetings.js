const express = require('express');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

module.exports = (meetingRooms) => {
  
  router.get('/check/:code', authenticate, (req, res) => {
    const { code } = req.params;

    if (meetingRooms[code] && meetingRooms[code].size > 0) {
      res.status(200).json({ message: 'Room exists and is active.' });
    } else {
      res.status(404).json({ message: 'Meeting room not found or is empty.' });
    }
  });

  return router;
};