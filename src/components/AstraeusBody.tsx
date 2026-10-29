import React, { useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Float, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { cn } from '../lib/utils';

const NeuralCore = ({ face, isTyping, isSpeaking }: { 
  face: 'logos' | 'pathos' | 'luna' | 'astraeus' | 'sophia' | 'mnemosyne',
  isTyping?: boolean,
  isSpeaking?: boolean
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const materialRef = useRef<any>(null);
  
  const particlePositions = useMemo(() => {
    const positions = new Float32Array(500 * 3);
    for (let i = 0; i < 500; i++) {
      const r = 1.5 + Math.random() * 0.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    return positions;
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (meshRef.current) {
      const rotationSpeed = isTyping ? 0.8 : (face === 'logos' ? 0.1 : 0.3);
      meshRef.current.rotation.x = time * rotationSpeed;
      meshRef.current.rotation.y = time * (rotationSpeed * 1.2);
    }
    if (particlesRef.current) {
      const particleSpeed = isTyping ? 0.5 : 0.1;
      particlesRef.current.rotation.y = time * particleSpeed;
      particlesRef.current.rotation.z = time * (particleSpeed * 0.5);
    }
    if (materialRef.current) {
      // Pulse emissive intensity when speaking
      if (isSpeaking) {
        materialRef.current.emissiveIntensity = 0.5 + Math.sin(time * 10) * 0.4;
        materialRef.current.distort = (face === 'logos' ? 0.2 : 0.6) + Math.sin(time * 5) * 0.2;
      } else {
        materialRef.current.emissiveIntensity = isTyping ? 0.8 : 0.5;
        materialRef.current.distort = isTyping ? 0.8 : (face === 'logos' ? 0.1 : 0.6);
      }
    }
  });

  const color = useMemo(() => {
    if (face === 'logos') return '#4cc9f0';
    if (face === 'pathos') return '#f72585';
    if (face === 'luna') return '#22c55e';
    if (face === 'sophia') return '#f59e0b';
    if (face === 'mnemosyne') return '#6366f1';
    return '#a855f7';
  }, [face]);

  return (
    <group>
      <Float speed={isTyping ? 5 : 2} rotationIntensity={isTyping ? 2 : 1} floatIntensity={isTyping ? 4 : 2}>
        <Sphere ref={meshRef} args={[1, 64, 64]}>
          <MeshDistortMaterial
            ref={materialRef}
            color={color}
            attach="material"
            distort={face === 'logos' ? 0.1 : 0.6}
            speed={isTyping ? 10 : (face === 'logos' ? 1 : 4)}
            roughness={0.2}
            metalness={0.8}
            emissive={color}
            emissiveIntensity={0.5}
            wireframe={face === 'logos'}
          />
        </Sphere>
        {face === 'luna' && (
          <Sphere args={[1.05, 32, 32]}>
            <meshBasicMaterial 
              color={color} 
              wireframe 
              transparent 
              opacity={0.15} 
            />
          </Sphere>
        )}
        {face === 'sophia' && (
          <Sphere args={[1.1, 16, 16]}>
            <meshBasicMaterial 
              color={color} 
              wireframe 
              transparent 
              opacity={0.1} 
            />
          </Sphere>
        )}
        {face === 'mnemosyne' && (
          <Sphere args={[1.2, 4, 4]}>
            <meshBasicMaterial 
              color={color} 
              wireframe 
              transparent 
              opacity={0.2} 
            />
          </Sphere>
        )}
      </Float>

      {face !== 'logos' && (
        <Points ref={particlesRef} positions={particlePositions}>
          <PointMaterial
            transparent
            color={color}
            size={isTyping ? 0.04 : 0.02}
            sizeAttenuation={true}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </Points>
      )}
    </group>
  );
};

export const AstraeusBody: React.FC<{ 
  face: 'logos' | 'pathos' | 'luna' | 'astraeus' | 'sophia' | 'mnemosyne', 
  isEventActive?: boolean,
  isTyping?: boolean,
  isSpeaking?: boolean,
  isListening?: boolean
}> = ({ face, isEventActive, isTyping, isSpeaking, isListening }) => {
  return (
    <div className={cn(
      "w-full h-48 bg-black/20 rounded-sm border mb-4 overflow-hidden relative transition-all duration-700",
      isEventActive ? "border-accent-pink/50 bg-accent-pink/5" : "border-border",
      face === 'luna' && "border-green-500/30 bg-green-500/5 shadow-[inset_0_0_20px_rgba(34,197,94,0.05)]",
      face === 'sophia' && "border-amber-500/30 bg-amber-500/5 shadow-[inset_0_0_20px_rgba(245,158,11,0.05)]",
      face === 'mnemosyne' && "border-indigo-500/30 bg-indigo-500/5 shadow-[inset_0_0_20px_rgba(99,102,241,0.05)]",
      face === 'astraeus' && "border-purple-500/30 bg-purple-500/5 shadow-[inset_0_0_20px_rgba(168,85,247,0.05)]",
      face === 'logos' && "border-accent-cyan/30 bg-accent-cyan/5 shadow-[inset_0_0_20px_rgba(76,201,240,0.05)]",
      face === 'pathos' && "border-accent-pink/30 bg-accent-pink/5 shadow-[inset_0_0_20px_rgba(247,37,133,0.05)]",
      isTyping && "border-accent-cyan/50 shadow-[0_0_15px_rgba(76,201,240,0.2)]",
      isListening && "border-accent-cyan ring-1 ring-accent-cyan/60 shadow-[0_0_25px_rgba(76,201,240,0.35)]"
    )}>
      {/* Psyche Transition Flash */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={face}
          initial={{ opacity: 0.4 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className={cn(
            "absolute inset-0 z-20 pointer-events-none",
            face === 'logos' ? "bg-accent-cyan/20" : 
            face === 'pathos' ? "bg-accent-pink/20" :
            face === 'luna' ? "bg-green-500/20" : 
            face === 'sophia' ? "bg-amber-500/20" :
            face === 'mnemosyne' ? "bg-indigo-500/20" : "bg-purple-500/20"
          )}
        />
      </AnimatePresence>

      {/* Psyche Specific Background Patterns */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
        {face === 'logos' && (
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#4cc9f0 0.5px, transparent 0.5px)', backgroundSize: '10px 10px' }} />
        )}
        {face === 'pathos' && (
          <motion.div 
            animate={{ 
              background: [
                'radial-gradient(circle at 30% 30%, #f72585 0%, transparent 50%)',
                'radial-gradient(circle at 70% 70%, #f72585 0%, transparent 50%)',
                'radial-gradient(circle at 30% 30%, #f72585 0%, transparent 50%)'
              ]
            }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute inset-0" 
          />
        )}
        {face === 'luna' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div 
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="w-32 h-32 border border-green-500/30 rounded-full" 
            />
          </div>
        )}
        {face === 'sophia' && (
          <div className="absolute inset-0 opacity-40">
            {Array.from({ length: 5 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ x: -20, y: Math.random() * 200, opacity: 0 }}
                animate={{ x: 400, opacity: [0, 1, 0] }}
                transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, delay: i * 0.5 }}
                className="absolute w-8 h-[1px] bg-amber-400"
              />
            ))}
          </div>
        )}
        {face === 'mnemosyne' && (
          <div className="absolute inset-0 flex flex-wrap gap-1 p-2 opacity-10">
            {Array.from({ length: 40 }).map((_, i) => (
              <div key={i} className="w-4 h-4 border border-indigo-500/50 flex items-center justify-center text-[6px] font-mono text-indigo-400">
                {Math.round(Math.random())}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="absolute top-2 left-2 z-10">
        <span className="text-[8px] font-mono uppercase tracking-[2px] text-text-dim">Neural Manifestation</span>
      </div>
      {(isEventActive || isTyping || isListening) && (
        <div className="absolute top-2 right-2 z-30 flex flex-col items-end gap-1">
          {isListening && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-accent-cyan/20 border border-accent-cyan/60 backdrop-blur-md shadow-[0_0_12px_rgba(76,201,240,0.3)]">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-cyan opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent-cyan"></span>
              </span>
              <span className="text-[8px] font-mono font-bold uppercase tracking-[1.5px] text-accent-cyan animate-pulse">
                Listening...
              </span>
            </div>
          )}
          {isEventActive && <span className="text-[8px] font-mono uppercase tracking-[2px] text-accent-pink animate-pulse">Event Sync Active</span>}
          {isTyping && <span className="text-[8px] font-mono uppercase tracking-[2px] text-accent-cyan animate-pulse">Processing Neural Flux</span>}
        </div>
      )}

      {/* Sonar Acoustic Frequency Rings Overlay when Listening */}
      <AnimatePresence>
        {isListening && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-15 pointer-events-none flex items-center justify-center overflow-hidden"
          >
            {[0, 0.7, 1.4].map((delay, i) => (
              <motion.div
                key={i}
                animate={{ scale: [0.5, 2.4], opacity: [0.75, 0] }}
                transition={{ repeat: Infinity, duration: 2.1, delay, ease: "easeOut" }}
                className="absolute w-24 h-24 rounded-full border border-accent-cyan/50 shadow-[0_0_15px_rgba(76,201,240,0.25)]"
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <Canvas camera={{ position: [0, 0, 3] }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <NeuralCore face={face} isTyping={isTyping} isSpeaking={isSpeaking} />
      </Canvas>

      {/* Listening Frequency Waveform Overlay */}
      <AnimatePresence>
        {isListening && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-0 inset-x-0 z-25 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-2.5 pt-6 pointer-events-none"
          >
            <div className="flex items-center justify-between text-[7px] font-mono text-accent-cyan/90 uppercase tracking-[2px] mb-1 px-1">
              <div className="flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-accent-cyan animate-ping" />
                <span>Neural Audio Reception // 48kHz</span>
              </div>
              <span className="text-[7px] font-mono text-accent-cyan animate-pulse">Waveform Spectrum Active</span>
            </div>
            
            {/* Frequency Equalizer Bars Waveform */}
            <div className="flex items-end justify-between h-8 gap-[2px] px-1">
              {Array.from({ length: 32 }).map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    height: [
                      `${12 + Math.abs(Math.sin((i / 32) * Math.PI) * 20)}%`,
                      `${35 + Math.abs(Math.sin(((i + 3) / 32) * Math.PI) * 60)}%`,
                      `${15 + Math.abs(Math.cos((i / 16) * Math.PI) * 45)}%`,
                      `${20 + Math.abs(Math.sin((i / 8) * Math.PI) * 75)}%`
                    ]
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 0.35 + (i % 6) * 0.08,
                    ease: "easeInOut"
                  }}
                  className="flex-1 rounded-t-[1px] bg-gradient-to-t from-accent-cyan/50 via-accent-cyan to-white shadow-[0_0_6px_rgba(76,201,240,0.5)]"
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Subtle Scanline Overlay specific to psyche */}
      <div className={cn(
        "absolute inset-0 pointer-events-none opacity-[0.03]",
        face === 'logos' ? "bg-accent-cyan" : "bg-white"
      )} style={{ backgroundImage: 'linear-gradient(transparent 50%, rgba(0,0,0,0.5) 50%)', backgroundSize: '100% 4px' }} />
    </div>
  );
};
