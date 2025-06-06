import { Card, CardContent } from "@/components/ui/card";
import { HandHeart, TrendingUp, Clock, AlertTriangle } from "lucide-react";

interface StatsCardsProps {
  stats?: {
    totalContributionsThisMonth: string;
    activeLoans: number;
    latePayments: number;
    penaltiesCollected: string;
  };
  isLoading: boolean;
}

export default function StatsCards({ stats, isLoading }: StatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "This Month's Contributions",
      value: `${parseFloat(stats?.totalContributionsThisMonth || "0").toLocaleString()} RWF`,
      icon: HandHeart,
      trend: "+12% from last month",
      trendUp: true,
      bgColor: "bg-green-100 dark:bg-green-900/20",
      iconColor: "text-green-600 dark:text-green-400",
    },
    {
      title: "Active Loans",
      value: stats?.activeLoans?.toString() || "0",
      icon: TrendingUp,
      trend: "420,000 RWF total",
      trendUp: false,
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Late Payments",
      value: stats?.latePayments?.toString() || "0",
      icon: Clock,
      trend: "Requires attention",
      trendUp: false,
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
      iconColor: "text-orange-600 dark:text-orange-400",
    },
    {
      title: "Penalties Collected",
      value: `${parseFloat(stats?.penaltiesCollected || "0").toLocaleString()} RWF`,
      icon: AlertTriangle,
      trend: "5 members affected",
      trendUp: false,
      bgColor: "bg-red-100 dark:bg-red-900/20",
      iconColor: "text-red-600 dark:text-red-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <Card key={index} className="enterprise-stat-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                <p className="text-3xl font-bold mt-2">{card.value}</p>
                <p className={`text-sm mt-1 ${card.trendUp ? 'enterprise-success' : 'text-muted-foreground'}`}>
                  {card.trendUp && <TrendingUp className="inline mr-1 h-3 w-3" />}
                  {card.trend}
                </p>
              </div>
              <div className={`w-12 h-12 ${card.bgColor} rounded-lg flex items-center justify-center`}>
                <card.icon className={`${card.iconColor} h-6 w-6`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
