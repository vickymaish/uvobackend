require('dotenv').config()

const express = require('express')
const User = require('../models/users')
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')


const router = express.Router()

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
        to:  process.env.EMAIL,
        subject,
        text: message,
      });
    } catch (error) {
      console.error('Error sending email:', error.message);
    }
  };


router.post("/sign-up", async (req, res) => {
    const fields = req.body;

    
  
    if (!fields.email || !fields.password) {
      return res.status(400).json({ message: "email and password are required" });
    }
  
    try {
      const existingUser = await User.findOne({ email: fields.email });
  
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
  
      const hashedPassword = await bcrypt.hash(fields.password, 10);
  
      const newUser = await User.create({ ...fields, password: hashedPassword });
  
      res
        .status(201)
        .json({ message: "User created successfully", data: newUser });
    } catch (err) {
      res
        .status(500)
        .json({ message: "Something went wrong", error: err.message });
    }
  });
  
  router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    
    const generateTokens = (userId) => {
      const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });
      
      const refreshToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: "30d", 
      });
      
      return { accessToken, refreshToken };
    };
  
    try {
      const findUser = await User.findOne({ email });
      if (!findUser || !await bcrypt.compare(password, findUser.password)) {
        return res.status(400).json({ message: "Invalid credentials" });
      }
    }
    catch(error){
      console.log(error)
    }
  

    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }
  
    try {
      const findUser = await User.findOne({ email });
      if (!findUser) {
        return res.status(400).json({ message: "Invalid credentials" });
      }
  
      
        
      const { accessToken, refreshToken } = generateTokens(findUser._id);
  
      const isPasswordValid = await bcrypt.compare(password, findUser.password);
  
      if (!isPasswordValid) {
        return res.status(400).json({ message: "Invalid credentials" });
      }
  
      const token = jwt.sign({ id: findUser._id }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });
  
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

      let loginDate =  new Date();

      findUser.lastLogin =loginDate

      const fullName = `${findUser.firstName} ${findUser.lastName}`;
      const subject = 'Login Notification Alert';
      const message = `${fullName},\n\njust logged in at ${loginDate.toLocaleString()}.\n\n`;
  
      await sendEmail(subject, message);
      await findUser.save();


  
      res.status(200).json({ message: "Login successful",accessToken,refreshToken });
    } catch (err) {
      res
        .status(500)
        .json({ message: "Something went wrong", error: err.message });
    }
  });
  
  router.post('/logout', async(req, res) => {
      res.clearCookie('authToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', 
        sameSite: 'strict',
      });
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', 
        sameSite: 'strict',
      });

      let logoutDate =  new Date();


      const findUser = await User.findById(req.user.id);
      findUser.lastLogout =logoutDate
    const fullName = `${findUser.firstName} ${findUser.lastName}`;
    const subject = 'Logout Notification Alert';
    const message = `${fullName},\n\n successfully logged out at ${logoutDate.toLocaleString()}.\n\n`;

    await sendEmail(subject, message);
    await findUser.save();



      res.status(200).json({ message: 'Logged out successfully' });
    });
  
  module.exports = router;