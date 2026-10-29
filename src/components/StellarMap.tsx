import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Star, StellarEvent } from '../types';
import { 
  Columns, 
  ArrowLeftRight, 
  X, 
  BookmarkCheck, 
  Star as StarIcon, 
  Disc, 
  Orbit 
} from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  stars: Star[];
  events: StellarEvent[];
  selectedStar: Star | null;
  comparisonStar?: Star | null;
  bookmarkedStarIds?: string[];
  onStarSelect: (star: Star) => void;
  onComparisonStarSelect?: (star: Star | null) => void;
  onToggleBookmark?: (star: Star) => void;
  onOpenBookmarks?: () => void;
  isCompareMode?: boolean;
  onToggleCompareMode?: () => void;
  onOpenComparisonModal?: () => void;
  searchKeywords?: string[];
}

const DISTANCE_TIERS = [10, 25, 50, 100, 250, 500]; // Light-Year concentric distance scales from Earth

export const StellarMap: React.FC<Props> = ({ 
  stars, 
  events, 
  selectedStar, 
  comparisonStar = null,
  bookmarkedStarIds = [],
  onStarSelect, 
  onComparisonStarSelect,
  onToggleBookmark,
  onOpenBookmarks,
  isCompareMode = false,
  onToggleCompareMode,
  onOpenComparisonModal,
  searchKeywords = [] 
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomToStarRef = useRef<((star: Star) => void) | null>(null);
  const prevSelectedStarIdRef = useRef<string | null>(null);
  const [hoveredStar, setHoveredStar] = useState<Star | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Toggle state for distance rings and orbital drift
  const [showDistanceRings, setShowDistanceRings] = useState(true);
  const [isDriftActive, setIsDriftActive] = useState(true);

  const showDistanceRingsRef = useRef(showDistanceRings);
  const isDriftActiveRef = useRef(isDriftActive);
  const driftElapsedRef = useRef(0);
  const updateDistanceRingsRef = useRef<(() => void) | null>(null);

  // Sync refs with state
  useEffect(() => {
    showDistanceRingsRef.current = showDistanceRings;
    updateDistanceRingsRef.current?.();
  }, [showDistanceRings]);

  useEffect(() => {
    isDriftActiveRef.current = isDriftActive;
  }, [isDriftActive]);

  useEffect(() => {
    if (!svgRef.current || stars.length === 0) return;

    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    svg.selectAll('*').remove();

    // Define glow filters
    const defs = svg.append('defs');
    
    // Star glow
    const filter = defs.append('filter')
      .attr('id', 'glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
    
    filter.append('feGaussianBlur')
      .attr('stdDeviation', '3')
      .attr('result', 'blur');
    
    filter.append('feComposite')
      .attr('in', 'SourceGraphic')
      .attr('in2', 'blur')
      .attr('operator', 'over');

    // Search Match glow
    const matchFilter = defs.append('filter')
      .attr('id', 'match-glow')
      .attr('x', '-100%')
      .attr('y', '-100%')
      .attr('width', '300%')
      .attr('height', '300%');
    
    matchFilter.append('feGaussianBlur')
      .attr('stdDeviation', '5')
      .attr('result', 'blur');

    // Event glow (more intense)
    const eventFilter = defs.append('filter')
      .attr('id', 'event-glow')
      .attr('x', '-100%')
      .attr('y', '-100%')
      .attr('width', '300%')
      .attr('height', '300%');
    
    eventFilter.append('feGaussianBlur')
      .attr('stdDeviation', '8')
      .attr('result', 'blur');

    // Bookmark glow (warm amber)
    const bookmarkFilter = defs.append('filter')
      .attr('id', 'bookmark-glow')
      .attr('x', '-100%')
      .attr('y', '-100%')
      .attr('width', '300%')
      .attr('height', '300%');
    
    bookmarkFilter.append('feGaussianBlur')
      .attr('stdDeviation', '4')
      .attr('result', 'blur');

    const projection = d3.geoOrthographic()
      .scale(Math.min(width, height) / 2.5)
      .translate([width / 2, height / 2])
      .clipAngle(90);

    const path = d3.geoPath(projection);

    // Background sphere
    const bgSphere = svg.append('circle')
      .attr('cx', width / 2)
      .attr('cy', height / 2)
      .attr('r', projection.scale())
      .attr('fill', '#05070a')
      .attr('stroke', '#1f2937')
      .attr('stroke-width', 1);

    // Distance Rings Layer (positioned right over background, behind stars)
    const distanceRingsGroup = svg.append('g').attr('class', 'distance-rings-layer');

    // Grid lines (Graticule)
    const graticule = d3.geoGraticule();
    svg.append('path')
      .datum(graticule())
      .attr('d', path)
      .attr('fill', 'none')
      .attr('stroke', '#1f2937')
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.3);

    // Stars & Elements Groups
    const starGroup = svg.append('g').attr('class', 'stars-layer');
    const bookmarkGroup = svg.append('g').attr('class', 'bookmarks-layer');
    const eventGroup = svg.append('g').attr('class', 'events-layer');
    const highlightGroup = svg.append('g').attr('class', 'highlight-layer');

    // Pre-calculate matches for search performance
    const matchMap = new Map(stars.map(s => [
      s.id, 
      searchKeywords.length > 0 && searchKeywords.some(k => 
        s.name.toLowerCase().includes(k.toLowerCase()) || 
        s.type.toLowerCase().includes(k.toLowerCase())
      )
    ]));

    // Distance Rings Rendering Logic
    const updateDistanceRings = () => {
      distanceRingsGroup.selectAll('*').remove();

      if (!showDistanceRingsRef.current) {
        return;
      }

      const currentScale = projection.scale();
      const cx = width / 2;
      const cy = height / 2;

      // Sol / Earth Origin Reticle at center
      const originG = distanceRingsGroup.append('g').attr('class', 'sol-origin');
      
      // Center crosshair lines
      originG.append('line')
        .attr('x1', cx - 10).attr('y1', cy).attr('x2', cx + 10).attr('y2', cy)
        .attr('stroke', '#00f0ff').attr('stroke-width', 0.8).attr('opacity', 0.5);
      originG.append('line')
        .attr('x1', cx).attr('y1', cy - 10).attr('x2', cx).attr('y2', cy + 10)
        .attr('stroke', '#00f0ff').attr('stroke-width', 0.8).attr('opacity', 0.5);
        
      originG.append('circle')
        .attr('cx', cx).attr('cy', cy).attr('r', 2.5)
        .attr('fill', '#00f0ff').attr('opacity', 0.85);

      originG.append('text')
        .attr('x', cx + 7).attr('y', cy - 7)
        .attr('fill', '#00f0ff').attr('font-size', '8px')
        .attr('font-family', 'monospace')
        .attr('font-weight', 'bold')
        .attr('letter-spacing', '1px')
        .attr('opacity', 0.75)
        .text('SOL (0 LY)');

      // Concentric Distance Rings with Light-Year tags
      const labelAngle = -Math.PI / 4; // 45 degrees top-right angle for clear label placement
      
      DISTANCE_TIERS.forEach((tier) => {
        // Square root distance scaling proportional to celestial volume
        const r = currentScale * Math.sqrt(tier / 500);

        // Only draw rings within or close to the visible celestial sphere
        if (r <= currentScale * 1.02) {
          const ringG = distanceRingsGroup.append('g').attr('class', `ring-${tier}`);

          // Concentric dashed circle
          ringG.append('circle')
            .attr('cx', cx)
            .attr('cy', cy)
            .attr('r', r)
            .attr('fill', 'none')
            .attr('stroke', '#00f0ff')
            .attr('stroke-width', tier === 100 || tier === 500 ? 0.9 : 0.65)
            .attr('stroke-dasharray', '3, 4')
            .attr('opacity', tier === 100 || tier === 500 ? 0.32 : 0.2);

          // Subtle secondary glow for major distance gates (50, 100, 500 LY)
          if (tier === 50 || tier === 100 || tier === 500) {
            ringG.append('circle')
              .attr('cx', cx)
              .attr('cy', cy)
              .attr('r', r)
              .attr('fill', 'none')
              .attr('stroke', '#4cc9f0')
              .attr('stroke-width', 2)
              .attr('opacity', 0.08);
          }

          // Distance scale label badge along the ring
          const lx = cx + r * Math.cos(labelAngle);
          const ly = cy + r * Math.sin(labelAngle);
          const labelText = `${tier} LY`;
          const badgeWidth = labelText.length * 5.5 + 8;
          
          ringG.append('rect')
            .attr('x', lx - badgeWidth / 2)
            .attr('y', ly - 6)
            .attr('width', badgeWidth)
            .attr('height', 12)
            .attr('fill', '#05070a')
            .attr('stroke', '#00f0ff')
            .attr('stroke-width', 0.5)
            .attr('rx', 2)
            .attr('opacity', 0.85);

          ringG.append('text')
            .attr('x', lx)
            .attr('y', ly + 2.5)
            .attr('text-anchor', 'middle')
            .attr('fill', '#00f0ff')
            .attr('font-size', '7.5px')
            .attr('font-family', 'monospace')
            .attr('font-weight', 'bold')
            .attr('letter-spacing', '0.5px')
            .attr('opacity', 0.9)
            .text(labelText);
        }
      });
    };

    updateDistanceRingsRef.current = updateDistanceRings;
    updateDistanceRings();

    // Rotation & Interaction
    let rotation = [0, 0];
    const initialScale = Math.min(width, height) / 2.5;
    const sensitivity = 0.25;
    let isTransitioning = false;

    const updateStars = () => {
      // Calculate star coordinates with subtle simulated orbital drift
      const starData = stars.map(s => {
        let effectiveRa = s.ra;
        let effectiveDec = s.dec;

        if (isDriftActiveRef.current) {
          // Slow-motion proper motion orbital drift inversely scaled by distance
          const properMotionSpeed = 0.25 / Math.max(2, Math.sqrt(s.dist || 40)); 
          const seed = (Math.abs(s.ra * 19.3 + s.dec * 11.7 + (s.dist || 50) * 2.3)) % 1000;
          const orbitalPeriod = 0.8 + (seed % 10) * 0.15;
          const t = driftElapsedRef.current * orbitalPeriod;

          const driftRa = Math.sin(t + seed) * properMotionSpeed;
          const driftDec = Math.cos(t * 0.8 + seed * 1.4) * (properMotionSpeed * 0.6);

          effectiveRa = (s.ra + driftRa + 360) % 360;
          effectiveDec = Math.max(-89.9, Math.min(89.9, s.dec + driftDec));
        }

        const coords = projection([effectiveRa, effectiveDec]);
        const isMatch = matchMap.get(s.id);
        const isBookmarked = bookmarkedStarIds.includes(s.id);
        return { 
          ...s, 
          effectiveRa, 
          effectiveDec, 
          coords, 
          visible: !!coords, 
          isMatch, 
          isBookmarked 
        };
      });

      const starSelection = starGroup.selectAll('circle')
        .data(starData, (d: any) => d.id);

      starSelection.enter()
        .append('circle')
        .attr('r', d => {
          if (d.isMatch) return 6;
          if (d.isBookmarked) return Math.max(2.5, 5.5 - d.mag / 3);
          return Math.max(1, 5 - d.mag / 3);
        })
        .attr('fill', d => {
          if (d.isMatch) return '#f72585';
          if (d.isBookmarked) return '#fbb03b';
          return d.mag < 2 ? '#4cc9f0' : '#e0e6ed';
        })
        .attr('filter', d => {
          if (d.isMatch) return 'url(#match-glow)';
          if (d.isBookmarked) return 'url(#bookmark-glow)';
          return null;
        })
        .attr('cursor', 'pointer')
        .on('mouseenter', (event, d) => {
          setHoveredStar(d);
          setTooltipPos({ x: event.clientX, y: event.clientY });
          d3.select(event.currentTarget).transition().duration(200).attr('r', (d.isMatch ? 8 : (d.isBookmarked ? 8 : Math.max(2, 7 - d.mag / 3))));
        })
        .on('mousemove', (event) => {
          setTooltipPos({ x: event.clientX, y: event.clientY });
        })
        .on('mouseleave', (event, d) => {
          setHoveredStar(null);
          d3.select(event.currentTarget).transition().duration(200).attr('r', d.isMatch ? 6 : (d.isBookmarked ? Math.max(2.5, 5.5 - d.mag / 3) : Math.max(1, 5 - d.mag / 3)));
        })
        .on('click', (event, d) => {
          onStarSelect(d);
          zoomToStar(d);
        })
        .merge(starSelection as any)
        .attr('cx', d => d.coords ? d.coords[0] : -100)
        .attr('cy', d => d.coords ? d.coords[1] : -100)
        .attr('opacity', d => {
          const p = projection([d.effectiveRa, d.effectiveDec]);
          if (!p) return 0;
          if (searchKeywords.length > 0) return d.isMatch ? 1 : 0.15;
          return 0.85;
        });

      starSelection.exit().remove();

      // Bookmark Rings Rendering
      const bookmarkData = starData.filter(s => s.isBookmarked);

      const bookmarkSelection = bookmarkGroup.selectAll('g')
        .data(bookmarkData, (d: any) => d.id);

      const bookmarkEnter = bookmarkSelection.enter().append('g');

      bookmarkEnter.append('circle')
        .attr('class', 'bookmark-ring')
        .attr('r', 9)
        .attr('fill', 'none')
        .attr('stroke', '#fbb03b')
        .attr('stroke-width', 1.2)
        .attr('stroke-dasharray', '2,2')
        .attr('opacity', 0.8);

      const bookmarkMerged = bookmarkEnter.merge(bookmarkSelection as any);
      bookmarkMerged.attr('transform', d => d.coords ? `translate(${d.coords[0]}, ${d.coords[1]})` : 'translate(-100, -100)')
        .attr('opacity', d => projection([d.effectiveRa, d.effectiveDec]) ? 1 : 0);

      bookmarkSelection.exit().remove();

      // Events rendering
      const eventData = events.map(e => {
        const coords = projection([e.ra, e.dec]);
        return { ...e, coords };
      });

      const eventSelection = eventGroup.selectAll('g')
        .data(eventData, (d: any) => d.id);

      const eventEnter = eventSelection.enter().append('g');

      eventEnter.append('circle')
        .attr('class', 'event-core')
        .attr('r', d => d.type === 'supernova' ? 8 : 4)
        .attr('fill', d => {
          if (d.type === 'supernova') return '#f72585';
          if (d.type === 'anomaly') return '#7209b7';
          return '#4cc9f0';
        })
        .attr('filter', 'url(#event-glow)');

      eventEnter.append('circle')
        .attr('class', 'event-ring')
        .attr('r', d => d.type === 'supernova' ? 12 : 6)
        .attr('fill', 'none')
        .attr('stroke', d => {
          if (d.type === 'supernova') return '#f72585';
          if (d.type === 'anomaly') return '#7209b7';
          return '#4cc9f0';
        })
        .attr('stroke-width', 1)
        .attr('opacity', 0.5);

      const eventMerged = eventEnter.merge(eventSelection as any);
      
      eventMerged.attr('transform', d => d.coords ? `translate(${d.coords[0]}, ${d.coords[1]})` : 'translate(-100, -100)')
        .attr('opacity', d => projection([d.ra, d.dec]) ? 1 : 0);

      // Animate rings
      eventMerged.select('.event-ring')
        .each(function(d: any) {
          d3.select(this)
            .transition()
            .duration(2000)
            .ease(d3.easeLinear)
            .attr('r', d.type === 'supernova' ? 30 : 15)
            .attr('opacity', 0)
            .on('end', function repeat() {
              d3.select(this)
                .attr('r', d.type === 'supernova' ? 12 : 6)
                .attr('opacity', 0.5)
                .transition()
                .duration(2000)
                .ease(d3.easeLinear)
                .attr('r', d.type === 'supernova' ? 30 : 15)
                .attr('opacity', 0)
                .on('end', repeat);
            });
        });

      eventSelection.exit().remove();

      // Highlight selected star
      highlightGroup.selectAll('*').remove();
      if (selectedStar) {
        const starMatch = starData.find(s => s.id === selectedStar.id);
        const coords = starMatch?.coords || projection([selectedStar.ra, selectedStar.dec]);
        if (coords) {
          const r = Math.max(1, 5 - selectedStar.mag / 3);
          
          // Pulse effect
          const pulse = highlightGroup.append('circle')
            .attr('cx', coords[0])
            .attr('cy', coords[1])
            .attr('r', r)
            .attr('fill', 'none')
            .attr('stroke', '#4cc9f0')
            .attr('stroke-width', 2)
            .attr('opacity', 0.8);

          pulse.transition()
            .duration(1500)
            .ease(d3.easeLinear)
            .attr('r', r * 4)
            .attr('opacity', 0)
            .on('end', function repeat() {
              d3.select(this)
                .attr('r', r)
                .attr('opacity', 0.8)
                .transition()
                .duration(1500)
                .ease(d3.easeLinear)
                .attr('r', r * 4)
                .attr('opacity', 0)
                .on('end', repeat);
            });

          // Static glow
          highlightGroup.append('circle')
            .attr('cx', coords[0])
            .attr('cy', coords[1])
            .attr('r', r + 2)
            .attr('fill', '#4cc9f0')
            .attr('filter', 'url(#glow)')
            .attr('opacity', 0.5);
        }
      }
    };

    updateStars();

    const zoomToStar = (star: Star) => {
      isTransitioning = true;
      const targetRotation: [number, number] = [-star.ra, -star.dec];
      const targetScale = initialScale * 2.5;

      d3.transition()
        .duration(1500)
        .ease(d3.easeCubicInOut)
        .tween('rotate-zoom', () => {
          const r = d3.interpolate(projection.rotate(), targetRotation);
          const s = d3.interpolate(projection.scale(), targetScale);
          return (t) => {
            rotation = r(t) as any;
            projection.rotate(rotation as [number, number]);
            projection.scale(s(t));
            bgSphere.attr('r', projection.scale());
            updateDistanceRings();
            updateStars();
          };
        })
        .on('end', () => {
          isTransitioning = false;
        });
    };

    zoomToStarRef.current = zoomToStar;

    const drag = d3.drag<SVGSVGElement, any>()
      .on('drag', (event) => {
        if (isTransitioning) return;
        rotation[0] += event.dx * sensitivity;
        rotation[1] -= event.dy * sensitivity;
        projection.rotate(rotation as [number, number]);
        updateStars();
      });

    svg.call(drag as any);

    const zoom = d3.zoom<SVGSVGElement, any>()
      .scaleExtent([0.5, 10])
      .on('zoom', (event) => {
        if (isTransitioning) return;
        projection.scale(initialScale * event.transform.k);
        bgSphere.attr('r', projection.scale());
        updateDistanceRings();
        updateStars();
      });

    svg.call(zoom as any);

    const timer = d3.timer((elapsed) => {
      if (!isTransitioning) {
        rotation[0] += 0.035;
        projection.rotate(rotation as [number, number]);
        if (isDriftActiveRef.current) {
          driftElapsedRef.current = elapsed * 0.0006;
        }
        updateStars();
      }
    });

    return () => {
      timer.stop();
    };
  }, [stars, events, onStarSelect, searchKeywords, selectedStar, bookmarkedStarIds]);

  // Auto-focus camera on star when selectedStar changes from outside (e.g. My Bookmarks or Search)
  useEffect(() => {
    if (selectedStar && selectedStar.id !== prevSelectedStarIdRef.current) {
      prevSelectedStarIdRef.current = selectedStar.id;
      zoomToStarRef.current?.(selectedStar);
    }
  }, [selectedStar]);

  return (
    <div className="w-full h-full bg-bg relative overflow-hidden border border-border rounded-sm group select-none">
      {/* Star Hover Tooltip */}
      {hoveredStar && (
        <div 
          className="fixed z-50 pointer-events-none bg-surface/95 backdrop-blur-md border border-accent-cyan/40 p-3 rounded-sm shadow-2xl transition-opacity duration-200"
          style={{ 
            left: `${tooltipPos.x + 15}px`, 
            top: `${tooltipPos.y + 15}px`,
          }}
        >
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-[12px] font-mono text-accent-cyan uppercase tracking-wider font-bold">{hoveredStar.name}</h4>
              {bookmarkedStarIds.includes(hoveredStar.id) && (
                <span className="flex items-center gap-1 text-[8px] font-mono text-accent-gold bg-accent-gold/15 px-1.5 py-0.2 border border-accent-gold/40 rounded-xs uppercase tracking-wider">
                  <StarIcon size={8} className="fill-accent-gold" />
                  <span>Favorite</span>
                </span>
              )}
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-[10px] font-mono text-text-dim flex justify-between gap-4">
                <span>Distance:</span>
                <span className="text-text-main font-bold">{hoveredStar.dist.toFixed(2)} LY</span>
              </p>
              <p className="text-[10px] font-mono text-text-dim flex justify-between gap-4">
                <span>Magnitude:</span>
                <span className="text-text-main">{hoveredStar.mag.toFixed(2)}</span>
              </p>
              <p className="text-[10px] font-mono text-text-dim flex justify-between gap-4">
                <span>Spectral:</span>
                <span className="text-text-main">{hoveredStar.type}</span>
              </p>
              {isDriftActive && (
                <p className="text-[9px] font-mono text-accent-pink/80 flex justify-between gap-4 pt-1 border-t border-border/40">
                  <span>Drift Rate:</span>
                  <span>{(0.25 / Math.max(2, Math.sqrt(hoveredStar.dist || 40))).toFixed(4)}°/epoch</span>
                </p>
              )}
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-border/50 flex items-center justify-between">
            <p className="text-[8px] font-mono text-accent-cyan/60 uppercase tracking-widest animate-pulse">Neural Link Ready</p>
            <span className="text-[8px] font-mono text-text-dim/70">Click to Lock-On</span>
          </div>
        </div>
      )}

      {/* Top Left Engine Title */}
      <div className="absolute top-4 left-4 z-10 space-y-1 pointer-events-none">
        <h3 className="text-[10px] font-mono uppercase tracking-[2px] text-text-dim">Stellar Mapping Engine</h3>
        <div className="flex items-center gap-2">
          <p className="text-[11px] font-mono text-text-main">
            {stars.some(s => s.isSimulated) ? "Quantum Fallback Active" : "NASA Exoplanet Archive"}
          </p>
          {stars.some(s => s.isSimulated) && (
            <span className="px-1.5 py-0.5 bg-accent-pink/20 border border-accent-pink/40 text-accent-pink text-[8px] font-mono uppercase animate-pulse">
              Simulated
            </span>
          )}
        </div>
      </div>

      {/* Top Right Quick Controls */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        {/* Toggle Distance Rings */}
        <button
          onClick={() => setShowDistanceRings(prev => !prev)}
          className={cn(
            "px-2.5 py-1.5 rounded-sm text-[9px] font-mono uppercase tracking-wider flex items-center gap-1.5 shadow-lg backdrop-blur-md transition-all cursor-pointer border",
            showDistanceRings 
              ? "bg-accent-cyan/15 border-accent-cyan text-accent-cyan shadow-[0_0_12px_rgba(0,240,255,0.25)]" 
              : "bg-surface/90 hover:bg-surface border-border text-text-dim hover:text-text-main"
          )}
          title="Toggle concentric light-year distance rings from Earth (Sol origin)"
        >
          <Disc size={12} className={cn("transition-transform", showDistanceRings ? "rotate-45" : "")} />
          <span className="font-bold">Distance Rings</span>
          <span className={cn(
            "px-1.5 py-0.2 rounded-xs text-[8px] font-bold",
            showDistanceRings ? "bg-accent-cyan/25 text-accent-cyan" : "bg-white/5 text-text-dim"
          )}>
            {showDistanceRings ? "ON" : "OFF"}
          </span>
        </button>

        {/* Toggle Orbital Drift Animation */}
        <button
          onClick={() => setIsDriftActive(prev => !prev)}
          className={cn(
            "px-2.5 py-1.5 rounded-sm text-[9px] font-mono uppercase tracking-wider flex items-center gap-1.5 shadow-lg backdrop-blur-md transition-all cursor-pointer border",
            isDriftActive 
              ? "bg-accent-pink/15 border-accent-pink text-accent-pink shadow-[0_0_12px_rgba(247,37,133,0.25)]" 
              : "bg-surface/90 hover:bg-surface border-border text-text-dim hover:text-text-main"
          )}
          title="Toggle simulated real-time orbital proper motion drift for stars"
        >
          <Orbit 
            size={12} 
            className={cn(isDriftActive ? "animate-spin" : "")} 
            style={{ animationDuration: '6s' }} 
          />
          <span className="font-bold">Orbital Drift</span>
          <span className={cn(
            "px-1.5 py-0.2 rounded-xs text-[8px] font-bold",
            isDriftActive ? "bg-accent-pink/25 text-accent-pink" : "bg-white/5 text-text-dim"
          )}>
            {isDriftActive ? "LIVE" : "PAUSED"}
          </span>
        </button>

        {/* My Bookmarks Quick Nav */}
        {onOpenBookmarks && (
          <button
            onClick={onOpenBookmarks}
            className="px-2.5 py-1.5 bg-surface/90 hover:bg-surface border border-accent-gold/40 hover:border-accent-gold text-accent-gold rounded-sm text-[9px] font-mono uppercase tracking-wider flex items-center gap-1.5 shadow-lg backdrop-blur-md transition-all group/bm cursor-pointer"
            title="Open My Bookmarks in Sub-Computer panel"
          >
            <BookmarkCheck size={12} className={cn("transition-transform group-hover/bm:scale-110", bookmarkedStarIds.length > 0 ? "fill-accent-gold" : "")} />
            <span className="font-bold">Bookmarks</span>
            <span className="px-1.5 py-0.2 bg-accent-gold/20 rounded-xs text-[8px]">
              {bookmarkedStarIds.length}
            </span>
          </button>
        )}
      </div>

      {/* Reticle Overlay */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-20">
        <div className="w-32 h-32 border border-accent-cyan rounded-full flex items-center justify-center">
          <div className="w-1 h-1 bg-accent-cyan rounded-full" />
          <div className="absolute w-full h-[1px] bg-accent-cyan/50" />
          <div className="absolute h-full w-[1px] bg-accent-cyan/50" />
        </div>
      </div>

      {/* Main Celestial SVG */}
      <svg ref={svgRef} className="w-full h-full cursor-move" />
      
      {/* Bottom Left Status Overlay */}
      <div className="absolute bottom-4 left-4 z-10 flex flex-wrap items-center gap-2 pointer-events-none">
        {showDistanceRings && (
          <div className="bg-surface/85 backdrop-blur-md border border-accent-cyan/30 px-2.5 py-1 rounded-xs flex items-center gap-1.5 shadow-md">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse" />
            <span className="text-[8px] font-mono text-accent-cyan uppercase tracking-wider">
              Distance Scale: 10 // 25 // 50 // 100 // 250 // 500 LY (Sol Origin)
            </span>
          </div>
        )}
        {isDriftActive && (
          <div className="bg-surface/85 backdrop-blur-md border border-accent-pink/30 px-2.5 py-1 rounded-xs flex items-center gap-1.5 shadow-md">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-pink animate-pulse" />
            <span className="text-[8px] font-mono text-accent-pink uppercase tracking-wider">
              Proper Motion Drift: Active (Inverse-Square Distance Modulation)
            </span>
          </div>
        )}
      </div>

      {/* Bottom Right Controls Guide */}
      <div className="absolute bottom-4 right-4 z-10 text-right pointer-events-none">
        <p className="text-[10px] font-mono text-text-dim uppercase tracking-widest">Quantum Stabilized View</p>
        <p className="text-[8px] font-mono text-text-dim/50 uppercase">DRAG TO ROTATE // SCROLL TO ZOOM</p>
      </div>
    </div>
  );
};
