'use client';

import React from 'react';

export default function StateDebugger({ state }: { state: any }) {
  return (
    <div className="bg-black text-green-400 text-xs p-4 overflow-auto max-h-[400px] rounded-md border border-green-600 shadow-lg">
      <h3 className="text-green-300 font-bold mb-2">🧠 State Debugger</h3>
      <pre className="whitespace-pre-wrap break-all">
        {JSON.stringify(state, null, 2)}
      </pre>
    </div>
  );
}
