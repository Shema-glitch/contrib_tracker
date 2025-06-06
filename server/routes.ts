import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { sendOtpEmail, sendContributionReminder, sendLoanReminder } from "./email";
import { z } from "zod";
import { insertContributionSchema, insertLoanSchema, insertMemberSchema } from "@shared/schema";

// Request validation schemas
const otpRequestSchema = z.object({
  email: z.string().email(),
});

const otpVerifySchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

const recordPaymentSchema = insertContributionSchema.extend({
  applyLateFee: z.boolean().optional(),
});

const addLoanSchema = insertLoanSchema.extend({
  memberIdInput: z.number(),
});

function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Authentication routes
  app.post("/api/auth/send-otp", async (req, res) => {
    try {
      const { email } = otpRequestSchema.parse(req.body);
      
      // Check if admin exists
      const admin = await storage.getAdminByEmail(email);
      if (!admin) {
        return res.status(404).json({ message: "Admin not found" });
      }

      const code = generateOtpCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      
      await storage.createOtpSession(email, code, expiresAt);
      await sendOtpEmail(email, code);
      
      res.json({ message: "OTP sent successfully" });
    } catch (error) {
      console.error("Send OTP error:", error);
      res.status(500).json({ message: "Failed to send OTP" });
    }
  });

  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { email, code } = otpVerifySchema.parse(req.body);
      
      const session = await storage.getValidOtpSession(email, code);
      if (!session) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }

      await storage.markOtpAsUsed(session.id);
      
      const admin = await storage.getAdminByEmail(email);
      if (!admin) {
        return res.status(404).json({ message: "Admin not found" });
      }

      // Set session
      req.session.adminId = admin.id;
      req.session.adminEmail = admin.email;
      
      res.json({ 
        message: "Login successful",
        admin: { id: admin.id, email: admin.email, name: admin.name }
      });
    } catch (error) {
      console.error("Verify OTP error:", error);
      res.status(500).json({ message: "Failed to verify OTP" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  // Auth middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.adminId) {
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
      console.error("Dashboard stats error:", error);
      res.status(500).json({ message: "Failed to load dashboard stats" });
    }
  });

  // Member routes
  app.get("/api/members", requireAuth, async (req, res) => {
    try {
      const members = await storage.getAllMembers();
      
      // Enhance members with contribution data
      const enhancedMembers = await Promise.all(
        members.map(async (member) => {
          const totalContributions = await storage.getTotalContributionsByMember(member.id);
          const currentMonth = new Date().toISOString().slice(0, 7);
          const currentContribution = await storage.getContributionByMemberAndMonth(member.id, currentMonth);
          const activeLoans = await storage.getActiveLoansByMember(member.id);
          
          return {
            ...member,
            totalContributions,
            currentMonthStatus: currentContribution?.status || 'unpaid',
            isLoanEligible: totalContributions >= 30000,
            activeLoansCount: activeLoans.length,
          };
        })
      );
      
      res.json(enhancedMembers);
    } catch (error) {
      console.error("Get members error:", error);
      res.status(500).json({ message: "Failed to load members" });
    }
  });

  app.post("/api/members", requireAuth, async (req, res) => {
    try {
      const memberData = insertMemberSchema.parse(req.body);
      const member = await storage.createMember(memberData);
      res.json(member);
    } catch (error) {
      console.error("Create member error:", error);
      res.status(500).json({ message: "Failed to create member" });
    }
  });

  // Contribution routes
  app.post("/api/contributions/record", requireAuth, async (req, res) => {
    try {
      const { applyLateFee, ...contributionData } = recordPaymentSchema.parse(req.body);
      
      let finalAmount = Number(contributionData.amount || 5000);
      let lateFee = 0;
      
      if (applyLateFee) {
        lateFee = 1000;
        finalAmount += lateFee;
      }
      
      const contribution = await storage.createContribution({
        ...contributionData,
        paidAmount: finalAmount.toString(),
        lateFee: lateFee.toString(),
        status: 'paid',
        paidAt: new Date(),
      });
      
      res.json(contribution);
    } catch (error) {
      console.error("Record payment error:", error);
      res.status(500).json({ message: "Failed to record payment" });
    }
  });

  app.get("/api/contributions/:memberId", requireAuth, async (req, res) => {
    try {
      const memberId = parseInt(req.params.memberId);
      const contributions = await storage.getContributionsByMember(memberId);
      res.json(contributions);
    } catch (error) {
      console.error("Get contributions error:", error);
      res.status(500).json({ message: "Failed to load contributions" });
    }
  });

  // Loan routes
  app.get("/api/loans", requireAuth, async (req, res) => {
    try {
      const loans = await storage.getAllActiveLoans();
      
      // Enhance loans with member data
      const enhancedLoans = await Promise.all(
        loans.map(async (loan) => {
          const member = await storage.getMemberById(loan.memberId);
          return {
            ...loan,
            memberName: member?.name,
            memberTotalContributions: await storage.getTotalContributionsByMember(loan.memberId),
          };
        })
      );
      
      res.json(enhancedLoans);
    } catch (error) {
      console.error("Get loans error:", error);
      res.status(500).json({ message: "Failed to load loans" });
    }
  });

  app.post("/api/loans", requireAuth, async (req, res) => {
    try {
      const { memberIdInput, ...loanData } = addLoanSchema.parse(req.body);
      
      // Check member eligibility
      const totalContributions = await storage.getTotalContributionsByMember(memberIdInput);
      if (totalContributions < 30000) {
        return res.status(400).json({ message: "Member not eligible for loan. Minimum 30,000 RWF contributions required." });
      }
      
      const loan = await storage.createLoan({
        ...loanData,
        memberId: memberIdInput,
      });
      
      // Send loan approval email
      const member = await storage.getMemberById(memberIdInput);
      if (member?.email) {
        await sendLoanReminder(member.email, member.name, Number(loan.amount), loan.dueDate);
      }
      
      res.json(loan);
    } catch (error) {
      console.error("Create loan error:", error);
      res.status(500).json({ message: "Failed to create loan" });
    }
  });

  app.get("/api/loans/:memberId", requireAuth, async (req, res) => {
    try {
      const memberId = parseInt(req.params.memberId);
      const loans = await storage.getLoansByMember(memberId);
      res.json(loans);
    } catch (error) {
      console.error("Get member loans error:", error);
      res.status(500).json({ message: "Failed to load member loans" });
    }
  });

  // Penalty routes
  app.get("/api/penalties", requireAuth, async (req, res) => {
    try {
      const penalties = await storage.getOutstandingPenalties();
      
      // Enhance penalties with member data
      const enhancedPenalties = await Promise.all(
        penalties.map(async (penalty) => {
          const member = await storage.getMemberById(penalty.memberId);
          return {
            ...penalty,
            memberName: member?.name,
          };
        })
      );
      
      res.json(enhancedPenalties);
    } catch (error) {
      console.error("Get penalties error:", error);
      res.status(500).json({ message: "Failed to load penalties" });
    }
  });

  app.patch("/api/penalties/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const penalty = await storage.updatePenalty(id, updates);
      res.json(penalty);
    } catch (error) {
      console.error("Update penalty error:", error);
      res.status(500).json({ message: "Failed to update penalty" });
    }
  });

  // Settings routes
  app.get("/api/settings", requireAuth, async (req, res) => {
    try {
      const defaultSettings = [
        'contribution_amount',
        'late_fee_amount',
        'loan_penalty_amount',
        'payment_deadline_day',
        'loan_eligibility_minimum',
        'auto_late_fees',
        'auto_loan_penalties',
        'email_notifications',
      ];
      
      const settings: Record<string, string> = {};
      for (const key of defaultSettings) {
        const setting = await storage.getSetting(key);
        settings[key] = setting?.value || '';
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Get settings error:", error);
      res.status(500).json({ message: "Failed to load settings" });
    }
  });

  app.post("/api/settings", requireAuth, async (req, res) => {
    try {
      const settingsData = req.body;
      
      const updatedSettings: Record<string, string> = {};
      for (const [key, value] of Object.entries(settingsData)) {
        if (typeof value === 'string') {
          const setting = await storage.setSetting(key, value);
          updatedSettings[key] = setting.value;
        }
      }
      
      res.json(updatedSettings);
    } catch (error) {
      console.error("Update settings error:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Email notification routes
  app.post("/api/notifications/send-reminders", requireAuth, async (req, res) => {
    try {
      const members = await storage.getAllMembers();
      const currentMonth = new Date().toISOString().slice(0, 7);
      
      let sentCount = 0;
      
      for (const member of members) {
        if (!member.email) continue;
        
        const contribution = await storage.getContributionByMemberAndMonth(member.id, currentMonth);
        if (!contribution || contribution.status === 'unpaid') {
          await sendContributionReminder(member.email, member.name, currentMonth);
          sentCount++;
        }
      }
      
      res.json({ message: `Sent ${sentCount} reminder emails` });
    } catch (error) {
      console.error("Send reminders error:", error);
      res.status(500).json({ message: "Failed to send reminders" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
