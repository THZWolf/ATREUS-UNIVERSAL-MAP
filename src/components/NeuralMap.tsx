import React, { useMemo } from 'react';
import { motion } from 'motion/react';

interface Node {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
}

interface Connection {
  from: number;
  to: number;
}

export const NeuralMap: React.FC<{ face: string }> = ({ face }) => {
  const nodes = useMemo(() => {
    return Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      x: 10 + Math.random() * 80,
      y: 10 + Math.random() * 80,
      size: 2 + Math.random() * 4,
      color: face === 'logos' ? '#4cc9f0' : 
             face === 'pathos' ? '#f72585' :
             face === 'luna' ? '#22c55e' : 
             face === 'sophia' ? '#f59e0b' :
             face === 'mnemosyne' ? '#6366f1' : '#a855f7'
    }));
  }, [face]);

  const connections = useMemo(() => {
    const conn: Connection[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (Math.random() > 0.85) {
          conn.push({ from: i, to: j });
        }
      }
    }
    return conn;
  }, [nodes]);

  return (
    <div className="w-full h-32 bg-bg/50 border border-border rounded-sm relative overflow-hidden">
      <div className="absolute top-2 left-2 z-10">
        <span className="text-[7px] font-mono uppercase tracking-[2px] text-text-dim">Neural Connectomics</span>
      </div>
      
      <svg className="w-full h-full">
        {connections.map((c, i) => (
          <motion.line
            key={i}
            x1={`${nodes[c.from].x}%`}
            y1={`${nodes[c.from].y}%`}
            x2={`${nodes[c.to].x}%`}
            y2={`${nodes[c.to].y}%`}
            stroke={nodes[c.from].color}
            strokeWidth="0.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0] }}
            transition={{ repeat: Infinity, duration: 2 + Math.random() * 2, delay: Math.random() * 2 }}
          />
        ))}
        {nodes.map((n, i) => (
          <motion.circle
            key={i}
            cx={`${n.x}%`}
            cy={`${n.y}%`}
            r={n.size}
            fill={n.color}
            initial={{ opacity: 0.2 }}
            animate={{ opacity: [0.2, 1, 0.2], scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 + Math.random() * 2, delay: Math.random() * 2 }}
          />
        ))}
      </svg>
      
      <div className="absolute bottom-2 right-2">
        <span className="text-[6px] font-mono text-text-dim/50 uppercase">Synaptic Flux: Active</span>
      </div>
    </div>
  );
};
