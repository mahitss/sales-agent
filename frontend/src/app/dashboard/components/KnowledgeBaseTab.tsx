import React from "react";
import { Globe, RefreshCw, ArrowRight, FileText, Plus, Trash2 } from "lucide-react";

interface FAQItem {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

interface KnowledgeBaseTabProps {
  user: any;
  business: any;
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
  business,
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
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-bold text-white">Company FAQs & Knowledge Base</h3>
        <p className="text-xs text-slate-500 mt-1">Upload answers, instructions, and services so the AI sales agent can reference them.</p>
      </div>

      {user?.role === 'ADMIN' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Website Scraper */}
          <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-6 space-y-4">
            <h4 className="font-bold text-sm uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Globe className="h-4.5 w-4.5 text-emerald-400 animate-pulse" />
              Auto Website Learning (Instant RAG Scraper)
            </h4>
            <p className="text-xs text-slate-500">
              Enter any website URL. Beacon will crawl the pages, extract FAQs/services, and automatically generate Knowledge Base articles using Gemini context extraction.
            </p>

            <form onSubmit={handleStartScrape} className="flex gap-3">
              <input
                type="url"
                required
                value={scraperUrl}
                onChange={(e) => setScraperUrl(e.target.value)}
                placeholder="e.g. https://theirwebsite.com"
                className="flex-1 rounded-xl bg-slate-900 border border-slate-800 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 placeholder-slate-700"
              />
              <button
                type="submit"
                disabled={scraperLoading || !scraperUrl}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl px-5 py-2.5 text-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
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
              <div className="rounded-xl bg-slate-950 border border-slate-900 p-4 font-mono text-[11px] text-emerald-500 space-y-1 overflow-y-auto max-h-40 leading-relaxed shadow-inner">
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
          <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-6 space-y-4">
            <h4 className="font-bold text-sm uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <FileText className="h-4.5 w-4.5 text-emerald-400" />
              RAG Knowledge Document Upload
            </h4>
            <p className="text-xs text-slate-500">
              Upload service lists, catalogs, or context files (.txt, .csv, .json) to extract and inject FAQ items into your AI agent's memory.
            </p>

            <div className="border border-dashed border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center bg-slate-950/20 relative hover:bg-slate-950/40 transition-colors">
              <input
                type="file"
                accept=".txt,.csv,.json"
                onChange={handleStartFileUpload}
                disabled={kbUploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:pointer-events-none"
              />
              <FileText className={`h-8 w-8 text-slate-600 mb-2 ${kbUploading ? 'animate-bounce' : ''}`} />
              <p className="text-xs text-slate-400 text-center">
                {kbUploading ? `Reading and extracting "${kbFileName}"...` : 'Drag and drop or click to upload knowledge document'}
              </p>
              <p className="text-[10px] text-slate-600 mt-1">Supports UTF-8 text files up to 2MB</p>
            </div>

            {kbUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-mono text-emerald-400">
                  <span>Uploading...</span>
                  <span>{kbProgress}%</span>
                </div>
                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500 transition-all duration-300" style={{ width: `${kbProgress}%` }}></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {user?.role === 'ADMIN' && (
        /* Add FAQ form */
        <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-6">
          <h4 className="font-bold text-sm uppercase tracking-wider text-slate-400 mb-4">Add FAQ Question</h4>
          <form onSubmit={handleAddFAQ} className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Question / Topic Title</label>
              <input
                type="text"
                required
                value={faqTitle}
                onChange={(e) => setFaqTitle(e.target.value)}
                placeholder="e.g. What are your pricing plans for SEO services?"
                className="mt-1 w-full rounded-xl bg-slate-900 border border-slate-800/80 px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Answer / Knowledge Content</label>
              <textarea
                required
                value={faqContent}
                onChange={(e) => setFaqContent(e.target.value)}
                rows={3}
                placeholder="Detail the answer here..."
                className="mt-1 w-full rounded-xl bg-slate-900 border border-slate-800/80 px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all resize-none"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={faqLoading || !faqTitle || !faqContent}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition-all shadow-md disabled:opacity-50 cursor-pointer"
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
        <h4 className="font-bold text-sm uppercase tracking-wider text-slate-400">Existing Knowledge Items</h4>
        {faqs.length === 0 ? (
          <div className="border border-slate-900 border-dashed rounded-2xl p-8 text-center text-slate-500 text-sm">
            No FAQs uploaded yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {faqs.map((faq) => (
              <div key={faq.id} className="rounded-xl border border-slate-900 bg-slate-900/10 p-5 flex justify-between gap-4">
                <div className="space-y-1">
                  <h5 className="font-bold text-sm text-slate-200">{faq.title}</h5>
                  <p className="text-xs text-slate-400 leading-relaxed">{faq.content}</p>
                </div>
                {user?.role === 'ADMIN' && (
                  <button
                    onClick={() => handleDeleteFAQ(faq.id)}
                    className="text-slate-600 hover:text-red-400 rounded-lg p-1.5 self-start transition-colors cursor-pointer"
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
