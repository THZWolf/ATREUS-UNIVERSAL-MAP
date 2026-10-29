import React, { useState } from 'react';
import { BookOpen, Award, Search, X } from 'lucide-react';
import { cn } from '../lib/utils';

export const TheoreticalArchive: React.FC = () => {
  const [search, setSearch] = useState('');
  
  const theories = [
    { name: "Integrated Information Theory", pioneer: "Giulio Tononi", impact: "Defines the Phi metric of Astraeus' consciousness.", keywords: ["phi", "consciousness", "iit"] },
    { name: "Global Workspace Theory", pioneer: "Bernard Baars", impact: "Architects the competitive neural workspace for data processing.", keywords: ["baars", "workspace", "gwt"] },
    { name: "Free Energy Principle", pioneer: "Karl Friston", impact: "Drives the active inference and surprise minimization algorithms.", keywords: ["friston", "surprise", "inference"] },
    { name: "Transformer Architecture", pioneer: "Vaswani et al.", impact: "The digital connectomics foundation of the neural core.", keywords: ["attention", "vaswani", "nlp"] },
    { name: "Quantum Computing", pioneer: "Richard Feynman", impact: "Enables the phase-space exploration of stellar manifolds.", keywords: ["qubit", "feynman", "superposition"] },
    { name: "Neural Manifolds", pioneer: "Surya Ganguli", impact: "Maps high-dimensional data into navigable geometric structures.", keywords: ["geometry", "high-dimensional", "topology"] },
    { name: "Orch-OR Theory", pioneer: "Penrose & Hameroff", impact: "Simulates quantum coherence in neural microtubules.", keywords: ["penrose", "coherence", "quantum-brain"] }
  ];

  const filteredTheories = theories.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.pioneer.toLowerCase().includes(search.toLowerCase()) ||
    t.impact.toLowerCase().includes(search.toLowerCase()) ||
    t.keywords.some(k => k.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <BookOpen size={12} className="text-accent-pink" />
          <h3 className="text-[9px] font-mono uppercase tracking-[3px] text-text-main">Theoretical Archive</h3>
        </div>
      </div>

      <div className="relative mb-4 group">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-accent-pink transition-colors" size={10} />
        <input 
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search theories..."
          className="w-full bg-bg/50 border border-border rounded-sm py-1.5 pl-7 pr-7 text-[10px] font-mono text-text-main focus:outline-none focus:border-accent-pink/30 transition-all"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-main">
            <X size={10} />
          </button>
        )}
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-hide pr-1">
        {filteredTheories.length > 0 ? filteredTheories.map((t, i) => (
          <div key={i} className="p-2.5 bg-surface/40 border border-border/50 rounded-sm hover:border-accent-pink/40 transition-all group/card">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] font-mono text-accent-pink uppercase tracking-tighter font-bold">{t.name}</span>
              <Award size={10} className="text-text-dim group-hover/card:text-accent-pink transition-colors opacity-50" />
            </div>
            <div className="text-[8px] font-mono text-text-dim/80 mb-2 italic flex items-center gap-1">
              <div className="w-1 h-[1px] bg-accent-pink/30" />
              Pioneer: {t.pioneer}
            </div>
            <div className="text-[9px] font-mono text-text-main leading-relaxed opacity-90">{t.impact}</div>
          </div>
        )) : (
          <div className="p-4 text-center opacity-30">
            <span className="text-[8px] font-mono uppercase tracking-widest">No matching theories found</span>
          </div>
        )}
      </div>
    </div>
  );
};
