import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Mic, Download, Radio, Sparkles } from "lucide-react";

interface VoicePlayerProps {
  url: string;
  title?: string;
  authorMoniker?: string;
  category?: string;
  compact?: boolean;
}

export function VoicePlayer({ url, title, authorMoniker, category, compact = false }: VoicePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  const togglePlay = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch((err) => {
        console.error("Audio playback error:", err);
      });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const cycleSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    const speeds = [1, 1.25, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    setPlaybackSpeed(speeds[nextIdx]);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return "0:00";
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Mock waveform bar heights for rich visual feedback
  const waveformBars = [30, 65, 40, 85, 95, 45, 75, 100, 80, 50, 90, 60, 35, 70, 85, 40, 95, 60, 80, 50, 30, 75, 90, 45, 85, 60, 35, 95, 50, 70];

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden border border-amber-500/30 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white shadow-lg ${
        compact ? "p-3" : "p-4 sm:p-5"
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
        preload="metadata"
      />

      {/* Top Header Badge */}
      <div className="flex items-center justify-between gap-2 mb-3 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Mic className="w-3.5 h-3.5" />
          </span>
          <span className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            Voice Chat Point
            {isPlaying && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Speed Toggle */}
          <button
            type="button"
            onClick={cycleSpeed}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono font-bold text-slate-300 hover:text-amber-400 border border-slate-700 transition-colors cursor-pointer"
            title="Toggle playback speed"
          >
            {playbackSpeed}x
          </button>

          {/* Mute Toggle */}
          <button
            type="button"
            onClick={toggleMute}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-slate-300" />}
          </button>
        </div>
      </div>

      {/* Main Player Row */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={togglePlay}
          className={`relative shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-slate-950 font-bold transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95 ${
            isPlaying
              ? "bg-amber-400 text-slate-950 shadow-amber-400/30"
              : "bg-amber-500 hover:bg-amber-400 text-slate-950"
          }`}
          title={isPlaying ? "Pause Voice Point" : "Play Voice Point"}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 fill-slate-950" />
          ) : (
            <Play className="w-5 h-5 fill-slate-950 ml-0.5" />
          )}
        </button>

        {/* Waveform & Progress Bar */}
        <div className="flex-1 min-w-0">
          {/* Title if present */}
          {title && (
            <div className="text-xs font-bold text-slate-200 truncate mb-1">
              {title}
            </div>
          )}

          {/* Animated Waveform Visualizer */}
          <div className="flex items-center gap-0.5 h-7 mb-1.5 px-1 bg-slate-950/60 rounded-lg border border-slate-800/80 overflow-hidden">
            {waveformBars.map((height, idx) => {
              const barProgress = (idx / waveformBars.length) * 100;
              const isPast = barProgress <= progressPercent;
              return (
                <div
                  key={idx}
                  className={`flex-1 rounded-full transition-all duration-150 ${
                    isPast
                      ? "bg-amber-400"
                      : "bg-slate-700/60"
                  } ${isPlaying && isPast ? "animate-pulse" : ""}`}
                  style={{
                    height: isPlaying ? `${Math.max(20, Math.min(100, height * (0.6 + Math.random() * 0.5)))}%` : `${height}%`
                  }}
                />
              );
            })}
          </div>

          {/* Scrub Bar Slider */}
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
          />

          {/* Time Display */}
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
