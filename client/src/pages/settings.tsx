import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  DollarSign, 
  HandHeart, 
  Mail, 
  Shield, 
  Save,
  RotateCcw,
  Settings as SettingsIcon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/lib/theme";
import { apiRequest } from "@/lib/queryClient";

interface SettingsData {
  contributionAmount: string;
  paymentDeadline: string;
  lateFeeAmount: string;
  minContributionEligibility: string;
  loanPenaltyAmount: string;
  defaultLoanTerm: string;
  monthlyReminders: boolean;
  latePaymentNotifications: boolean;
  loanReminders: boolean;
  penaltyNotifications: boolean;
  reminderDays: string;
  otpProvider: string;
  requireOTPSensitive: boolean;
  autoLateFees: boolean;
  autoLoanPenalties: boolean;
}

const defaultSettings: SettingsData = {
  contributionAmount: "5000",
  paymentDeadline: "15",
  lateFeeAmount: "1000",
  minContributionEligibility: "30000",
  loanPenaltyAmount: "30000",
  defaultLoanTerm: "3",
  monthlyReminders: true,
  latePaymentNotifications: true,
  loanReminders: true,
  penaltyNotifications: true,
  reminderDays: "3",
  otpProvider: "gmail",
  requireOTPSensitive: true,
  autoLateFees: true,
  autoLoanPenalties: true,
};

export default function Settings() {
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ["/api/settings"],
    queryFn: async () => {
      // Fetch all settings
      const settingsKeys = Object.keys(defaultSettings);
      const settingsPromises = settingsKeys.map(async (key) => {
        try {
          const response = await apiRequest("GET", `/api/settings/${key}`);
          return { key, value: await response.json() };
        } catch {
          return { key, value: null };
        }
      });
      
      const results = await Promise.all(settingsPromises);
      const settingsObj: any = {};
      
      results.forEach(({ key, value }) => {
        if (value && value.value !== undefined) {
          settingsObj[key] = value.value;
        } else {
          settingsObj[key] = defaultSettings[key as keyof SettingsData];
        }
      });
      
      return settingsObj;
    },
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async (settingsToSave: SettingsData) => {
      const promises = Object.entries(settingsToSave).map(([key, value]) =>
        apiRequest("POST", "/api/settings", { key, value: value.toString() })
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Success",
        description: "Settings saved successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (settingsData) {
      setSettings(settingsData);
    }
  }, [settingsData]);

  const handleSettingChange = (key: keyof SettingsData, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSaveSettings = () => {
    saveSettingsMutation.mutate(settings);
  };

  const handleResetSettings = () => {
    setSettings(defaultSettings);
    toast({
      title: "Settings Reset",
      description: "All settings have been reset to defaults",
    });
  };

  const handleThemeToggle = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure application settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contribution Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Contribution Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="contributionAmount">Monthly Contribution Amount</Label>
              <div className="flex mt-2">
                <Input
                  id="contributionAmount"
                  type="number"
                  value={settings.contributionAmount}
                  onChange={(e) => handleSettingChange("contributionAmount", e.target.value)}
                  className="flex-1"
                />
                <span className="flex items-center px-3 bg-muted border border-l-0 rounded-r-md text-muted-foreground">
                  RWF
                </span>
              </div>
            </div>

            <div>
              <Label htmlFor="paymentDeadline">Payment Deadline (Day of Month)</Label>
              <Input
                id="paymentDeadline"
                type="number"
                min="1"
                max="31"
                value={settings.paymentDeadline}
                onChange={(e) => handleSettingChange("paymentDeadline", e.target.value)}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="lateFeeAmount">Late Fee Amount</Label>
              <div className="flex mt-2">
                <Input
                  id="lateFeeAmount"
                  type="number"
                  value={settings.lateFeeAmount}
                  onChange={(e) => handleSettingChange("lateFeeAmount", e.target.value)}
                  className="flex-1"
                />
                <span className="flex items-center px-3 bg-muted border border-l-0 rounded-r-md text-muted-foreground">
                  RWF
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loan Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HandHeart className="h-5 w-5" />
              Loan Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="minContributionEligibility">Minimum Contribution for Eligibility</Label>
              <div className="flex mt-2">
                <Input
                  id="minContributionEligibility"
                  type="number"
                  value={settings.minContributionEligibility}
                  onChange={(e) => handleSettingChange("minContributionEligibility", e.target.value)}
                  className="flex-1"
                />
                <span className="flex items-center px-3 bg-muted border border-l-0 rounded-r-md text-muted-foreground">
                  RWF
                </span>
              </div>
            </div>

            <div>
              <Label htmlFor="loanPenaltyAmount">Loan Penalty Amount</Label>
              <div className="flex mt-2">
                <Input
                  id="loanPenaltyAmount"
                  type="number"
                  value={settings.loanPenaltyAmount}
                  onChange={(e) => handleSettingChange("loanPenaltyAmount", e.target.value)}
                  className="flex-1"
                />
                <span className="flex items-center px-3 bg-muted border border-l-0 rounded-r-md text-muted-foreground">
                  RWF
                </span>
              </div>
            </div>

            <div>
              <Label htmlFor="defaultLoanTerm">Default Loan Term (Months)</Label>
              <Input
                id="defaultLoanTerm"
                type="number"
                min="1"
                max="12"
                value={settings.defaultLoanTerm}
                onChange={(e) => handleSettingChange("defaultLoanTerm", e.target.value)}
                className="mt-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Email Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="monthlyReminders">Monthly Contribution Reminders</Label>
              <Switch
                id="monthlyReminders"
                checked={settings.monthlyReminders}
                onCheckedChange={(checked) => handleSettingChange("monthlyReminders", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="latePaymentNotifications">Late Payment Notifications</Label>
              <Switch
                id="latePaymentNotifications"
                checked={settings.latePaymentNotifications}
                onCheckedChange={(checked) => handleSettingChange("latePaymentNotifications", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="loanReminders">Loan Due Date Reminders</Label>
              <Switch
                id="loanReminders"
                checked={settings.loanReminders}
                onCheckedChange={(checked) => handleSettingChange("loanReminders", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="penaltyNotifications">Penalty Notifications</Label>
              <Switch
                id="penaltyNotifications"
                checked={settings.penaltyNotifications}
                onCheckedChange={(checked) => handleSettingChange("penaltyNotifications", checked)}
              />
            </div>

            <div>
              <Label htmlFor="reminderDays">Reminder Days Before Due Date</Label>
              <Input
                id="reminderDays"
                type="number"
                min="1"
                max="15"
                value={settings.reminderDays}
                onChange={(e) => handleSettingChange("reminderDays", e.target.value)}
                className="mt-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Security & System Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security & System
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="otpProvider">OTP Email Provider</Label>
              <Select value={settings.otpProvider} onValueChange={(value) => handleSettingChange("otpProvider", value)}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gmail">Gmail SMTP</SelectItem>
                  <SelectItem value="sendgrid">SendGrid</SelectItem>
                  <SelectItem value="mailgun">Mailgun</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="requireOTPSensitive">Require OTP for Sensitive Operations</Label>
              <Switch
                id="requireOTPSensitive"
                checked={settings.requireOTPSensitive}
                onCheckedChange={(checked) => handleSettingChange("requireOTPSensitive", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="autoLateFees">Auto-apply Late Fees</Label>
              <Switch
                id="autoLateFees"
                checked={settings.autoLateFees}
                onCheckedChange={(checked) => handleSettingChange("autoLateFees", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="autoLoanPenalties">Auto-apply Loan Penalties</Label>
              <Switch
                id="autoLoanPenalties"
                checked={settings.autoLoanPenalties}
                onCheckedChange={(checked) => handleSettingChange("autoLoanPenalties", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="darkMode">Dark Mode</Label>
              <Switch
                id="darkMode"
                checked={theme === "dark"}
                onCheckedChange={handleThemeToggle}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Settings */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                Save Configuration
              </h3>
              <p className="text-muted-foreground">Changes will be applied immediately</p>
            </div>
            <div className="space-x-2">
              <Button variant="outline" onClick={handleResetSettings}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Defaults
              </Button>
              <Button 
                onClick={handleSaveSettings}
                disabled={saveSettingsMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {saveSettingsMutation.isPending ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
