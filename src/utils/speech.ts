export type PsycheFace = 'logos' | 'pathos' | 'luna' | 'astraeus' | 'sophia' | 'mnemosyne';

export function speakText(
  text: string, 
  face: PsycheFace = 'logos', 
  enabled: boolean = true
): void {
  if (!enabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }

  window.speechSynthesis.cancel();
  
  // Clean text of markdown, brackets, and emojis for smooth pronunciation
  const cleanText = text
    .replace(/\[.*?\]/g, '')
    .replace(/[#*`_~]/g, '')
    .trim();

  if (!cleanText) return;

  const utterance = new SpeechSynthesisUtterance(cleanText);
  const voices = window.speechSynthesis.getVoices();

  // Try to find matching voice
  const isPortuguese = /[à-úÀ-Ú]/.test(cleanText) || cleanText.includes('não') || cleanText.includes('pesquisa');
  const langPrefix = isPortuguese ? 'pt' : 'en';

  const preferredVoice = voices.find(v => {
    if (!v.lang.startsWith(langPrefix)) return false;
    if (face === 'logos') return v.name.includes('Google') || v.name.includes('Daniel') || v.name.includes('David');
    if (face === 'pathos') return v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Luciana');
    if (face === 'luna') return v.name.includes('Female') || v.name.includes('Zira') || v.name.includes('Victoria');
    return true;
  }) || voices.find(v => v.lang.startsWith(langPrefix)) || voices[0];

  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  // Adjust pitch & rate based on psyche
  switch (face) {
    case 'logos':
      utterance.pitch = 0.85;
      utterance.rate = 1.05;
      break;
    case 'pathos':
      utterance.pitch = 1.15;
      utterance.rate = 0.9;
      break;
    case 'luna':
      utterance.pitch = 1.0;
      utterance.rate = 1.0;
      break;
    case 'sophia':
      utterance.pitch = 0.95;
      utterance.rate = 0.95;
      break;
    case 'mnemosyne':
      utterance.pitch = 0.75;
      utterance.rate = 1.1;
      break;
    case 'astraeus':
    default:
      utterance.pitch = 1.0;
      utterance.rate = 1.0;
      break;
  }

  window.speechSynthesis.speak(utterance);
}
