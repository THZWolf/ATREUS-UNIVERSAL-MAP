import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bookmark, 
  BookmarkCheck, 
  Star as StarIcon, 
  Navigation, 
  Trash2, 
  Search, 
  Sparkles, 
  Compass, 
  Orbit, 
  ArrowUpDown, 
  ExternalLink, 
  Edit3, 
  Check, 
  X, 
  Copy, 
  AlertCircle 
} from 'lucide-react';
import { Star, BookmarkedStar } from '../types';
import { cn } from '../lib/utils';

interface Props {
  bookmarks: BookmarkedStar[];
  selectedStar: Star | null;
  onNavigateToStar: (star: Star) => void;
  onRemoveBookmark: (starId: string) => void;
  onUpdateBookmarkNote?: (starId: string, notes: string) => void;
  onClearAllBookmarks?: () => void;
  onStartResearch?: (query: string) => void;
  onAddSampleStars?: () => void;
  onClose?: () => void;
}

type SortOption = 'recent' | 'distance-asc' | 'distance-desc' | 'magnitude-asc' | 'name-asc';

export const MyBookmarksPanel: React.FC<Props> = ({
  bookmarks,
  selectedStar,
  onNavigateToStar,
  onRemoveBookmark,
  onUpdateBookmarkNote,
  onClearAllBookmarks,
  onStartResearch,
  onAddSampleStars,
  onClose
}) => {
  const [searchFilter, setSearchFilter] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [navigatedId, setNavigatedId] = useState<string | null>(null);

  // Spectral type color helper
  const getSpectralColor = (type: string) => {
    const t = type.toUpperCase();
    if (t.startsWith('O') || t.startsWith('B')) return 'text-accent-cyan border-accent-cyan/30 bg-accent-cyan/10';
    if (t.startsWith('A')) return 'text-blue-200 border-blue-300/30 bg-blue-500/10';
    if (t.startsWith('F')) return 'text-yellow-100 border-yellow-200/30 bg-yellow-500/10';
    if (t.startsWith('G')) return 'text-accent-gold border-accent-gold/30 bg-accent-gold/10';
    if (t.startsWith('K')) return 'text-orange-400 border-orange-400/30 bg-orange-500/10';
    if (t.startsWith('M')) return 'text-accent-pink border-accent-pink/30 bg-accent-pink/10';
    return 'text-text-main border-border bg-surface';
  };

  // Filter and sort bookmarks
  const processedBookmarks = useMemo(() => {
    let result = [...bookmarks];

    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      result = result.filter(b => 
        b.star.name.toLowerCase().includes(q) ||
        b.star.type.toLowerCase().includes(q) ||
        (b.notes && b.notes.toLowerCase().includes(q))
      );
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'distance-asc':
          return a.star.dist - b.star.dist;
        case 'distance-desc':
          return b.star.dist - a.star.dist;
        case 'magnitude-asc':
          return a.star.mag - b.star.mag; // Brighter first
        case 'name-asc':
          return a.star.name.localeCompare(b.star.name);
        case 'recent':
        default:
          return b.bookmarkedAt - a.bookmarkedAt;
      }
    });

    return result;
  }, [bookmarks, searchFilter, sortBy]);

  const handleStartEditNote = (b: BookmarkedStar) => {
    setEditingNoteId(b.starId);
    setNoteText(b.notes || '');
  };

  const handleSaveNote = (starId: string) => {
    if (onUpdateBookmarkNote) {
      onUpdateBookmarkNote(starId, noteText.trim());
    }
    setEditingNoteId(null);
    setNoteText('');
  };

  const handleNavigate = (star: Star) => {
    setNavigatedId(star.id);
    onNavigateToStar(star);
    setTimeout(() => setNavigatedId(null), 2500);
  };

  const handleCopyCoordinates = () => {
    if (bookmarks.length === 0) return;
    const text = bookmarks.map(b => 
      `${b.star.name}: RA ${b.star.ra.toFixed(2)}°, Dec ${b.star.dec.toFixed(2)}°, Dist ${b.star.dist.toFixed(2)} LY, Mag ${b.star.mag.toFixed(2)} [${b.star.type}]`
    ).join('\n');
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-accent-gold/15 border border-accent-gold/40 rounded-sm text-accent-gold shadow-[0_0_10px_rgba(251,176,59,0.25)]">
            <BookmarkCheck size={14} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-mono uppercase tracking-[2px] text-accent-gold font-bold">
                My Bookmarks
              </h3>
              <span className="px-1.5 py-0.2 bg-accent-gold/20 text-accent-gold border border-accent-gold/30 text-[9px] font-mono rounded-xs">
                {bookmarks.length}
              </span>
            </div>
            <p className="text-[9px] font-mono text-text-dim uppercase tracking-wider">
              Favorite Stellar Targets & Fast Lock-On
            </p>
          </div>
        </div>

        {bookmarks.length > 0 && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopyCoordinates}
              className="p-1.5 bg-surface hover:bg-border/60 border border-border rounded-sm text-text-dim hover:text-accent-gold transition-colors"
              title="Copy Coordinates List"
            >
              {copySuccess ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
            </button>
            {onClearAllBookmarks && (
              <button
                onClick={() => {
                  if (window.confirm("Remove all bookmarked stars from your favorite archive?")) {
                    onClearAllBookmarks();
                  }
                }}
                className="p-1.5 bg-surface hover:bg-red-500/20 border border-border hover:border-red-500/40 rounded-sm text-text-dim hover:text-red-400 transition-colors"
                title="Clear all bookmarks"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Filter and Sort Toolbar */}
      {bookmarks.length > 0 && (
        <div className="space-y-2">
          <div className="relative">
            <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-dim" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filter by name, type, or notes..."
              className="w-full bg-bg border border-border rounded-sm py-1.5 pl-8 pr-3 text-[10px] font-mono text-text-main focus:outline-none focus:border-accent-gold/50 transition-all placeholder:text-text-dim/40"
            />
          </div>

          <div className="flex items-center justify-between text-[9px] font-mono text-text-dim">
            <span className="flex items-center gap-1">
              <ArrowUpDown size={10} className="text-accent-gold" />
              <span>Sort:</span>
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-bg border border-border rounded-sm px-2 py-0.5 text-[9px] font-mono text-text-main focus:outline-none focus:border-accent-gold/50 cursor-pointer"
            >
              <option value="recent">Recently Added</option>
              <option value="distance-asc">Closest First</option>
              <option value="distance-desc">Farthest First</option>
              <option value="magnitude-asc">Brightest First</option>
              <option value="name-asc">Name (A-Z)</option>
            </select>
          </div>
        </div>
      )}

      {/* Bookmarks List */}
      <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-border">
        {processedBookmarks.length > 0 ? (
          processedBookmarks.map((b) => {
            const isSelected = selectedStar?.id === b.star.id;
            const isJustNavigated = navigatedId === b.star.id;
            const isEditingThisNote = editingNoteId === b.starId;

            return (
              <motion.div
                key={b.starId}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={cn(
                  "p-3 rounded-sm border transition-all relative group flex flex-col gap-2",
                  isSelected
                    ? "bg-accent-gold/10 border-accent-gold shadow-[0_0_15px_rgba(251,176,59,0.2)]"
                    : "bg-bg/80 border-border hover:border-accent-gold/40 hover:bg-surface/50"
                )}
              >
                {/* Top Row: Name and Badges */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <StarIcon size={11} className={cn("shrink-0", isSelected ? "text-accent-gold fill-accent-gold" : "text-accent-gold")} />
                      <h4 className="text-[11px] font-mono font-bold text-text-main uppercase tracking-wider truncate">
                        {b.star.name}
                      </h4>
                      <span className={cn("px-1.5 py-0.2 text-[8px] font-mono uppercase tracking-widest rounded-xs border", getSpectralColor(b.star.type))}>
                        {b.star.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[9px] font-mono text-text-dim mt-1">
                      <span>{b.star.dist.toFixed(2)} LY</span>
                      <span>•</span>
                      <span>Mag {b.star.mag.toFixed(2)}</span>
                      <span>•</span>
                      <span>RA {b.star.ra.toFixed(1)}°</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onRemoveBookmark(b.starId)}
                    className="p-1 text-text-dim hover:text-red-400 opacity-60 hover:opacity-100 transition-opacity"
                    title="Remove from bookmarks"
                  >
                    <X size={13} />
                  </button>
                </div>

                {/* Notes Section */}
                {isEditingThisNote ? (
                  <div className="space-y-1.5 pt-1 border-t border-border/50">
                    <textarea
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Add research log or bookmark note..."
                      rows={2}
                      className="w-full bg-surface border border-accent-gold/40 rounded-xs p-1.5 text-[9px] font-mono text-text-main focus:outline-none"
                    />
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => setEditingNoteId(null)}
                        className="px-2 py-0.5 text-[8px] font-mono text-text-dim hover:text-text-main"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveNote(b.starId)}
                        className="px-2.5 py-0.5 bg-accent-gold/20 border border-accent-gold/40 text-accent-gold text-[8px] font-mono uppercase rounded-xs"
                      >
                        Save Note
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between group/note text-[9px] font-mono">
                    {b.notes ? (
                      <p className="text-text-dim italic line-clamp-2 text-[9px] border-l-2 border-accent-gold/40 pl-2">
                        "{b.notes}"
                      </p>
                    ) : (
                      <span className="text-text-dim/40 text-[8px] italic">No mission notes attached</span>
                    )}
                    {onUpdateBookmarkNote && (
                      <button
                        onClick={() => handleStartEditNote(b)}
                        className="p-1 text-text-dim/60 hover:text-accent-gold transition-colors shrink-0"
                        title={b.notes ? "Edit note" : "Add note"}
                      >
                        <Edit3 size={11} />
                      </button>
                    )}
                  </div>
                )}

                {/* Bottom Action Bar */}
                <div className="flex items-center justify-between pt-1 border-t border-border/40 gap-2">
                  <span className="text-[8px] font-mono text-text-dim">
                    {new Date(b.bookmarkedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {onStartResearch && (
                      <button
                        onClick={() => {
                          const query = `Comprehensive astrophysical analysis of ${b.star.name} (${b.star.type}, ${b.star.dist.toFixed(2)} LY away, magnitude ${b.star.mag.toFixed(2)}).`;
                          onStartResearch(query);
                        }}
                        className="px-2 py-1 bg-surface hover:bg-accent-pink/15 border border-border hover:border-accent-pink/40 text-[8px] font-mono text-text-dim hover:text-accent-pink uppercase rounded-xs transition-colors flex items-center gap-1"
                        title="Analyze star in Research Lab"
                      >
                        <Sparkles size={9} />
                        <span className="hidden sm:inline">Research</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleNavigate(b.star)}
                      className={cn(
                        "px-2.5 py-1 rounded-xs border text-[8px] font-mono uppercase tracking-wider flex items-center gap-1 font-bold transition-all",
                        isJustNavigated
                          ? "bg-green-500/20 border-green-500 text-green-400"
                          : isSelected
                            ? "bg-accent-gold/25 border-accent-gold text-accent-gold"
                            : "bg-accent-cyan/10 hover:bg-accent-cyan/20 border-accent-cyan/30 text-accent-cyan"
                      )}
                      title="Lock camera on star in Stellar Map"
                    >
                      <Navigation size={9} className={isJustNavigated ? "animate-spin" : ""} />
                      <span>{isJustNavigated ? "Locked" : isSelected ? "In Focus" : "Navigate"}</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          /* Empty State */
          <div className="p-6 bg-surface/30 border border-dashed border-border/80 rounded-sm text-center space-y-4">
            <div className="w-10 h-10 mx-auto rounded-full bg-accent-gold/10 border border-accent-gold/30 flex items-center justify-center text-accent-gold">
              <StarIcon size={18} />
            </div>
            <div className="space-y-1">
              <h4 className="text-[11px] font-mono uppercase tracking-wider text-text-main font-bold">
                No Bookmarked Stars Yet
              </h4>
              <p className="text-[9px] font-mono text-text-dim leading-relaxed max-w-[240px] mx-auto">
                Explore the 3D Stellar Map, select any star, and click "Bookmark Star" to save it here for instant neural navigation.
              </p>
            </div>

            {onAddSampleStars && (
              <button
                onClick={onAddSampleStars}
                className="px-3 py-1.5 bg-accent-gold/10 hover:bg-accent-gold/20 border border-accent-gold/40 text-accent-gold text-[9px] font-mono uppercase tracking-wider rounded-sm transition-all flex items-center gap-1.5 mx-auto"
              >
                <Sparkles size={11} />
                <span>Quick-Add Featured Stars</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
