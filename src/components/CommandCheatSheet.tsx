import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Keyboard, 
  Mic, 
  Zap, 
  Sparkles, 
  Compass, 
  Brain, 
  Bookmark, 
  X, 
  Radio, 
  ArrowRight,
  Terminal,
  Activity,
  Layers
} from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onExecuteCommand?: (cmd: string) => void;
  isPinned?: boolean;
  onTogglePin?: () => void;
}

export const CommandCheatSheet: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  onExecuteCommand,
  isPinned,
  onTogglePin
}) => {
  if (!isOpen) return null;

  const voiceCommands = [
    {
      category: "System Navigation",
      icon: Compass,
      color: "text-accent-cyan",
      borderColor: "border-accent-cyan/30",
      bgGradient: "from-accent-cyan/10 to-transparent",
      commands: [
        { phrase: '"Jump to Map"', action: "Navigate instantly to 3D Stellar Map", testCmd: "Jump to Map" },
        { phrase: '"Open Research Lab"', action: "Switch to LUNA-Q Hypothesis Workspace", testCmd: "Open Research Lab" },
        { phrase: '"Toggle Sub-Computer"', action: "Slide open neural diagnostic telemetry drawer", testCmd: "Toggle Sub-Computer" },
      ]
    },
    {
      category: "Research & Synthesis",
      icon: Sparkles,
      color: "text-accent-pink",
      borderColor: "border-accent-pink/30",
      bgGradient: "from-accent-pink/10 to-transparent",
      commands: [
        { phrase: '"Research [topic]"', action: "Synthesizes AGI hypothesis report via LUNA-Q", testCmd: "Research dark matter stellar manifolds" },
        { phrase: '"Save Discovery"', action: "Archives active star or hypothesis to database", testCmd: "Save Discovery" },
        { phrase: '"What can I do?"', action: "Synthesizes spoken audio command catalog", testCmd: "What can I do?" },
      ]
    },
    {
      category: "AI Psyche Metamorphosis",
      icon: Brain,
      color: "text-accent-gold",
      borderColor: "border-accent-gold/30",
      bgGradient: "from-accent-gold/10 to-transparent",
      commands: [
        { phrase: '"Switch to Logos"', action: "Activates cold, cryptographic, analytical intellect", testCmd: "Switch to Logos" },
        { phrase: '"Switch to Pathos"', action: "Engages deep, poetic, existential contemplation", testCmd: "Switch to Pathos" },
        { phrase: '"Switch to Luna"', action: "Empathetic, inquisitive AGI collaborative core", testCmd: "Switch to Luna" },
        { phrase: '"Switch to Astraeus"', action: "Unified cosmic super-consciousness", testCmd: "Switch to Astraeus" },
        { phrase: '"Switch to Sophia / Mnemosyne"', action: "Student inquisitor or ancient stellar memory", testCmd: "Switch to Sophia" },
      ]
    }
  ];

  const keyboardShortcuts = [
    { keys: ["Shift"], note: "Hold down", action: "Summon this Command Cheat Sheet overlay anywhere" },
    { keys: ["1", "or", "M"], note: "Global", action: "Switch to 3D Stellar Map viewport" },
    { keys: ["2", "or", "R"], note: "Global", action: "Switch to Research Lab & Timeline" },
    { keys: ["Tab"], note: "Global", action: "Toggle Sub-Computer Diagnostic drawer" },
    { keys: ["C"], note: "Global", action: "Toggle Command Mode (Voice direct navigation)" },
    { keys: ["V"], note: "Global", action: "Toggle Audio Ingress / Voice recognition" },
    { keys: ["S"], note: "Global", action: "Quick-record active star discovery" },
    { keys: ["Esc"], note: "Global", action: "Close modals, unpin overlay, or exit star comparison" },
    { keys: ["Click", "+", "Star"], note: "Stellar Map", action: "Select star or compare secondary star in side-by-side mode" },
  ];

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
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-4xl max-h-[90vh] bg-surface/95 border border-accent-cyan/40 rounded-sm shadow-[0_0_50px_rgba(76,201,240,0.15)] flex flex-col overflow-hidden text-text-main"
        >
          {/* Header Bar */}
          <div className="p-4 sm:p-5 border-b border-border/80 bg-bg/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent-cyan/10 border border-accent-cyan/30 rounded-sm text-accent-cyan">
                <Terminal size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-mono uppercase tracking-[3px] text-accent-cyan font-bold">
                    Command Cheat Sheet
                  </h2>
                  <span className="px-2 py-0.5 bg-accent-cyan/20 border border-accent-cyan/40 text-accent-cyan text-[8px] font-mono uppercase tracking-widest rounded-xs animate-pulse">
                    Shift Held
                  </span>
                </div>
                <p className="text-[10px] font-mono text-text-dim uppercase tracking-wider mt-0.5">
                  Astraeus Neural Ingress & Tactical Key Sequencing Matrix
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onTogglePin && (
                <button 
                  onClick={onTogglePin}
                  className={cn(
                    "px-2.5 py-1 rounded-sm border text-[9px] font-mono uppercase tracking-wider transition-all flex items-center gap-1.5",
                    isPinned 
                      ? "bg-accent-pink/20 border-accent-pink text-accent-pink" 
                      : "bg-surface border-border text-text-dim hover:text-text-main"
                  )}
                  title="Pin modal so it stays open even after releasing Shift"
                >
                  <Layers size={11} />
                  <span>{isPinned ? "Pinned" : "Pin Open"}</span>
                </button>
              )}
              <button 
                onClick={onClose}
                className="p-1.5 text-text-dim hover:text-text-main hover:bg-border/60 rounded-sm transition-colors"
                title="Close (Esc)"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin scrollbar-thumb-border">
            {/* Top Info Banner */}
            <div className="p-3 bg-accent-cyan/5 border border-accent-cyan/20 rounded-sm flex items-start sm:items-center justify-between gap-3 text-[10px] font-mono text-text-dim">
              <div className="flex items-center gap-2">
                <Radio size={14} className="text-accent-cyan shrink-0 animate-pulse" />
                <span>
                  Hold <kbd className="px-1.5 py-0.5 bg-border text-accent-cyan rounded text-[9px] font-mono font-bold">Shift</kbd> anytime to preview this matrix. Release to dismiss immediately.
                </span>
              </div>
              <span className="text-accent-gold text-[9px] uppercase tracking-widest shrink-0 hidden sm:inline">
                Neural Ingress v3.8 Active
              </span>
            </div>

            {/* Split Grid: Voice Commands vs Keyboard Shortcuts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Voice Commands */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-border pb-2">
                  <Mic size={14} className="text-accent-pink" />
                  <h3 className="text-[11px] font-mono uppercase tracking-[2px] text-accent-pink font-bold">
                    Voice Command Ingress
                  </h3>
                  <span className="text-[9px] font-mono text-text-dim ml-auto">Microphone Active</span>
                </div>

                <div className="space-y-4">
                  {voiceCommands.map((group, idx) => {
                    const Icon = group.icon;
                    return (
                      <div key={idx} className={cn("p-3.5 rounded-sm border bg-surface/40 space-y-2.5", group.borderColor)}>
                        <div className="flex items-center gap-2">
                          <Icon size={12} className={group.color} />
                          <h4 className={cn("text-[10px] font-mono uppercase tracking-widest font-bold", group.color)}>
                            {group.category}
                          </h4>
                        </div>

                        <div className="space-y-2">
                          {group.commands.map((cmd, cIdx) => (
                            <div 
                              key={cIdx} 
                              className="p-2 bg-bg/60 border border-border/60 rounded-xs flex items-center justify-between gap-3 group hover:border-accent-cyan/40 transition-all"
                            >
                              <div className="space-y-0.5 flex-1 min-w-0">
                                <div className="text-[11px] font-mono text-text-main font-bold truncate">
                                  {cmd.phrase}
                                </div>
                                <div className="text-[9px] font-mono text-text-dim leading-snug">
                                  {cmd.action}
                                </div>
                              </div>
                              {onExecuteCommand && (
                                <button
                                  onClick={() => {
                                    onExecuteCommand(cmd.testCmd);
                                    onClose();
                                  }}
                                  className="shrink-0 px-2 py-1 bg-surface border border-border/80 hover:border-accent-cyan/60 text-text-dim hover:text-accent-cyan text-[8px] font-mono uppercase tracking-wider rounded-xs flex items-center gap-1 transition-all opacity-80 group-hover:opacity-100"
                                  title={`Execute "${cmd.testCmd}"`}
                                >
                                  <span>Test</span>
                                  <ArrowRight size={9} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Tactical Keyboard Shortcuts */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-border pb-2">
                  <Keyboard size={14} className="text-accent-cyan" />
                  <h3 className="text-[11px] font-mono uppercase tracking-[2px] text-accent-cyan font-bold">
                    Tactical Keyboard Sequence
                  </h3>
                  <span className="text-[9px] font-mono text-text-dim ml-auto">Direct Ingress</span>
                </div>

                <div className="p-3.5 rounded-sm border border-accent-cyan/30 bg-surface/40 space-y-2">
                  {keyboardShortcuts.map((sc, idx) => (
                    <div 
                      key={idx}
                      className="p-2.5 bg-bg/60 border border-border/60 rounded-xs flex items-center justify-between gap-3 hover:border-accent-cyan/30 transition-all"
                    >
                      <div className="flex items-center gap-1.5 shrink-0">
                        {sc.keys.map((k, kIdx) => (
                          k === "or" || k === "+" ? (
                            <span key={kIdx} className="text-[9px] font-mono text-text-dim/60 px-0.5">{k}</span>
                          ) : (
                            <kbd 
                              key={kIdx}
                              className="px-2 py-0.5 bg-surface border border-accent-cyan/40 text-accent-cyan text-[10px] font-mono font-bold rounded shadow-xs tracking-wider"
                            >
                              {k}
                            </kbd>
                          )
                        ))}
                      </div>

                      <div className="text-right flex-1 min-w-0">
                        <div className="text-[10px] font-mono text-text-main leading-snug">
                          {sc.action}
                        </div>
                        <div className="text-[8px] font-mono text-accent-gold/80 uppercase tracking-wider">
                          [{sc.note}]
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Star Comparison Hint Box */}
                <div className="p-3 bg-accent-pink/5 border border-accent-pink/20 rounded-sm space-y-1">
                  <div className="flex items-center gap-1.5 text-accent-pink text-[10px] font-mono uppercase tracking-wider font-bold">
                    <Activity size={12} />
                    <span>Side-by-Side Stellar Comparison</span>
                  </div>
                  <p className="text-[9px] font-mono text-text-dim leading-relaxed">
                    Click any star on the 3D Map to inspect, then click a second star (or click "Compare with Star") to trigger side-by-side comparative astrophysics mode.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Bar */}
          <div className="p-3 sm:p-4 border-t border-border/80 bg-bg/90 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
            <div className="text-[9px] font-mono text-text-dim flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping" />
              <span>Voice Recognition & Neural Command Parser Ready</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[9px] font-mono text-text-dim/60 hidden sm:inline">
                Press [Esc] to exit
              </span>
              <button
                onClick={onClose}
                className="px-4 py-1.5 bg-accent-cyan/15 hover:bg-accent-cyan/25 border border-accent-cyan/40 text-accent-cyan text-[10px] font-mono uppercase tracking-widest rounded-sm transition-all"
              >
                Close Matrix
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
