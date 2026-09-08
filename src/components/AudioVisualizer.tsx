import React, { useEffect, useRef } from 'react';
import type { AgentVoiceState, UserVoiceState } from '../types';

interface AudioVisualizerProps {
  agentVoiceState: AgentVoiceState;
  userVoiceState: UserVoiceState;
  userAudioLevel: number;
  agentAudioLevel: number;
  isConnected: boolean;
  frequencyDataRef: React.RefObject<Uint8Array>;
  className?: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  agentVoiceState,
  userVoiceState,
  userAudioLevel,
  agentAudioLevel,
  isConnected,
  frequencyDataRef,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let phase = 0;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const render = () => {
      phase += 0.04;
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      // Determine active level and theme color palette based on state
      const isAgentSpeaking = agentVoiceState === 'speaking';
      const isThinking = agentVoiceState === 'thinking';
      const isUserSpeaking = userVoiceState === 'speaking';

      let effectiveLevel = 0.05;
      if (isAgentSpeaking) {
        effectiveLevel = 0.25 + agentAudioLevel * 0.75;
      } else if (isUserSpeaking) {
        effectiveLevel = 0.2 + userAudioLevel * 0.8;
      } else if (isThinking) {
        effectiveLevel = 0.35 + Math.sin(phase * 2) * 0.15;
      } else if (isConnected) {
        effectiveLevel = 0.1 + Math.sin(phase * 0.8) * 0.05;
      }

      // 1. Draw Multi-Layer Radial Glow Background
      const radialGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        10,
        centerX,
        centerY,
        Math.min(centerX, centerY) * 1.2
      );

      if (isAgentSpeaking) {
        radialGradient.addColorStop(0, `rgba(168, 85, 247, ${0.35 * effectiveLevel})`); // Violet/Purple
        radialGradient.addColorStop(0.5, `rgba(6, 182, 212, ${0.2 * effectiveLevel})`); // Cyan
        radialGradient.addColorStop(1, 'rgba(15, 23, 42, 0)');
      } else if (isUserSpeaking) {
        radialGradient.addColorStop(0, `rgba(16, 185, 129, ${0.4 * effectiveLevel})`); // Emerald
        radialGradient.addColorStop(0.5, `rgba(6, 182, 212, ${0.25 * effectiveLevel})`); // Cyan
        radialGradient.addColorStop(1, 'rgba(15, 23, 42, 0)');
      } else if (isThinking) {
        radialGradient.addColorStop(0, 'rgba(99, 102, 241, 0.35)'); // Indigo
        radialGradient.addColorStop(0.6, 'rgba(236, 72, 153, 0.15)'); // Pink
        radialGradient.addColorStop(1, 'rgba(15, 23, 42, 0)');
      } else if (isConnected) {
        radialGradient.addColorStop(0, 'rgba(6, 182, 212, 0.15)');
        radialGradient.addColorStop(0.6, 'rgba(59, 130, 246, 0.05)');
        radialGradient.addColorStop(1, 'rgba(15, 23, 42, 0)');
      } else {
        radialGradient.addColorStop(0, 'rgba(71, 85, 105, 0.1)');
        radialGradient.addColorStop(1, 'rgba(15, 23, 42, 0)');
      }

      ctx.fillStyle = radialGradient;
      ctx.fillRect(0, 0, width, height);

      // 2. Draw Concentric Pulsating Rings
      const numRings = 3;
      for (let r = 0; r < numRings; r++) {
        const ringRadius = 55 + r * 30 + effectiveLevel * 40 + Math.sin(phase + r * 1.2) * 8;
        ctx.beginPath();
        ctx.arc(centerX, centerY, Math.max(10, ringRadius), 0, Math.PI * 2);

        if (isAgentSpeaking) {
          ctx.strokeStyle = `rgba(192, 132, 252, ${0.25 / (r + 1)})`;
        } else if (isUserSpeaking) {
          ctx.strokeStyle = `rgba(52, 211, 153, ${0.3 / (r + 1)})`;
        } else if (isThinking) {
          ctx.strokeStyle = `rgba(129, 140, 248, ${0.35 / (r + 1)})`;
        } else {
          ctx.strokeStyle = `rgba(148, 163, 184, ${0.1 / (r + 1)})`;
        }

        ctx.lineWidth = 1.5;
        ctx.setLineDash([6 + r * 4, 8 + r * 2]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 3. Draw 64-Band Circular Audio Waveform / Frequency Spectrum
      const numBars = 48;
      const baseRadius = 70;
      const freqData = frequencyDataRef.current;

      for (let i = 0; i < numBars; i++) {
        const angle = (i / numBars) * Math.PI * 2 + (isThinking ? phase * 0.5 : 0);
        
        let barHeight = 4;
        if (freqData && isUserSpeaking) {
          const val = freqData[i % freqData.length] || 0;
          barHeight = 4 + (val / 255) * 55;
        } else if (isAgentSpeaking) {
          const harmonic = Math.sin(phase * 3 + i * 0.4) * Math.cos(phase * 2 + i * 0.2);
          barHeight = 4 + (effectiveLevel * 48 * Math.abs(harmonic)) + Math.random() * 8;
        } else if (isThinking) {
          const wave = Math.sin(phase * 4 + i * 0.3);
          barHeight = 6 + Math.abs(wave) * 24;
        } else if (isConnected) {
          barHeight = 3 + Math.sin(phase * 1.5 + i * 0.2) * 4;
        }

        const x1 = centerX + Math.cos(angle) * baseRadius;
        const y1 = centerY + Math.sin(angle) * baseRadius;
        const x2 = centerX + Math.cos(angle) * (baseRadius + barHeight);
        const y2 = centerY + Math.sin(angle) * (baseRadius + barHeight);

        const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        if (isAgentSpeaking) {
          gradient.addColorStop(0, '#06b6d4'); // Cyan
          gradient.addColorStop(1, '#a855f7'); // Purple
        } else if (isUserSpeaking) {
          gradient.addColorStop(0, '#06b6d4'); // Cyan
          gradient.addColorStop(1, '#10b981'); // Emerald
        } else if (isThinking) {
          gradient.addColorStop(0, '#6366f1'); // Indigo
          gradient.addColorStop(1, '#ec4899'); // Pink
        } else {
          gradient.addColorStop(0, '#334155');
          gradient.addColorStop(1, '#64748b');
        }

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      // 4. Center Core Energy Orb
      const coreRadius = 42 + (effectiveLevel * 18);
      const coreGradient = ctx.createRadialGradient(
        centerX - 8,
        centerY - 8,
        5,
        centerX,
        centerY,
        coreRadius
      );

      if (isAgentSpeaking) {
        coreGradient.addColorStop(0, '#c084fc');
        coreGradient.addColorStop(0.6, '#9333ea');
        coreGradient.addColorStop(1, '#0891b2');
      } else if (isUserSpeaking) {
        coreGradient.addColorStop(0, '#6ee7b7');
        coreGradient.addColorStop(0.6, '#10b981');
        coreGradient.addColorStop(1, '#0284c7');
      } else if (isThinking) {
        coreGradient.addColorStop(0, '#a5b4fc');
        coreGradient.addColorStop(0.6, '#6366f1');
        coreGradient.addColorStop(1, '#db2777');
      } else if (isConnected) {
        coreGradient.addColorStop(0, '#67e8f9');
        coreGradient.addColorStop(0.7, '#0891b2');
        coreGradient.addColorStop(1, '#0f172a');
      } else {
        coreGradient.addColorStop(0, '#475569');
        coreGradient.addColorStop(1, '#1e293b');
      }

      ctx.beginPath();
      ctx.arc(centerX, centerY, coreRadius, 0, Math.PI * 2);
      ctx.fillStyle = coreGradient;
      ctx.shadowColor = isAgentSpeaking ? '#a855f7' : isUserSpeaking ? '#10b981' : isThinking ? '#6366f1' : '#06b6d4';
      ctx.shadowBlur = isConnected ? 25 + effectiveLevel * 30 : 5;
      ctx.fill();
      ctx.shadowBlur = 0; // Reset shadow

      // Center glossy reflection highlight
      ctx.beginPath();
      ctx.ellipse(centerX - 10, centerY - 12, coreRadius * 0.35, coreRadius * 0.2, -Math.PI / 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.fill();

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [
    agentVoiceState,
    userVoiceState,
    userAudioLevel,
    agentAudioLevel,
    isConnected,
    frequencyDataRef,
  ]);

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full max-w-[420px] max-h-[420px] aspect-square pointer-events-none"
      />
    </div>
  );
};
