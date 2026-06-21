import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { registerSchema } from "@/lib/schemas";
import { Building, Lock, Mail, User, Eye, EyeOff, Check, X } from "lucide-react";

interface RegisterFormProps {
  onSubmit: (data: z.infer<typeof registerSchema>) => void;
  authLoading: boolean;
  authError: string;
  onToggleView: () => void;
  onGoogleSignUp?: () => void;
}

const GoogleIcon = () => (
  <svg className="mr-2 h-4 w-4 shrink-0" aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
    <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
  </svg>
);

const checkPasswordStrength = (pass: string) => {
  const requirements = [
    { id: "length", label: "At least 8 characters", met: pass.length >= 8 },
    { id: "uppercase", label: "At least one uppercase letter", met: /[A-Z]/.test(pass) },
    { id: "lowercase", label: "At least one lowercase letter", met: /[a-z]/.test(pass) },
    { id: "number_special", label: "At least one number or special character", met: /[\d\W]/.test(pass) },
  ];

  const metCount = requirements.filter((r) => r.met).length;

  let label = "Very Weak";
  let color = "bg-slate-800";
  let textColor = "text-slate-500";

  if (pass.length === 0) {
    label = "Empty";
  } else if (metCount === 1) {
    label = "Very Weak";
    color = "bg-red-500";
    textColor = "text-red-400";
  } else if (metCount === 2) {
    label = "Weak";
    color = "bg-orange-500";
    textColor = "text-orange-400";
  } else if (metCount === 3) {
    label = "Medium";
    color = "bg-yellow-500";
    textColor = "text-yellow-400";
  } else if (metCount === 4) {
    label = "Strong";
    color = "bg-emerald-500";
    textColor = "text-emerald-400";
  }

  return { requirements, metCount, label, color, textColor };
};

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSubmit,
  authLoading,
  authError,
  onToggleView,
  onGoogleSignUp,
}) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const [showPassword, setShowPassword] = useState(false);
  const passwordValue = watch("password", "");
  const strength = checkPasswordStrength(passwordValue);

  return (
    <div className="w-full space-y-6">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-lg shadow-emerald-500/20">
          <Building className="h-7 w-7" />
        </div>
        <h2 className="mt-6 text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
          Create Business Portal
        </h2>
        <p className="mt-2 text-sm text-muted-text">
          Get started with your AI-powered site widget
        </p>
      </div>

      {onGoogleSignUp && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={onGoogleSignUp}
            disabled={authLoading}
            className="flex w-full items-center justify-center rounded-xl border border-slate-800/80 bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-800/50 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 disabled:opacity-50 transition-all shadow-sm cursor-pointer"
            aria-label="Register with Google"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="relative flex items-center justify-center py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800/80"></div>
            </div>
            <span className="relative bg-slate-950 px-3 text-xs uppercase tracking-wider text-slate-500">
              Or continue with email
            </span>
          </div>
        </div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        {authError && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400 text-center" role="alert">
            {authError}
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label htmlFor="reg-name" className="text-xs font-semibold uppercase tracking-wider text-muted-text block mb-1">
              Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
              <input
                id="reg-name"
                type="text"
                {...register("name")}
                placeholder="John Doe"
                aria-invalid={errors.name ? "true" : "false"}
                aria-describedby={errors.name ? "reg-name-error" : undefined}
                className="w-full rounded-xl bg-slate-900 border border-slate-800/80 pl-11 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all"
              />
            </div>
            {errors.name && (
              <p id="reg-name-error" className="text-xs text-rose-400 mt-1">{errors.name.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="reg-email" className="text-xs font-semibold uppercase tracking-wider text-muted-text block mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
              <input
                id="reg-email"
                type="email"
                {...register("email")}
                placeholder="admin@company.com"
                aria-invalid={errors.email ? "true" : "false"}
                aria-describedby={errors.email ? "reg-email-error" : undefined}
                className="w-full rounded-xl bg-slate-900 border border-slate-800/80 pl-11 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all"
              />
            </div>
            {errors.email && (
              <p id="reg-email-error" className="text-xs text-rose-400 mt-1">{errors.email.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="reg-password" className="text-xs font-semibold uppercase tracking-wider text-muted-text block mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
              <input
                id="reg-password"
                type={showPassword ? "text" : "password"}
                {...register("password")}
                placeholder="••••••••"
                aria-invalid={errors.password ? "true" : "false"}
                aria-describedby={errors.password ? "reg-password-error" : undefined}
                className="w-full rounded-xl bg-slate-900 border border-slate-800/80 pl-11 pr-10 py-3 text-sm text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>

            {/* Password Strength Meter Grid & Requirement List */}
            {passwordValue && (
              <div className="mt-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800/50 space-y-2">
                <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider">
                  <span className="text-slate-400">Password Strength:</span>
                  <span className={strength.textColor}>{strength.label}</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 h-1.5">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`h-full rounded-full transition-all duration-300 ${
                        step <= strength.metCount ? strength.color : "bg-slate-800"
                      }`}
                    />
                  ))}
                </div>
                <ul className="space-y-1 pt-1.5 border-t border-slate-800/40" aria-label="Password requirements checklist">
                  {strength.requirements.map((req) => (
                    <li key={req.id} className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      {req.met ? (
                        <Check className="h-3 w-3 text-emerald-400 shrink-0" />
                      ) : (
                        <X className="h-3 w-3 text-slate-600 shrink-0" />
                      )}
                      <span className={req.met ? "text-slate-300 line-through decoration-slate-600/55" : ""}>
                        {req.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {errors.password && (
              <p id="reg-password-error" className="text-xs text-rose-400 mt-1">{errors.password.message}</p>
            )}
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={authLoading}
            className="group relative flex w-full justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:opacity-50 transition-all shadow-lg cursor-pointer"
          >
            {authLoading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
            ) : (
              "Register Agent"
            )}
          </button>
        </div>
      </form>

      <div className="text-center">
        <button
          onClick={onToggleView}
          className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer focus:outline-none focus:underline"
        >
          Already have an account? Sign in
        </button>
      </div>
    </div>
  );
};
