const jwt = require('jsonwebtoken');

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { userId: decoded.userId, role: decoded.role, name: decoded.name };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Unauthorized: Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }
    console.error("Authentication error:", error);
    return res.status(500).json({ message: 'Server error during authentication' });
  }
};

module.exports = authenticate;