
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Coins, Mail, Shield, Lock } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export default function LoginPage() {
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, setLocation]);

  const handleLogin = async () => {
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        if (result.requireOtp) {
          setStep("otp");
          toast({
            title: "Login Successful",
            description: result.message,
          });
        }
      } else {
        toast({
          title: "Login Failed",
          description: result.message || "Invalid credentials",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter the complete 6-digit code",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const success = await login(email, otp);
    setIsLoading(false);

    if (!success) {
      toast({
        title: "Error",
        description: "Invalid or expired OTP code",
        variant: "destructive",
      });
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    await handleLogin(); // Re-trigger login to get new OTP
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Coins className="text-2xl text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Member Contribution Manager</CardTitle>
          <CardDescription>
            {step === "credentials" 
              ? "Secure admin access with email and password" 
              : "Enter the OTP code sent to your email"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === "credentials" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">Admin Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                  />
                </div>
              </div>
              <Button 
                onClick={handleLogin} 
                disabled={isLoading}
                className="w-full"
              >
                <Shield className="mr-2 h-4 w-4" />
                {isLoading ? "Signing in..." : "Sign In & Send OTP"}
              </Button>
            </>
          )}

          {step === "otp" && (
            <>
              <div className="text-center mb-4">
                <p className="text-sm text-muted-foreground">
                  Enter the 6-digit code sent to: <strong>{email}</strong>
                </p>
              </div>
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
              <Button 
                onClick={handleVerifyOtp} 
                disabled={isLoading || otp.length !== 6}
                className="w-full"
              >
                <Shield className="mr-2 h-4 w-4" />
                {isLoading ? "Verifying..." : "Verify & Complete Login"}
              </Button>
              <div className="flex space-x-2">
                <Button 
                  variant="ghost" 
                  onClick={handleResendOtp}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Resend OTP
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setStep("credentials")}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Back to Login
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
