import { VoiceCommandLogEntry, AIMessage } from '../types';

export interface CommandDispatchContext {
  onNavigate: (tab: 'map' | 'research') => void;
  onToggleSubComputer: () => void;
  onStartResearch: (query: string) => void;
  onSwitchPsyche: (face: 'logos' | 'pathos' | 'luna' | 'astraeus' | 'sophia' | 'mnemosyne') => void;
  onSaveDiscovery?: () => void;
  onSpeak: (text: string, face?: 'logos' | 'pathos' | 'luna' | 'astraeus' | 'sophia' | 'mnemosyne') => void;
  onPostAssistantMessage: (msg: AIMessage) => void;
  onLogCommand: (entry: Omit<VoiceCommandLogEntry, 'id' | 'timestamp'>) => void;
  currentFace?: 'logos' | 'pathos' | 'luna' | 'astraeus' | 'sophia' | 'mnemosyne';
}

export const AVAILABLE_VOICE_COMMANDS = [
  { phrase: 'What can I do?', desc: 'List all available voice commands via synthesized voice & chat transcript', type: 'help' },
  { phrase: 'Jump to Map', desc: 'Navigate to real-time 3D Stellar Map', type: 'navigation' },
  { phrase: 'Open Research Lab', desc: 'Switch to LUNA-Q Neural Synthesis & Hypothesis Lab', type: 'navigation' },
  { phrase: 'Start research on <topic>', desc: 'Initiate automated research sequence on any cosmic topic', type: 'research' },
  { phrase: 'Open Sub-Computer', desc: 'Toggle quantum diagnostics & entropy telemetry panel', type: 'navigation' },
  { phrase: 'Switch to Logos', desc: 'Engage cold analytical, mathematical psyche', type: 'psyche' },
  { phrase: 'Switch to Pathos', desc: 'Engage philosophical, emotive cosmological psyche', type: 'psyche' },
  { phrase: 'Switch to Luna', desc: 'Engage unified LUNA-Q neural super-intelligence', type: 'psyche' },
  { phrase: 'Save discovery', desc: 'Archive currently selected star to persistent mission database', type: 'discovery' },
] as const;

export const HELP_SYNTHESIZED_SPEECH = 
  "Astraeus Voice Interface active. Available voice commands include: Say 'Jump to Map' to inspect celestial coordinates. Say 'Open Research Lab' to access neural synthesis. Say 'Start research on', followed by your topic, to initiate analysis. Say 'Switch to' Logos, Pathos, Luna, Sophia, Mnemosyne, or Astraeus to change my active psyche. And say 'Open Sub-Computer' to toggle quantum telemetry. You can also re-trigger past commands from the Research Lab command log.";

export const HELP_CHAT_TRANSCRIPT = `[VOICE COMMAND PROTOCOL ACTIVATED]
Astraeus-Prime accepts the following hands-free voice commands:

🛰️ NAVIGATION:
  • "Jump to Map" — Navigate to 3D Stellar Map & NASA coordinates
  • "Open Research Lab" — Access LUNA-Q research synthesis suite
  • "Open Sub-Computer" / "Close Sub-Computer" — Toggle quantum telemetry drawer

🔬 RESEARCH INITIATION:
  • "Start research on [topic]" — Automatically initiates deep analysis (e.g. "Start research on Dark Energy")
  • "Initiate research on [topic]" — Synthesizes manifolds & NASA stellar data

🧠 PSYCHE RE-ALIGNMENT:
  • "Switch to Logos" — Analytical & structural logic
  • "Switch to Pathos" — Emotive & cosmological reflections
  • "Switch to Luna" — LUNA-Q unified neural super-intelligence
  • "Switch to Sophia" / "Mnemosyne" / "Astraeus"

💾 MISSION PROTOCOLS:
  • "Save discovery" — Record currently selected star to database
  • "What can I do?" — Repeat this command directory

Command Mode is active: speak naturally or use the quick re-trigger buttons in the Research Lab.`;

/**
 * Parses and processes a voice transcript.
 * Returns true if a command was recognized and handled.
 */
export function handleVoiceCommand(
  rawTranscript: string,
  isCommandMode: boolean,
  context: CommandDispatchContext
): boolean {
  if (!rawTranscript || !rawTranscript.trim()) return false;

  const normalized = rawTranscript
    .toLowerCase()
    .replace(/[?!.,;:_]/g, '')
    .trim();

  const activeFace = context.currentFace || 'astraeus';

  // 1. HELP COMMAND: "What can I do?"
  // Must work whether Command Mode is enabled or not!
  if (
    normalized === 'what can i do' ||
    normalized.includes('what can i do') ||
    normalized === 'what can you do' ||
    normalized.includes('what can you do') ||
    normalized === 'help' ||
    normalized === 'voice commands' ||
    normalized === 'o que posso fazer' ||
    normalized.includes('o que posso fazer') ||
    normalized === 'quais sao os comandos' ||
    normalized === 'ajuda'
  ) {
    context.onSpeak(HELP_SYNTHESIZED_SPEECH, activeFace);
    context.onPostAssistantMessage({
      role: 'assistant',
      content: HELP_CHAT_TRANSCRIPT,
      face: activeFace
    });
    context.onLogCommand({
      command: rawTranscript.trim(),
      status: 'executed',
      actionType: 'help',
      responseFeedback: 'Voice command catalog synthesized'
    });
    return true;
  }

  // If Command Mode is NOT active, navigation and system commands are disabled
  // unless explicitly in command mode
  if (!isCommandMode) {
    return false;
  }

  // 2. NAVIGATION: Jump to Map
  if (
    normalized.includes('jump to map') ||
    normalized.includes('open map') ||
    normalized.includes('go to map') ||
    normalized.includes('show map') ||
    normalized.includes('view map') ||
    normalized === 'stellar map' ||
    normalized === 'map' ||
    normalized.includes('ir para o mapa') ||
    normalized.includes('abrir mapa') ||
    normalized === 'mapa estelar' ||
    normalized === 'mapa'
  ) {
    context.onNavigate('map');
    context.onSpeak('Navigating to Stellar Map.', activeFace);
    context.onLogCommand({
      command: rawTranscript.trim(),
      status: 'executed',
      actionType: 'navigation',
      responseFeedback: 'Switched view to Stellar Map'
    });
    return true;
  }

  // 3. NAVIGATION: Open Research Lab
  if (
    normalized.includes('open research lab') ||
    normalized.includes('jump to research lab') ||
    normalized.includes('go to research lab') ||
    normalized.includes('open research') ||
    normalized.includes('research lab') ||
    normalized === 'research' ||
    normalized.includes('abrir laboratorio') ||
    normalized.includes('ir para o laboratorio') ||
    normalized.includes('laboratorio de pesquisa') ||
    normalized === 'laboratorio' ||
    normalized === 'pesquisa'
  ) {
    context.onNavigate('research');
    context.onSpeak('Opening Research Lab.', activeFace);
    context.onLogCommand({
      command: rawTranscript.trim(),
      status: 'executed',
      actionType: 'navigation',
      responseFeedback: 'Switched view to Research Lab'
    });
    return true;
  }

  // 4. NAVIGATION: Sub-Computer
  if (
    normalized.includes('sub-computer') ||
    normalized.includes('sub computer') ||
    normalized.includes('subcomputador') ||
    normalized.includes('telemetry')
  ) {
    context.onToggleSubComputer();
    context.onSpeak('Toggling Sub-Computer quantum diagnostics.', activeFace);
    context.onLogCommand({
      command: rawTranscript.trim(),
      status: 'executed',
      actionType: 'navigation',
      responseFeedback: 'Toggled Sub-Computer telemetry panel'
    });
    return true;
  }

  // 5. RESEARCH INITIATION: "Start research on <topic>"
  const researchPrefixes = [
    'start research on ',
    'initiate research on ',
    'research on ',
    'research ',
    'iniciar pesquisa sobre ',
    'pesquisar sobre ',
    'pesquisar '
  ];

  for (const prefix of researchPrefixes) {
    if (normalized.startsWith(prefix)) {
      const topic = rawTranscript.slice(prefix.length).replace(/[?.!]/g, '').trim();
      if (topic) {
        context.onNavigate('research');
        context.onStartResearch(topic);
        context.onSpeak(`Initiating research sequence on ${topic}.`, 'luna');
        context.onLogCommand({
          command: rawTranscript.trim(),
          status: 'executed',
          actionType: 'research',
          responseFeedback: `Synthesizing neural report on: ${topic}`
        });
        return true;
      }
    }
  }

  // 6. PSYCHE SWITCHING
  const psycheMatches: Array<{ names: string[]; face: 'logos' | 'pathos' | 'luna' | 'astraeus' | 'sophia' | 'mnemosyne'; label: string }> = [
    { names: ['logos', 'switch to logos', 'mudar para logos', 'ativar logos'], face: 'logos', label: 'Logos' },
    { names: ['pathos', 'switch to pathos', 'mudar para pathos', 'ativar pathos'], face: 'pathos', label: 'Pathos' },
    { names: ['luna', 'switch to luna', 'mudar para luna', 'ativar luna'], face: 'luna', label: 'Luna' },
    { names: ['sophia', 'switch to sophia', 'mudar para sophia'], face: 'sophia', label: 'Sophia' },
    { names: ['mnemosyne', 'switch to mnemosyne', 'mudar para mnemosyne'], face: 'mnemosyne', label: 'Mnemosyne' },
    { names: ['astraeus', 'switch to astraeus', 'unified core', 'mudar para astraeus'], face: 'astraeus', label: 'Astraeus Core' }
  ];

  for (const p of psycheMatches) {
    if (p.names.some(n => normalized === n || normalized.includes(n))) {
      context.onSwitchPsyche(p.face);
      context.onSpeak(`Psyche aligned to ${p.label}.`, p.face);
      context.onLogCommand({
        command: rawTranscript.trim(),
        status: 'executed',
        actionType: 'psyche',
        responseFeedback: `Aligned neural psyche to ${p.label}`
      });
      return true;
    }
  }

  // 7. SAVE DISCOVERY
  if (
    normalized.includes('save discovery') ||
    normalized.includes('record discovery') ||
    normalized.includes('salvar descoberta')
  ) {
    if (context.onSaveDiscovery) {
      context.onSaveDiscovery();
      context.onSpeak('Recording discovery to mission database.', activeFace);
      context.onLogCommand({
        command: rawTranscript.trim(),
        status: 'executed',
        actionType: 'discovery',
        responseFeedback: 'Archived celestial discovery'
      });
      return true;
    }
  }

  return false;
}
