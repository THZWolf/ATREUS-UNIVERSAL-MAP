import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Zap, Lock, Terminal, Activity, Globe } from 'lucide-react';
import { cn } from '../lib/utils';

export const BlackzoneDiagnostic: React.FC = () => {
  const [nodes, setNodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeNode, setActiveNode] = useState<any | null>(null);

  const fetchNodes = async () => {
    try {
      const res = await fetch('/api/blackzone');
      const data = await res.json();
      setNodes(data.nodes);
      setLoading(false);
    } catch (e) {
      console.error("Diagnostic failure", e);
    }
  };

  useEffect(() => {
    fetchNodes();
    const interval = setInterval(fetchNodes, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield size={14} className="text-accent-pink" />
          <h3 className="text-[10px] font-mono uppercase tracking-[3px] text-text-main">Blackzone Deep Scan</h3>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-accent-pink/10 border border-accent-pink/30 rounded-full">
          <div className="w-1 h-1 rounded-full bg-accent-pink animate-pulse" />
          <span className="text-[8px] font-mono text-accent-pink uppercase tracking-tighter">Deep Network Active</span>
        </div>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-10 gap-2">
        {loading ? Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="aspect-square bg-surface/30 animate-pulse rounded-sm border border-border/20" />
        )) : nodes.map((node) => (
          <motion.button
            key={node.id}
            whileHover={{ scale: 1.1 }}
            onMouseEnter={() => setActiveNode(node)}
            className={cn(
              "aspect-square rounded-sm border transition-all flex items-center justify-center group relative",
              node.status === 'ENCRYPTED' ? "bg-accent-cyan/10 border-accent-cyan/20" : "bg-accent-pink/20 border-accent-pink/40 animate-pulse"
            )}
          >
            <div className={cn(
              "w-1 h-1 rounded-full",
              node.status === 'ENCRYPTED' ? "bg-accent-cyan" : "bg-accent-pink"
            )} />
            
            <AnimatePresence>
              {activeNode?.id === node.id && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 10 }}
                  className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 w-48 bg-bg border border-accent-pink/40 p-3 rounded-sm shadow-2xl pointer-events-none"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[8px] font-mono uppercase text-accent-pink font-bold">{node.id}</span>
                    <Lock size={10} className="text-accent-pink" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[7px] font-mono uppercase text-text-dim">
                      <span>Latency</span>
                      <span className="text-text-main">{node.latency.toFixed(2)}ms</span>
                    </div>
                    <div className="flex justify-between text-[7px] font-mono uppercase text-text-dim">
                      <span>Protocol</span>
                      <span className="text-text-main font-bold">{node.protocol}</span>
                    </div>
                    <div className="flex justify-between text-[7px] font-mono uppercase text-text-dim">
                      <span>Depth</span>
                      <span className="text-accent-cyan">{node.depth} LY</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        ))}
      </div>

      <div className="bg-surface/50 border border-border/50 p-4 rounded-sm">
        <div className="flex items-center gap-3 mb-4">
          <Terminal size={14} className="text-accent-cyan" />
          <span className="text-[9px] font-mono uppercase tracking-[2px] text-text-main">Neural Cryptography Stream</span>
        </div>
        <div className="space-y-2 h-24 overflow-hidden mask-fade-bottom">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-4 font-mono text-[8px] tracking-widest opacity-40">
              <span className="text-accent-pink">[{new Date().toLocaleTimeString()}]</span>
              <span className="text-accent-cyan">SEQ_{Math.random().toString(36).substring(7).toUpperCase()}</span>
              <span className="text-text-dim truncate">INITIALIZING RSA-X PADDING ON LAYER {Math.floor(Math.random() * 10)}...</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
