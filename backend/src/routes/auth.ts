import express from 'express';
import admin from 'firebase-admin';
import { authenticationRateLimit } from '../middleware/rateLimiting';
import { sendEmail } from '../services/emailService';

const router = express.Router();

router.post(
  '/api/auth/send-signin-link',
  authenticationRateLimit,
  async (req, res) => {
    const { email } = req.body;

    // Validate Cornell email
    if (!email || !email.endsWith('@cornell.edu')) {
      return res
        .status(400)
        .json({ error: 'Must use Cornell email (@cornell.edu)' });
    }

    try {
      // Get redirect URL from environment variable or use production default
      // For local development, set WEB_REDIRECT_URL=http://localhost:3000
      const webRedirectUrl = process.env.WEB_REDIRECT_URL || 'https://redi.love';

      // Generate Firebase sign-in link using Admin SDK (without sending email)
      const actionCodeSettings = {
        url: `${webRedirectUrl}/auth-redirect?email=${encodeURIComponent(email)}`,
        handleCodeInApp: true,
        iOS: {
          bundleId: 'com.incubator.redi',
        },
        android: {
          packageName: 'com.incubator.redi',
          installApp: true,
        },
      };

      const signInLink = await admin.auth().generateSignInWithEmailLink(
        email,
        actionCodeSettings
      );

      // Send the email using Nodemailer
      await sendEmail({
        to: email,
        subject: 'Sign in to Redi',
        html: `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.6;
        color: #333;
        margin: 0;
        padding: 0;
        background-color: #f5f5f5;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        background-color: white;
        padding: 40px 20px;
      }
      .header {
        text-align: center;
        margin-bottom: 30px;
      }
      .logo {
        font-size: 32px;
        font-weight: bold;
        color: #FF4B6E;
        margin-bottom: 10px;
      }
      .content {
        padding: 0 20px;
      }
      h1 {
        color: #333;
        font-size: 24px;
        margin-bottom: 20px;
      }
      p {
        color: #666;
        margin-bottom: 20px;
      }
      .button {
        display: inline-block;
        background-color: #FF4B6E;
        color: white !important;
        padding: 14px 32px;
        text-decoration: none;
        border-radius: 8px;
        margin: 20px 0;
        font-weight: 600;
      }
      .button-container {
        text-align: center;
        margin: 30px 0;
      }
      .link-container {
        background-color: #f8f8f8;
        padding: 15px;
        border-radius: 6px;
        margin: 20px 0;
        word-break: break-all;
      }
      .link {
        color: #666;
        font-size: 12px;
      }
      .footer {
        color: #999;
        font-size: 12px;
        text-align: center;
        margin-top: 40px;
        padding-top: 20px;
        border-top: 1px solid #eee;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="logo">Redi 💖</div>
      </div>

      <div class="content">
        <h1>Welcome to Redi!</h1>
        <p>Click the button below to sign in to your account:</p>

        <div class="button-container">
          <a href="${signInLink}" class="button">Sign in to Redi</a>
        </div>

        <p>Or copy and paste this link into your browser:</p>
        <div class="link-container">
          <p class="link">${signInLink}</p>
        </div>

        <p style="color: #999; font-size: 14px;">
          This link will expire in 1 hour and can only be used once.
        </p>
      </div>

      <div class="footer">
        <p>If you didn't request this email, you can safely ignore it.</p>
        <p>© ${new Date().getFullYear()} Redi - Cornell's Dating App</p>
      </div>
    </div>
  </body>
</html>
        `,
      });

      console.log(`✅ Sign-in link sent to ${email}`);
      res.json({ success: true, message: 'Sign-in link sent to your email' });
    } catch (error) {
      console.error('Error generating/sending sign-in link:', error);
      res.status(500).json({ error: 'Failed to send sign-in link' });
    }
  }
);

export default router;
