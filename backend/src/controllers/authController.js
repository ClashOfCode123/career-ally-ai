import { User } from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';
import { isAdminEmail } from '../utils/admin.js';

const buildAuthResponse = (user) => {
  return {
    _id: user._id,
    username: user.username,
    email: user.email,

    // For frontend UI only.
    // Backend security should still use middleware.
    isAdmin: isAdminEmail(user.email),
  };
};

export const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        message: 'Username, email, and password are required.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const userExists = await User.findOne({ email: normalizedEmail });

    if (userExists) {
      return res.status(400).json({
        message: 'User already exists',
      });
    }

    const role = isAdminEmail(normalizedEmail) ? 'admin' : 'user';

    const user = await User.create({
      username: username.trim(),
      email: normalizedEmail,
      passwordHash: password,
      role,
    });

    generateToken(res, user._id);

    return res.status(201).json(buildAuthResponse(user));
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({
      message: 'Server error while registering user.',
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        message: 'Invalid email or password',
      });
    }

    const correctRole = isAdminEmail(user.email) ? 'admin' : 'user';

    if (user.role !== correctRole) {
      user.role = correctRole;
      await user.save();
    }

    generateToken(res, user._id);

    return res.status(200).json(buildAuthResponse(user));
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      message: 'Server error while logging in.',
    });
  }
};

export const logoutUser = (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0),
  });

  res.status(200).json({
    message: 'Logged out successfully',
  });
};