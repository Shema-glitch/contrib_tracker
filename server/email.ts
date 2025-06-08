import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType: string;
  }>;
}

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

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

export async function sendOtpEmail(email: string, otp: string) {
  const mailOptions = {
    from: 'charmantshema112@gmail.com',
    to: email,
    subject: "Your FundSync Login Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">FundSync Login Code</h2>
        <p>Here is your one-time password (OTP) for logging in:</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <h1 style="color: #1e40af; margin: 0; font-size: 32px; letter-spacing: 4px;">${otp}</h1>
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p style="color: #6b7280; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
        <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">FundSync - Empowering Contributions, Securing Loans, Building Futures.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Failed to send email:", error);
    throw new Error("Failed to send email");
  }
}

export async function sendContributionReminder({ to, name, dueAmount, dueDate }: { to: string; name: string; dueAmount: string; dueDate: string }) {
  const mailOptions = {
    from: 'charmantshema112@gmail.com',
    to,
    subject: "FundSync Contribution Reminder",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">FundSync Contribution Reminder</h2>
        <p>Dear ${name},</p>
        <p>This is a friendly reminder that your contribution of ${dueAmount} RWF is due on ${dueDate}.</p>
        <p>Please make your contribution before the due date to avoid any late fees.</p>
        <p style="color: #6b7280; font-size: 14px;">This is an automated reminder. Please do not reply to this email.</p>
        <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">FundSync - Empowering Contributions, Securing Loans, Building Futures.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Failed to send reminder:", error);
    throw new Error("Failed to send reminder");
  }
}

export async function sendLoanApprovalEmail(email: string, name: string, amount: string, dueDate: string) {
  const mailOptions = {
    from: 'charmantshema112@gmail.com',
    to: email,
    subject: "FundSync Loan Approval",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">FundSync Loan Approved</h2>
        <p>Dear ${name},</p>
        <p>Your loan request for ${amount} RWF has been approved.</p>
        <p>The loan is due on ${new Date(dueDate).toLocaleDateString()}.</p>
        <p>Please ensure timely repayment to maintain your good standing.</p>
        <p style="color: #6b7280; font-size: 14px;">This is an automated message. Please do not reply to this email.</p>
        <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">FundSync - Empowering Contributions, Securing Loans, Building Futures.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Failed to send loan approval:", error);
    throw new Error("Failed to send loan approval");
  }
}

export async function sendPenaltyNotification(email: string, name: string, penaltyType: string, amount: string, reason: string): Promise<void> {
  const mailOptions = {
    from: 'charmantshema112@gmail.com',
    to: email,
    subject: 'FundSync Penalty Notification',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">FundSync Penalty Applied</h2>
        <p>Dear ${name},</p>
        <p>A penalty has been applied to your account due to the following reason:</p>
        <div style="background-color: #fef2f2; padding: 15px; border-left: 4px solid #dc2626; margin: 20px 0;">
          <p style="margin: 0;"><strong>Penalty Type:</strong> ${penaltyType}</p>
          <p style="margin: 5px 0;"><strong>Amount:</strong> ${amount} RWF</p>
          <p style="margin: 5px 0 0 0;"><strong>Reason:</strong> ${reason}</p>
        </div>
        <p>Please contact the administrator to resolve this penalty or arrange payment.</p>
        <p>To avoid future penalties, please ensure timely payments of contributions and loan repayments.</p>
        <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">FundSync - Empowering Contributions, Securing Loans, Building Futures.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Failed to send penalty notification:", error);
    throw new Error("Failed to send penalty notification");
  }
}

export async function sendEmail(options: EmailOptions) {
  try {
    // Validate required fields
    if (!options.to) {
      throw new Error('No recipient email address provided');
    }
    if (!options.subject) {
      throw new Error('No email subject provided');
    }
    if (!options.text) {
      throw new Error('No email text provided');
    }

    console.log('Email configuration:', {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER,
      from: process.env.SMTP_FROM
    });

    console.log('Sending email to:', options.to);
    console.log('Subject:', options.subject);
    console.log('Attachments:', options.attachments?.map(a => a.filename).join(', '));

    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@example.com',
      ...options
    };

    console.log('Final mail options:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
      hasAttachments: !!mailOptions.attachments?.length
    });

    const info = await transporter.sendMail(mailOptions);

    console.log('Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}