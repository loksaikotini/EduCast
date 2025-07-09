require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const jwt = require('jsonwebtoken');

const Classroom = require('./models/Classroom');
const ChatMessage = require('./models/ChatMessage');
const authRoutes = require('./routes/auth');
const classroomRoutes = require('./routes/classroom');
const meetingRoutes = require('./routes/meetings'); 

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/auth', authRoutes);
app.use('/api/classroom', classroomRoutes);

const meetingRooms = {}; 
app.use('/api/meetings', meetingRoutes(meetingRooms)); 

app.get('/', (req, res) => {
  res.send('EduCast Backend is alive!');
});
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ['GET', 'POST'],
  },
});

const socketAuthMiddleware = (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error("Authentication error: No token provided"));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = { userId: decoded.userId, role: decoded.role, name: decoded.name };
    next();
  } catch (err) {
    return next(new Error("Authentication error: Invalid token"));
  }
};

const videoMeetingNsp = io.of("/video-meeting");

videoMeetingNsp.use(socketAuthMiddleware);

videoMeetingNsp.on('connection', socket => {
  
  socket.on('join-room', roomID => {
    if (!roomID) return;
    
    if (!meetingRooms[roomID]) {
      meetingRooms[roomID] = new Map();
    }
    
    const otherUsersInRoom = [...meetingRooms[roomID].values()];
    
    const participantData = { id: socket.id, name: socket.user.name };
    meetingRooms[roomID].set(socket.id, participantData);
    
    socket.join(roomID);
    socket.currentMeetingRoom = roomID;

    socket.emit('all-users', otherUsersInRoom);
    socket.to(roomID).emit('user-connected', { userID: socket.id, name: socket.user.name });
    
  });

  socket.on('sending-offer', payload => {
    videoMeetingNsp.to(payload.userToSignal).emit('offer-received', { signal: payload.signal, callerID: payload.callerID, });
  });

  socket.on('sending-answer', payload => {
    videoMeetingNsp.to(payload.callerID).emit('answer-received', { signal: payload.signal, id: socket.id, });
  });

  socket.on('send-message', (roomID, message) => {
    if (!roomID || !meetingRooms[roomID] || !meetingRooms[roomID].has(socket.id)) return;
    const fullMessage = { ...message, sender: socket.id, senderName: socket.user.name };
    videoMeetingNsp.to(roomID).emit('receive-message', fullMessage);
  });

  socket.on('hand-raise', (roomID, data) => {
    if (!roomID || !meetingRooms[roomID] || !meetingRooms[roomID].has(socket.id)) return;
    const handRaiseData = { userId: socket.id, raised: data.raised, name: socket.user.name };
    videoMeetingNsp.to(roomID).emit('user-hand-raised', handRaiseData);
  });
  
  socket.on('drawing-change', ({ roomCode, change }) => {
    socket.to(roomCode).volatile.emit('drawing-update', change);
  });

  const handleLeaveMeetingRoom = (socketInstance) => {
    const roomID = socketInstance.currentMeetingRoom;
    if (roomID && meetingRooms[roomID]) {
        meetingRooms[roomID].delete(socketInstance.id);
        socketInstance.leave(roomID);
        videoMeetingNsp.to(roomID).emit('user-left', socketInstance.id);
        if (meetingRooms[roomID].size === 0) {
            delete meetingRooms[roomID];
        }
    }
    socketInstance.currentMeetingRoom = null;
  };

  socket.on('leave-room', () => handleLeaveMeetingRoom(socket));
  socket.on('disconnect', () => {
    handleLeaveMeetingRoom(socket);
  });
});

const classroomChatNsp = io.of("/classroom-chat");
classroomChatNsp.use(socketAuthMiddleware);
classroomChatNsp.on('connection', socket => {

  socket.on('join-classroom-chat', async ({ classroomCode }) => {
    try {
      const classroom = await Classroom.findOne({ code: classroomCode }).select('_id name teacher students');
      if (!classroom) return socket.emit('classroom-error', { message: 'Classroom not found.' });

      const isTeacher = classroom.teacher.toString() === socket.user.userId;
      const isStudent = classroom.students.map(s => s.toString()).includes(socket.user.userId);

      if (!isTeacher && !isStudent) return socket.emit('classroom-error', { message: 'Not authorized for this classroom chat.' });

      const chatRoomId = `classroom_${classroomCode}`;
      socket.join(chatRoomId);
      socket.currentClassroomChat = chatRoomId;
      
      socket.emit('joined-classroom-chat', { 
        classroomCode, 
        classroomName: classroom.name,
        message: `Welcome to "${classroom.name}" chat, ${socket.user.name}!`
      });

    } catch (error) {
      console.error("[Classroom Namespace] Error joining chat:", error.message);
      socket.emit('classroom-error', { message: 'Error joining classroom chat.' });
    }
  });

  socket.on('send-classroom-message', async ({ classroomCode, messageText }) => {
    try {
      const { userId, name: senderName } = socket.user;
      const classroom = await Classroom.findOne({ code: classroomCode }).select('_id');
      if (!classroom) return socket.emit('classroom-error', { message: 'Classroom not found.' });
      
      const chatRoomId = `classroom_${classroomCode}`;
      if (!socket.rooms.has(chatRoomId)) return socket.emit('classroom-error', { message: 'Not in chat room.' });
      if(!messageText || messageText.trim() === "") return socket.emit('classroom-error', { message: 'Message empty.' });

      const newMessage = new ChatMessage({
        classroom: classroom._id,
        sender: userId,
        senderName: senderName,
        text: messageText.trim(),
      });
      await newMessage.save();

      const messageToBroadcast = {
        _id: newMessage._id,
        sender: { _id: userId, name: senderName },
        text: newMessage.text,
        timestamp: newMessage.timestamp,
        classroom: classroom._id
      };
      classroomChatNsp.to(chatRoomId).emit('new-classroom-message', messageToBroadcast);
    } catch (error) {
      console.error("[Classroom Namespace] Error sending message:", error.message);
      socket.emit('classroom-error', { message: 'Error sending message.' });
    }
  });

  socket.on('leave-classroom-chat', ({ classroomCode }) => {
    const chatRoomId = `classroom_${classroomCode}`;
    if (socket.currentClassroomChat === chatRoomId) {
        socket.leave(chatRoomId);
        socket.currentClassroomChat = null;
    }
  });

});


const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log(`MongoDB connected...`))
  .catch(err => console.error(`MongoDB connection error:`, err));

server.listen(PORT, () => {
  console.log(`Unified Server (REST, Video, Chat) listening on port ${PORT}`);
});
