import React from "react";
import { Check, Shield, Zap, Sparkles, CreditCard, ExternalLink } from "lucide-react";

interface BillingTabProps {
  business: {
    id: string;
    companyName: string;
    subscription?: {
      id: string;
      planId: string;
      status: string;
      currentPeriodEnd: string;
    } | null;
  };
  handleStripeCheckout: (planId: string) => Promise<void>;
  handleStripePortal: () => Promise<void>;
}

export const BillingTab: React.FC<BillingTabProps> = ({
  business,
  handleStripeCheckout,
  handleStripePortal,
}) => {
  const currentPlan = business.subscription?.planId?.toLowerCase() || "free";
  const subStatus = business.subscription?.status || "TRIAL";
  const periodEnd = business.subscription?.currentPeriodEnd;

  const plans = [
    {
      id: "free",
      name: "Starter Sandbox",
      price: "$0",
      description: "Ideal for validation, prototyping, and testing local channels.",
      features: [
        "Up to 100 qualified leads/mo",
        "1 AI Chatbot widget deployment",
        "Basic WhatsApp & Web Simulators",
        "Prisma SQLite local cache access",
        "Standard intent analysis (10sec TTL)",
      ],
      icon: Shield,
      badge: "Free Tier",
    },
    {
      id: "growth",
      name: "Growth Professional",
      price: "$49",
      period: "/month",
      description: "Complete Lead Intelligence suite for emerging businesses.",
      features: [
        "Unlimited qualified lead tracking",
        "Full lead enrichment & deal probability scoring",
        "Google Sheets real-time integrations",
        "Advanced custom prompt agent settings",
        "Priority queue processing & Redis Caching",
        "Email support (under 12-hour response)",
      ],
      icon: Zap,
      badge: "Popular",
      accent: true,
    },
    {
      id: "enterprise",
      name: "Enterprise Dedicated",
      price: "$199",
      period: "/month",
      description: "Bespoke automation, multiple team workspaces, and custom limits.",
      features: [
        "Everything in Growth Professional",
        "Custom domain assets & cloud CDN deliveries",
        "Multiple team workspace invitations",
        "SLA guaranteed uptime metrics",
        "Full API key & webhook ingestion triggers",
        "Dedicated Account Specialist onboarding",
      ],
      icon: Sparkles,
      badge: "Scale Up",
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white">Subscription & Licensing Plan</h3>
          <p className="text-xs text-muted-text mt-1">
            Manage your billing workspace, payment accounts, and current resource consumption limits.
          </p>
        </div>
        {business.subscription?.id && (
          <button
            onClick={handleStripePortal}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-accent-primary bg-accent-primary/10 border border-accent-primary/20 hover:bg-accent-primary/20 hover:text-white rounded-xl transition-all cursor-pointer"
          >
            <CreditCard className="h-4 w-4" />
            Billing Customer Portal
            <ExternalLink className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Current Subscription Card */}
      <div className="border border-card-border rounded-2xl bg-card/20 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-text font-medium uppercase tracking-wider">Current Account Plan</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent-primary/10 text-accent-primary border border-accent-primary/20">
              {subStatus}
            </span>
          </div>
          <h4 className="text-lg font-bold text-white capitalize">
            {plans.find((p) => p.id === currentPlan)?.name || currentPlan} Plan
          </h4>
          {periodEnd && (
            <p className="text-xs text-muted-text">
              Next billing statement scheduled for: {new Date(periodEnd).toLocaleDateString()}
            </p>
          )}
        </div>
        <div className="text-left md:text-right">
          <p className="text-xs text-muted-text">Workspace Account Owner</p>
          <p className="text-sm font-semibold text-white">{business.companyName}</p>
        </div>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const PlanIcon = plan.icon;
          const isCurrent = plan.id === currentPlan;
          return (
            <div
              key={plan.id}
              className={`relative border rounded-3xl bg-card/10 flex flex-col justify-between transition-all duration-300 p-6 ${
                plan.accent
                  ? "border-accent-primary/50 shadow-lg shadow-accent-primary/5 bg-accent-primary/[0.02]"
                  : "border-card-border"
              } ${isCurrent ? "ring-2 ring-accent-primary/40 bg-accent-primary/[0.04]" : ""}`}
            >
              {plan.badge && (
                <span
                  className={`absolute top-4 right-4 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest ${
                    plan.accent
                      ? "bg-accent-primary text-slate-950"
                      : "bg-slate-800 text-slate-300 border border-slate-700/50"
                  }`}
                >
                  {plan.badge}
                </span>
              )}

              <div className="space-y-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-accent-primary shadow-inner">
                  <PlanIcon className="h-5 w-5" />
                </div>

                <div>
                  <h4 className="text-lg font-extrabold text-white">{plan.name}</h4>
                  <p className="text-xs text-muted-text mt-1 min-h-[32px]">{plan.description}</p>
                </div>

                <div className="flex items-baseline gap-1 py-2">
                  <span className="text-3xl font-black text-white">{plan.price}</span>
                  {plan.period && <span className="text-xs text-muted-text">{plan.period}</span>}
                </div>

                <ul className="space-y-2.5 border-t border-card-border/60 pt-4">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                      <Check className="h-4.5 w-4.5 text-accent-primary shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8">
                {isCurrent ? (
                  <div className="w-full py-2.5 text-center text-xs font-semibold text-accent-primary bg-accent-primary/10 border border-accent-primary/20 rounded-xl">
                    Active Plan
                  </div>
                ) : (
                  <button
                    onClick={() => handleStripeCheckout(plan.id)}
                    className={`w-full py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                      plan.accent
                        ? "bg-accent-primary text-slate-950 hover:bg-emerald-400 hover:shadow-lg hover:shadow-accent-primary/20"
                        : "bg-slate-800 text-white hover:bg-slate-700 border border-slate-700"
                    }`}
                  >
                    Upgrade Workspace
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
