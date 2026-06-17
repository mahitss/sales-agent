import React from "react";
import { Plus, RefreshCw } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { employeeSchema } from "@/lib/schemas";
import { z } from "zod";

type EmployeeInput = z.infer<typeof employeeSchema>;

interface TeamTabProps {
  employees: any[];
  employeeError: string;
  employeeSuccess: string;
  employeeLoading: boolean;
  handleAddEmployee: (data: { name: string; email: string; password?: string }) => void;
}

export const TeamTab: React.FC<TeamTabProps> = ({
  employees,
  employeeError,
  employeeSuccess,
  employeeLoading,
  handleAddEmployee,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EmployeeInput>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = (data: EmployeeInput) => {
    handleAddEmployee({
      name: data.name,
      email: data.email,
      password: data.password || undefined,
    });
    // Reset form after submit
    reset();
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-bold text-white">Team Seats Management</h3>
        <p className="text-xs text-slate-500 mt-1">Create operator logins for your support agents so they can reply in the Live Inbox.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Operator Form */}
        <div className="lg:col-span-1 rounded-2xl border border-slate-900 bg-slate-900/30 p-6 space-y-4 h-fit">
          <h4 className="font-bold text-sm uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Plus className="h-4.5 w-4.5 text-emerald-400" />
            Invite Support Agent
          </h4>
          
          {employeeError && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-400 text-center">
              {employeeError}
            </div>
          )}
          {employeeSuccess && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-400 text-center">
              {employeeSuccess}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Agent Name</label>
              <input
                type="text"
                {...register("name")}
                placeholder="e.g. Alice Smith"
                className="mt-1 w-full rounded-xl bg-slate-900 border border-slate-800 px-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
              />
              {errors.name && (
                <p className="text-[10px] text-rose-400 mt-1">{errors.name.message}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Email Address</label>
              <input
                type="email"
                {...register("email")}
                placeholder="e.g. alice@company.com"
                className="mt-1 w-full rounded-xl bg-slate-900 border border-slate-800 px-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
              />
              {errors.email && (
                <p className="text-[10px] text-rose-400 mt-1">{errors.email.message}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Temporary Password</label>
              <input
                type="text"
                {...register("password")}
                placeholder="Welcome123! (Defaults if blank)"
                className="mt-1 w-full rounded-xl bg-slate-900 border border-slate-800 px-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
              />
              {errors.password && (
                <p className="text-[10px] text-rose-400 mt-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={employeeLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl py-2.5 text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {employeeLoading ? (
                <RefreshCw className="h-4.5 w-4.5 animate-spin" />
              ) : (
                <Plus className="h-4.5 w-4.5" />
              )}
              Create Agent Account
            </button>
          </form>
        </div>

        {/* Operator List Table */}
        <div className="lg:col-span-2 space-y-4">
          <h4 className="font-bold text-sm uppercase tracking-wider text-slate-400">Active Operators</h4>
          <div className="overflow-hidden border border-slate-900 rounded-2xl bg-slate-900/10">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-900/50 border-b border-slate-900 text-xs font-semibold uppercase text-slate-400">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60">
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500 text-xs">
                      No employees added yet. Invite your first operator on the left!
                    </td>
                  </tr>
                ) : (
                  employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-900/20 text-xs transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-200">{emp.name}</td>
                      <td className="px-6 py-4 text-slate-300">{emp.email}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {emp.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(emp.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
