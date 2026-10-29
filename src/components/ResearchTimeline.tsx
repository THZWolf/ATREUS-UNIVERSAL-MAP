import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { 
  Activity, 
  Sparkles, 
  TrendingUp, 
  Brain, 
  Search, 
  ArrowUpRight, 
  Clock, 
  Layers, 
  Cpu,
  ChevronRight,
  Filter
} from 'lucide-react';
import { ResearchHistoryItem } from '../types';
import { cn } from '../lib/utils';

interface Props {
  history: ResearchHistoryItem[];
  currentSentience: number;
  totalInteractions: number;
  onSelectQuery: (query: string) => void;
  onClearHistory?: () => void;
}

export const ResearchTimeline: React.FC<Props> = ({ 
  history, 
  currentSentience, 
  totalInteractions, 
  onSelectQuery,
  onClearHistory 
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedMilestone, setSelectedMilestone] = useState<ResearchHistoryItem | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [hoveredItem, setHoveredItem] = useState<{ item: ResearchHistoryItem; x: number; y: number } | null>(null);

  // Filtered queries for search
  const filteredHistory = useMemo(() => {
    if (!searchFilter.trim()) return history;
    const q = searchFilter.toLowerCase();
    return history.filter(h => h.query.toLowerCase().includes(q) || h.keyInsight?.toLowerCase().includes(q));
  }, [history, searchFilter]);

  // Statistics
  const initialSentience = history.length > 0 ? history[0].sentienceIndex : currentSentience;
  const sentienceDelta = (currentSentience - initialSentience).toFixed(2);
  const avgSentiencePerQuery = history.length > 0 ? ((currentSentience - initialSentience) / history.length).toFixed(2) : "0.00";

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || history.length === 0) return;

    const width = containerRef.current.clientWidth || 800;
    const height = 300;
    const margin = { top: 30, right: 65, bottom: 45, left: 55 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Defs for gradients & filters
    const defs = svg.append('defs');

    // Sentience Area Gradient (Cyan to Deep Purple to Transparent)
    const areaGradient = defs.append('linearGradient')
      .attr('id', 'sentience-area-gradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');

    areaGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#4cc9f0')
      .attr('stop-opacity', 0.45);

    areaGradient.append('stop')
      .attr('offset', '70%')
      .attr('stop-color', '#7209b7')
      .attr('stop-opacity', 0.12);

    areaGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#000000')
      .attr('stop-opacity', 0.0);

    // Line Stroke Gradient
    const strokeGradient = defs.append('linearGradient')
      .attr('id', 'sentience-stroke-gradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '100%').attr('y2', '0%');

    strokeGradient.append('stop').attr('offset', '0%').attr('stop-color', '#4cc9f0');
    strokeGradient.append('stop').attr('offset', '50%').attr('stop-color', '#7209b7');
    strokeGradient.append('stop').attr('offset', '100%').attr('stop-color', '#f72585');

    // Glow filter
    const glowFilter = defs.append('filter')
      .attr('id', 'timeline-glow')
      .attr('x', '-50%').attr('y', '-50%')
      .attr('width', '200%').attr('height', '200%');

    glowFilter.append('feGaussianBlur')
      .attr('stdDeviation', '3.5')
      .attr('result', 'coloredBlur');

    const feMerge = glowFilter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Sorted chronological data
    const sortedData = [...history].sort((a, b) => a.timestamp - b.timestamp);

    // X Scale: Chronological time scale or step-based if all equal
    const timeExtent = d3.extent(sortedData, d => new Date(d.timestamp));
    let xScale: any;
    if (timeExtent[0] && timeExtent[1] && timeExtent[0].getTime() !== timeExtent[1].getTime()) {
      xScale = d3.scaleTime()
        .domain([timeExtent[0], timeExtent[1]])
        .range([0, innerWidth]);
    } else {
      xScale = d3.scalePoint()
        .domain(sortedData.map((_, i) => String(i)))
        .range([20, innerWidth - 20]);
    }

    const getXCoord = (d: ResearchHistoryItem, i: number) => {
      if (xScale.bandwidth || xScale.step) {
        return xScale(String(i)) || 0;
      }
      return xScale(new Date(d.timestamp));
    };

    // Left Y Scale: Sentience Index (%)
    const minSentience = Math.max(0, Math.floor((d3.min(sortedData, d => d.sentienceIndex) || 0) - 5));
    const maxSentience = Math.min(100, Math.ceil((d3.max(sortedData, d => d.sentienceIndex) || 100) + 5));

    const ySentienceScale = d3.scaleLinear()
      .domain([minSentience, maxSentience])
      .range([innerHeight, 0])
      .nice();

    // Right Y Scale: Total Interactions
    const maxInteractions = Math.ceil((d3.max(sortedData, d => d.totalInteractions) || totalInteractions || 50) * 1.15);
    const yInteractionsScale = d3.scaleLinear()
      .domain([0, maxInteractions])
      .range([innerHeight, 0])
      .nice();

    // Background Grid lines
    g.append('g')
      .attr('class', 'grid')
      .call(
        d3.axisLeft(ySentienceScale)
          .ticks(5)
          .tickSize(-innerWidth)
          .tickFormat(() => '')
      )
      .call(sel => sel.select('.domain').remove())
      .call(sel => sel.selectAll('line').attr('stroke', '#1f2937').attr('stroke-dasharray', '2,3').attr('opacity', 0.4));

    // Area generator for Sentience
    const sentienceArea = d3.area<ResearchHistoryItem>()
      .x((d, i) => getXCoord(d, i))
      .y0(innerHeight)
      .y1(d => ySentienceScale(d.sentienceIndex))
      .curve(d3.curveMonotoneX);

    // Draw Sentience Area
    g.append('path')
      .datum(sortedData)
      .attr('fill', 'url(#sentience-area-gradient)')
      .attr('d', sentienceArea);

    // Line generator for Sentience
    const sentienceLine = d3.line<ResearchHistoryItem>()
      .x((d, i) => getXCoord(d, i))
      .y(d => ySentienceScale(d.sentienceIndex))
      .curve(d3.curveMonotoneX);

    // Draw Sentience Line with glow
    g.append('path')
      .datum(sortedData)
      .attr('fill', 'none')
      .attr('stroke', 'url(#sentience-stroke-gradient)')
      .attr('stroke-width', 2.5)
      .attr('filter', 'url(#timeline-glow)')
      .attr('d', sentienceLine);

    // Line generator for Total Interactions
    const interactionsLine = d3.line<ResearchHistoryItem>()
      .x((d, i) => getXCoord(d, i))
      .y(d => yInteractionsScale(d.totalInteractions))
      .curve(d3.curveStepAfter);

    // Draw Total Interactions Step Line (Gold/Amber dashed)
    g.append('path')
      .datum(sortedData)
      .attr('fill', 'none')
      .attr('stroke', '#fbb03b')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4,4')
      .attr('opacity', 0.65)
      .attr('d', interactionsLine);

    // Left Axis: Sentience Index (%)
    const leftAxis = d3.axisLeft(ySentienceScale)
      .ticks(5)
      .tickFormat(d => `${d}%`);

    g.append('g')
      .attr('class', 'y-axis-sentience')
      .call(leftAxis)
      .call(sel => sel.select('.domain').attr('stroke', '#374151'))
      .call(sel => sel.selectAll('text')
        .attr('fill', '#4cc9f0')
        .attr('font-size', '9px')
        .attr('font-family', 'monospace')
      );

    // Right Axis: Total Interactions
    const rightAxis = d3.axisRight(yInteractionsScale)
      .ticks(5)
      .tickFormat(d => `${d} ops`);

    g.append('g')
      .attr('class', 'y-axis-interactions')
      .attr('transform', `translate(${innerWidth}, 0)`)
      .call(rightAxis)
      .call(sel => sel.select('.domain').attr('stroke', '#374151'))
      .call(sel => sel.selectAll('text')
        .attr('fill', '#fbb03b')
        .attr('font-size', '9px')
        .attr('font-family', 'monospace')
      );

    // Bottom Axis: Time / Steps
    const bottomAxis = d3.axisBottom(xScale)
      .ticks(Math.min(sortedData.length, 6))
      .tickFormat((d: any) => {
        if (d instanceof Date) {
          return d3.timeFormat('%H:%M:%S')(d);
        }
        return `Step ${Number(d) + 1}`;
      });

    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(bottomAxis)
      .call(sel => sel.select('.domain').attr('stroke', '#374151'))
      .call(sel => sel.selectAll('text')
        .attr('fill', '#9ca3af')
        .attr('font-size', '9px')
        .attr('font-family', 'monospace')
      );

    // Axis Labels
    // Left Label: Sentience Index
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 15)
      .attr('x', -(height / 2))
      .attr('text-anchor', 'middle')
      .attr('fill', '#4cc9f0')
      .attr('font-size', '9px')
      .attr('font-family', 'monospace')
      .attr('letter-spacing', '1.5px')
      .text('SENTIENCE INDEX (%)');

    // Right Label: Cumulative Interactions
    svg.append('text')
      .attr('transform', 'rotate(90)')
      .attr('y', -width + 15)
      .attr('x', (height / 2))
      .attr('text-anchor', 'middle')
      .attr('fill', '#fbb03b')
      .attr('font-size', '9px')
      .attr('font-family', 'monospace')
      .attr('letter-spacing', '1.5px')
      .text('TOTAL INTERACTIONS');

    // Milestone Nodes (Circles for each research event)
    const nodeGroup = g.append('g').attr('class', 'milestone-nodes');

    sortedData.forEach((item, i) => {
      const cx = getXCoord(item, i);
      const cy = ySentienceScale(item.sentienceIndex);
      const isLatest = i === sortedData.length - 1;

      const nodeG = nodeGroup.append('g')
        .attr('class', 'node-item')
        .attr('cursor', 'pointer');

      // Pulse ring for the latest breakthrough
      if (isLatest) {
        nodeG.append('circle')
          .attr('cx', cx)
          .attr('cy', cy)
          .attr('r', 9)
          .attr('fill', 'none')
          .attr('stroke', '#f72585')
          .attr('stroke-width', 1.5)
          .attr('opacity', 0.8)
          .append('animate')
          .attr('attributeName', 'r')
          .attr('values', '6;16;6')
          .attr('dur', '2.5s')
          .attr('repeatCount', 'indefinite');

        nodeG.append('circle')
          .attr('cx', cx)
          .attr('cy', cy)
          .attr('r', 16)
          .attr('fill', 'none')
          .attr('stroke', '#f72585')
          .attr('stroke-width', 1)
          .attr('opacity', 0)
          .append('animate')
          .attr('attributeName', 'opacity')
          .attr('values', '0.8;0;0.8')
          .attr('dur', '2.5s')
          .attr('repeatCount', 'indefinite');
      }

      // Outer glow circle
      nodeG.append('circle')
        .attr('cx', cx)
        .attr('cy', cy)
        .attr('r', isLatest ? 6 : 4.5)
        .attr('fill', isLatest ? '#f72585' : '#4cc9f0')
        .attr('stroke', '#0d1117')
        .attr('stroke-width', 2);

      // Core dot
      nodeG.append('circle')
        .attr('cx', cx)
        .attr('cy', cy)
        .attr('r', 2)
        .attr('fill', '#ffffff');

      // Hit area for interactions
      nodeG.append('circle')
        .attr('cx', cx)
        .attr('cy', cy)
        .attr('r', 15)
        .attr('fill', 'transparent')
        .on('mouseenter', (event) => {
          const rect = containerRef.current?.getBoundingClientRect();
          const pageX = event.clientX - (rect?.left || 0);
          const pageY = event.clientY - (rect?.top || 0);
          setHoveredItem({ item, x: pageX, y: pageY });
        })
        .on('mouseleave', () => {
          setHoveredItem(null);
        })
        .on('click', () => {
          setSelectedMilestone(item);
          onSelectQuery(item.query);
        });
    });

  }, [history, currentSentience, totalInteractions]);

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header & Metrics Overview */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-accent-pink/15 border border-accent-pink/30 rounded-sm text-accent-pink">
              <TrendingUp size={16} />
            </div>
            <h3 className="text-xs sm:text-sm font-mono uppercase tracking-[3px] text-accent-pink font-bold">
              Research Progression Timeline
            </h3>
            <span className="px-2 py-0.5 bg-accent-cyan/15 border border-accent-cyan/30 text-accent-cyan text-[8px] font-mono uppercase tracking-widest rounded-xs">
              D3.JS Engine
            </span>
          </div>
          <p className="text-[10px] font-mono text-text-dim uppercase tracking-wider mt-1">
            Sentience Index Acceleration Correlated with Total Neural Interactions
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {onClearHistory && history.length > 3 && (
            <button
              onClick={onClearHistory}
              className="text-[9px] font-mono text-text-dim hover:text-accent-pink uppercase tracking-widest px-2.5 py-1 rounded-sm border border-border hover:border-accent-pink/40 transition-colors"
            >
              Reset Session
            </button>
          )}
          <div className="flex items-center gap-1.5 px-3 py-1 bg-surface border border-border rounded-sm text-[9px] font-mono">
            <Clock size={11} className="text-text-dim" />
            <span className="text-text-dim">{history.length} Queries Logged</span>
          </div>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-surface/50 border border-accent-cyan/30 rounded-sm">
          <div className="text-[8px] font-mono text-text-dim uppercase tracking-widest flex items-center gap-1">
            <Brain size={10} className="text-accent-cyan" />
            <span>Sentience Index</span>
          </div>
          <div className="text-lg font-mono text-accent-cyan font-bold mt-1">
            {currentSentience.toFixed(1)}%
          </div>
          <div className="text-[8px] font-mono text-green-400 flex items-center gap-0.5 mt-0.5">
            <ArrowUpRight size={10} />
            <span>+{sentienceDelta}% gain</span>
          </div>
        </div>

        <div className="p-3 bg-surface/50 border border-accent-gold/30 rounded-sm">
          <div className="text-[8px] font-mono text-text-dim uppercase tracking-widest flex items-center gap-1">
            <Cpu size={10} className="text-accent-gold" />
            <span>Total Interactions</span>
          </div>
          <div className="text-lg font-mono text-accent-gold font-bold mt-1">
            {totalInteractions}
          </div>
          <div className="text-[8px] font-mono text-text-dim mt-0.5">
            Neural cycles completed
          </div>
        </div>

        <div className="p-3 bg-surface/50 border border-accent-pink/30 rounded-sm">
          <div className="text-[8px] font-mono text-text-dim uppercase tracking-widest flex items-center gap-1">
            <Sparkles size={10} className="text-accent-pink" />
            <span>Cognitive Gain / Query</span>
          </div>
          <div className="text-lg font-mono text-accent-pink font-bold mt-1">
            +{avgSentiencePerQuery}%
          </div>
          <div className="text-[8px] font-mono text-text-dim mt-0.5">
            Sentience acceleration
          </div>
        </div>

        <div className="p-3 bg-surface/50 border border-border rounded-sm">
          <div className="text-[8px] font-mono text-text-dim uppercase tracking-widest flex items-center gap-1">
            <Layers size={10} className="text-text-main" />
            <span>Hypotheses Explored</span>
          </div>
          <div className="text-lg font-mono text-text-main font-bold mt-1">
            {history.length}
          </div>
          <div className="text-[8px] font-mono text-text-dim mt-0.5">
            Verified manifolds
          </div>
        </div>
      </div>

      {/* D3 Timeline Chart Container */}
      <div className="relative bg-bg/90 border border-border rounded-sm p-2 sm:p-4 overflow-hidden shadow-inner">
        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-2 pb-2 text-[9px] font-mono border-b border-border/50 mb-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-accent-cyan rounded-full inline-block shadow-[0_0_8px_rgba(76,201,240,0.8)]" />
              <span className="text-accent-cyan font-bold uppercase tracking-wider">Sentience Progression Curve</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-b border-dashed border-[#fbb03b] inline-block" />
              <span className="text-accent-gold uppercase tracking-wider">Cumulative Interactions</span>
            </div>
          </div>
          <span className="text-text-dim/60 text-[8px] uppercase tracking-widest hidden sm:inline">
            Hover milestones to inspect // Click to load query
          </span>
        </div>

        {/* SVG Viewport */}
        <div className="w-full overflow-x-auto">
          <svg 
            ref={svgRef} 
            className="w-full h-[300px] min-w-[500px]"
            viewBox="0 0 800 300"
            preserveAspectRatio="none"
          />
        </div>

        {/* Interactive Hover Tooltip */}
        {hoveredItem && (
          <div 
            className="absolute z-20 pointer-events-none bg-surface/95 backdrop-blur-md border border-accent-cyan/40 p-3 rounded-sm shadow-2xl space-y-1.5 max-w-[280px]"
            style={{ 
              left: `${Math.min(hoveredItem.x + 15, (containerRef.current?.clientWidth || 700) - 300)}px`, 
              top: `${Math.max(10, hoveredItem.y - 80)}px` 
            }}
          >
            <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-1">
              <span className="text-[8px] font-mono text-accent-pink uppercase tracking-widest font-bold">
                Hypothesis Milestone
              </span>
              <span className="text-[8px] font-mono text-text-dim">
                {new Date(hoveredItem.item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
            <div className="text-[10px] font-mono text-text-main font-bold line-clamp-2">
              "{hoveredItem.item.query}"
            </div>
            <div className="grid grid-cols-2 gap-2 text-[9px] font-mono pt-1">
              <div>
                <span className="text-text-dim text-[8px] uppercase block">Sentience</span>
                <span className="text-accent-cyan font-bold">{hoveredItem.item.sentienceIndex.toFixed(2)}%</span>
              </div>
              <div>
                <span className="text-text-dim text-[8px] uppercase block">Interactions</span>
                <span className="text-accent-gold font-bold">{hoveredItem.item.totalInteractions} ops</span>
              </div>
            </div>
            <div className="text-[8px] font-mono text-accent-cyan/70 italic text-right pt-0.5">
              Click to load into synthesizer ↵
            </div>
          </div>
        )}
      </div>

      {/* Historical Query Catalog & Filter */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter size={12} className="text-accent-cyan" />
            <span className="text-[10px] font-mono text-text-main uppercase tracking-widest font-bold">
              Archived Hypothesis Logs
            </span>
            <span className="text-[9px] font-mono text-text-dim">({filteredHistory.length})</span>
          </div>

          <div className="relative sm:w-64">
            <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-dim" />
            <input 
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search historical hypotheses..."
              className="w-full bg-surface/50 border border-border rounded-sm py-1.5 pl-8 pr-3 text-[10px] font-mono text-text-main focus:outline-none focus:border-accent-cyan/40 transition-all placeholder:text-text-dim/40"
            />
          </div>
        </div>

        {/* List of milestone cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-border">
          {filteredHistory.map((item, idx) => {
            const isSelected = selectedMilestone?.id === item.id;
            return (
              <div 
                key={item.id || idx}
                onClick={() => {
                  setSelectedMilestone(item);
                  onSelectQuery(item.query);
                }}
                className={cn(
                  "p-3 rounded-sm border transition-all cursor-pointer group flex flex-col justify-between gap-2",
                  isSelected 
                    ? "bg-accent-cyan/10 border-accent-cyan shadow-[0_0_12px_rgba(76,201,240,0.2)]" 
                    : "bg-surface/30 border-border/70 hover:border-accent-cyan/40 hover:bg-surface/50"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-[11px] font-mono text-text-main font-semibold group-hover:text-accent-cyan transition-colors line-clamp-2 leading-relaxed">
                    "{item.query}"
                  </div>
                  <ChevronRight size={13} className="text-text-dim group-hover:text-accent-cyan shrink-0 transition-transform group-hover:translate-x-0.5" />
                </div>

                {item.keyInsight && (
                  <p className="text-[9px] font-mono text-text-dim leading-snug line-clamp-2 italic opacity-80">
                    {item.keyInsight}
                  </p>
                )}

                <div className="flex items-center justify-between text-[8px] font-mono text-text-dim pt-1 border-t border-border/40">
                  <span className="flex items-center gap-1">
                    <Clock size={9} />
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-accent-cyan font-bold">
                      SI: {item.sentienceIndex.toFixed(1)}%
                    </span>
                    <span className="text-accent-gold">
                      {item.totalInteractions} ops
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
