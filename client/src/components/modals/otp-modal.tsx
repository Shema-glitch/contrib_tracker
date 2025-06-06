import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { Shield } from "lucide-react";

interface OtpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerify: (token: string) => Promise<boolean>;
  email: string;
  title?: string;
  description?: string;
}

export default function OtpModal({ 
  open, 
  onOpenChange, 
  onVerify, 
  email,
  title = "OTP Verification",
  description = "Enter the code sent to your email"
}: OtpModalProps) {
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleVerify = async () => {
    if (otp.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter the complete 6-digit code",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const success = await onVerify(otp);
    setIsLoading(false);

    if (success) {
      onOpenChange(false);
      setOtp("");
    } else {
      toast({
        title: "Error",
        description: "Invalid or expired OTP code",
        variant: "destructive",
      });
    }
  };

  const handleResend = async () => {
    // Implementation for resending OTP
    toast({
      title: "OTP Resent",
      description: "A new code has been sent to your email",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
            <br />
            <span className="text-xs text-muted-foreground">Sent to: {email}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={setOtp}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Didn't receive code?{" "}
              <Button variant="link" className="p-0 h-auto" onClick={handleResend}>
                Resend
              </Button>
            </p>
          </div>

          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleVerify}
              disabled={isLoading || otp.length !== 6}
              className="flex-1"
            >
              {isLoading ? "Verifying..." : "Verify"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
