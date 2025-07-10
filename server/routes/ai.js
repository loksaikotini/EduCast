const express = require('express');
const authenticate = require('../middleware/authenticate');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });

router.post('/ask', authenticate, async (req, res) => {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
    return res.status(400).json({ message: 'A valid question prompt is required.' });
  }

  try {
    const fullPrompt = `You are "EduCast AI Tutor," a helpful and friendly AI assistant for students. Explain concepts clearly, deeply, and in a way that is easy to understand. Here is the student's question: \n\n${prompt}`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const answerText = response.text();
    
    res.json({ answer: answerText });

  } catch (error) {
    console.error('AI Tutor Error:', error);
    res.status(500).json({ message: 'The AI Tutor is currently unavailable. Please try again later.' });
  }
});

module.exports = router;
