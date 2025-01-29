
const express = require('express')
const router = express.Router()
const User = require('../models/users')
const nodemailer = require('nodemailer');

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