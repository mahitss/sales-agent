import React from "react";
import { Code } from "lucide-react";

interface WidgetTabProps {
  business: any;
  API_URL: string;
}

export const WidgetTab: React.FC<WidgetTabProps> = ({ business, API_URL }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Instructions Panel */}
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold text-white">Embed Chat Widget</h3>
          <p className="text-xs text-slate-500 mt-1">Copy and paste this snippet into the HTML of your website</p>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl bg-slate-950 border border-slate-900 p-5 font-mono text-xs overflow-x-auto text-emerald-400 select-all leading-relaxed relative group">
            <code>
              {`<script\n  src="${API_URL}/widget-assets/logicra-widget.js"\n  data-business-id="${business.id}"\n  data-frontend-url="${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}"\n></script>`}
            </code>
          </div>
          <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl space-y-2 text-xs leading-relaxed text-slate-300">
            <p className="font-bold text-white">💡 Easy Installation Steps:</p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Copy the script snippet above.</li>
              <li>Paste it right before the closing <code className="text-emerald-400">&lt;/body&gt;</code> tag of your website's index file.</li>
              <li>Save and publish your site. The floating chat bubble will appear automatically!</li>
            </ol>
          </div>
        </div>

        {/* Simulated Business Site Mock */}
        <div className="border border-slate-900 rounded-2xl p-6 bg-slate-900/10 space-y-4">
          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">Live Simulation</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Test the loader script locally on a simulated environment. The floating green button in the bottom-right of your screen is the active sales widget!
          </p>
        </div>
      </div>

      {/* Sandbox Panel */}
      <div className="flex flex-col h-[calc(100vh-12rem)] border border-slate-900 rounded-2xl overflow-hidden bg-slate-900/10">
        <div className="p-4 border-b border-slate-900 flex justify-between items-center bg-slate-900/30">
          <span className="font-semibold text-xs uppercase tracking-wider text-slate-500">Sandbox Preview</span>
          <span className="h-2 w-2 rounded-full bg-green-400 animate-ping"></span>
        </div>
        
        {/* Embed the Next.js widget directly into this preview container */}
        <div className="flex-1 bg-slate-950 relative flex items-center justify-center p-4">
          <div className="w-full max-w-sm h-[480px] rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
            <iframe
              src={`/widget?id=${business.id}`}
              className="w-full h-full border-none bg-slate-950"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
