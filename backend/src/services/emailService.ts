import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

// Create reusable transporter
const createTransporter = () => {
  // Using Gmail (you can use any SMTP service)
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // Your Gmail address
      pass: process.env.EMAIL_PASSWORD, // App-specific password
    },
  });
};

export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: {
        name: 'Redi',
        address: process.env.EMAIL_USER || 'noreply@redi.love',
      },
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${options.to}: ${info.messageId}`);
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw new Error('Failed to send email');
  }
}
