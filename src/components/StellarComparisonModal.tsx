import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Columns, 
  X, 
  ArrowLeftRight, 
  Sparkles, 
  Compass, 
  Orbit, 
  Activity, 
  ExternalLink,
  ChevronDown,
  Search,
  Check
} from 'lucide-react';
import { Star } from '../types';
import { cn } from '../lib/utils';

interface Props {
  isOpen: boolean;
  starA: Star;
  starB: Star;
  allStars?: Star[];
  onClose: () => void;
  onSwapStars: () => void;
  onSelectStarA?: (star: Star) => void;
  onSelectStarB?: (star: Star) => void;
  onAskAIComparison?: (prompt: string) => void;
}

export const StellarComparisonModal: React.FC<Props> = ({
  isOpen,
  starA,
  starB,
  allStars = [],
  onClose,
  onSwapStars,
  onSelectStarA,
  onSelectStarB,
  onAskAIComparison
}) => {
  const [selectorTarget, setSelectorTarget] = useState<'A' | 'B' | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  if (!isOpen || !starA || !starB) return null;

  // Convert RA (hours to radians), Dec (degrees to radians)
  // Note: ra is often in degrees or hours. In Star interface: ra, dec.
  const raARad = (starA.ra * Math.PI) / 180;
  const decARad = (starA.dec * Math.PI) / 180;
  const raBRad = (starB.ra * Math.PI) / 180;
  const decBRad = (starB.dec * Math.PI) / 180;

  // 3D Cartesian coordinates (Light Years)
  const xA = starA.dist * Math.cos(decARad) * Math.cos(raARad);
  const yA = starA.dist * Math.cos(decARad) * Math.sin(raARad);
  const zA = starA.dist * Math.sin(decARad);

  const xB = starB.dist * Math.cos(decBRad) * Math.cos(raBRad);
  const yB = starB.dist * Math.cos(decBRad) * Math.sin(raBRad);
  const zB = starB.dist * Math.sin(decBRad);

  // Euclidean Interstellar Distance
  const interstellarDist = Math.sqrt(
    Math.pow(xB - xA, 2) + Math.pow(yB - yA, 2) + Math.pow(zB - zA, 2)
  );

  // Angular separation
  const cosTheta = Math.sin(decARad) * Math.sin(decBRad) + 
                   Math.cos(decARad) * Math.cos(decBRad) * Math.cos(raARad - raBRad);
  const angularSepDeg = Math.acos(Math.max(-1, Math.min(1, cosTheta))) * (180 / Math.PI);

  // Delta calculations
  const deltaDist = starB.dist - starA.dist;
  const deltaMag = starB.mag - starA.mag;

  // Brightness ratio (Pogson's formula: Ratio = 100^((m1 - m2)/5) = 2.512^(m2 - m1))
  const brightnessRatio = Math.pow(2.512, Math.abs(deltaMag));

  const filteredStars = allStars.filter(s => 
    s.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    s.type.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const handleAskAI = () => {
    if (!onAskAIComparison) return;
    const prompt = `Comparative astrophysical analysis of ${starA.name} (${starA.type}, ${starA.dist.toFixed(2)} LY, mag ${starA.mag.toFixed(2)}) and ${starB.name} (${starB.type}, ${starB.dist.toFixed(2)} LY, mag ${starB.mag.toFixed(2)}). Angular separation is ${angularSepDeg.toFixed(2)}°, physical separation is ${interstellarDist.toFixed(2)} LY. Synthesize stellar evolution divergence, habitability prospects, and potential quantum resonance between their heliospheres.`;
    onAskAIComparison(prompt);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 pointer-events-auto">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-4xl max-h-[92vh] bg-surface/95 border border-accent-cyan/40 rounded-sm shadow-[0_0_50px_rgba(76,201,240,0.18)] flex flex-col overflow-hidden text-text-main"
        >
          {/* Top Navigation Bar */}
          <div className="p-4 sm:p-5 border-b border-border/80 bg-bg/90 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent-cyan/15 border border-accent-cyan/30 rounded-sm text-accent-cyan">
                <Columns size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-mono uppercase tracking-[3px] text-accent-cyan font-bold">
                    Stellar Comparison Mode
                  </h2>
                  <span className="px-2 py-0.5 bg-accent-pink/20 border border-accent-pink/40 text-accent-pink text-[8px] font-mono uppercase tracking-widest rounded-xs animate-pulse">
                    2 Systems Entangled
                  </span>
                </div>
                <p className="text-[10px] font-mono text-text-dim uppercase tracking-wider mt-0.5">
                  Side-by-Side Astrophysical & Spectroscopic Delta Analysis
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onSwapStars}
                className="px-2.5 py-1 rounded-sm border border-border hover:border-accent-cyan/40 bg-surface text-[9px] font-mono uppercase tracking-wider text-text-dim hover:text-accent-cyan transition-all flex items-center gap-1.5"
                title="Swap Star A and Star B"
              >
                <ArrowLeftRight size={12} />
                <span className="hidden sm:inline">Swap Stars</span>
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-text-dim hover:text-text-main hover:bg-border/60 rounded-sm transition-colors"
                title="Close (Esc)"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Interstellar Euclidean Bridge Banner */}
          <div className="px-4 py-3 bg-accent-cyan/5 border-b border-accent-cyan/20 flex flex-wrap items-center justify-between gap-3 text-[10px] font-mono shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-accent-cyan font-bold">
                <Orbit size={13} className="animate-spin text-accent-cyan" />
                <span>Interstellar Distance:</span>
                <span className="text-text-main font-mono text-xs">{interstellarDist.toFixed(2)} LY</span>
              </div>
              <span className="text-text-dim/40">|</span>
              <div className="flex items-center gap-1.5 text-text-dim">
                <Compass size={13} className="text-accent-pink" />
                <span>Angular Separation:</span>
                <span className="text-text-main font-mono text-xs">{angularSepDeg.toFixed(2)}°</span>
              </div>
            </div>

            <div className="text-[9px] font-mono text-accent-gold flex items-center gap-1">
              <span>Brightness Variance:</span>
              <span className="font-bold">
                {starA.mag < starB.mag ? `${starA.name} is ${brightnessRatio.toFixed(1)}x brighter` : `${starB.name} is ${brightnessRatio.toFixed(1)}x brighter`}
              </span>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin scrollbar-thumb-border">
            {/* Side-by-Side Star Header Cards */}
            <div className="grid grid-cols-2 gap-4">
              {/* Star A Card */}
              <div className="p-4 bg-accent-cyan/5 border border-accent-cyan/40 rounded-sm relative group">
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 bg-accent-cyan/20 text-accent-cyan text-[9px] font-mono font-bold uppercase tracking-widest rounded-xs">
                    Primary Star [A]
                  </span>
                  {onSelectStarA && allStars.length > 0 && (
                    <button
                      onClick={() => setSelectorTarget(selectorTarget === 'A' ? null : 'A')}
                      className="text-[8px] font-mono text-accent-cyan/80 hover:text-accent-cyan uppercase tracking-wider flex items-center gap-1"
                    >
                      <span>Change</span>
                      <ChevronDown size={10} />
                    </button>
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-mono font-bold text-text-main tracking-wider uppercase">
                  {starA.name}
                </h3>
                <p className="text-[10px] font-mono text-text-dim mt-0.5">
                  Spectral Class: <span className="text-accent-cyan font-bold">{starA.type}</span>
                </p>
              </div>

              {/* Star B Card */}
              <div className="p-4 bg-accent-pink/5 border border-accent-pink/40 rounded-sm relative group">
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 bg-accent-pink/20 text-accent-pink text-[9px] font-mono font-bold uppercase tracking-widest rounded-xs">
                    Comparative Star [B]
                  </span>
                  {onSelectStarB && allStars.length > 0 && (
                    <button
                      onClick={() => setSelectorTarget(selectorTarget === 'B' ? null : 'B')}
                      className="text-[8px] font-mono text-accent-pink/80 hover:text-accent-pink uppercase tracking-wider flex items-center gap-1"
                    >
                      <span>Change</span>
                      <ChevronDown size={10} />
                    </button>
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-mono font-bold text-text-main tracking-wider uppercase">
                  {starB.name}
                </h3>
                <p className="text-[10px] font-mono text-text-dim mt-0.5">
                  Spectral Class: <span className="text-accent-pink font-bold">{starB.type}</span>
                </p>
              </div>
            </div>

            {/* In-Modal Star Selector Dropdown */}
            {selectorTarget && (
              <div className="p-3 bg-surface/90 border border-border rounded-sm space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between text-[10px] font-mono text-text-dim">
                  <span>Select replacement for Star [{selectorTarget}]</span>
                  <button onClick={() => setSelectorTarget(null)} className="text-text-dim hover:text-text-main">
                    <X size={12} />
                  </button>
                </div>
                <div className="relative">
                  <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-dim" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Filter stellar catalog..."
                    className="w-full bg-bg border border-border rounded-sm py-1.5 pl-8 pr-3 text-[10px] font-mono text-text-main focus:outline-none focus:border-accent-cyan/40"
                  />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {filteredStars.slice(0, 15).map(s => (
                    <button
                      key={s.id}
                      onClick={() => {
                        if (selectorTarget === 'A' && onSelectStarA) onSelectStarA(s);
                        if (selectorTarget === 'B' && onSelectStarB) onSelectStarB(s);
                        setSelectorTarget(null);
                        setSearchFilter('');
                      }}
                      className="p-1.5 bg-bg/80 hover:bg-surface border border-border/60 hover:border-accent-cyan/40 rounded-xs text-left text-[9px] font-mono flex items-center justify-between"
                    >
                      <span className="truncate">{s.name}</span>
                      <span className="text-text-dim/60 text-[8px]">{s.dist.toFixed(1)}LY</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Detailed Properties Comparison Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono text-text-dim uppercase tracking-widest border-b border-border pb-2">
                <span>Astrophysical Property</span>
                <div className="grid grid-cols-3 gap-4 w-[65%] text-center">
                  <span className="text-accent-cyan font-bold">{starA.name}</span>
                  <span className="text-text-dim">Delta (B - A)</span>
                  <span className="text-accent-pink font-bold">{starB.name}</span>
                </div>
              </div>

              {/* Table Rows */}
              <div className="space-y-1.5 text-[11px] font-mono">
                {/* Distance */}
                <div className="p-2.5 bg-surface/30 hover:bg-surface/50 border border-border/50 rounded-xs flex items-center justify-between">
                  <div className="text-text-dim">Distance from Earth</div>
                  <div className="grid grid-cols-3 gap-4 w-[65%] text-center">
                    <span className="text-accent-cyan font-bold">{starA.dist.toFixed(3)} LY</span>
                    <span className={cn("text-[10px]", deltaDist > 0 ? "text-accent-pink" : "text-accent-cyan")}>
                      {deltaDist > 0 ? `+${deltaDist.toFixed(2)}` : deltaDist.toFixed(2)} LY
                    </span>
                    <span className="text-accent-pink font-bold">{starB.dist.toFixed(3)} LY</span>
                  </div>
                </div>

                {/* Apparent Magnitude */}
                <div className="p-2.5 bg-surface/30 hover:bg-surface/50 border border-border/50 rounded-xs flex items-center justify-between">
                  <div className="text-text-dim">Apparent Magnitude</div>
                  <div className="grid grid-cols-3 gap-4 w-[65%] text-center">
                    <span className="text-accent-cyan font-bold">{starA.mag.toFixed(2)}</span>
                    <span className="text-[10px] text-accent-gold">
                      {deltaMag > 0 ? `+${deltaMag.toFixed(2)}` : deltaMag.toFixed(2)} mag
                    </span>
                    <span className="text-accent-pink font-bold">{starB.mag.toFixed(2)}</span>
                  </div>
                </div>

                {/* Celestial Right Ascension */}
                <div className="p-2.5 bg-surface/30 hover:bg-surface/50 border border-border/50 rounded-xs flex items-center justify-between">
                  <div className="text-text-dim">Right Ascension (RA)</div>
                  <div className="grid grid-cols-3 gap-4 w-[65%] text-center">
                    <span className="text-text-main">{starA.ra.toFixed(3)}°</span>
                    <span className="text-[10px] text-text-dim">
                      {(starB.ra - starA.ra).toFixed(2)}°
                    </span>
                    <span className="text-text-main">{starB.ra.toFixed(3)}°</span>
                  </div>
                </div>

                {/* Celestial Declination */}
                <div className="p-2.5 bg-surface/30 hover:bg-surface/50 border border-border/50 rounded-xs flex items-center justify-between">
                  <div className="text-text-dim">Declination (Dec)</div>
                  <div className="grid grid-cols-3 gap-4 w-[65%] text-center">
                    <span className="text-text-main">{starA.dec.toFixed(3)}°</span>
                    <span className="text-[10px] text-text-dim">
                      {(starB.dec - starA.dec).toFixed(2)}°
                    </span>
                    <span className="text-text-main">{starB.dec.toFixed(3)}°</span>
                  </div>
                </div>

                {/* Spectral Class */}
                <div className="p-2.5 bg-surface/30 hover:bg-surface/50 border border-border/50 rounded-xs flex items-center justify-between">
                  <div className="text-text-dim">Spectral Type</div>
                  <div className="grid grid-cols-3 gap-4 w-[65%] text-center">
                    <span className="text-accent-cyan">{starA.type}</span>
                    <span className="text-[10px] text-text-dim">
                      {starA.type === starB.type ? "Identical" : "Divergent"}
                    </span>
                    <span className="text-accent-pink">{starB.type}</span>
                  </div>
                </div>

                {/* Temperature Metadata (if available) */}
                {(starA.metadata?.temp || starB.metadata?.temp) && (
                  <div className="p-2.5 bg-surface/30 hover:bg-surface/50 border border-border/50 rounded-xs flex items-center justify-between">
                    <div className="text-text-dim">Effective Surface Temp</div>
                    <div className="grid grid-cols-3 gap-4 w-[65%] text-center">
                      <span className="text-accent-cyan">
                        {starA.metadata?.temp ? `${starA.metadata.temp.toLocaleString()} K` : "~5,700 K"}
                      </span>
                      <span className="text-[10px] text-text-dim">
                        Δ {Math.abs((starB.metadata?.temp || 5700) - (starA.metadata?.temp || 5700)).toLocaleString()} K
                      </span>
                      <span className="text-accent-pink">
                        {starB.metadata?.temp ? `${starB.metadata.temp.toLocaleString()} K` : "~5,700 K"}
                      </span>
                    </div>
                  </div>
                )}

                {/* Relative Mass / Radius (if available) */}
                {(starA.metadata?.mass || starB.metadata?.mass) && (
                  <div className="p-2.5 bg-surface/30 hover:bg-surface/50 border border-border/50 rounded-xs flex items-center justify-between">
                    <div className="text-text-dim">Estimated Stellar Mass</div>
                    <div className="grid grid-cols-3 gap-4 w-[65%] text-center">
                      <span className="text-accent-cyan">
                        {starA.metadata?.mass ? `${starA.metadata.mass.toFixed(2)} M☉` : "1.00 M☉"}
                      </span>
                      <span className="text-[10px] text-text-dim">
                        Δ {((starB.metadata?.mass || 1.0) - (starA.metadata?.mass || 1.0)).toFixed(2)} M☉
                      </span>
                      <span className="text-accent-pink">
                        {starB.metadata?.mass ? `${starB.metadata.mass.toFixed(2)} M☉` : "1.00 M☉"}
                      </span>
                    </div>
                  </div>
                )}

                {/* Coordinates Vector 3D */}
                <div className="p-2.5 bg-surface/30 hover:bg-surface/50 border border-border/50 rounded-xs flex items-center justify-between">
                  <div className="text-text-dim">3D Cartesian Vector (x,y,z)</div>
                  <div className="grid grid-cols-3 gap-4 w-[65%] text-center text-[9px] font-mono">
                    <span className="text-text-dim">[{xA.toFixed(1)}, {yA.toFixed(1)}, {zA.toFixed(1)}]</span>
                    <span className="text-accent-cyan">Vector Delta</span>
                    <span className="text-text-dim">[{xB.toFixed(1)}, {yB.toFixed(1)}, {zB.toFixed(1)}]</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Action Bar */}
          <div className="p-4 sm:p-5 border-t border-border/80 bg-bg/90 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="text-[9px] font-mono text-text-dim flex items-center gap-2">
              <Activity size={12} className="text-accent-cyan" />
              <span>Comparative Stellar Geodesic Computed in 3D Euclidean Space</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {onAskAIComparison && (
                <button
                  onClick={handleAskAI}
                  className="flex-1 sm:flex-initial px-4 py-2 bg-accent-pink/15 hover:bg-accent-pink/25 border border-accent-pink/40 text-accent-pink text-[10px] font-mono uppercase tracking-widest rounded-sm transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles size={13} />
                  <span>AI Comparative Analysis</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2 bg-surface hover:bg-border/60 border border-border text-text-dim hover:text-text-main text-[10px] font-mono uppercase tracking-widest rounded-sm transition-all"
              >
                Exit Comparison
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
