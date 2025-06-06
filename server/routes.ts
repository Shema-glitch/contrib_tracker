import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { sendOtpEmail, sendContributionReminder, sendLoanApprovalEmail } from "./email";
import { z } from "zod";
import { insertContributionSchema, insertLoanSchema, insertMemberSchema } from "@shared/schema";

// Validation schemas
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
  // Auth routes
  app.post("/api/auth/send-otp", async (req, res) => {
    try {
      console.log("Request body:", req.body);
      console.log("Email received:", req.body.email);
      const { email } = sendOtpSchema.parse(req.body);
      
      // Check if admin exists
      const admin = await storage.getAdminByEmail(email);
      if (!admin || !admin.isActive) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Generate OTP
      const token = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await storage.createOtpToken(email, token, expiresAt);
      await sendOtpEmail(email, token);

      res.json({ success: true, message: "OTP sent successfully" });
    } catch (error) {
      console.error("Error sending OTP:", error);
      if (error.code === 'EAUTH') {
        console.error("Email authentication failed. Please check your Gmail app password.");
      }
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
      
      // Set session
      (req.session as any).adminEmail = email;
      (req.session as any).isAuthenticated = true;

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
  const requireAuth = (req: any, res: any, next: any) => {
    if (!(req.session as any)?.isAuthenticated) {
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
      const contributions = await storage.getContributions();
      const loans = await storage.getLoans();
      
      // Combine and sort recent activities
      const activities = [
        ...contributions.slice(0, 5).map(c => ({
          type: 'contribution',
          date: c.paymentDate || c.createdAt,
          description: `Contribution payment`,
          amount: c.amount,
          memberId: c.memberId,
        })),
        ...loans.slice(0, 5).map(l => ({
          type: 'loan',
          date: l.issueDate,
          description: `Loan issued`,
          amount: l.amount,
          memberId: l.memberId,
        }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
       .slice(0, 10);

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
      const member = await storage.getMember(id);
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }
      res.json(member);
    } catch (error) {
      console.error("Error fetching member:", error);
      res.status(500).json({ message: "Failed to fetch member" });
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
      await sendLoanApprovalEmail(member.email, member.name, loanData.amount, loanData.dueDate);
      
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
      
      for (const member of members) {
        const contributions = await storage.getContributionsByMember(member.id);
        const hasCurrentMonthContribution = contributions.some(c => 
          c.month === currentMonth && c.isPaid
        );
        
        if (!hasCurrentMonthContribution) {
          await sendContributionReminder(member.email, member.name, currentMonth);
        }
      }
      
      res.json({ success: true, message: "Reminders sent successfully" });
    } catch (error) {
      console.error("Error sending reminders:", error);
      res.status(500).json({ message: "Failed to send reminders" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
