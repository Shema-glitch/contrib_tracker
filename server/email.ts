
import nodemailer from 'nodemailer';

// Create transporter with fallback configuration
const createTransporter = () => {
  try {
    return nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER || process.env.EMAIL_USER || 'charmantshema112@gmail.com',
        pass: process.env.SMTP_PASS || process.env.EMAIL_PASS || 'kfqb rpdm doow pajj',
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  } catch (error) {
    console.error('Failed to create email transporter:', error);
    return null;
  }
};

// Mock email service for development/testing
const mockEmailService = {
  async sendEmail(to: string, subject: string, html: string) {
    console.log(`\n📧 MOCK EMAIL SENT:`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Content: ${html.replace(/<[^>]*>/g, '')}`);
    console.log(`\n`);
    return Promise.resolve();
  }
};

export async function sendOtpEmail(email: string, token: string): Promise<void> {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: process.env.SMTP_USER || process.env.EMAIL_USER || 'charmantshema112@gmail.com',
    to: email,
    subject: 'Your OTP Code - Member Contribution Manager',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">Your OTP Code</h2>
        <p>Your one-time password for accessing the Member Contribution Manager is:</p>
        <div style="background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 3px; margin: 20px 0;">
          ${token}
        </div>
        <p style="color: #6b7280;">This code will expire in 10 minutes.</p>
        <p style="color: #6b7280;">If you didn't request this code, please ignore this email.</p>
      </div>
    `,
  };

  try {
    if (!transporter) {
      throw new Error('Email transporter not available');
    }
    
    // Test the connection first
    await transporter.verify();
    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email sent successfully to ${email}`);
  } catch (error: any) {
    console.error('Email service failed, using mock service:', error.message);
    
    // Use mock service as fallback
    await mockEmailService.sendEmail(
      email, 
      'Your OTP Code - Member Contribution Manager', 
      mailOptions.html
    );
  }
}

export async function sendContributionReminder(email: string, name: string, month: string): Promise<void> {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: process.env.SMTP_USER || process.env.EMAIL_USER || 'charmantshema112@gmail.com',
    to: email,
    subject: 'Monthly Contribution Reminder',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">Monthly Contribution Reminder</h2>
        <p>Dear ${name},</p>
        <p>This is a friendly reminder that your monthly contribution for <strong>${month}</strong> is due.</p>
        <div style="background-color: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0;">
          <p style="margin: 0;"><strong>Amount Due:</strong> 5,000 RWF</p>
          <p style="margin: 5px 0 0 0;"><strong>Due Date:</strong> 15th of the month</p>
        </div>
        <p style="color: #dc2626; font-weight: bold;">Note: Late payments after the 15th of the following month will incur a 1,000 RWF penalty.</p>
        <p>Please contact the administrator if you have any questions.</p>
        <p>Thank you for your participation!</p>
      </div>
    `,
  };

  try {
    if (!transporter) {
      throw new Error('Email transporter not available');
    }
    
    await transporter.verify();
    await transporter.sendMail(mailOptions);
    console.log(`✅ Reminder email sent successfully to ${email}`);
  } catch (error: any) {
    console.error('Email service failed, using mock service:', error.message);
    
    await mockEmailService.sendEmail(
      email, 
      'Monthly Contribution Reminder', 
      mailOptions.html
    );
  }
}

export async function sendLoanApprovalEmail(email: string, name: string, amount: string, dueDate: string): Promise<void> {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: process.env.SMTP_USER || process.env.EMAIL_USER || 'charmantshema112@gmail.com',
    to: email,
    subject: 'Loan Approval Notification',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Loan Approved!</h2>
        <p>Dear ${name},</p>
        <p>Congratulations! Your loan application has been approved.</p>
        <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1e40af;">Loan Details:</h3>
          <p><strong>Amount:</strong> ${amount} RWF</p>
          <p><strong>Due Date:</strong> ${dueDate}</p>
          <p style="color: #dc2626;"><strong>Important:</strong> Late repayment will incur a 30,000 RWF penalty.</p>
        </div>
        <p>Please ensure timely repayment to avoid penalties.</p>
        <p>Thank you for your participation in our member contribution program!</p>
      </div>
    `,
  };

  try {
    if (!transporter) {
      throw new Error('Email transporter not available');
    }
    
    await transporter.verify();
    await transporter.sendMail(mailOptions);
    console.log(`✅ Loan approval email sent successfully to ${email}`);
  } catch (error: any) {
    console.error('Email service failed, using mock service:', error.message);
    
    await mockEmailService.sendEmail(
      email, 
      'Loan Approval Notification', 
      mailOptions.html
    );
  }
}

export async function sendPenaltyNotification(email: string, name: string, penaltyType: string, amount: string, reason: string): Promise<void> {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: process.env.SMTP_USER || process.env.EMAIL_USER || 'charmantshema112@gmail.com',
    to: email,
    subject: 'Penalty Applied - Action Required',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Penalty Applied</h2>
        <p>Dear ${name},</p>
        <p>A penalty has been applied to your account due to the following reason:</p>
        <div style="background-color: #fef2f2; padding: 15px; border-left: 4px solid #dc2626; margin: 20px 0;">
          <p style="margin: 0;"><strong>Penalty Type:</strong> ${penaltyType}</p>
          <p style="margin: 5px 0;"><strong>Amount:</strong> ${amount} RWF</p>
          <p style="margin: 5px 0 0 0;"><strong>Reason:</strong> ${reason}</p>
        </div>
        <p>Please contact the administrator to resolve this penalty or arrange payment.</p>
        <p>To avoid future penalties, please ensure timely payments of contributions and loan repayments.</p>
      </div>
    `,
  };

  try {
    if (!transporter) {
      throw new Error('Email transporter not available');
    }
    
    await transporter.verify();
    await transporter.sendMail(mailOptions);
    console.log(`✅ Penalty notification email sent successfully to ${email}`);
  } catch (error: any) {
    console.error('Email service failed, using mock service:', error.message);
    
    await mockEmailService.sendEmail(
      email, 
      'Penalty Applied - Action Required', 
      mailOptions.html
    );
  }
}
