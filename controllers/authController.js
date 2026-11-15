const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

// make a token that stores the user id, valid for 7 days
const createToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// the user details we are allowed to send to the frontend (no password)
const userData = (user) => {
    return {
        _id: user._id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        avatar: user.avatar,
        showOnLeaderboard: user.showOnLeaderboard
    };
};

// Signup
const signup = async (req, res) => {
    try {

        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        if (password.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters' });
        }

        const emailExists = await User.findOne({ email: email.toLowerCase() });
        if (emailExists) {
            return res.status(400).json({ message: 'An account with this email already exists.' });
        }

        const nameExists = await User.findOne({ name: username.trim() });
        if (nameExists) {
            return res.status(400).json({ message: 'That username is taken.' });
        }

        // never save the plain password, save the hash
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name: username,
            email,
            password: hashedPassword
        });

        res.status(201).json({
            token: createToken(user._id),
            user: userData(user)
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Login
const login = async (req, res) => {
    try {

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // password is hidden by default, so we ask for it here
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
        if (!user) {
            return res.status(401).json({ message: 'Incorrect email or password.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Incorrect email or password.' });
        }

        res.status(200).json({
            token: createToken(user._id),
            user: userData(user)
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get the logged in user (token required)
const getMe = async (req, res) => {
    try {

        res.status(200).json(userData(req.user));

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Change password (token required)
const changePassword = async (req, res) => {
    try {

        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        if (newPassword.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters' });
        }

        const user = await User.findById(req.user._id).select('+password');

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect.' });
        }
        if (currentPassword === newPassword) {
            return res.status(400).json({ message: 'New password must be different from the current one.' });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.status(200).json({ message: 'Password updated' });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { signup, login, getMe, changePassword };