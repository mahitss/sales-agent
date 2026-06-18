import React from "react";
import { BusinessInfo } from "@/hooks/useDashboardData";

interface WidgetTabProps {
  business: BusinessInfo | null;
  API_URL: string;
}

export const WidgetTab: React.FC<WidgetTabProps> = ({ business, API_URL }) => {
  if (!business) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10">
      {/* Instructions Panel */}
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold text-white">Embed Chat Widget</h3>
          <p className="text-xs text-muted-text mt-1">Copy and paste this snippet into the HTML of your website</p>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl bg-background border border-card-border p-5 font-mono text-xs overflow-x-auto text-accent-primary select-all leading-relaxed shadow-inner">
            <code>
              {`<script\n  src="${API_URL}/widget-assets/logicra-widget.js"\n  data-business-id="${business.id}"\n  data-frontend-url="${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}"\n></script>`}
            </code>
          </div>
          <div className="p-4 bg-accent-primary/5 border border-accent-primary/10 rounded-xl space-y-2 text-xs leading-relaxed text-slate-300">
            <p className="font-bold text-white">💡 Easy Installation Steps:</p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Copy the script snippet above.</li>
              <li>Paste it right before the closing <code className="text-accent-primary">&lt;/body&gt;</code> tag of your website&apos;s index file.</li>
              <li>Save and publish your site. The floating chat bubble will appear automatically!</li>
            </ol>
          </div>
        </div>

        {/* Simulated Business Site Mock */}
        <div className="border border-card-border bg-card/20 rounded-2xl p-6 space-y-4 shadow-sm">
          <h4 className="font-bold text-xs uppercase tracking-wider text-muted-text">Live Simulation</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Test the loader script locally on a simulated environment. The floating green button in the bottom-right of your screen is the active sales widget!
          </p>
        </div>
      </div>

      {/* Sandbox Panel */}
      <div className="flex flex-col h-[calc(100vh-12rem)] border border-card-border rounded-2xl overflow-hidden bg-card/10 shadow-sm">
        <div className="p-4 border-b border-card-border flex justify-between items-center bg-card/25">
          <span className="font-semibold text-xs uppercase tracking-wider text-muted-text">Sandbox Preview</span>
          <span className="h-2 w-2 rounded-full bg-green-400 animate-ping"></span>
        </div>
        
        {/* Embed the Next.js widget directly into this preview container */}
        <div className="flex-1 bg-background relative flex items-center justify-center p-4">
          <div className="w-full max-w-sm h-[480px] rounded-2xl border border-card-border overflow-hidden shadow-2xl">
            <iframe
              src={`/widget?id=${business.id}`}
              className="w-full h-full border-none bg-background"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
