import React from "react";
import { Globe, RefreshCw, ArrowRight, FileText, Plus, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { UserInfo, BusinessInfo, FAQItem } from "@/hooks/useDashboardData";

interface KnowledgeBaseTabProps {
  user: UserInfo | null;
  business: BusinessInfo | null;
  faqs: FAQItem[];
  scraperUrl: string;
  setScraperUrl: (val: string) => void;
  scraperLoading: boolean;
  scraperLogs: string[];
  handleStartScrape: (e: React.FormEvent) => void;
  kbUploading: boolean;
  kbFileName: string;
  kbProgress: number;
  handleStartFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  faqTitle: string;
  setFaqTitle: (val: string) => void;
  faqContent: string;
  setFaqContent: (val: string) => void;
  faqLoading: boolean;
  handleAddFAQ: (e: React.FormEvent) => void;
  handleDeleteFAQ: (faqId: string) => void;
}

export const KnowledgeBaseTab: React.FC<KnowledgeBaseTabProps> = ({
  user,
  faqs,
  scraperUrl,
  setScraperUrl,
  scraperLoading,
  scraperLogs,
  handleStartScrape,
  kbUploading,
  kbFileName,
  kbProgress,
  handleStartFileUpload,
  faqTitle,
  setFaqTitle,
  faqContent,
  setFaqContent,
  faqLoading,
  handleAddFAQ,
  handleDeleteFAQ,
}) => {
  return (
    <div className="space-y-8 pb-10">
      <div>
        <h3 className="text-xl font-bold text-white">Company FAQs & Knowledge Base</h3>
        <p className="text-xs text-muted-text mt-1">Upload answers, instructions, and services so the AI sales agent can reference them.</p>
      </div>

      {user?.role === 'ADMIN' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Website Scraper */}
          <div className="rounded-2xl border border-card-border bg-card/20 p-6 space-y-4 shadow-sm">
            <h4 className="font-bold text-sm uppercase tracking-wider text-muted-text flex items-center gap-2">
              <Globe className="h-4.5 w-4.5 text-accent-primary" />
              Auto Website Learning (Instant RAG Scraper)
            </h4>
            <p className="text-xs text-muted-text">
              Enter any website URL. Beacon will crawl the pages, extract FAQs/services, and automatically generate Knowledge Base articles using Gemini context extraction.
            </p>

            <form onSubmit={handleStartScrape} className="flex gap-3">
              <input
                type="url"
                required
                value={scraperUrl}
                onChange={(e) => setScraperUrl(e.target.value)}
                placeholder="e.g. https://theirwebsite.com"
                className="flex-1 rounded-xl bg-card border border-card-border px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent-primary/50 placeholder-slate-700 transition-all"
              />
              <button
                type="submit"
                disabled={scraperLoading || !scraperUrl}
                className="bg-accent-primary hover:bg-accent-hover text-white font-semibold rounded-xl px-5 py-2.5 text-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors shrink-0"
              >
                {scraperLoading ? (
                  <RefreshCw className="h-4.5 w-4.5 animate-spin" />
                ) : (
                  <ArrowRight className="h-4.5 w-4.5" />
                )}
                Crawl Website
              </button>
            </form>

            {scraperLogs.length > 0 && (
              <div className="rounded-xl bg-background border border-card-border p-4 font-mono text-[11px] text-accent-primary space-y-1 overflow-y-auto max-h-40 leading-relaxed shadow-inner">
                {scraperLogs.map((log, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-emerald-800 shrink-0">[{i+1}]</span>
                    <span>{log}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Document RAG Upload */}
          <div className="rounded-2xl border border-card-border bg-card/20 p-6 space-y-4 shadow-sm">
            <h4 className="font-bold text-sm uppercase tracking-wider text-muted-text flex items-center gap-2">
              <FileText className="h-4.5 w-4.5 text-accent-primary" />
              RAG Knowledge Document Upload
            </h4>
            <p className="text-xs text-muted-text">
              Upload service lists, catalogs, or context files (.txt, .csv, .json) to extract and inject FAQ items into your AI agent&apos;s memory.
            </p>

            <div className="border border-dashed border-card-border rounded-xl p-6 flex flex-col items-center justify-center bg-card/5 relative hover:bg-card/20 transition-all">
              <input
                type="file"
                accept=".txt,.csv,.json"
                onChange={handleStartFileUpload}
                disabled={kbUploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:pointer-events-none"
              />
              <FileText className={`h-8 w-8 text-slate-500 mb-2 ${kbUploading ? 'animate-bounce' : ''}`} />
              <p className="text-xs text-slate-400 text-center">
                {kbUploading ? `Reading and extracting "${kbFileName}"...` : 'Drag and drop or click to upload knowledge document'}
              </p>
              <p className="text-[10px] text-muted-text/80 mt-1">Supports UTF-8 text files up to 2MB</p>
            </div>

            {kbUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-mono text-accent-primary">
                  <span>Uploading...</span>
                  <span>{kbProgress}%</span>
                </div>
                <div className="w-full bg-card-border/40 h-1.5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-accent-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${kbProgress}%` }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {user?.role === 'ADMIN' && (
        /* Add FAQ form */
        <div className="rounded-2xl border border-card-border bg-card/20 p-6 shadow-sm">
          <h4 className="font-bold text-sm uppercase tracking-wider text-muted-text mb-4">Add FAQ Question</h4>
          <form onSubmit={handleAddFAQ} className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-text">Question / Topic Title</label>
              <input
                type="text"
                required
                value={faqTitle}
                onChange={(e) => setFaqTitle(e.target.value)}
                placeholder="e.g. What are your pricing plans for SEO services?"
                className="mt-1 w-full rounded-xl bg-card border border-card-border px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-accent-primary/50 focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-text">Answer / Knowledge Content</label>
              <textarea
                required
                value={faqContent}
                onChange={(e) => setFaqContent(e.target.value)}
                rows={3}
                placeholder="Detail the answer here..."
                className="mt-1 w-full rounded-xl bg-card border border-card-border px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-accent-primary/50 focus:outline-none transition-all resize-none"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={faqLoading || !faqTitle || !faqContent}
                className="flex items-center gap-1.5 bg-accent-primary hover:bg-accent-hover text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition-all shadow-md disabled:opacity-50 cursor-pointer"
              >
                <Plus className="h-4.5 w-4.5" />
                Add to Knowledge Base
              </button>
            </div>
          </form>
        </div>
      )}

      {/* FAQs list */}
      <div className="space-y-4">
        <h4 className="font-bold text-sm uppercase tracking-wider text-muted-text">Existing Knowledge Items</h4>
        {faqs.length === 0 ? (
          <div className="border border-card-border border-dashed rounded-2xl p-8 text-center text-muted-text text-sm">
            No FAQs uploaded yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {faqs.map((faq) => (
              <div key={faq.id} className="rounded-xl border border-card-border bg-card/10 p-5 flex justify-between gap-4 shadow-sm">
                <div className="space-y-1">
                  <h5 className="font-bold text-sm text-slate-200">{faq.title}</h5>
                  <p className="text-xs text-slate-400 leading-relaxed">{faq.content}</p>
                </div>
                {user?.role === 'ADMIN' && (
                  <button
                    onClick={() => handleDeleteFAQ(faq.id)}
                    className="text-slate-500 hover:text-red-400 rounded-lg p-1.5 self-start transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
