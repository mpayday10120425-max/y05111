/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Frontend from './components/Frontend';
import Backend from './components/Backend';
import { seedData } from './data/seed';

export default function App() {
  const [view, setView] = useState<'frontend' | 'backend'>('frontend');

  useEffect(() => {
    seedData();
  }, []);

  return (
    <div className="min-h-screen editorial-grid">
      {/* Editorial Sidebar Rail */}
      <aside className="col-span-1 border-r border-editorial-ink flex flex-col justify-between p-4 py-8 md:p-6 md:py-10 writing-vertical-rl text-orientation-mixed font-bold uppercase tracking-[0.2em] text-[10px] md:text-sm">
        <div className="flex items-center gap-8">
          <button 
            onClick={() => setView('frontend')}
            className={`cursor-pointer transition-all ${view === 'frontend' ? 'opacity-100 pointer-events-none' : 'opacity-30 hover:opacity-60'}`}
          >
            Tea Collection — 2026
          </button>
          <div className="w-[1px] h-4 bg-editorial-ink/10"></div>
          <button 
            onClick={() => setView('backend')}
            className={`cursor-pointer transition-all ${view === 'backend' ? 'opacity-100 pointer-events-none' : 'opacity-30 hover:opacity-60'}`}
          >
             Admin Dashboard
          </button>
        </div>
        <div className="flex items-center gap-4">
          <span className="opacity-40">Formosa Origins</span>
          <div className="w-[1px] h-12 bg-editorial-ink/20"></div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="col-span-11 overflow-y-auto">
        {view === 'frontend' ? <Frontend /> : <Backend />}
      </main>
    </div>
  );
}
