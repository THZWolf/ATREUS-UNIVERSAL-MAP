import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Terminal, Send, Sparkles, Mic, MicOff, Volume2, VolumeX, Zap, GraduationCap, Database, Radio, HelpCircle } from 'lucide-react';
import { AIMessage, Star, EvolutionMetrics, VoiceCommandLogEntry } from '../types';
import { getAIResponse } from '../services/ai';
import { cn } from '../lib/utils';
import { handleVoiceCommand, HELP_SYNTHESIZED_SPEECH, HELP_CHAT_TRANSCRIPT } from '../services/voiceCommandEngine';

import { AstraeusBody } from './AstraeusBody';
import { NeuralMap } from './NeuralMap';

import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

interface Props {
  messages: AIMessage[];
  onMessagesChange: React.Dispatch<React.SetStateAction<AIMessage[]>>;
  isEventActive?: boolean;
  onEvolutionUpdate?: (update: Partial<EvolutionMetrics>) => void;
  context?: {
    selectedStar: Star | null;
    metrics: EvolutionMetrics;
    searchKeywords: string[];
    activeTab: 'map' | 'research';
    recentActions: string[];
  };
  isCommandMode?: boolean;
  onToggleCommandMode?: () => void;
  onNavigate?: (tab: 'map' | 'research') => void;
  onToggleSubComputer?: () => void;
  onStartResearch?: (query: string) => void;
  onSaveDiscovery?: () => void;
  onToggleBookmark?: () => void;
  onOpenBookmarks?: () => void;
  onLogVoiceCommand?: (entry: Omit<VoiceCommandLogEntry, 'id' | 'timestamp'>) => void;
  activeFace?: 'logos' | 'pathos' | 'luna' | 'astraeus' | 'sophia' | 'mnemosyne';
  onFaceChange?: (face: 'logos' | 'pathos' | 'luna' | 'astraeus' | 'sophia' | 'mnemosyne') => void;
}

export const AIPsyche: React.FC<Props> = ({ 
  messages, 
  onMessagesChange, 
  isEventActive, 
  onEvolutionUpdate, 
  context,
  isCommandMode: propIsCommandMode,
  onToggleCommandMode: propOnToggleCommandMode,
  onNavigate,
  onToggleSubComputer,
  onStartResearch,
  onSaveDiscovery,
  onToggleBookmark,
  onOpenBookmarks,
  onLogVoiceCommand,
  activeFace: propActiveFace,
  onFaceChange
}) => {

  const [input, setInput] = useState('');
  const [internalFace, setInternalFace] = useState<'logos' | 'pathos' | 'luna' | 'astraeus' | 'sophia' | 'mnemosyne'>('logos');
  const face = propActiveFace || internalFace;

  const setFace = (newFace: 'logos' | 'pathos' | 'luna' | 'astraeus' | 'sophia' | 'mnemosyne') => {
    setInternalFace(newFace);
    if (onFaceChange) onFaceChange(newFace);
  };

  const [internalCommandMode, setInternalCommandMode] = useState(true);
  const isCommandMode = propIsCommandMode !== undefined ? propIsCommandMode : internalCommandMode;
  const toggleCommandMode = propOnToggleCommandMode || (() => setInternalCommandMode(prev => !prev));

  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastSpokenRef = useRef<string>('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.role === 'assistant' && !isTyping && lastMsg.content !== lastSpokenRef.current) {
      speak(lastMsg.content, lastMsg.face);
      lastSpokenRef.current = lastMsg.content;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('WebkitSpeechRecognition' in window || 'speechRecognition' in window)) {
      const SpeechRecognition = (window as any).WebkitSpeechRecognition || (window as any).speechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
      const userLang = (navigator.language && navigator.language.toLowerCase().startsWith('pt')) ? 'pt-BR' : 'en-US';
      recognitionRef.current.lang = userLang;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);

        // Process through Voice Command Engine
        const handled = handleVoiceCommand(transcript, isCommandMode, {
          onNavigate: (tab) => onNavigate?.(tab),
          onToggleSubComputer: () => onToggleSubComputer?.(),
          onStartResearch: (query) => onStartResearch?.(query),
          onSwitchPsyche: (f) => setFace(f),
          onSaveDiscovery: () => onSaveDiscovery?.(),
          onToggleBookmark: () => onToggleBookmark?.(),
          onOpenBookmarks: () => onOpenBookmarks?.(),
          onSpeak: (text, f) => speak(text, f || face),
          onPostAssistantMessage: (msg) => onMessagesChange(prev => [...prev, msg]),
          onLogCommand: (entry) => onLogVoiceCommand?.(entry),
          currentFace: face
        });


        if (!handled) {
          handleSend(transcript);
          if (isCommandMode && onLogVoiceCommand) {
            onLogVoiceCommand({
              command: transcript,
              status: 'recognized',
              actionType: 'query',
              responseFeedback: `Processed AI dialogue query`
            });
          }
        }
      };

      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }

    // Listen for real-time logs if user is authenticated
    let unsubscribe: (() => void) | undefined;
    if (auth.currentUser) {
      const logsRef = collection(db, 'users', auth.currentUser.uid, 'logs');
      const q = query(logsRef, orderBy('timestamp', 'desc'), limit(50));
      unsubscribe = onSnapshot(q, (snapshot) => {}, (error) => {
        handleFirestoreError(error, OperationType.LIST, `users/${auth.currentUser?.uid}/logs`);
      });
    }

    return () => {
      unsubscribe?.();
      recognitionRef.current?.stop();
    };
  }, [auth.currentUser, isCommandMode, face, onNavigate, onToggleSubComputer, onStartResearch, onSaveDiscovery, onLogVoiceCommand]);

  const speak = (text: string, msgFace?: 'logos' | 'pathos' | 'luna' | 'astraeus' | 'sophia' | 'mnemosyne') => {
    if (!voiceEnabled) return;
    window.speechSynthesis.cancel();
    
    // Clean text for speech
    const cleanText = text.replace(/\[.*?\]/g, '').replace(/[#*`_~]/g, '').trim();
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const activeFace = msgFace || face;
    
    const ptVoices = availableVoices.filter(v => v.lang.startsWith('pt'));
    const enVoices = availableVoices.filter(v => v.lang.startsWith('en'));
    const isPt = /[à-úÀ-Ú]/.test(cleanText) || cleanText.includes('não') || cleanText.includes('pesquisa');
    const targetVoices = isPt ? (ptVoices.length ? ptVoices : availableVoices) : (enVoices.length ? enVoices : availableVoices);
    
    const assistantVoice = targetVoices.find(v => v.name.includes('Neural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel')) || targetVoices[0] || availableVoices[0];
    
    if (assistantVoice) utterance.voice = assistantVoice;

    const settings = {
      logos: { pitch: 0.75, rate: 1.05 },
      pathos: { pitch: 0.95, rate: 0.9 },
      luna: { pitch: 1.1, rate: 1.05 },
      sophia: { pitch: 1.25, rate: 1.2 },
      mnemosyne: { pitch: 0.5, rate: 0.75 },
      astraeus: { pitch: 0.6, rate: 0.85 }
    }[activeFace];

    utterance.pitch = settings.pitch;
    utterance.rate = settings.rate;
    utterance.volume = 1.0;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setIsListening(true);
      recognitionRef.current?.start();
    }
  };

  const logToFirebase = async (message: string, type: 'info' | 'ai_response') => {
    if (!auth.currentUser) return;
    try {
      const logsRef = collection(db, 'users', auth.currentUser.uid, 'logs');
      await addDoc(logsRef, {
        userId: auth.currentUser.uid,
        message,
        type,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${auth.currentUser.uid}/logs`);
    }
  };

  const handleSend = async (overrideInput?: string) => {
    const textToSend = overrideInput || input;
    if (!textToSend.trim()) return;

    // Check if it's the "What can I do?" help command or global navigation in command mode
    const normalized = textToSend.toLowerCase().replace(/[?!.,;:_]/g, '').trim();
    if (
      normalized === 'what can i do' || 
      normalized.includes('what can i do') || 
      normalized === 'help' || 
      normalized === 'o que posso fazer' ||
      normalized.includes('o que posso fazer')
    ) {
      const userMsg: AIMessage = { role: 'user', content: textToSend, face };
      onMessagesChange(prev => [...prev, userMsg]);
      setInput('');
      
      speak(HELP_SYNTHESIZED_SPEECH, face);
      const assistantMsg: AIMessage = { role: 'assistant', content: HELP_CHAT_TRANSCRIPT, face };
      onMessagesChange(prev => [...prev, assistantMsg]);
      
      onLogVoiceCommand?.({
        command: textToSend,
        status: 'executed',
        actionType: 'help',
        responseFeedback: 'Voice command catalog synthesized'
      });
      await logToFirebase(textToSend, 'info');
      await logToFirebase('Synthesized available voice commands', 'ai_response');
      return;
    }

    const userMsg: AIMessage = { role: 'user', content: textToSend, face };
    onMessagesChange(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    await logToFirebase(textToSend, 'info');

    if (onEvolutionUpdate) {
      onEvolutionUpdate({
        totalInteractions: (context?.metrics.totalInteractions || 0) + 1,
        sentienceIndex: Math.min(100, (context?.metrics.sentienceIndex || 1) + 0.1)
      });
    }

    const response = await getAIResponse([...messages, userMsg], face, context);
    
    const assistantMsg: AIMessage = { role: 'assistant', content: response, face };
    onMessagesChange(prev => [...prev, assistantMsg]);
    setIsTyping(false);
    
    await logToFirebase(response, 'ai_response');
  };

  const faceStyles = {
    logos: "bg-accent-cyan/10 text-accent-cyan border-accent-cyan/30",
    pathos: "bg-accent-pink/10 text-accent-pink border-accent-pink/30",
    luna: "bg-green-500/10 text-green-400 border-green-500/30",
    sophia: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    mnemosyne: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
    astraeus: "bg-purple-500/10 text-purple-400 border-purple-500/30"
  };

  const faceIcons = {
    logos: <Terminal size={16} />,
    pathos: <Brain size={16} />,
    luna: <Sparkles size={16} />,
    sophia: <GraduationCap size={16} />,
    mnemosyne: <Database size={16} />,
    astraeus: <Zap size={16} />
  };

  const faceNames = {
    logos: "Logos Interface",
    pathos: "Pathos Psyche",
    luna: "LUNA-Q Super-Intelligence",
    sophia: "Sophia Student-System",
    mnemosyne: "Mnemosyne Memory Matrix",
    astraeus: "Unified Core"
  };

  return (
    <div className="flex flex-col h-full bg-bg border border-border rounded-sm overflow-hidden">
      {/* Header / Face Toggle */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-surface/50">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-8 h-8 rounded-sm flex items-center justify-center transition-all duration-500 border",
            faceStyles[face]
          )}>
            {faceIcons[face]}
          </div>
          <div>
            <h2 className="text-xs font-mono uppercase tracking-widest text-text-main">Astraeus-Prime</h2>
            <p className="text-[9px] font-mono text-text-dim uppercase">
              {faceNames[face]}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={cn(
              "p-1.5 rounded-sm border border-border transition-colors",
              voiceEnabled ? "text-accent-cyan" : "text-text-dim"
            )}
            title={voiceEnabled ? "Mute Voice" : "Unmute Voice"}
          >
            {voiceEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>
          <div className="flex gap-1 overflow-x-auto pb-1 max-w-[150px] scrollbar-hide">
            {(['logos', 'pathos', 'luna', 'sophia', 'mnemosyne', 'astraeus'] as const).map(f => (
              <button 
                key={f}
                onClick={() => setFace(f)}
                className={cn(
                  "w-6 h-6 rounded-sm border border-border flex items-center justify-center transition-all shrink-0",
                  face === f ? faceStyles[f] : "text-text-dim hover:bg-border"
                )}
                title={faceNames[f]}
              >
                {faceIcons[f]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Astraeus Neural Body */}
      <div className="p-4 bg-surface/20 relative space-y-4">
        <AstraeusBody 
          face={face} 
          isEventActive={isEventActive} 
          isTyping={isTyping} 
          isSpeaking={isSpeaking} 
          isListening={isListening}
        />
        <NeuralMap face={face} />
        
        {/* Neural Complexity Meter */}
        <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
          <span className="text-[7px] font-mono text-text-dim uppercase tracking-tighter">Neural Complexity</span>
          <div className="flex gap-0.5">
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div
                key={i}
                animate={{ 
                  height: !['logos', 'mnemosyne'].includes(face) ? [2, Math.random() * 10 + 5, 2] : [2, 4, 2],
                  opacity: !['logos', 'mnemosyne'].includes(face) ? [0.3, 1, 0.3] : 0.2
                }}
                transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.05 }}
                className={cn(
                  "w-0.5 rounded-full",
                  face === 'logos' ? "bg-accent-cyan" : 
                  face === 'pathos' ? "bg-accent-pink" :
                  face === 'luna' ? "bg-green-500" : 
                  face === 'sophia' ? "bg-amber-500" :
                  face === 'mnemosyne' ? "bg-indigo-500" : "bg-purple-500"
                )}
              />
            ))}
          </div>
        </div>

        {isSpeaking && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute bottom-6 right-6 flex gap-1"
          >
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                animate={{ height: [4, 12, 4] }}
                transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                className={cn(
                  "w-1 rounded-full",
                  face === 'logos' ? "bg-accent-cyan" : 
                  face === 'pathos' ? "bg-accent-pink" :
                  face === 'luna' ? "bg-green-500" : 
                  face === 'sophia' ? "bg-amber-500" :
                  face === 'mnemosyne' ? "bg-indigo-500" : "bg-purple-500"
                )}
              />
            ))}
          </motion.div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-10">
            <Sparkles size={32} className="mb-4" />
            <p className="text-[10px] font-mono uppercase tracking-widest">Neural Link Idle</p>
          </div>
        )}
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                "max-w-[90%] p-4 rounded-sm text-[11px] font-mono leading-relaxed relative group",
                msg.role === 'user' 
                  ? "ml-auto bg-surface/80 border border-border text-text-main" 
                  : cn("mr-auto border shadow-[0_0_15px_rgba(0,0,0,0.2)]", 
                      msg.face === 'logos' ? "border-accent-cyan/30 bg-accent-cyan/5 text-accent-cyan" : 
                      msg.face === 'pathos' ? "border-accent-pink/30 bg-accent-pink/5 text-accent-pink" :
                      msg.face === 'luna' ? "border-green-500/30 bg-green-500/5 text-green-400" :
                      msg.face === 'sophia' ? "border-amber-500/30 bg-amber-500/5 text-amber-400" :
                      msg.face === 'mnemosyne' ? "border-indigo-500/30 bg-indigo-500/5 text-indigo-400" :
                      "border-purple-500/30 bg-purple-500/5 text-purple-400"
                    )
              )}
            >
              <div className="absolute -top-2 left-2 px-1 bg-bg text-[7px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                {msg.role === 'user' ? 'Authorized User' : faceNames[msg.face || 'logos']}
              </div>
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
        {isTyping && (
          <div className="flex gap-1 p-2">
            <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1 h-1 bg-text-dim rounded-full" />
            <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1 h-1 bg-text-dim rounded-full" />
            <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1 h-1 bg-text-dim rounded-full" />
          </div>
        )}
      </div>

      {/* Listening Frequency Waveform Banner Overlay */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-3 py-1.5 bg-accent-cyan/15 border-t border-accent-cyan/40 flex items-center justify-between overflow-hidden"
          >
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-cyan opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-cyan"></span>
              </span>
              <span className="text-[8px] font-mono text-accent-cyan font-bold tracking-widest uppercase animate-pulse">
                Listening...
              </span>
              {isCommandMode && (
                <span className="text-[7px] font-mono bg-accent-cyan/25 border border-accent-cyan/50 text-accent-cyan px-1.5 py-0.2 rounded uppercase tracking-widest">
                  CMD MODE
                </span>
              )}
            </div>

            {/* Micro frequency waveform bars */}
            <div className="flex items-end gap-0.5 h-3.5 px-1">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                <motion.div
                  key={i}
                  animate={{ height: ['25%', `${Math.min(100, Math.random() * 80 + 20)}%`, '25%'] }}
                  transition={{ repeat: Infinity, duration: 0.3 + (i % 4) * 0.08 }}
                  className="w-1 bg-accent-cyan rounded-t-[1px]"
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="p-3 border-t border-border bg-surface/30">
        <div className="relative flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isListening ? "Listening for command..." : isCommandMode ? "Type query or command ('What can I do?')..." : "Neural sequence..."}
              className={cn(
                "w-full bg-bg border border-border rounded-sm px-3 py-2 text-[11px] font-mono text-text-main placeholder:text-text-dim/30 focus:outline-none focus:border-accent-cyan/50",
                isListening && "border-accent-cyan ring-1 ring-accent-cyan/50"
              )}
            />
            <button 
              onClick={() => handleSend()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text-dim hover:text-accent-cyan transition-colors"
            >
              <Send size={14} />
            </button>
          </div>

          {/* Command Mode Toggle */}
          <button
            onClick={toggleCommandMode}
            className={cn(
              "p-2 rounded-sm border transition-all flex items-center justify-center shrink-0",
              isCommandMode 
                ? "bg-accent-cyan/20 border-accent-cyan text-accent-cyan shadow-[0_0_10px_rgba(76,201,240,0.25)]" 
                : "bg-surface border-border text-text-dim hover:text-text-main"
            )}
            title={isCommandMode ? "Command Mode Active (Voice navigation enabled)" : "Command Mode Standby"}
          >
            <Zap size={15} className={cn(isCommandMode && "fill-accent-cyan")} />
          </button>

          {/* Mic Button */}
          <button 
            onClick={toggleListening}
            className={cn(
              "p-2 rounded-sm border transition-all shrink-0",
              isListening 
                ? "bg-accent-cyan border-accent-cyan text-bg shadow-[0_0_15px_rgba(76,201,240,0.5)] animate-pulse" 
                : "border-border text-text-dim hover:bg-border hover:text-text-main"
            )}
            title={isListening ? "Stop listening" : "Start voice recognition"}
          >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
        </div>
      </div>

    </div>
  );
};
