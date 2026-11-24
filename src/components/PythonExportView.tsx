import React, { useMemo, useState } from 'react';
import { PetProfile } from '../types/pet';
import { generatePythonScript } from '../engine/pythonGenerator';
import { Check, Copy, Download, Terminal } from 'lucide-react';

interface PythonExportViewProps {
  profile: PetProfile;
}

export const PythonExportView: React.FC<PythonExportViewProps> = ({ profile }) => {
  const [copied, setCopied] = useState(false);

  const pythonCode = useMemo(() => generatePythonScript(profile), [profile]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pythonCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard failure
    }
  };

  const handleDownload = () => {
    const blob = new Blob([pythonCode], { type: 'text/x-python;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'main.py';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Windows Desktop Pet Script (main.py)
            </h2>
            <p className="mt-1 text-sm text-slate-600 max-w-2xl">
              Runs directly on top of your Windows screen using Python&apos;s built-in standard library (no extra packages needed). Rests in the bottom-right corner until activated, monitors your active app &amp; work time, shares calming/love quotes, feeds snacks, and launches 5-min Energy Mode.
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download main.py</span>
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-100">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
              <Terminal className="w-3.5 h-3.5 text-slate-600" />
              <span>1. Corner Standby &amp; Wake</span>
            </div>
            <p className="mt-1 text-xs text-slate-600">
              Starts curled up in the bottom-right corner. Double-click or right-click to wake and roam your screen.
            </p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-100">
            <div className="text-xs font-semibold text-slate-800">
              2. Active Window &amp; Work Timer
            </div>
            <p className="mt-1 text-xs text-slate-600">
              Uses Windows <code className="font-mono">ctypes</code> to observe your active app title, work duration, and idle time.
            </p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-100">
            <div className="text-xs font-semibold text-slate-800">
              3. Quotes, Snacks &amp; Energy Mode
            </div>
            <p className="mt-1 text-xs text-slate-600">
              Right-click {profile.name} anytime for calming/love quotes, snacks, rolls, or a 5-min Energy break.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/60 border-b border-slate-800 text-xs text-slate-400">
          <span className="font-mono">main.py</span>
          <span className="font-mono tabular-nums">
            {pythonCode.split('\n').length} lines · Zero extra pip dependencies
          </span>
        </div>
        <pre className="p-5 text-xs font-mono text-slate-200 overflow-x-auto max-h-[540px] leading-relaxed">
          <code>{pythonCode}</code>
        </pre>
      </div>
    </div>
  );
};
