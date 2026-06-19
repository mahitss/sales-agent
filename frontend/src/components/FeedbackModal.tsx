import React, { useState } from "react";
import { X, Send, AlertCircle, CheckCircle2 } from "lucide-react";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
  apiUrl: string;
  userEmail?: string;
  userName?: string;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  businessId,
  apiUrl,
  userEmail = "",
  userName = "",
}) => {
  const [name, setName] = useState(userName);
  const [email, setEmail] = useState(userEmail);
  const [category, setCategory] = useState("FEEDBACK"); // FEEDBACK, BUG, FEATURE_REQUEST, SUPPORT
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !content) {
      setError("Please complete all required fields.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch(`${apiUrl}/leads/business/${businessId}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, category, content }),
      });

      if (res.ok) {
        setSuccess(true);
        setContent("");
      } else {
        const data = await res.json();
        setError(data.message || "Failed to submit ticket request. Please try again.");
      }
    } catch {
      setError("Unable to connect to the servers. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg overflow-hidden border border-card-border bg-card/90 rounded-3xl p-6 shadow-2xl backdrop-blur-md transition-all duration-300">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-card-border">
          <div>
            <h3 className="text-lg font-bold text-white">Submit Feedback & Tickets</h3>
            <p className="text-xs text-muted-text mt-0.5">Let us know if you find a bug, want a new feature, or need customer support.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-text hover:bg-card border border-transparent hover:border-card-border transition-all cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        {success ? (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
            <CheckCircle2 className="h-12 w-12 text-emerald-400 animate-bounce" />
            <h4 className="font-bold text-white">Ticket Submitted Successfully!</h4>
            <p className="text-xs text-muted-text max-w-xs">
              Thank you for helping us improve Beacon. Our engineering and support team has been notified.
            </p>
            <button
              onClick={() => {
                setSuccess(false);
                onClose();
              }}
              className="mt-4 px-6 py-2 text-xs font-semibold bg-accent-primary text-slate-950 hover:bg-emerald-400 rounded-xl transition-all cursor-pointer"
            >
              Close Window
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            {error && (
              <div className="p-3 border border-red-500/20 bg-red-500/10 rounded-xl flex items-center gap-2 text-xs text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-semibold">Your Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950/40 border border-card-border text-white text-xs px-3 py-2 rounded-xl focus:border-accent-primary focus:outline-none transition-colors"
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-semibold">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950/40 border border-card-border text-white text-xs px-3 py-2 rounded-xl focus:border-accent-primary focus:outline-none transition-colors"
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-semibold">Category Type *</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { value: "FEEDBACK", label: "Feedback" },
                  { value: "BUG", label: "Bug Report" },
                  { value: "FEATURE_REQUEST", label: "Feature" },
                  { value: "SUPPORT", label: "Support" },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setCategory(item.value)}
                    className={`py-2 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer ${
                      category === item.value
                        ? "bg-accent-primary/10 text-accent-primary border-accent-primary/30"
                        : "bg-slate-950/20 text-muted-text border-card-border hover:border-slate-700 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-semibold">Describe Details *</label>
              <textarea
                required
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full bg-slate-950/40 border border-card-border text-white text-xs p-3 rounded-xl focus:border-accent-primary focus:outline-none transition-colors resize-none"
                placeholder="Describe your issue, feature idea, or question in detail..."
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-card-border">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-text hover:bg-card border border-transparent hover:border-card-border transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-accent-primary text-slate-950 hover:bg-emerald-400 disabled:opacity-50 transition-all cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
                {loading ? "Sending..." : "Submit Ticket"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
