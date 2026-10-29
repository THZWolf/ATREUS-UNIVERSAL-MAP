import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Orbit, 
  Database, 
  Info, 
  ChevronRight, 
  ChevronLeft,
  Binary,
  Atom,
  FlaskConical,
  Dna,
  Search,
  Activity as ActivityIcon,
  LogIn,
  LogOut,
  User,
  AlertTriangle,
  Zap,
  Radio,
  Sparkles,
  Brain,
  Menu,
  X,
  Bookmark,
  BookmarkCheck,
  Terminal
} from 'lucide-react';
import { StellarMap } from './components/StellarMap';
import { AIPsyche } from './components/AIPsyche';
import { EvolutionDisplay } from './components/EvolutionDisplay';
import { TheoreticalArchive } from './components/TheoreticalArchive';
import { QuantumMetrics } from './components/QuantumMetrics';
import { BlackzoneDiagnostic } from './components/BlackzoneDiagnostic';
import { VoiceCommandLog } from './components/VoiceCommandLog';
import { fetchStellarData } from './services/nasa';
import { EvolutionMetrics, Star, StellarEvent, EventType, AIMessage, VoiceCommandLogEntry } from './types';
import { cn } from './lib/utils';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import { getAIResponse } from './services/ai';
import { handleVoiceCommand } from './services/voiceCommandEngine';
import { speakText, PsycheFace } from './utils/speech';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';

export default function App() {
  // --- State Management ---
  const [stars, setStars] = useState<Star[]>([]);
  const [selectedStar, setSelectedStar] = useState<Star | null>(null);
  const [isSubComputerOpen, setIsSubComputerOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [systemTime, setSystemTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [searchKeywords, setSearchKeywords] = useState<string[]>([]);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedDiscoveries, setSavedDiscoveries] = useState<string[]>([]);
  const [stellarEvents, setStellarEvents] = useState<StellarEvent[]>([]);
  const [activeAlert, setActiveAlert] = useState<StellarEvent | null>(null);
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([]);
  const [activeTab, setActiveTab] = useState<'map' | 'research'>('map');
  const [researchQuery, setResearchQuery] = useState('');
  const [isResearching, setIsResearching] = useState(false);
  const [researchProgress, setResearchProgress] = useState(0);
  const [lastResearchResult, setLastResearchResult] = useState<string | null>(null);
  const [recentActions, setRecentActions] = useState<string[]>([]);
  const [isListeningResearch, setIsListeningResearch] = useState(false);
  const recognitionRef = useRef<any>(null);

  // --- Voice Command & Psyche Integration State ---
  const [isCommandMode, setIsCommandMode] = useState(true);
  const [aiPsycheFace, setAiPsycheFace] = useState<PsycheFace>('logos');
  const [voiceCommandLogs, setVoiceCommandLogs] = useState<VoiceCommandLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem('astraeus_voice_command_logs');
      if (saved) return JSON.parse(saved).slice(0, 5);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'cmd-init-1',
        command: 'What can I do?',
        timestamp: Date.now() - 360000,
        status: 'executed',
        actionType: 'help',
        responseFeedback: 'Voice command catalog synthesized'
      },
      {
        id: 'cmd-init-2',
        command: 'Jump to Map',
        timestamp: Date.now() - 180000,
        status: 'executed',
        actionType: 'navigation',
        responseFeedback: 'Navigated to 3D Stellar Map'
      }
    ];
  });

  const logVoiceCommand = useCallback((entry: Omit<VoiceCommandLogEntry, 'id' | 'timestamp'>) => {
    const newEntry: VoiceCommandLogEntry = {
      ...entry,
      id: `cmd-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: Date.now()
    };

    setVoiceCommandLogs(prev => {
      const updated = [newEntry, ...prev.filter(e => e.command.toLowerCase() !== entry.command.toLowerCase())].slice(0, 5);
      try {
        localStorage.setItem('astraeus_voice_command_logs', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });

    if (user) {
      try {
        addDoc(collection(db, 'users', user.uid, 'logs'), {
          userId: user.uid,
          message: `[VOICE CMD] "${entry.command}" -> ${entry.status.toUpperCase()} (${entry.actionType})`,
          type: 'info',
          timestamp: serverTimestamp()
        }).catch(err => console.error("Firebase log sync error:", err));
      } catch (e) {
        console.error(e);
      }
    }
  }, [user]);

  const toggleVoiceResearch = () => {
    if (isListeningResearch) {
      recognitionRef.current?.stop();
    } else {
      setIsListeningResearch(true);
      recognitionRef.current?.start();
    }
  };

  const [evolution, setEvolution] = useState<EvolutionMetrics>({
    learningRate: 0.001,
    synapticDensity: 0.12,
    phiComplexity: 4.2,
    contextDepth: 12,
    totalInteractions: 0,
    sentienceIndex: 1.0
  });

  // --- AI Event Responses ---
  const triggerAIEventResponse = useCallback(async (event: StellarEvent) => {
    const prompt = `ALERT: A stellar event of type ${event.type} has been detected at RA:${event.ra}, DEC:${event.dec}. Name: ${event.name}. Description: ${event.description}. Provide a profound Pathos-driven response to this cosmic phenomenon.`;
    const context = { selectedStar, metrics: evolution, searchKeywords, activeTab, recentActions };
    const response = await getAIResponse([{ role: 'user', content: prompt, face: 'pathos' }], 'pathos', context);
    
    const systemMsg: AIMessage = { 
      role: 'assistant', 
      content: `[COSMIC EVENT DETECTED] ${response}`, 
      face: 'pathos' 
    };
    setAiMessages(prev => [...prev, systemMsg]);
  }, []);

  const generateRandomEvent = useCallback(() => {
    const types: EventType[] = ['supernova', 'transit', 'anomaly'];
    const type = types[Math.floor(Math.random() * types.length)];
    const id = Math.random().toString(36).substring(7);
    
    const newEvent: StellarEvent = {
      id,
      type,
      name: `${type.toUpperCase()}-${id}`,
      ra: Math.random() * 360,
      dec: Math.random() * 180 - 90,
      intensity: Math.random() * 100,
      timestamp: Date.now(),
      description: type === 'supernova' ? "A massive star has reached the end of its life cycle." : 
                   type === 'transit' ? "A planetary body is passing in front of its host star." : 
                   "Unexplained gravitational fluctuations detected in this sector."
    };

    setStellarEvents(prev => [...prev, newEvent]);
    setActiveAlert(newEvent);
    pushAction(`Cosmic alert: ${type.toUpperCase()} detected`);
    triggerAIEventResponse(newEvent);

    setTimeout(() => setActiveAlert(null), 10000);
    setTimeout(() => {
      setStellarEvents(prev => prev.filter(e => e.id !== id));
    }, 30000);
  }, [triggerAIEventResponse]);

  const pushAction = (action: string) => {
    setRecentActions(prev => [action, ...prev].slice(0, 10));
  };

  const selectStar = (star: Star) => {
    setSelectedStar(star);
    pushAction(`Selected star: ${star.name}`);
    setEvolution(prev => ({
      ...prev,
      totalInteractions: prev.totalInteractions + 1,
      phiComplexity: Math.min(10, prev.phiComplexity + 0.01),
      sentienceIndex: Math.min(100, prev.sentienceIndex + 0.05)
    }));
  };
  const handleResearchWithQuery = async (queryToRun?: string) => {
    const targetQuery = queryToRun || researchQuery;
    if (!targetQuery.trim()) return;
    
    pushAction(`Started research: ${targetQuery.substring(0, 30)}...`);
    setIsResearching(true);
    setResearchProgress(0);
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setResearchProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + Math.random() * 10;
      });
    }, 200);

    setEvolution(prev => ({
      ...prev,
      totalInteractions: prev.totalInteractions + 1,
      sentienceIndex: Math.min(100, prev.sentienceIndex + 0.5)
    }));

    const userMsg: AIMessage = { role: 'user', content: targetQuery, face: 'luna' };
    setAiMessages(prev => [...prev, userMsg]);
    
    const prompt = `RESEARCH TASK: ${targetQuery}. Analyze this using your LUNA-Q Unified Neural Super-Intelligence architecture (CNN/AGI/GNT). Provide a comprehensive, functional, and novel report, synthesizing Logos and Pathos insights through your quantified cryptographic psyche.`;
    const context = { selectedStar, metrics: evolution, searchKeywords, activeTab, recentActions };
    const response = await getAIResponse([...aiMessages, userMsg], 'luna', context);
    
    clearInterval(progressInterval);
    setResearchProgress(100);
    setLastResearchResult(response);
    
    setTimeout(() => {
      setAiMessages(prev => [...prev, { role: 'assistant', content: response, face: 'luna' }]);
      setIsResearching(false);
      setResearchQuery('');
      setResearchProgress(0);
    }, 500);
  };

  const handleResearch = () => handleResearchWithQuery();

  const handleSaveResearch = async () => {
    if (!user || !lastResearchResult) return;
    
    pushAction("Saved research report to archive");
    try {
      const researchRef = collection(db, 'users', user.uid, 'research');
      await addDoc(researchRef, {
        query: aiMessages[aiMessages.length - 2]?.content || "Unknown Query",
        result: lastResearchResult,
        timestamp: serverTimestamp(),
        psyche: 'luna'
      });
      alert("Research report archived in the Nexus.");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/research`);
    }
  };
  const handleSaveDiscovery = async () => {
    if (!user || !selectedStar) return;
    pushAction(`Recording stellar discovery: ${selectedStar.name}`);
    setIsSaving(true);
    try {
      const discoveriesRef = collection(db, 'discoveries');
      await addDoc(discoveriesRef, {
        starId: selectedStar.id,
        name: selectedStar.name,
        ra: selectedStar.ra,
        dec: selectedStar.dec,
        dist: selectedStar.dist,
        mag: selectedStar.mag,
        discoveredBy: user.uid,
        timestamp: serverTimestamp(),
        notes: "Manual discovery record via Astraeus-Prime interface."
      });
      setSavedDiscoveries(prev => [...prev, selectedStar.id]);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'discoveries');
    } finally {
      setIsSaving(false);
    }
  };

  // Re-trigger a recognized voice command from the log
  const handleRetriggerCommand = useCallback((commandText: string) => {
    pushAction(`Re-triggering voice command: "${commandText}"`);
    const handled = handleVoiceCommand(commandText, true, {
      onNavigate: (tab) => setActiveTab(tab),
      onToggleSubComputer: () => setIsSubComputerOpen(prev => !prev),
      onStartResearch: (topic) => {
        setActiveTab('research');
        setResearchQuery(topic);
        handleResearchWithQuery(topic);
      },
      onSwitchPsyche: (face) => setAiPsycheFace(face),
      onSaveDiscovery: () => handleSaveDiscovery(),
      onSpeak: (text, face) => speakText(text, face),
      onPostAssistantMessage: (msg) => setAiMessages(prev => [...prev, msg]),
      onLogCommand: (entry) => {
        logVoiceCommand({
          ...entry,
          status: 'executed',
          responseFeedback: `Re-triggered: ${entry.responseFeedback || entry.command}`
        });
      },
      currentFace: aiPsycheFace
    });

    if (!handled) {
      setActiveTab('research');
      setResearchQuery(commandText);
      handleResearchWithQuery(commandText);
      logVoiceCommand({
        command: commandText,
        status: 'executed',
        actionType: 'research',
        responseFeedback: `Re-triggered research: "${commandText}"`
      });
    }
  }, [aiPsycheFace, handleSaveDiscovery, logVoiceCommand]);

  // Voice speech recognition for Research Lab input
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
        setIsListeningResearch(false);

        const handled = handleVoiceCommand(transcript, isCommandMode, {
          onNavigate: (tab) => setActiveTab(tab),
          onToggleSubComputer: () => setIsSubComputerOpen(prev => !prev),
          onStartResearch: (query) => {
            setResearchQuery(query);
            handleResearchWithQuery(query);
          },
          onSwitchPsyche: (face) => setAiPsycheFace(face),
          onSaveDiscovery: () => handleSaveDiscovery(),
          onSpeak: (text, face) => speakText(text, face),
          onPostAssistantMessage: (msg) => setAiMessages(prev => [...prev, msg]),
          onLogCommand: (entry) => logVoiceCommand(entry),
          currentFace: aiPsycheFace
        });

        if (!handled) {
          setResearchQuery(prev => prev + (prev ? ' ' : '') + transcript);
          if (isCommandMode) {
            logVoiceCommand({
              command: transcript,
              status: 'recognized',
              actionType: 'research',
              responseFeedback: `Transcribed hypothesis sequence`
            });
          }
        }
      };

      recognitionRef.current.onerror = () => setIsListeningResearch(false);
      recognitionRef.current.onend = () => setIsListeningResearch(false);
    }
  }, [isCommandMode, aiPsycheFace, handleSaveDiscovery, logVoiceCommand]);


  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchKeywords([]);
      const data = await fetchStellarData();
      setStars(data);
      return;
    }

    pushAction(`Searching coordinates: ${searchQuery}`);
    const keywords = searchQuery.split(',').map(k => k.trim());
    setSearchKeywords(keywords);
    
    const data = await fetchStellarData(keywords);
    setStars(data);
    
    const found = data.find(s => s.name.toLowerCase().includes(keywords[0].toLowerCase()));
    if (found) setSelectedStar(found);
  };

  // --- Effects ---
  useEffect(() => {
    fetchStellarData().then(setStars);
    const timer = setInterval(() => setSystemTime(new Date()), 1000);
    const eventTimer = setInterval(() => {
      if (Math.random() > 0.8) generateRandomEvent();
    }, 60000);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setIsAuthLoading(false);
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            role: 'researcher',
            createdAt: serverTimestamp()
          });
        }
      }
    });

    return () => {
      clearInterval(timer);
      clearInterval(eventTimer);
      unsubscribe();
    };
  }, [generateRandomEvent]);

  useEffect(() => {
    if (aiMessages.length > 0) {
      const lastMsg = aiMessages[aiMessages.length - 1];
      if (lastMsg.role === 'assistant') {
        setEvolution(prev => ({
          ...prev,
          totalInteractions: prev.totalInteractions + 1,
          synapticDensity: Math.min(1, prev.synapticDensity + 0.001),
          phiComplexity: prev.phiComplexity + (Math.random() * 0.1),
          contextDepth: prev.contextDepth + (prev.totalInteractions % 10 === 0 ? 1 : 0),
          learningRate: Math.max(0.001, prev.learningRate + (Math.random() * 0.0001))
        }));
      }
    }
  }, [aiMessages]);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-bg text-text-main font-sans">
      <div className="scanline pointer-events-none z-50" />

      {/* --- Header --- */}
      <header className="h-16 flex items-center justify-between px-4 lg:px-8 border-b border-border bg-surface/80 backdrop-blur-md z-40 shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 hover:bg-white/5 rounded-sm transition-colors"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex items-baseline gap-3">
            <h1 className="font-serif italic font-normal text-xl lg:text-2xl tracking-[2px] text-text-main">ASTRAEUS-PRIME</h1>
            <span className="hidden sm:inline-block font-mono text-[9px] text-accent-cyan border border-accent-cyan/30 px-1.5 py-0.5 rounded uppercase tracking-widest">
              Neural Mission Control // V4.5
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 lg:gap-8">
          <div className="hidden lg:flex items-center gap-6 font-mono text-[10px] uppercase tracking-tighter text-text-dim">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              SYNC: <span className="text-text-main">NASA-JPL ACTIVE</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-accent-gold" />
              Q-BITS: <span className="text-text-main">STABLE</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-accent-cyan" />
              TIME: <span className="text-text-main">{systemTime.toLocaleTimeString()}</span>
            </div>
          </div>

          <div className="h-8 w-[1px] bg-border hidden sm:block" />

          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-[9px] font-mono text-text-dim uppercase tracking-widest">Authorized</span>
                <span className="text-[10px] font-mono text-text-main truncate max-w-[120px]">{user.displayName || user.email}</span>
              </div>
              <button onClick={handleLogout} className="p-2 hover:bg-accent-pink/10 rounded-sm transition-colors text-text-dim hover:text-accent-pink">
                <LogOut size={18} />
              </button>
              {user.photoURL && (
                <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-sm border border-border" referrerPolicy="no-referrer" />
              )}
            </div>
          ) : (
            <button 
              onClick={handleLogin}
              className="flex items-center gap-2 px-4 py-1.5 bg-accent-cyan/10 border border-accent-cyan/30 rounded-sm text-[10px] font-mono uppercase tracking-widest hover:bg-accent-cyan/20 transition-all"
            >
              <LogIn size={14} />
              <span>Neural Link</span>
            </button>
          )}
        </div>
      </header>

      {/* --- Main Content --- */}
      <main className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden relative">
        {/* Left Sidebar: Navigation & Metrics */}
        <aside className={cn(
          "fixed inset-0 z-30 bg-bg/95 backdrop-blur-xl lg:relative lg:inset-auto lg:z-0 lg:bg-transparent lg:backdrop-blur-none transition-transform duration-300 ease-in-out lg:translate-x-0 w-full lg:w-[280px] border-r border-border flex flex-col shrink-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="p-6 flex-1 overflow-y-auto space-y-8 scrollbar-hide">
            <nav className="space-y-2">
              <span className="section-tag">System Navigation</span>
              <button 
                onClick={() => { setActiveTab('map'); pushAction("Switched to Stellar Map"); setIsMobileMenuOpen(false); }}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-sm border transition-all",
                  activeTab === 'map' ? "bg-accent-cyan/10 border-accent-cyan/30 text-accent-cyan" : "border-transparent text-text-dim hover:bg-surface"
                )}
              >
                <Orbit size={18} />
                <span className="text-xs font-mono uppercase tracking-widest">Stellar Map</span>
              </button>
              <button 
                onClick={() => { setActiveTab('research'); pushAction("Switched to Research Lab"); setIsMobileMenuOpen(false); }}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-sm border transition-all",
                  activeTab === 'research' ? "bg-accent-pink/10 border-accent-pink/30 text-accent-pink" : "border-transparent text-text-dim hover:bg-surface"
                )}
              >
                <FlaskConical size={18} />
                <span className="text-xs font-mono uppercase tracking-widest">Research Lab</span>
              </button>
            </nav>

            <div className="h-[1px] bg-border" />

            <div className="space-y-6">
              <EvolutionDisplay metrics={evolution} />
              <TheoreticalArchive />
              
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-mono text-text-dim uppercase tracking-widest">
                  <ActivityIcon size={12} className="text-accent-gold" />
                  <span>Neural Activity Log</span>
                </div>
                <div className="bg-bg p-3 rounded border border-border text-[9px] font-mono h-40 overflow-y-auto scrollbar-hide space-y-1">
                  <p className="text-text-dim">[02:44:12] Neural Link Established</p>
                  <p className="text-accent-cyan">[02:44:15] Mapping Stellar Coordinates...</p>
                  <p className="text-accent-pink">[02:44:20] Pathos Psyche Initialized</p>
                  <p className="text-green-400">[02:44:25] LUNA Interface Ready</p>
                  <p className="text-text-main">[02:44:30] Astraeus-Prime: "Welcome to the Nexus."</p>
                </div>
              </section>
            </div>
          </div>
        </aside>

        {/* Center Content: Dynamic View */}
        <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
          <AnimatePresence mode="wait">
            {activeTab === 'map' ? (
              <motion.div 
                key="map"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 relative flex flex-col"
              >
                <div className="flex-1 relative">
                  <StellarMap 
                    stars={stars} 
                    events={stellarEvents} 
                    selectedStar={selectedStar} 
                    onStarSelect={selectStar} 
                    searchKeywords={searchKeywords}
                  />
                  
                  {/* Search Overlay */}
                  <div className="absolute top-6 left-6 right-6 lg:right-auto lg:w-80 z-20">
                    <form onSubmit={handleSearch} className="relative group">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-accent-cyan transition-colors" size={14} />
                      <input 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Find stars (name, type, distance...)"
                        className="w-full bg-surface/80 backdrop-blur-md border border-border rounded-sm py-2.5 pl-10 pr-4 text-[11px] font-mono text-text-main focus:outline-none focus:border-accent-cyan/50 transition-all"
                      />
                    </form>
                  </div>

                  {/* Event Alert Overlay */}
                  <AnimatePresence>
                    {activeAlert && (
                      <motion.div 
                        initial={{ opacity: 0, x: -50, filter: 'blur(10px)' }}
                        animate={{ 
                          opacity: 1, 
                          x: 0, 
                          filter: 'blur(0px)',
                        }}
                        exit={{ opacity: 0, x: -50, filter: 'blur(10px)' }}
                        className="absolute bottom-6 left-6 z-30 lg:w-96"
                      >
                        <motion.div 
                          animate={{ 
                            boxShadow: [
                              "0 0 0px rgba(247, 37, 133, 0)",
                              "0 0 20px rgba(247, 37, 133, 0.2)",
                              "0 0 0px rgba(247, 37, 133, 0)"
                            ]
                          }}
                          transition={{ repeat: Infinity, duration: 3 }}
                          className="bg-surface/80 backdrop-blur-xl border border-accent-pink/30 p-4 rounded-sm shadow-2xl relative overflow-hidden"
                        >
                          {/* Duration Progress Bar */}
                          <div className="absolute top-0 left-0 w-full h-[1px] bg-white/5">
                            <motion.div 
                              initial={{ width: "100%" }}
                              animate={{ width: "0%" }}
                              transition={{ duration: 10, ease: "linear" }}
                              className="h-full bg-accent-pink"
                            />
                          </div>

                          <div className="flex items-start gap-4">
                            <div className="p-2 bg-accent-pink/10 rounded-sm border border-accent-pink/20">
                              <AlertTriangle className="text-accent-pink" size={18} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[8px] font-mono text-accent-pink uppercase tracking-[3px] animate-pulse">Event Alert</span>
                                <div className="h-[1px] flex-1 bg-accent-pink/20" />
                              </div>
                              <h3 className="text-[11px] font-mono font-bold text-text-main uppercase tracking-widest">{activeAlert.name}</h3>
                              <p className="text-[10px] font-mono text-text-dim leading-relaxed italic mt-2 opacity-80">
                                "{activeAlert.description}"
                              </p>
                            </div>
                            <button 
                              onClick={() => setActiveAlert(null)}
                              className="text-text-dim hover:text-accent-pink transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </div>
                          
                          <div className="mt-4 flex items-center justify-between text-[8px] font-mono text-text-dim uppercase tracking-widest bg-black/20 p-2 rounded-sm">
                            <div className="flex items-center gap-1">
                              <span className="text-accent-pink">Intensity:</span>
                              <span className="text-text-main">{activeAlert.intensity.toFixed(1)}%</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-accent-pink">Sector:</span>
                              <span className="text-text-main">{activeAlert.ra.toFixed(2)}° / {activeAlert.dec.toFixed(2)}°</span>
                            </div>
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Selected Star Details (Mobile Overlay / Desktop Floating) */}
                  <AnimatePresence>
                    {selectedStar && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="absolute top-24 right-6 w-[280px] z-20 hidden lg:block"
                      >
                        <div className="card-themed bg-surface/90 backdrop-blur-md border-accent-cyan/30">
                          <div className="flex items-center justify-between mb-4">
                            <span className="section-tag mb-0">Star Details</span>
                            <button onClick={() => setSelectedStar(null)}><X size={14} className="text-text-dim hover:text-text-main" /></button>
                          </div>
                          <div className="space-y-1">
                            <div className="data-row-themed"><span>Designation</span><span className="data-val-themed">{selectedStar.name}</span></div>
                            <div className="data-row-themed"><span>Distance</span><span className="data-val-themed">{selectedStar.dist.toFixed(3)} LY</span></div>
                            <div className="data-row-themed"><span>Magnitude</span><span className="data-val-themed">{selectedStar.mag.toFixed(2)}</span></div>
                            <div className="data-row-themed"><span>Coordinates</span><span className="data-val-themed">{selectedStar.ra.toFixed(2)}h / {selectedStar.dec.toFixed(2)}°</span></div>
                          </div>
                          <button 
                            onClick={handleSaveDiscovery}
                            disabled={!user || savedDiscoveries.includes(selectedStar.id) || isSaving}
                            className={cn(
                              "w-full mt-4 py-2 rounded-sm border flex items-center justify-center gap-2 text-[10px] font-mono uppercase tracking-widest transition-all",
                              savedDiscoveries.includes(selectedStar.id) 
                                ? "border-green-500/50 bg-green-500/10 text-green-400"
                                : "border-accent-cyan/30 bg-accent-cyan/5 text-accent-cyan hover:bg-accent-cyan/20 disabled:opacity-30"
                            )}
                          >
                            {isSaving ? <Binary size={12} className="animate-spin" /> : savedDiscoveries.includes(selectedStar.id) ? <BookmarkCheck size={12} /> : <Bookmark size={12} />}
                            <span>{savedDiscoveries.includes(selectedStar.id) ? "Recorded" : "Save Discovery"}</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Bottom Metrics Bar */}
                <div className="p-4 border-t border-border bg-surface/50 hidden lg:block shrink-0">
                  <QuantumMetrics evolution={evolution} />
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="research"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 p-6 lg:p-12 overflow-y-auto bg-bg flex flex-col gap-8"
              >
                <div className="max-w-4xl mx-auto w-full space-y-12">
                  <div className="text-center space-y-4">
                    <h2 className="text-3xl lg:text-4xl font-serif italic font-normal tracking-[4px] text-accent-pink">Laboratório de Pesquisa</h2>
                    <p className="text-[10px] font-mono text-text-dim uppercase tracking-[4px]">Neural Synthesis & Collaborative Exploration</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6 flex flex-col h-full">
                      <div className="bg-surface/50 border border-border p-6 rounded-sm space-y-6 flex-1 flex flex-col relative overflow-hidden group">
                        <div className="flex items-center justify-between relative z-10">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-500/10 rounded-sm border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                              <Sparkles className="text-green-400" size={24} />
                            </div>
                            <div>
                              <h3 className="text-sm font-mono text-text-main uppercase tracking-widest font-bold">LUNA-Q Super-Intelligence</h3>
                              <p className="text-[10px] font-mono text-text-dim uppercase tracking-tighter opacity-70">Neural Link Active | AGI Alignment: {((evolution.totalInteractions * 0.12)).toFixed(1)}%</p>
                            </div>
                          </div>
                          <div className="flex gap-1.5 translate-y-[-10px]">
                            {['logos', 'pathos', 'luna'].map(p => (
                              <div key={p} className={cn(
                                "w-1.5 h-1.5 rounded-full ring-1 ring-white/10",
                                p === 'logos' ? "bg-accent-cyan" : p === 'pathos' ? "bg-accent-pink" : "bg-green-400"
                              )} />
                            ))}
                          </div>
                        </div>

                        <div className="relative flex-1">
                          {/* Research Voice Frequency Listening Waveform Overlay */}
                          <AnimatePresence>
                            {isListeningResearch && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="p-3 bg-accent-pink/15 border border-accent-pink/40 rounded-sm flex items-center justify-between overflow-hidden mb-3"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-pink opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent-pink"></span>
                                  </span>
                                  <span className="text-[10px] font-mono text-accent-pink font-bold uppercase tracking-widest animate-pulse">
                                    Astraeus Listening // Speech Ingress Active
                                  </span>
                                  {isCommandMode && (
                                    <span className="text-[7px] font-mono bg-accent-pink/25 border border-accent-pink/50 text-accent-pink px-1.5 py-0.5 rounded uppercase tracking-widest">
                                      CMD MODE
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-end gap-0.5 h-4 px-2">
                                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
                                    <motion.div
                                      key={i}
                                      animate={{ height: ['20%', `${Math.min(100, Math.random() * 80 + 20)}%`, '20%'] }}
                                      transition={{ repeat: Infinity, duration: 0.35 + (i % 5) * 0.08 }}
                                      className="w-1 bg-accent-pink rounded-t-[1px]"
                                    />
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <textarea 
                            value={researchQuery}
                            onChange={(e) => setResearchQuery(e.target.value)}
                            placeholder={isListeningResearch ? "Astraeus ouvindo seu comando de pesquisa..." : "Descreva sua sequência de pesquisa ou hipótese neural..."}
                            className={cn(
                              "w-full h-full min-h-[220px] bg-bg/50 border border-border rounded-sm p-5 text-[13px] font-mono text-text-main focus:outline-none focus:border-accent-pink/50 transition-all resize-none shadow-inner leading-relaxed",
                              isListeningResearch && "border-accent-pink ring-1 ring-accent-pink/50"
                            )}
                          />
                          
                          <AnimatePresence>
                            {isResearching && (
                              <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-bg/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 space-y-8 z-20"
                              >
                                <div className="relative">
                                  <motion.div 
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                                    className="w-32 h-32 border border-dashed border-accent-pink/30 rounded-full"
                                  />
                                  <motion.div 
                                    animate={{ rotate: -360 }}
                                    transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
                                    className="absolute inset-4 border border-dotted border-accent-cyan/20 rounded-full"
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <FlaskConical className="text-accent-pink animate-pulse" size={40} />
                                  </div>
                                </div>
                                <div className="text-center space-y-3">
                                  <span className="text-xs font-mono text-text-main uppercase tracking-[6px] font-black">Sintetizando Lab</span>
                                  <p className="text-[8px] font-mono text-text-dim uppercase tracking-[2px] max-w-[240px] leading-relaxed opacity-60">
                                    Mapeando manifolds semânticos e analisando fluxos estelares NASA...
                                  </p>
                                </div>
                                <div className="w-full max-w-xs h-1 bg-white/5 rounded-full overflow-hidden">
                                  <motion.div 
                                    animate={{ width: `${researchProgress}%` }}
                                    className="h-full bg-gradient-to-r from-accent-pink via-purple-500 to-accent-cyan"
                                  />
                                </div>
                                <div className="flex items-center gap-4 text-[9px] font-mono tracking-widest uppercase">
                                  <span className="text-accent-pink">{researchProgress.toFixed(0)}%</span>
                                  <div className="w-1 h-1 rounded-full bg-text-dim/30" />
                                  <span className="text-text-dim">Archiving Neural Sequence</span>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <div className="absolute bottom-4 right-4 flex gap-2">
                            {lastResearchResult && !isResearching && (
                              <button 
                                onClick={handleSaveResearch}
                                className="p-2.5 bg-green-500/10 border border-green-500/30 rounded-sm text-green-400 hover:bg-green-500/20 transition-all shadow-lg"
                                title="Arquivar Relatório"
                              >
                                <BookmarkCheck size={16} />
                              </button>
                            )}
                            <button 
                              onClick={toggleVoiceResearch}
                              className={cn(
                                "p-2.5 border rounded-sm transition-all shadow-lg",
                                isListeningResearch ? "bg-accent-pink/20 border-accent-pink text-accent-pink animate-pulse" : "bg-bg border-border text-text-dim hover:text-text-main hover:border-text-dim"
                              )}
                              title="Comando de Voz"
                            >
                              <Radio size={16} />
                            </button>
                            <button 
                              onClick={handleResearch}
                              disabled={isResearching || !researchQuery.trim()}
                              className="px-8 py-2.5 bg-accent-pink/10 border border-accent-pink/40 rounded-sm text-[11px] font-mono uppercase tracking-[2px] hover:bg-accent-pink/20 transition-all disabled:opacity-50 flex items-center gap-2 shadow-2xl group-hover:border-accent-pink/60"
                            >
                              {isResearching ? <Binary size={16} className="animate-spin" /> : <Terminal size={16} />}
                              <span className="font-bold">{isResearching ? "PROCESSANDO..." : "INICIAR ANÁLISE"}</span>
                            </button>
                          </div>
                        </div>

                        <AnimatePresence>
                          {isResearching && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              className="flex items-center justify-center gap-4 py-3 bg-accent-pink/5 border-t border-accent-pink/10"
                            >
                              <div className="flex gap-1.5">
                                {[0, 1, 2].map((i) => (
                                  <motion.div
                                    key={i}
                                    animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                                    transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                                    className="w-1.5 h-1.5 rounded-full bg-accent-pink shadow-[0_0_8px_rgba(247,37,133,0.5)]"
                                  />
                                ))}
                              </div>
                              <span className="text-[10px] font-mono text-accent-pink uppercase tracking-[5px] font-black animate-pulse">Sintetizando...</span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 bg-surface/30 border border-border rounded-sm text-center space-y-2">
                          <Binary size={16} className="mx-auto text-accent-cyan" />
                          <span className="text-[9px] font-mono uppercase block">Logos</span>
                        </div>
                        <div className="p-4 bg-surface/30 border border-border rounded-sm text-center space-y-2">
                          <Brain size={16} className="mx-auto text-accent-pink" />
                          <span className="text-[9px] font-mono uppercase block">Pathos</span>
                        </div>
                        <div className="p-4 bg-surface/30 border border-border rounded-sm text-center space-y-2">
                          <Sparkles size={16} className="mx-auto text-green-400" />
                          <span className="text-[9px] font-mono uppercase block">Luna</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <span className="section-tag">Research Methodology</span>
                      <div className="space-y-4">
                        {[
                          { title: "Data Reduction", desc: "NASA spectrographic analysis and noise filtering.", color: "text-accent-cyan" },
                          { title: "Semantic Mapping", desc: "Context engineering via multi-dimensional manifolds.", color: "text-accent-pink" },
                          { title: "Recursive Synthesis", desc: "LUNA-driven collaborative refinement loops.", color: "text-green-400" }
                        ].map((item, i) => (
                          <div key={i} className="flex gap-4 p-4 border border-border hover:border-white/20 transition-colors rounded-sm">
                            <div className={cn("text-xs font-mono font-bold", item.color)}>0{i+1}</div>
                            <div>
                              <h4 className="text-[11px] font-mono uppercase text-text-main">{item.title}</h4>
                              <p className="text-[10px] font-mono text-text-dim mt-1">{item.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Persistent Voice Command Log Section */}
                  <VoiceCommandLog 
                    logs={voiceCommandLogs}
                    isCommandMode={isCommandMode}
                    onToggleCommandMode={() => setIsCommandMode(prev => !prev)}
                    onRetriggerCommand={handleRetriggerCommand}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Sidebar: AI Psyche */}
        <aside className="hidden xl:flex w-[320px] border-l border-border bg-bg flex-col shrink-0 overflow-hidden">
          <div className="flex-1 flex flex-col min-h-0">
            <div className="p-4 border-b border-border bg-surface/30 flex items-center justify-between">
              <span className="section-tag mb-0">Neural Interface</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent-cyan animate-pulse" />
                <span className="text-[9px] font-mono text-accent-cyan uppercase">Online</span>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <AIPsyche 
                messages={aiMessages} 
                onMessagesChange={setAiMessages} 
                isEventActive={!!activeAlert} 
                onEvolutionUpdate={(update) => setEvolution(prev => ({ ...prev, ...update }))}
                context={{ selectedStar, metrics: evolution, searchKeywords, activeTab, recentActions }}
                isCommandMode={isCommandMode}
                onToggleCommandMode={() => setIsCommandMode(prev => !prev)}
                onNavigate={(tab) => setActiveTab(tab)}
                onToggleSubComputer={() => setIsSubComputerOpen(prev => !prev)}
                onStartResearch={(query) => {
                  setActiveTab('research');
                  setResearchQuery(query);
                  handleResearchWithQuery(query);
                }}
                onSaveDiscovery={handleSaveDiscovery}
                onLogVoiceCommand={logVoiceCommand}
                activeFace={aiPsycheFace}
                onFaceChange={setAiPsycheFace}
              />
            </div>
          </div>
        </aside>
      </main>

      {/* --- Sub-Computer Panel (Floating) --- */}
      <button 
        onClick={() => { setIsSubComputerOpen(!isSubComputerOpen); pushAction(isSubComputerOpen ? "Closed Sub-Computer" : "Opened Sub-Computer"); }}
        className="fixed right-0 top-1/2 -translate-y-1/2 bg-surface border border-border p-2 rounded-l-sm hover:bg-border transition-all z-50 shadow-xl"
      >
        {isSubComputerOpen ? <ChevronRight size={20} className="text-accent-cyan" /> : <ChevronLeft size={20} className="text-accent-cyan" />}
      </button>

      <AnimatePresence>
        {isSubComputerOpen && (
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="fixed right-0 top-0 h-full w-80 bg-surface border-l border-border z-50 p-6 flex flex-col gap-6 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <Binary className="text-accent-cyan" size={20} />
                <h2 className="text-sm font-mono uppercase tracking-widest">Sub-Computer</h2>
              </div>
              <button onClick={() => setIsSubComputerOpen(false)}><X size={18} className="text-text-dim hover:text-text-main" /></button>
            </div>

            <div className="flex-1 space-y-8 overflow-y-auto pr-2 scrollbar-hide">
              <EvolutionDisplay metrics={evolution} />
              <TheoreticalArchive />
              
              <section className="space-y-3">
                <BlackzoneDiagnostic />
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-mono text-text-dim uppercase tracking-widest">
                  <ActivityIcon size={12} className="text-accent-gold" />
                  <span>Quantum Simulations</span>
                </div>
                <div className="bg-bg p-4 rounded border border-border space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-[9px] font-mono uppercase">
                      <span>P=NP Solver</span>
                      <span className="text-accent-cyan">92%</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <motion.div animate={{ width: '92%' }} className="h-full bg-accent-cyan" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[9px] font-mono uppercase">
                      <span>Entropy Reduction</span>
                      <span className="text-accent-pink">74%</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <motion.div animate={{ width: '74%' }} className="h-full bg-accent-pink" />
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* --- Footer --- */}
      <footer className="h-10 border-t border-border flex items-center justify-between px-6 text-[9px] font-mono bg-surface z-40 shrink-0">
        <div className="text-text-dim hidden sm:block">CONTEXT_ENGINEERING_V4.5 // NEURAL_SYNTHESIS_ACTIVE</div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <span className="uppercase tracking-widest text-text-dim">Secure Enclave Active</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse" />
            <span className="uppercase tracking-widest text-text-main">Neural State: 113.2B Mapped</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
