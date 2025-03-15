require('dotenv').config();
const express = require('express');
const User = require('../models/users.cjs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const router = express.Router();

// Ensure JSON parsing middleware is used
router.use(express.json());

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL, 
    pass: process.env.PASSWORD,
  },
});

const sendEmail = async (subject, message) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL,
      to: process.env.EMAIL,
      subject,
      text: message,
    });
  } catch (error) {
    console.error('Error sending email:', error.message);
  }
};

router.post("/sign-up", async (req, res) => {
  console.log("Received sign-up request:", req.body);

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ email, password: hashedPassword });

    res.status(201).json({ message: "User created successfully", data: newUser });
  } catch (err) {
    console.error("Sign-up error:", err);
    res.status(500).json({ message: "Something went wrong", error: err.message });
  }
});

router.post("/login", async (req, res) => {
  console.log("Received login request:", req.body);

  const { email, password } = req.body;

  if (!email || !password) {
    console.error("Missing email or password");
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const findUser = await User.findOne({ email });

    if (!findUser) {
      console.error("User not found");
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, findUser.password);
    if (!isPasswordValid) {
      console.error("Invalid password");
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const accessToken = jwt.sign({ id: findUser._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    const refreshToken = jwt.sign({ id: findUser._id }, process.env.JWT_SECRET, { expiresIn: "30d" });

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 1000, // 1 hour
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    let loginDate = new Date();
    findUser.lastLogin = loginDate;
    await findUser.save();

    const fullName = `${findUser.firstName} ${findUser.lastName}`;
    const subject = 'Login Notification Alert';
    const message = `${fullName},\n\njust logged in at ${loginDate.toLocaleString()}.\n\n`;
    await sendEmail(subject, message);

    console.log("Login successful for:", findUser.email);
    res.status(200).json({ message: "Login successful", accessToken, refreshToken });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Something went wrong", error: err.message });
  }
});

module.exports = router;

