import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { onboardingSchema } from "@/lib/schemas";
import { Building, Globe, Briefcase, FileText, LogOut } from "lucide-react";

interface OnboardingFormProps {
  onSubmit: (data: z.infer<typeof onboardingSchema>) => void;
  onboardLoading: boolean;
  onLogout: () => void;
}

export const OnboardingForm: React.FC<OnboardingFormProps> = ({
  onSubmit,
  onboardLoading,
  onLogout,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { companyName: "", website: "", industry: "", description: "" },
  });

  return (
    <div className="w-full space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
          Set Up Your Business Profile
        </h2>
        <p className="mt-2 text-sm text-muted-text">
          Tell Beacon AI about your business so it can qualify leads and answer FAQs accurately.
        </p>
      </div>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="onboard-company" className="text-xs font-semibold uppercase tracking-wider text-muted-text block mb-1">
              Company Name
            </label>
            <div className="relative">
              <Building className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
              <input
                id="onboard-company"
                type="text"
                {...register("companyName")}
                placeholder="e.g. Acme Agency"
                aria-invalid={errors.companyName ? "true" : "false"}
                aria-describedby={errors.companyName ? "onboard-company-error" : undefined}
                className="w-full rounded-xl bg-slate-900 border border-slate-800/80 pl-11 pr-4 py-3 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all"
              />
            </div>
            {errors.companyName && (
              <p id="onboard-company-error" className="text-xs text-rose-400 mt-1">{errors.companyName.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="onboard-website" className="text-xs font-semibold uppercase tracking-wider text-muted-text block mb-1">
              Website URL
            </label>
            <div className="relative">
              <Globe className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
              <input
                id="onboard-website"
                type="text"
                {...register("website")}
                placeholder="e.g. acme.com"
                aria-invalid={errors.website ? "true" : "false"}
                aria-describedby={errors.website ? "onboard-website-error" : undefined}
                className="w-full rounded-xl bg-slate-900 border border-slate-800/80 pl-11 pr-4 py-3 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all"
              />
            </div>
            {errors.website && (
              <p id="onboard-website-error" className="text-xs text-rose-400 mt-1">{errors.website.message}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="onboard-industry" className="text-xs font-semibold uppercase tracking-wider text-muted-text block mb-1">
            Industry
          </label>
          <div className="relative">
            <Briefcase className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
            <input
              id="onboard-industry"
              type="text"
              {...register("industry")}
              placeholder="e.g. Marketing, Real Estate, Consulting"
              aria-invalid={errors.industry ? "true" : "false"}
              aria-describedby={errors.industry ? "onboard-industry-error" : undefined}
              className="w-full rounded-xl bg-slate-900 border border-slate-800/80 pl-11 pr-4 py-3 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all"
            />
          </div>
          {errors.industry && (
            <p id="onboard-industry-error" className="text-xs text-rose-400 mt-1">{errors.industry.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="onboard-description" className="text-xs font-semibold uppercase tracking-wider text-muted-text block mb-1">
            Company Description & Services
          </label>
          <div className="relative">
            <FileText className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500 animate-pulse" />
            <textarea
              id="onboard-description"
              {...register("description")}
              rows={4}
              placeholder="Describe what your business does, who you serve, pricing structure, and key services..."
              aria-invalid={errors.description ? "true" : "false"}
              aria-describedby={errors.description ? "onboard-description-error" : undefined}
              className="w-full rounded-xl bg-slate-900 border border-slate-800/80 pl-11 pr-4 py-3 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all resize-none"
            />
          </div>
          {errors.description && (
            <p id="onboard-description-error" className="text-xs text-rose-400 mt-1">{errors.description.message}</p>
          )}
        </div>

        <div>
          <button
            type="submit"
            disabled={onboardLoading}
            className="group relative flex w-full justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:opacity-50 transition-all shadow-lg cursor-pointer"
          >
            {onboardLoading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
            ) : (
              "Create Business Profile"
            )}
          </button>
        </div>
      </form>

      <div className="text-center mt-4">
        <button
          onClick={onLogout}
          className="text-xs font-medium text-slate-500 hover:text-slate-400 transition-colors cursor-pointer flex items-center justify-center gap-1 mx-auto focus:outline-none focus:underline"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign Out
        </button>
      </div>
    </div>
  );
};
