const express = require('express');
const Classroom = require('../models/Classroom');
const Material = require('../models/Material');
const ChatMessage = require('../models/ChatMessage');
const authenticate = require('../middleware/authenticate');
const { nanoid } = require('nanoid');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const ensureDirExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const classroomCode = req.params.code;
    if (!classroomCode) return cb(new Error("Classroom code is required for storing material path"));
    const dir = path.join('uploads', 'materials', classroomCode.toString());
    ensureDirExists(path.join(__dirname, '..', dir));
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage, limits: { fileSize: 1024 * 1024 * 100 } });

const checkClassroomAccess = async (classroomId, userId, userRole) => {
    const classroom = await Classroom.findById(classroomId).lean();
    if (!classroom) return false;
    if (userRole === 'teacher' && classroom.teacher.toString() === userId) return true;
    if (userRole === 'student' && classroom.students.map(s => s.toString()).includes(userId)) return true;
    return false;
};

router.post('/create', authenticate, async (req, res) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Forbidden: Only teachers can create classrooms' });
  try {
    const { name, subject } = req.body;
    if (!name || !subject) return res.status(400).json({ message: 'Classroom name and subject are required' });
    const code = nanoid(8).toUpperCase();
    const classroom = new Classroom({ code, name, subject, teacher: req.user.userId });
    await classroom.save();
    res.status(201).json({ classroom });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Failed to generate unique classroom code, try again.' });
    console.error("Create classroom error:", err);
    res.status(500).json({ message: 'Server error creating classroom' });
  }
});

router.post('/:code/join', authenticate, async (req, res) => {
  try {
    const classroom = await Classroom.findOne({ code: req.params.code });
    if (!classroom) return res.status(404).json({ message: 'Classroom not found' });
    if (req.user.role === 'student') {
      if (classroom.students.map(s => s.toString()).includes(req.user.userId)) return res.status(200).json({ message: 'Already enrolled', classroom });
      classroom.students.push(req.user.userId);
      await classroom.save();
      const updatedClassroom = await Classroom.findById(classroom._id).populate('teacher', 'name email').populate('students', 'name email');
      return res.status(200).json({ message: 'Successfully joined', classroom: updatedClassroom });
    }
    res.status(403).json({ message: 'Only students can join classrooms via this method.' });
  } catch (err) {
    console.error("Join classroom error:", err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/student/enrolled', authenticate, async (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ message: 'Forbidden' });
  try {
    const classrooms = await Classroom.find({ students: req.user.userId }).populate('teacher', 'name').select('name code subject teacher');
    res.json({ classrooms });
  } catch (err) {
    console.error("Get enrolled error:", err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/teacher/owned', authenticate, async (req, res) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Forbidden' });
  try {
    const classrooms = await Classroom.find({ teacher: req.user.userId }).select('name code subject studentCount');
    res.json({ classrooms });
  } catch (err) {
    console.error("Get owned error:", err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:code', authenticate, async (req, res) => {
  try {
    const classroom = await Classroom.findOne({ code: req.params.code }).populate('teacher', 'name email').populate('students', 'name email role').populate({ path: 'materials', populate: { path: 'uploadedBy', select: 'name' } });
    if (!classroom) return res.status(404).json({ message: 'Classroom not found' });
    const isMember = await checkClassroomAccess(classroom._id, req.user.userId, req.user.role);
    if (!isMember) return res.status(403).json({ message: 'Forbidden: Not part of this classroom' });
    const classroomResponse = classroom.toObject();
    classroomResponse.materials = classroomResponse.materials.map(material => ({ ...material, url: `/${material.path.replace(/\\/g, '/')}` }));
    res.json({ classroom: classroomResponse });
  } catch (err) {
    console.error("Get classroom details error:", err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:code/materials', authenticate, upload.single('materialFile'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  try {
    const classroom = await Classroom.findOne({ code: req.params.code });
    if (!classroom) {
      fs.unlinkSync(path.join(__dirname, '..', req.file.path));
      return res.status(404).json({ message: 'Classroom not found' });
    }

    const isMember = await checkClassroomAccess(classroom._id, req.user.userId, req.user.role);
    if (!isMember) {
      fs.unlinkSync(path.join(__dirname, '..', req.file.path));
      return res.status(403).json({ message: 'Forbidden: You are not a member of this classroom and cannot upload materials.' });
    }
    
    const material = new Material({
      name: req.body.materialName || req.file.originalname,
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      mimetype: req.file.mimetype,
      classroom: classroom._id,
      uploadedBy: req.user.userId
    });
    await material.save();
    classroom.materials.push(material._id);
    await classroom.save();

    const materialResponse = material.toObject();
    materialResponse.url = `/${material.path.replace(/\\/g, '/')}`;
    res.status(201).json({ message: 'Material uploaded', material: materialResponse });
  } catch (err) {
    console.error("Upload material error:", err);
    if (req.file && req.file.path) fs.unlinkSync(path.join(__dirname, '..', req.file.path));
    res.status(500).json({ message: 'Server error uploading material' });
  }
});

router.get('/:code/materials', authenticate, async (req, res) => {
    const { code } = req.params;
    try {
        const classroom = await Classroom.findOne({ code: code }).select('_id teacher students materials').populate({ path: 'materials', select: 'name originalName path mimetype uploadedAt uploadedBy', populate: { path: 'uploadedBy', select: 'name _id' } });
        if (!classroom) return res.status(404).json({ message: 'Classroom not found' });
        const isTeacher = classroom.teacher.toString() === req.user.userId;
        const isStudent = classroom.students.map(s => s.toString()).includes(req.user.userId);
        if (!isTeacher && !isStudent) return res.status(403).json({ message: 'Access denied to this classroom\'s materials' });
        const materialsResponse = classroom.materials.map(material => {
            const matObj = material.toObject();
            return { ...matObj, url: `/${matObj.path.replace(/\\/g, '/')}` };
        });
        res.json({ materials: materialsResponse });
    } catch (err) {
        console.error(`Get materials error for classroom ${code}:`, err);
        res.status(500).json({ message: 'Server error while fetching materials' });
    }
});

router.get('/:code/messages', authenticate, async (req, res) => {
  try {
    const classroom = await Classroom.findOne({ code: req.params.code }).select('_id');
    if (!classroom) return res.status(404).json({ message: 'Classroom not found' });
    const isMember = await checkClassroomAccess(classroom._id, req.user.userId, req.user.role);
    if (!isMember) return res.status(403).json({ message: 'Access denied to chat' });
    const messages = await ChatMessage.find({ classroom: classroom._id }).sort({ timestamp: 1 }).populate('sender', 'name role');
    res.json({ messages });
  } catch (err) {
    console.error("Get chat messages error:", err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:code/leave', authenticate, async (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ message: 'Forbidden' });
  try {
    const classroom = await Classroom.findOneAndUpdate({ code: req.params.code }, { $pull: { students: req.user.userId } }, { new: true });
    if (!classroom) return res.status(404).json({ message: 'Classroom not found or you were not enrolled' });
    res.json({ message: 'Successfully left classroom' });
  } catch (err) {
    console.error("Leave classroom error:", err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:code', authenticate, async (req, res) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Forbidden' });
  try {
    const classroom = await Classroom.findOne({ code: req.params.code });
    if (!classroom) return res.status(404).json({ message: 'Classroom not found' });
    if (classroom.teacher.toString() !== req.user.userId) return res.status(403).json({ message: 'Not your classroom' });
    const materialDir = path.join(__dirname, '..', 'uploads', 'materials', req.params.code);
    if (fs.existsSync(materialDir)) fs.rmSync(materialDir, { recursive: true, force: true });
    await Material.deleteMany({ classroom: classroom._id });
    await ChatMessage.deleteMany({ classroom: classroom._id });
    await Classroom.deleteOne({ _id: classroom._id });
    res.json({ message: 'Classroom deleted' });
  } catch (err) {
    console.error("Delete classroom error:", err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;