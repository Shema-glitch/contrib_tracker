import cron from 'node-cron';
import { storage } from './storage';
import { sendContributionReminder, sendLoanReminder, sendLatePaymentNotice } from './email';

// Check for late contributions and apply penalties (runs daily at 9 AM)
cron.schedule('0 9 * * *', async () => {
  console.log('Running daily penalty check...');
  
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.toISOString().slice(0, 7);
    const dayOfMonth = currentDate.getDate();
    
    // Check if it's past the 15th (payment deadline)
    if (dayOfMonth > 15) {
      const members = await storage.getAllMembers();
      
      for (const member of members) {
        const contribution = await storage.getContributionByMemberAndMonth(member.id, currentMonth);
        
        // If no contribution record exists or it's unpaid, create/update with late status
        if (!contribution) {
          const dueDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 15);
          await storage.createContribution({
            memberId: member.id,
            month: currentMonth,
            amount: '5000.00',
            paidAmount: '0.00',
            lateFee: '1000.00',
            status: 'late',
            dueDate,
          });
          
          // Apply late penalty
          await storage.createPenalty({
            memberId: member.id,
            type: 'late_contribution',
            amount: '1000.00',
            reason: `Late payment for ${currentMonth}`,
            status: 'outstanding',
          });
          
          // Send notification email
          if (member.email) {
            await sendLatePaymentNotice(member.email, member.name, 1000);
          }
        } else if (contribution.status === 'unpaid') {
          // Update existing unpaid contribution to late
          await storage.updateContribution(contribution.id, {
            status: 'late',
            lateFee: '1000.00',
          });
          
          // Apply late penalty if not already applied
          const existingPenalties = await storage.getPenaltiesByMember(member.id);
          const hasLatePenalty = existingPenalties.some(
            p => p.type === 'late_contribution' && p.contributionId === contribution.id
          );
          
          if (!hasLatePenalty) {
            await storage.createPenalty({
              memberId: member.id,
              type: 'late_contribution',
              amount: '1000.00',
              reason: `Late payment for ${currentMonth}`,
              status: 'outstanding',
              contributionId: contribution.id,
            });
            
            if (member.email) {
              await sendLatePaymentNotice(member.email, member.name, 1000);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error in daily penalty check:', error);
  }
});

// Check for overdue loans and apply penalties (runs daily at 10 AM)
cron.schedule('0 10 * * *', async () => {
  console.log('Running overdue loan check...');
  
  try {
    const currentDate = new Date();
    const activeLoans = await storage.getAllActiveLoans();
    
    for (const loan of activeLoans) {
      if (currentDate > loan.dueDate) {
        // Loan is overdue
        const member = await storage.getMemberById(loan.memberId);
        if (!member) continue;
        
        // Check if penalty already applied
        const penalties = await storage.getPenaltiesByMember(member.id);
        const hasOverduePenalty = penalties.some(
          p => p.type === 'overdue_loan' && p.loanId === loan.id
        );
        
        if (!hasOverduePenalty) {
          // Apply overdue loan penalty
          await storage.createPenalty({
            memberId: member.id,
            type: 'overdue_loan',
            amount: '30000.00',
            reason: `Overdue loan of ${loan.amount} RWF`,
            status: 'outstanding',
            loanId: loan.id,
          });
          
          // Update loan status
          await storage.updateLoan(loan.id, {
            status: 'overdue',
            penalty: '30000.00',
          });
          
          // Send notification email
          if (member.email) {
            await sendLatePaymentNotice(member.email, member.name, 30000);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error in overdue loan check:', error);
  }
});

// Send monthly contribution reminders (runs on the 10th of each month at 9 AM)
cron.schedule('0 9 10 * *', async () => {
  console.log('Sending monthly contribution reminders...');
  
  try {
    const members = await storage.getAllMembers();
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    for (const member of members) {
      if (!member.email) continue;
      
      const contribution = await storage.getContributionByMemberAndMonth(member.id, currentMonth);
      
      // Send reminder if no contribution or unpaid
      if (!contribution || contribution.status === 'unpaid') {
        await sendContributionReminder(member.email, member.name, currentMonth);
      }
    }
  } catch (error) {
    console.error('Error sending monthly reminders:', error);
  }
});

// Send loan due date reminders (runs weekly on Mondays at 9 AM)
cron.schedule('0 9 * * 1', async () => {
  console.log('Sending loan due date reminders...');
  
  try {
    const activeLoans = await storage.getAllActiveLoans();
    const currentDate = new Date();
    const reminderDate = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    
    for (const loan of activeLoans) {
      if (loan.dueDate <= reminderDate && loan.dueDate > currentDate) {
        const member = await storage.getMemberById(loan.memberId);
        
        if (member?.email) {
          await sendLoanReminder(member.email, member.name, Number(loan.amount), loan.dueDate);
        }
      }
    }
  } catch (error) {
    console.error('Error sending loan reminders:', error);
  }
});

export function startScheduler() {
  console.log('Scheduler started - automated penalties and notifications active');
}
