import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Radio, 
  RotateCcw, 
  Play, 
  Compass, 
  FlaskConical, 
  HelpCircle, 
  Brain, 
  Bookmark, 
  CheckCircle2, 
  Zap, 
  Terminal,
  Volume2
} from 'lucide-react';
import { VoiceCommandLogEntry } from '../types';
import { cn } from '../lib/utils';

interface Props {
  logs: VoiceCommandLogEntry[];
  isCommandMode: boolean;
  onToggleCommandMode: () => void;
  onRetriggerCommand: (command: string) => void;
  onClearLogs?: () => void;
}

export const VoiceCommandLog: React.FC<Props> = ({
  logs,
  isCommandMode,
  onToggleCommandMode,
  onRetriggerCommand,
  onClearLogs
}) => {
  const getActionIcon = (actionType: VoiceCommandLogEntry['actionType']) => {
    switch (actionType) {
      case 'navigation':
        return <Compass size={13} className="text-accent-cyan" />;
      case 'research':
        return <FlaskConical size={13} className="text-accent-pink" />;
      case 'help':
        return <HelpCircle size={13} className="text-accent-gold" />;
      case 'psyche':
        return <Brain size={13} className="text-purple-400" />;
      case 'discovery':
        return <Bookmark size={13} className="text-green-400" />;
      default:
        return <Terminal size={13} className="text-text-dim" />;
    }
  };

  const getActionBadgeClass = (actionType: VoiceCommandLogEntry['actionType']) => {
    switch (actionType) {
      case 'navigation':
        return 'border-accent-cyan/30 text-accent-cyan bg-accent-cyan/5';
      case 'research':
        return 'border-accent-pink/30 text-accent-pink bg-accent-pink/5';
      case 'help':
        return 'border-accent-gold/30 text-accent-gold bg-accent-gold/5';
      case 'psyche':
        return 'border-purple-500/30 text-purple-400 bg-purple-500/5';
      case 'discovery':
        return 'border-green-500/30 text-green-400 bg-green-500/5';
      default:
        return 'border-border text-text-dim bg-surface';
    }
  };

  const formatTimestamp = (ts: number) => {
    try {
      const date = new Date(ts);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return 'Recent';
    }
  };

  return (
    <div className="bg-surface/50 border border-border rounded-sm p-6 space-y-5 relative overflow-hidden group">
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-accent-pink/5 rounded-full blur-3xl pointer-events-none" />

      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-accent-pink/10 border border-accent-pink/30 rounded-sm text-accent-pink shadow-[0_0_12px_rgba(247,37,133,0.15)]">
            <Radio size={18} className={cn(isCommandMode && "animate-pulse")} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-mono uppercase tracking-[2px] text-text-main font-bold">
                Voice Command Log
              </h3>
              <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-white/5 border border-border text-text-dim uppercase tracking-widest">
                Last 5 Records
              </span>
            </div>
            <p className="text-[9px] font-mono text-text-dim uppercase tracking-wider mt-0.5">
              Persistent Hands-Free Interface & Re-Execution
            </p>
          </div>
        </div>

        {/* Command Mode Toggle Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleCommandMode}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-sm border text-[9px] font-mono uppercase tracking-widest transition-all",
              isCommandMode 
                ? "bg-accent-cyan/15 border-accent-cyan/50 text-accent-cyan shadow-[0_0_12px_rgba(76,201,240,0.2)]" 
                : "bg-surface border-border text-text-dim hover:text-text-main"
            )}
            title="Toggle Command Mode for global voice control"
          >
            <Zap size={12} className={cn(isCommandMode ? "text-accent-cyan fill-accent-cyan" : "text-text-dim")} />
            <span>Command Mode: {isCommandMode ? "ACTIVE" : "OFF"}</span>
          </button>
        </div>
      </div>

      {/* Command List (Last 5) */}
      <div className="space-y-2.5 relative z-10">
        {logs.length === 0 ? (
          <div className="p-6 border border-dashed border-border rounded-sm text-center space-y-2 bg-black/10">
            <Terminal size={20} className="mx-auto text-text-dim opacity-40" />
            <p className="text-[10px] font-mono text-text-dim uppercase tracking-widest">
              No Voice Commands Recorded Yet
            </p>
            <p className="text-[9px] font-mono text-text-dim/60 max-w-sm mx-auto">
              Enable the microphone and speak <span className="text-accent-cyan">"What can I do?"</span> or <span className="text-accent-pink">"Jump to Map"</span> to populate this log.
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {logs.slice(0, 5).map((entry, idx) => (
              <motion.div
                key={entry.id || idx}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center justify-between gap-3 p-3 bg-bg/70 hover:bg-bg border border-border hover:border-accent-pink/30 rounded-sm transition-all group/item"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="shrink-0 p-1.5 rounded bg-surface border border-border/80">
                    {getActionIcon(entry.actionType)}
                  </div>
                  
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-mono text-text-main font-semibold truncate tracking-wide">
                        "{entry.command}"
                      </span>
                      <span className={cn(
                        "text-[7px] font-mono uppercase px-1.5 py-0.2 rounded border tracking-widest",
                        getActionBadgeClass(entry.actionType)
                      )}>
                        {entry.actionType}
                      </span>
                      <span className="text-[8px] font-mono text-green-400 flex items-center gap-1">
                        <CheckCircle2 size={10} />
                        <span className="uppercase tracking-widest">{entry.status}</span>
                      </span>
                    </div>

                    {entry.responseFeedback && (
                      <p className="text-[8px] font-mono text-text-dim truncate">
                        ↳ {entry.responseFeedback}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[8px] font-mono text-text-dim/60 hidden sm:inline-block">
                    {formatTimestamp(entry.timestamp)}
                  </span>

                  {/* Quick Re-trigger Button */}
                  <button
                    onClick={() => onRetriggerCommand(entry.command)}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-accent-pink/10 hover:bg-accent-pink/20 border border-accent-pink/30 hover:border-accent-pink/60 rounded-sm text-accent-pink text-[9px] font-mono uppercase tracking-widest transition-all shadow-sm"
                    title={`Re-execute command: "${entry.command}"`}
                  >
                    <RotateCcw size={11} className="group-hover/item:rotate-180 transition-transform duration-500" />
                    <span>Re-trigger</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Suggested Quick Triggers Footer */}
      <div className="pt-2 border-t border-border/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[8px] font-mono text-text-dim">
        <div className="flex items-center gap-1.5">
          <Volume2 size={12} className="text-accent-cyan" />
          <span className="uppercase tracking-widest">Quick Vocal Prompts:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[
            'What can I do?',
            'Jump to Map',
            'Start research on Exoplanets',
            'Switch to Luna'
          ].map((phrase) => (
            <button
              key={phrase}
              onClick={() => onRetriggerCommand(phrase)}
              className="px-2 py-0.5 rounded border border-border/80 bg-surface/50 hover:bg-surface hover:border-accent-cyan/40 text-text-dim hover:text-accent-cyan transition-colors"
            >
              "{phrase}"
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
