import jwt from 'jsonwebtoken';

const generateToken = (userId, extraPayload = {}) => {
  return jwt.sign(
    { id: userId, ...extraPayload },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

export default generateToken;