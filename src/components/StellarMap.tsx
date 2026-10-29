import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Star, StellarEvent } from '../types';
import { Columns, ArrowLeftRight, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  stars: Star[];
  events: StellarEvent[];
  selectedStar: Star | null;
  comparisonStar?: Star | null;
  onStarSelect: (star: Star) => void;
  onComparisonStarSelect?: (star: Star | null) => void;
  isCompareMode?: boolean;
  onToggleCompareMode?: () => void;
  onOpenComparisonModal?: () => void;
  searchKeywords?: string[];
}

export const StellarMap: React.FC<Props> = ({ 
  stars, 
  events, 
  selectedStar, 
  comparisonStar = null,
  onStarSelect, 
  onComparisonStarSelect,
  isCompareMode = false,
  onToggleCompareMode,
  onOpenComparisonModal,
  searchKeywords = [] 
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredStar, setHoveredStar] = useState<Star | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!svgRef.current || stars.length === 0) return;

    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    svg.selectAll('*').remove();

    // Define glow filter
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

    const projection = d3.geoOrthographic()
      .scale(Math.min(width, height) / 2.5)
      .translate([width / 2, height / 2])
      .clipAngle(90);

    const path = d3.geoPath(projection);

    // Background sphere
    svg.append('circle')
      .attr('cx', width / 2)
      .attr('cy', height / 2)
      .attr('r', projection.scale())
      .attr('fill', '#05070a')
      .attr('stroke', '#1f2937')
      .attr('stroke-width', 1);

    // Grid lines (Graticule)
    const graticule = d3.geoGraticule();
    svg.append('path')
      .datum(graticule())
      .attr('d', path)
      .attr('fill', 'none')
      .attr('stroke', '#1f2937')
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.3);

    // Stars
    const starGroup = svg.append('g');
    const eventGroup = svg.append('g');
    const highlightGroup = svg.append('g');

    // Pre-calculate matches for performance
    const matchMap = new Map(stars.map(s => [
      s.id, 
      searchKeywords.length > 0 && searchKeywords.some(k => 
        s.name.toLowerCase().includes(k.toLowerCase()) || 
        s.type.toLowerCase().includes(k.toLowerCase())
      )
    ]));

    // Rotation & Interaction
    let rotation = [0, 0];
    const initialScale = Math.min(width, height) / 2.5;
    const sensitivity = 0.25;
    let isTransitioning = false;

    const updateStars = () => {
      // Stars rendering
      const starData = stars.map(s => {
        const coords = projection([s.ra, s.dec]);
        const isMatch = matchMap.get(s.id);
        return { ...s, coords, visible: !!coords, isMatch };
      });

      const starSelection = starGroup.selectAll('circle')
        .data(starData, (d: any) => d.id);

      starSelection.enter()
        .append('circle')
        .attr('r', d => (d.isMatch ? 6 : Math.max(1, 5 - d.mag / 3)))
        .attr('fill', d => d.isMatch ? '#f72585' : (d.mag < 2 ? '#4cc9f0' : '#e0e6ed'))
        .attr('filter', d => d.isMatch ? 'url(#match-glow)' : null)
        .attr('cursor', 'pointer')
        .on('mouseenter', (event, d) => {
          setHoveredStar(d);
          setTooltipPos({ x: event.clientX, y: event.clientY });
          d3.select(event.currentTarget).transition().duration(200).attr('r', (d.isMatch ? 8 : Math.max(2, 7 - d.mag / 3)));
        })
        .on('mousemove', (event) => {
          setTooltipPos({ x: event.clientX, y: event.clientY });
        })
        .on('mouseleave', (event, d) => {
          setHoveredStar(null);
          d3.select(event.currentTarget).transition().duration(200).attr('r', d.isMatch ? 6 : Math.max(1, 5 - d.mag / 3));
        })
        .on('click', (event, d) => {
          onStarSelect(d);
          zoomToStar(d);
        })
        .merge(starSelection as any)
        .attr('cx', d => d.coords ? d.coords[0] : -100)
        .attr('cy', d => d.coords ? d.coords[1] : -100)
        .attr('opacity', d => {
          const p = projection([d.ra, d.dec]);
          if (!p) return 0;
          if (searchKeywords.length > 0) return d.isMatch ? 1 : 0.15;
          return 0.8;
        });

      starSelection.exit().remove();

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
        const coords = projection([selectedStar.ra, selectedStar.dec]);
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
            updateStars();
          };
        })
        .on('end', () => {
          isTransitioning = false;
        });
    };

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
        updateStars();
      });

    svg.call(zoom as any);

    const timer = d3.timer(() => {
      if (!isTransitioning) {
        rotation[0] += 0.05;
        projection.rotate(rotation as [number, number]);
        updateStars();
      }
    });

    return () => {
      timer.stop();
    };
  }, [stars, events, onStarSelect, searchKeywords, selectedStar]);

  return (
    <div className="w-full h-full bg-bg relative overflow-hidden border border-border rounded-sm group">
      {/* Tooltip */}
      {hoveredStar && (
        <div 
          className="fixed z-50 pointer-events-none bg-surface/90 backdrop-blur-md border border-accent-cyan/30 p-3 rounded-sm shadow-2xl transition-opacity duration-200"
          style={{ 
            left: `${tooltipPos.x + 15}px`, 
            top: `${tooltipPos.y + 15}px`,
          }}
        >
          <div className="space-y-1">
            <h4 className="text-[12px] font-mono text-accent-cyan uppercase tracking-wider">{hoveredStar.name}</h4>
            <div className="flex flex-col gap-0.5">
              <p className="text-[10px] font-mono text-text-dim flex justify-between gap-4">
                <span>Distance:</span>
                <span className="text-text-main">{hoveredStar.dist.toFixed(2)} LY</span>
              </p>
              <p className="text-[10px] font-mono text-text-dim flex justify-between gap-4">
                <span>Magnitude:</span>
                <span className="text-text-main">{hoveredStar.mag.toFixed(2)}</span>
              </p>
              <p className="text-[10px] font-mono text-text-dim flex justify-between gap-4">
                <span>Spectral:</span>
                <span className="text-text-main">{hoveredStar.type}</span>
              </p>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-border/50">
            <p className="text-[8px] font-mono text-accent-cyan/50 uppercase tracking-widest animate-pulse">Neural Link Ready</p>
          </div>
        </div>
      )}
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

      {/* Reticle Overlay */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-20">
        <div className="w-32 h-32 border border-accent-cyan rounded-full flex items-center justify-center">
          <div className="w-1 h-1 bg-accent-cyan rounded-full" />
          <div className="absolute w-full h-[1px] bg-accent-cyan/50" />
          <div className="absolute h-full w-[1px] bg-accent-cyan/50" />
        </div>
      </div>

      <svg ref={svgRef} className="w-full h-full cursor-move" />
      
      <div className="absolute bottom-4 right-4 z-10 text-right pointer-events-none">
        <p className="text-[10px] font-mono text-text-dim uppercase tracking-widest">Quantum Stabilized View</p>
        <p className="text-[8px] font-mono text-text-dim/50 uppercase">DRAG TO ROTATE // SCROLL TO ZOOM</p>
      </div>
    </div>
  );
};
