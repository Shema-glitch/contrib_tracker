import nodemailer from 'nodemailer';

// Configure your email transporter
const transporter = nodemailer.createTransporter({
  service: 'gmail', // or your preferred email service
  auth: {
    user: process.env.EMAIL_USER || process.env.SMTP_USER,
    pass: process.env.EMAIL_PASS || process.env.SMTP_PASS,
  },
});

export async function sendOtpEmail(to: string, code: string): Promise<void> {
  const mailOptions = {
    from: process.env.EMAIL_USER || process.env.SMTP_USER,
    to,
    subject: 'Member Contribution Manager - OTP Verification',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">Member Contribution Manager</h2>
        <p>Your OTP verification code is:</p>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #1e40af;">
          ${code}
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p style="color: #6b7280; font-size: 14px;">
          If you didn't request this code, please ignore this email.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

export async function sendContributionReminder(to: string, memberName: string, month: string): Promise<void> {
  const mailOptions = {
    from: process.env.EMAIL_USER || process.env.SMTP_USER,
    to,
    subject: 'Monthly Contribution Reminder',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">Monthly Contribution Reminder</h2>
        <p>Dear ${memberName},</p>
        <p>This is a friendly reminder that your monthly contribution of <strong>5,000 RWF</strong> for ${month} is due by the 15th of this month.</p>
        <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #92400e; margin: 0;">
            <strong>Important:</strong> Late payments will incur a penalty of 1,000 RWF if paid after the due date.
          </p>
        </div>
        <p>Please ensure your contribution is made on time to avoid any penalties.</p>
        <p>Thank you for your continued participation!</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">
          Member Contribution & Loan Manager<br>
          This is an automated message.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

export async function sendLoanReminder(to: string, memberName: string, amount: number, dueDate: Date): Promise<void> {
  const formattedDueDate = dueDate.toLocaleDateString();
  
  const mailOptions = {
    from: process.env.EMAIL_USER || process.env.SMTP_USER,
    to,
    subject: 'Loan Repayment Reminder',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">Loan Repayment Reminder</h2>
        <p>Dear ${memberName},</p>
        <p>This is a reminder about your loan repayment:</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Loan Amount:</strong> ${amount.toLocaleString()} RWF</p>
          <p><strong>Due Date:</strong> ${formattedDueDate}</p>
        </div>
        <div style="background: #fecaca; border: 1px solid #ef4444; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #b91c1c; margin: 0;">
            <strong>Warning:</strong> Overdue loans will incur a penalty of 30,000 RWF.
          </p>
        </div>
        <p>Please ensure your loan is repaid by the due date to avoid penalties.</p>
        <p>Thank you!</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">
          Member Contribution & Loan Manager<br>
          This is an automated message.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

export async function sendLatePaymentNotice(to: string, memberName: string, amount: number): Promise<void> {
  const mailOptions = {
    from: process.env.EMAIL_USER || process.env.SMTP_USER,
    to,
    subject: 'Late Payment Penalty Applied',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">Late Payment Penalty Notice</h2>
        <p>Dear ${memberName},</p>
        <p>A late payment penalty has been applied to your account:</p>
        <div style="background: #fecaca; border: 1px solid #ef4444; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #b91c1c;"><strong>Penalty Amount:</strong> ${amount.toLocaleString()} RWF</p>
          <p style="color: #b91c1c;">Reason: Late monthly contribution payment</p>
        </div>
        <p>Please make your payment as soon as possible to bring your account current.</p>
        <p>If you have any questions, please contact the administrator.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">
          Member Contribution & Loan Manager<br>
          This is an automated message.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}
