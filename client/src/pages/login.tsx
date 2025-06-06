import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Coins, 
  Mail, 
  Shield, 
  Lock, 
  Send, 
  Key,
  Users,
  CreditCard,
  BarChart3,
  CheckCircle2,
  Calendar,
  Bell,
  Receipt
} from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { motion } from "framer-motion";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "password" | "otp">("email");
  const [loginMethod, setLoginMethod] = useState<"password" | "otp">("password");
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, setLocation]);

  const handleTraditionalLogin = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.requiresOtp) {
        setStep("otp");
        toast({
          title: "Success",
          description: data.message,
        });
      } else if (data.requiresOtp === false) {
        // Direct login without OTP (shouldn't happen in this system)
        setLocation("/dashboard");
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Login failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpLogin = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setStep("otp");
        toast({
          title: "Success",
          description: data.message,
        });
      } else {
        if (data.requireTraditionalLogin) {
          setLoginMethod("password");
          setStep("password");
          toast({
            title: "Password Required",
            description: data.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: data.message,
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send OTP",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = () => {
    if (loginMethod === "password") {
      setStep("password");
    } else {
      handleOtpLogin();
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
    await handleOtpLogin(); // Re-trigger login to get new OTP
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8 w-full lg:w-1/2">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card className="w-full">
          <CardHeader className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4"
              >
              <Coins className="text-2xl text-primary-foreground" />
              </motion.div>
            <CardTitle className="text-xl sm:text-2xl">Member Contribution Manager</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              {step === "email" 
                  ? "Welcome back! Please enter your email to continue" 
                : step === "password"
                ? "Enter your password to proceed"
                  : "Enter the 6-digit code sent to your email"
              }
            </CardDescription>
          </CardHeader>
        <CardContent className="space-y-4">
        {step === "email" && (
            <>
              <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="email"
                    type="email"
                        placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-11"
                        autoFocus
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Login Method</Label>
                    <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={loginMethod === "password" ? "default" : "outline"}
                    onClick={() => setLoginMethod("password")}
                        className="h-11"
                  >
                        <Key className="mr-2 h-4 w-4" />
                        Password
                  </Button>
                  <Button
                    type="button"
                    variant={loginMethod === "otp" ? "default" : "outline"}
                    onClick={() => setLoginMethod("otp")}
                        className="h-11"
                  >
                        <Send className="mr-2 h-4 w-4" />
                        OTP
                  </Button>
                </div>
              </div>

              <Button 
                onClick={handleEmailSubmit} 
                disabled={isLoading || !email}
                    className="w-full h-11"
              >
                {loginMethod === "password" ? (
                  <>
                    <Key className="mr-2 h-4 w-4" />
                    {isLoading ? "Processing..." : "Continue with Password"}
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    {isLoading ? "Sending..." : "Send OTP"}
                  </>
                )}
              </Button>
            </>
          )}

          {step === "password" && (
            <>
              <div className="text-center mb-4">
                <p className="text-sm text-muted-foreground">
                  Enter your password for: <strong>{email}</strong>
                </p>
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
                        className="pl-10 h-11"
                        autoFocus
                    onKeyPress={(e) => e.key === "Enter" && handleTraditionalLogin()}
                  />
                </div>
              </div>
              <Button 
                onClick={handleTraditionalLogin} 
                disabled={isLoading || !password}
                    className="w-full h-11"
              >
                <Key className="mr-2 h-4 w-4" />
                {isLoading ? "Verifying..." : "Login & Send OTP"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setStep("email")}
                    className="w-full h-11"
              >
                    <Mail className="mr-2 h-4 w-4" />
                Back to Email
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
                  className="w-full"
                      autoFocus
                >
                  <InputOTPGroup className="gap-1 sm:gap-2">
                        <InputOTPSlot index={0} className="w-10 h-10 text-base" />
                        <InputOTPSlot index={1} className="w-10 h-10 text-base" />
                        <InputOTPSlot index={2} className="w-10 h-10 text-base" />
                        <InputOTPSlot index={3} className="w-10 h-10 text-base" />
                        <InputOTPSlot index={4} className="w-10 h-10 text-base" />
                        <InputOTPSlot index={5} className="w-10 h-10 text-base" />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <Button 
                onClick={handleVerifyOtp} 
                disabled={isLoading || otp.length !== 6}
                    className="w-full h-11"
              >
                <Shield className="mr-2 h-4 w-4" />
                {isLoading ? "Verifying..." : "Verify & Complete Login"}
              </Button>
                  <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="ghost" 
                  onClick={handleResendOtp}
                  disabled={isLoading}
                      className="h-11"
                >
                      <Send className="mr-2 h-4 w-4" />
                  Resend OTP
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setStep("email")}
                  disabled={isLoading}
                      className="h-11"
                >
                      <Mail className="mr-2 h-4 w-4" />
                  Back to Email
                </Button>
              </div>
            </>
          )}
        </CardContent>
        </Card>
        </motion.div>
      </div>

      {/* Right Side - Features */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-8 bg-gradient-to-br from-blue-600/10 to-indigo-600/10">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md space-y-8"
        >
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200">
              Simplify Member
            </h2>
            <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Contribution Management
            </div>
          </div>
          
          <div className="space-y-4">
            <FeatureCard 
              icon={<Users className="h-5 w-5 text-blue-600" />}
              title="Member Tracking"
              description="Keep track of all your members' information, payment history, and contribution status in one place"
            />
            <FeatureCard 
              icon={<Calendar className="h-5 w-5 text-indigo-600" />}
              title="Payment Scheduling"
              description="Set up regular contribution schedules and never miss a payment deadline"
            />
            <FeatureCard 
              icon={<Bell className="h-5 w-5 text-blue-600" />}
              title="Smart Reminders"
              description="Automatically send friendly reminders to members about upcoming or missed payments"
            />
            <FeatureCard 
              icon={<Receipt className="h-5 w-5 text-indigo-600" />}
              title="Easy Reports"
              description="Generate clear reports showing who has paid, who hasn't, and track overall contributions"
            />
          </div>

          <div className="text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Designed for Community Leaders
            </p>
            <div className="flex items-center justify-center space-x-4 mt-4">
              <div className="flex -space-x-2">
                {[1,2,3,4].map(i => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 border-2 border-white dark:border-slate-800 flex items-center justify-center"
                  >
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  </motion.div>
                ))}
              </div>
              <span className="text-xs text-slate-500">Simple & Reliable</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-lg bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 hover:bg-white/80 dark:hover:bg-slate-800/80 transition-colors"
    >
      <div className="flex items-start space-x-3">
        <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
          {icon}
        </div>
      <div>
        <h3 className="font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
      </div>
    </div>
    </motion.div>
  );
}