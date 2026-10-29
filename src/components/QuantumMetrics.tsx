import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Activity, Zap, Cpu, Layers } from 'lucide-react';
import { SystemMetrics, EvolutionMetrics } from '../types';
import { cn } from '../lib/utils';

interface Props {
  evolution?: EvolutionMetrics;
}

export const QuantumMetrics: React.FC<Props> = ({ evolution }) => {
  const [metrics, setMetrics] = useState<Partial<SystemMetrics>>({
    neuroPossibilities: 113243754777,
    energyProcessed: 0,
    qubitStability: 99.99,
    pnpSubprocesses: 0
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        energyProcessed: (prev.energyProcessed || 0) + Math.random() * 100,
        qubitStability: 99.9 + Math.random() * 0.1,
        pnpSubprocesses: Math.floor(Math.random() * 1000000)
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const MetricCard = ({ title, value, icon: Icon, color, progress, unit }: any) => (
    <div className="bg-surface/40 border border-border/50 p-3 rounded-sm flex flex-col gap-1 relative overflow-hidden group hover:bg-surface/60 transition-colors">
      <div className="flex items-center justify-between relative z-10">
        <span className="text-[7px] font-mono uppercase tracking-[2px] text-text-dim/80">{title}</span>
        <Icon size={10} className={cn("opacity-50 group-hover:opacity-100 transition-opacity", color)} />
      </div>
      <div className="flex items-baseline gap-1 relative z-10">
        <span className="text-sm font-mono text-text-main tabular-nums tracking-tighter">
          {typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 0 }) : value}
        </span>
        {unit && <span className="text-[8px] font-mono text-text-dim uppercase">{unit}</span>}
      </div>
      {/* Mini Gauge Indicator */}
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-white/5">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className={cn("h-full", color.replace('text-', 'bg-'))}
        />
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
      <MetricCard 
        title="Neural Synapses" 
        value={metrics.neuroPossibilities} 
        icon={Activity} 
        color="text-accent-cyan" 
        progress={75}
        unit="Mapped"
      />
      <MetricCard 
        title="Processing Load" 
        value={metrics.energyProcessed} 
        icon={Zap} 
        color="text-accent-gold" 
        progress={92}
        unit="P-FLOPs"
      />
      <MetricCard 
        title="Matrix Stability" 
        value={`${metrics.qubitStability.toFixed(2)}%`} 
        icon={Cpu} 
        color="text-accent-pink" 
        progress={metrics.qubitStability}
        unit="Q-Stable"
      />
      <MetricCard 
        title="Logic Threads" 
        value={metrics.pnpSubprocesses} 
        icon={Layers} 
        color="text-accent-cyan" 
        progress={45}
        unit="PNP-Active"
      />
      {evolution && (
        <MetricCard 
          title="Neural Phi" 
          value={evolution.phiComplexity.toFixed(2)} 
          icon={Activity} 
          color="text-green-400" 
          progress={(evolution.synapticDensity * 100)}
          unit="Integrated"
        />
      )}
    </div>
  );
};
