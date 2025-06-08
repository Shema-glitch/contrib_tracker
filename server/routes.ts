import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { sendOtpEmail, sendContributionReminder, sendLoanApprovalEmail } from "./email";
import { z } from "zod";
import { insertContributionSchema, insertLoanSchema, insertMemberSchema } from "@shared/schema";
import express from "express";
import { generateCSV, generateExcel, getFilename } from "./utils";
import { sendEmail } from "./email";
import { requireAuth } from "./auth";
import notificationsRouter from "./notifications";
import { Error as ErrorType } from './types';

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const sendOtpSchema = z.object({
  email: z.string().email(),
});

const verifyOtpSchema = z.object({
  email: z.string().email(),
  token: z.string().length(6),
});

const recordPaymentSchema = insertContributionSchema.extend({
  applyLateFee: z.boolean().optional(),
});

const addLoanSchema = insertLoanSchema.extend({
  notes: z.string().optional(),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Traditional login with email and password
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const admin = await storage.getAdminByEmail(email);
      if (!admin) {
        return res.status(404).json({ message: "Admin not found" });
      }

      const isValidPassword = await storage.validateAdminPassword(email, password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid password" });
      }

      // Password validated, now send OTP for second factor
      const token = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await storage.createOtpToken(email, token, expiresAt);

      try {
        await sendOtpEmail(email, token);
        res.json({ 
          success: true, 
          message: "Password verified. OTP sent to your email for second factor authentication.",
          requiresOtp: true
        });
      } catch (emailError) {
        console.error("Email send failed:", emailError);
        res.json({ 
          success: true, 
          message: "Password verified. OTP sent (check console for mock email)",
          requiresOtp: true,
          emailFallback: true 
        });
      }

    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/send-otp", async (req, res) => {
    try {
      const { email } = sendOtpSchema.parse(req.body);
      console.log("Request body:", req.body);
      console.log("Email received:", email);

      const admin = await storage.getAdminByEmail(email);
      if (!admin) {
        return res.status(404).json({ message: "Admin not found" });
      }

      // Generate OTP
      const token = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await storage.createOtpToken(email, token, expiresAt);

      try {
        await sendOtpEmail(email, token);
        res.json({ success: true, message: "OTP sent successfully" });
      } catch (emailError) {
        console.error("Email send failed:", emailError);
        res.json({ 
          success: true, 
          message: "OTP sent (check console for mock email)",
          emailFallback: true 
        });
      }

    } catch (error) {
      console.error("Error sending OTP:", error);
      res.status(500).json({ message: "Failed to send OTP" });
    }
  });

  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { email, token } = verifyOtpSchema.parse(req.body);

      const otpToken = await storage.getValidOtpToken(email, token);
      if (!otpToken) {
        return res.status(401).json({ message: "Invalid or expired OTP" });
      }

      await storage.markOtpAsUsed(otpToken.id);

      // Get the admin user
      const admin = await storage.getAdminByEmail(email);
      if (!admin) {
        return res.status(404).json({ message: "Admin not found" });
      }

      // Set session
      req.session.user = {
        id: admin.id.toString(),
        email: admin.email
      };
      req.session.isAuthenticated = true;

      // Save session explicitly
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) {
            console.error("Session save error:", err);
            reject(err);
          }
          resolve();
        });
      });

      console.log(`✅ OTP verification successful for ${email}`);
      res.json({ success: true, message: "Authentication successful" });
    } catch (error) {
      console.error("Error verifying OTP:", error);
      res.status(500).json({ message: "Failed to verify OTP" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ success: true, message: "Logged out successfully" });
    });
  });

  // Auth middleware
  const requireAuth = (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    if (!req.session?.isAuthenticated) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

  // Dashboard routes
  app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/dashboard/recent-activity", requireAuth, async (req, res) => {
    try {
      const activities = await storage.getRecentActivity();
      res.json(activities);
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      res.status(500).json({ message: "Failed to fetch recent activity" });
    }
  });

  // Members routes
  app.get("/api/members", requireAuth, async (req, res) => {
    try {
      const members = await storage.getMembers();
      res.json(members);
    } catch (error) {
      console.error("Error fetching members:", error);
      res.status(500).json({ message: "Failed to fetch members" });
    }
  });

  app.get("/api/members/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid member ID" });
      }
      const member = await storage.getMember(id);
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }
      res.json(member);
    } catch (error) {
      console.error("Error fetching member:", error);
      res.status(500).json({ message: "Failed to fetch member details" });
    }
  });

  app.post("/api/members", requireAuth, async (req, res) => {
    try {
      const memberData = insertMemberSchema.parse(req.body);
      const member = await storage.createMember(memberData);
      res.status(201).json(member);
    } catch (error) {
      console.error("Error creating member:", error);
      res.status(500).json({ message: "Failed to create member" });
    }
  });

  // Member routes
  app.post("/api/members/:id/record-payment", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid member ID" });
      }

      const paymentData = recordPaymentSchema.parse({ ...req.body, memberId: id });
      
      const contribution = await storage.recordContribution(paymentData);
      
      // Create a notification for the payment
      await storage.insertNotification({
        userId: id,
        type: "PAYMENT_RECORDED",
        title: "Payment Recorded",
        message: `Your contribution of ${paymentData.amount} RWF for ${paymentData.month} has been recorded`,
        data: {
          contributionId: contribution.id,
          amount: paymentData.amount,
          month: paymentData.month,
          paymentDate: paymentData.paymentDate,
          lateFee: paymentData.applyLateFee ? "500" : "0"
        }
      });

      res.status(201).json({
        success: true,
        message: "Payment recorded successfully",
        data: contribution
      });
    } catch (error) {
      console.error("Error recording payment:", error);
      if (error instanceof Error) {
        res.status(500).json({ message: "Failed to record payment", details: error.message });
      } else {
        res.status(500).json({ message: "Failed to record payment" });
      }
    }
  });

  // Contributions routes
  app.get("/api/contributions", requireAuth, async (req, res) => {
    try {
      const contributions = await storage.getContributions();
      res.json(contributions);
    } catch (error) {
      console.error("Error fetching contributions:", error);
      res.status(500).json({ message: "Failed to fetch contributions" });
    }
  });

  app.post("/api/contributions", requireAuth, async (req, res) => {
    try {
      const data = recordPaymentSchema.parse(req.body);
      const { applyLateFee, ...contributionData } = data;

      // Calculate late fee if applicable
      if (applyLateFee) {
        contributionData.lateFee = "1000"; // 1,000 RWF late fee
      }

      const contribution = await storage.createContribution(contributionData);

      // Update member's total contributions
      if (contribution.isPaid) {
        await storage.updateMemberContributions(contribution.memberId, contribution.amount);
      }

      res.status(201).json(contribution);
    } catch (error) {
      console.error("Error recording payment:", error);
      res.status(500).json({ message: "Failed to record payment" });
    }
  });

  // Loans routes
  app.get("/api/loans", requireAuth, async (req, res) => {
    try {
      const loans = await storage.getLoans();
      res.json(loans);
    } catch (error) {
      console.error("Error fetching loans:", error);
      res.status(500).json({ message: "Failed to fetch loans" });
    }
  });

  app.post("/api/loans", requireAuth, async (req, res) => {
    try {
      const loanData = addLoanSchema.parse(req.body);

      // Check member eligibility
      const member = await storage.getMember(loanData.memberId);
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }

      const totalContributions = parseFloat(member.totalContributions || "0");
      if (totalContributions < 30000) {
        return res.status(400).json({ 
          message: "Member not eligible for loan. Minimum 30,000 RWF contribution required." 
        });
      }

      const loan = await storage.createLoan(loanData);

      // Send loan approval email
      try {
        await sendLoanApprovalEmail(member.email, member.name, loanData.amount, loanData.dueDate);
      } catch (emailError) {
        console.error("Failed to send loan approval email:", emailError);
      }

      res.status(201).json(loan);
    } catch (error) {
      console.error("Error creating loan:", error);
      res.status(500).json({ message: "Failed to create loan" });
    }
  });

  // Penalties routes
  app.get("/api/penalties", requireAuth, async (req, res) => {
    try {
      const penalties = await storage.getPenalties();
      res.json(penalties);
    } catch (error) {
      console.error("Error fetching penalties:", error);
      res.status(500).json({ message: "Failed to fetch penalties" });
    }
  });

  // Settings routes
  app.get("/api/settings/:key", requireAuth, async (req, res) => {
    try {
      const setting = await storage.getSetting(req.params.key);
      res.json(setting);
    } catch (error) {
      console.error("Error fetching setting:", error);
      res.status(500).json({ message: "Failed to fetch setting" });
    }
  });

  app.post("/api/settings", requireAuth, async (req, res) => {
    try {
      const { key, value } = req.body;
      await storage.setSetting(key, value);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating setting:", error);
      res.status(500).json({ message: "Failed to update setting" });
    }
  });

  // Utility routes
  app.post("/api/send-reminders", requireAuth, async (req, res) => {
    try {
      const members = await storage.getMembers();
      const currentMonth = new Date().toISOString().slice(0, 7);
      const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      const dueAmount = "5,000";

      for (const member of members) {
        const contributions = await storage.getContributionsByMember(member.id);
        const hasCurrentMonthContribution = contributions.some(c => 
          c.month === currentMonth && c.isPaid
        );

        if (!hasCurrentMonthContribution) {
          try {
            await sendContributionReminder({
              to: member.email,
              name: member.name,
              dueAmount,
              dueDate: dueDate.toLocaleDateString()
            });
          } catch (emailError) {
            console.error(`Failed to send reminder to ${member.email}:`, emailError);
          }
        }
      }

      res.json({ success: true, message: "Reminders sent successfully" });
    } catch (error) {
      console.error("Error sending reminders:", error);
      res.status(500).json({ message: "Failed to send reminders" });
    }
  });

  app.post("/api/members/:memberId/send-reminder", requireAuth, async (req, res) => {
    try {
      const memberId = parseInt(req.params.memberId);
      if (isNaN(memberId)) {
        return res.status(400).json({ message: "Invalid member ID" });
      }

      const member = await storage.getMember(memberId);
      
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }

      const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      const dueAmount = "5,000"; // You might want to make this dynamic based on your business logic

      await sendContributionReminder({
        to: member.email,
        name: member.name,
        dueAmount,
        dueDate: dueDate.toLocaleDateString()
      });

      // Create a notification
      await storage.insertNotification({
        userId: member.id,
        type: "REMINDER_SENT",
        title: "Contribution Reminder Sent",
        message: `Reminder sent to ${member.name} for monthly contribution`,
        data: {
          memberId: member.id,
          memberName: member.name,
          dueAmount,
          dueDate: dueDate.toISOString(),
          reminderDate: new Date().toISOString()
        }
      });

      res.json({ success: true, message: "Reminder sent successfully" });
    } catch (error) {
      console.error("Error sending reminder:", error);
      if (error instanceof Error) {
        res.status(500).json({ message: "Failed to send reminder", details: error.message });
      } else {
        res.status(500).json({ message: "Failed to send reminder" });
      }
    }
  });

  // Reports routes
  app.post("/api/reports/export", requireAuth, async (req, res) => {
    try {
      const { format, filters } = req.body;
      const data = await storage.getFilteredReportData(filters);
      
      let content: string | Buffer;
      let contentType: string;
      
      if (format === 'csv') {
        content = generateCSV(data);
        contentType = 'text/csv';
      } else if (format === 'excel') {
        content = generateExcel(data);
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      } else {
        throw new Error('Invalid format');
      }

      const filename = getFilename(format, filters);
      
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', contentType);
      res.send(content);
    } catch (error) {
      console.error('Export report error:', error);
      res.status(500).json({ error: 'Failed to export report' });
    }
  });

  app.post("/api/reports/email", requireAuth, async (req, res) => {
    try {
      const { format, filters, email } = req.body;
      
      // Validate email
      if (!email || typeof email !== 'string' || !email.includes('@')) {
        throw new Error('Invalid email address');
      }

      console.log('Preparing to send report to:', email);
      const data = await storage.getFilteredReportData(filters);
      
      let content: string | Buffer;
      let filename: string;
      let contentType: string;
      
      if (format === 'csv') {
        content = generateCSV(data);
        contentType = 'text/csv';
      } else if (format === 'excel') {
        content = generateExcel(data);
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      } else {
        throw new Error('Invalid format');
      }

      filename = getFilename(format, filters);
      console.log('Generated report:', filename);

      const emailOptions = {
        to: email,
        subject: `Report: ${filename}`,
        text: `Please find attached the report: ${filename}`,
        attachments: [{
          filename,
          content,
          contentType
        }]
      };

      console.log('Sending email with options:', {
        to: emailOptions.to,
        subject: emailOptions.subject,
        attachment: emailOptions.attachments[0].filename
      });

      const emailResult = await sendEmail(emailOptions);

      if (!emailResult) {
        throw new Error('Failed to send email');
      }

      res.json({ message: 'Report sent successfully' });
    } catch (error) {
      console.error('Email report error:', error);
      res.status(500).json({ 
        error: 'Failed to send report via email',
        details: error.message 
      });
    }
  });

  app.use("/api/notifications", requireAuth, notificationsRouter);

  const httpServer = createServer(app);
  return httpServer;
}