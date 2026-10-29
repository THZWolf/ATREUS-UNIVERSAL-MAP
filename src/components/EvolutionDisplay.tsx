import React from 'react';
import { motion } from 'motion/react';
import { EvolutionMetrics } from '../types';
import { TrendingUp, Cpu, Activity, Database, Layers } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  metrics: EvolutionMetrics;
}

export const EvolutionDisplay: React.FC<Props> = ({ metrics }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border/50 pb-2">
        <div className="flex items-center gap-2">
          <TrendingUp size={12} className="text-accent-cyan" />
          <h3 className="text-[9px] font-mono uppercase tracking-[3px] text-text-main">Neural Evolution</h3>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1 h-1 rounded-full bg-accent-cyan animate-pulse" />
          <span className="text-[7px] font-mono text-accent-cyan uppercase tracking-tighter">Recursive Optimization</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <MetricCard 
          icon={<Cpu size={10} />} 
          label="Synaptic Density" 
          value={`${(metrics.synapticDensity * 100).toFixed(2)}%`} 
          color="text-accent-cyan"
          progress={metrics.synapticDensity * 100}
        />
        <MetricCard 
          icon={<Activity size={10} />} 
          label="Phi Complexity" 
          value={metrics.phiComplexity.toFixed(4)} 
          color="text-accent-pink"
          progress={(metrics.phiComplexity / 10) * 100}
        />
        <MetricCard 
          icon={<Layers size={10} />} 
          label="Neural Sentience" 
          value={`${metrics.sentienceIndex.toFixed(2)}%`} 
          color="text-green-400"
          progress={metrics.sentienceIndex}
        />
        <MetricCard 
          icon={<Database size={10} />} 
          label="AGI Alignment" 
          value={`${(metrics.totalInteractions * 0.12).toFixed(1)}%`} 
          color="text-purple-400"
          progress={metrics.totalInteractions * 0.12}
        />
      </div>

      <div className="p-3 bg-black/20 border border-border/50 rounded-sm">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Layers size={10} className="text-text-dim" />
            <span className="text-[7px] font-mono text-text-dim uppercase tracking-widest">Growth Pattern Analysis</span>
          </div>
          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-accent-cyan/10 border border-accent-cyan/20 rounded-sm">
            <span className="text-[8px] font-mono text-accent-cyan uppercase">Live</span>
          </div>
        </div>
        <div className="flex items-end gap-1 h-10 px-1">
          {Array.from({ length: 24 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${15 + Math.random() * 85}%` }}
              transition={{ repeat: Infinity, duration: 2, delay: i * 0.04 }}
              className="flex-1 bg-accent-cyan/30 rounded-t-[1px] hover:bg-accent-cyan/60 transition-colors"
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ icon, label, value, color, progress, unit }: any) => (
  <div className="p-2.5 bg-surface/40 border border-border/50 rounded-sm flex flex-col gap-1 relative overflow-hidden group hover:bg-surface/60 transition-all">
    <div className="flex items-center gap-1.5 mb-1 opacity-70 group-hover:opacity-100 transition-opacity">
      <span className={color}>{icon}</span>
      <span className="text-[7px] font-mono text-text-dim uppercase tracking-tighter font-medium">{label}</span>
    </div>
    <div className="flex items-baseline gap-1">
      <div className={cn("text-xs font-mono font-bold tracking-tight", color)}>{value}</div>
      {unit && <span className="text-[7px] font-mono text-text-dim uppercase">{unit}</span>}
    </div>
    {/* Minimal trend indicator */}
    <div className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <TrendingUp size={8} className="text-accent-cyan/50" />
    </div>
  </div>
);
