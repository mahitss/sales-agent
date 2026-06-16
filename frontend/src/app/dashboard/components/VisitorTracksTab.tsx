import React from "react";
import { MapPin } from "lucide-react";

interface VisitorTrack {
  id: string;
  location: string;
  pagesViewed: string[];
  duration: number;
  createdAt: string;
}

interface VisitorTracksTabProps {
  visitorTracks: VisitorTrack[];
}

export const VisitorTracksTab: React.FC<VisitorTracksTabProps> = ({ visitorTracks }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white">Live Visitor Tracking</h3>
        <p className="text-xs text-slate-500 mt-1">Geographic parameters, pages viewed, and stay duration recorded by Beacon script triggers</p>
      </div>

      <div className="overflow-hidden border border-slate-900 rounded-2xl bg-slate-900/10">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-slate-900/50 border-b border-slate-900 text-xs font-semibold uppercase text-slate-400">
            <tr>
              <th className="px-6 py-4">Location</th>
              <th className="px-6 py-4">Pages Viewed</th>
              <th className="px-6 py-4">Stay Duration</th>
              <th className="px-6 py-4">Log Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900/60">
            {visitorTracks.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                  No visitor activities tracked yet. Open the Widget Sandbox preview to register test logs automatically.
                </td>
              </tr>
            ) : (
              visitorTracks.map((vt) => (
                <tr key={vt.id} className="hover:bg-slate-900/20 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-200 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-red-400 shrink-0" />
                    {vt.location}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {vt.pagesViewed.map((page, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-slate-950 border border-slate-900 text-[10px] text-slate-400 font-mono">
                          {page}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-300">
                    {Math.floor(vt.duration / 60)}m {vt.duration % 60}s
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {new Date(vt.createdAt).toLocaleTimeString()} ({new Date(vt.createdAt).toLocaleDateString()})
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
