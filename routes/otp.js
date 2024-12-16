const express = require("express");
const router = express.Router();
const pool = require("../db");
const nodemailer = require("nodemailer");
const { authenticateToken } = require("../middleware/authorization");

// Configure nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Generate a random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email
const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your SpendWise Verification Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #00B152;">SpendWise Verification Code</h2>
        <p>Hello,</p>
        <p>Your verification code is:</p>
        <h1 style="color: #00B152; font-size: 32px; letter-spacing: 5px; text-align: center; padding: 20px; background-color: #f5f5f5; border-radius: 10px;">${otp}</h1>
        <p>This code will expire in 5 minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
        <p>Best regards,<br>SpendWise Team</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

// Send OTP
router.post("/send", async (req, res) => {
  try {
    const { email } = req.body;
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

    // Store OTP in database
    await pool.query(
      "INSERT INTO otp_verifications (email, otp_code, expires_at) VALUES ($1, $2, $3)",
      [email, otp, expiresAt]
    );

    // Send OTP via email
    await sendOTPEmail(email, otp);

    res.json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

// Verify OTP
router.post("/verify", async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Get the latest unverified OTP for the email
    const result = await pool.query(
      `SELECT * FROM otp_verifications 
       WHERE email = $1 
       AND otp_code = $2 
       AND verified = false 
       AND expires_at > NOW() 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [email, otp]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    // Mark OTP as verified
    await pool.query(
      "UPDATE otp_verifications SET verified = true WHERE id = $1",
      [result.rows[0].id]
    );

    res.json({ message: "OTP verified successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to verify OTP" });
  }
});

// Resend OTP
router.post("/resend", async (req, res) => {
  try {
    const { email } = req.body;

    // Invalidate previous OTPs
    await pool.query(
      "UPDATE otp_verifications SET expires_at = NOW() WHERE email = $1 AND verified = false",
      [email]
    );

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

    // Store new OTP in database
    await pool.query(
      "INSERT INTO otp_verifications (email, otp_code, expires_at) VALUES ($1, $2, $3)",
      [email, otp, expiresAt]
    );

    // Send new OTP via email
    await sendOTPEmail(email, otp);

    res.json({ message: "OTP resent successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to resend OTP" });
  }
});

module.exports = router;
