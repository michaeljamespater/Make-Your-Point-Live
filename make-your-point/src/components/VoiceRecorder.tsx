import React, { useState, useRef, useEffect } from "react";
import { Mic, Square, Play, Pause, RotateCcw, Check, Loader2, Radio, Trash2, Volume2 } from "lucide-react";

interface VoiceRecorderProps {
  onAudioRecorded: (file: File) => void;
  onCancel?: () => void;
  label?: string;
}

export function VoiceRecorder({ onAudioRecorded, onCancel, label = "Record Voice Note" }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    setPermissionError(null);
    audioChunksRef.current = [];
    setAudioUrl(null);
    setRecordedBlob(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Microphone access is not supported in this browser environment.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Select best supported MIME type
      let mimeType = "";
      if (MediaRecorder.isTypeSupported("audio/webm")) {
        mimeType = "audio/webm";
      } else if (MediaRecorder.isTypeSupported("audio/ogg")) {
        mimeType = "audio/ogg";
      } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
        mimeType = "audio/mp4";
      } else if (MediaRecorder.isTypeSupported("audio/aac")) {
        mimeType = "audio/aac";
      }

      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType || "audio/webm" });
        const url = URL.createObjectURL(audioBlob);
        setRecordedBlob(audioBlob);
        setAudioUrl(url);

        // Stop all track media streams to release microphone
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(100); // collect chunks every 100ms
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error("Error accessing microphone:", err);
      setPermissionError(err.message || "Microphone access denied or unavailable.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleDiscard = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setRecordedBlob(null);
    setRecordingTime(0);
    setIsPlaying(false);
    if (onCancel) onCancel();
  };

  const handleConfirm = () => {
    if (!recordedBlob) return;
    const fileExt = recordedBlob.type.includes("webm")
      ? ".webm"
      : recordedBlob.type.includes("ogg")
      ? ".ogg"
      : recordedBlob.type.includes("mp4")
      ? ".m4a"
      : ".wav";
    
    const timeStr = formatTime(recordingTime);
    const audioFile = new File(
      [recordedBlob],
      `Voice_Note_${Date.now()}${fileExt}`,
      { type: recordedBlob.type || "audio/webm" }
    );

    onAudioRecorded(audioFile);
    handleDiscard();
  };

  const togglePlayback = () => {
    if (!audioPlayerRef.current || !audioUrl) return;

    if (isPlaying) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlaying(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-4 text-white shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-orange-500/20 border border-orange-500/30 text-orange-400">
            <Mic className="w-4 h-4" />
          </div>
          <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
            {label}
          </span>
        </div>
        {permissionError && (
          <span className="text-[11px] font-mono text-red-400 max-w-[200px] truncate">
            {permissionError}
          </span>
        )}
      </div>

      {/* Mode 1: Initial state - Record Button */}
      {!isRecording && !audioUrl && (
        <div className="flex items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
          <div className="text-xs text-slate-400">
            Click to record voice note via microphone
          </div>
          <button
            type="button"
            onClick={startRecording}
            className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold font-mono flex items-center gap-2 cursor-pointer transition-all shadow-md shadow-orange-600/20 active:scale-95"
            id="start-voice-recording-btn"
          >
            <Mic className="w-4 h-4 text-white animate-pulse" />
            <span>Start Recording</span>
          </button>
        </div>
      )}

      {/* Mode 2: Currently Recording */}
      {isRecording && (
        <div className="flex items-center justify-between gap-3 bg-red-950/40 p-3 rounded-lg border border-red-500/40 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
            <div className="font-mono text-sm font-bold text-red-400 flex items-center gap-2">
              <Radio className="w-4 h-4 text-red-400 animate-spin" />
              <span>RECORDING {formatTime(recordingTime)}</span>
            </div>
          </div>

          {/* Animated sound waves */}
          <div className="hidden sm:flex items-center gap-1 h-5 px-2">
            {[40, 80, 50, 90, 30, 100, 60, 85, 45].map((h, i) => (
              <div
                key={i}
                className="w-1 bg-red-400 rounded-full animate-bounce"
                style={{
                  height: `${h}%`,
                  animationDelay: `${i * 0.12}s`,
                  animationDuration: "0.6s"
                }}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={stopRecording}
            className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold font-mono flex items-center gap-1.5 cursor-pointer shadow-md"
            id="stop-voice-recording-btn"
          >
            <Square className="w-3.5 h-3.5 fill-white" />
            <span>Stop</span>
          </button>
        </div>
      )}

      {/* Mode 3: Review Recorded Audio */}
      {audioUrl && !isRecording && (
        <div className="flex flex-col gap-3 bg-slate-950/80 p-3 rounded-lg border border-slate-700">
          <audio
            ref={audioPlayerRef}
            src={audioUrl}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={togglePlayback}
                className="p-2.5 rounded-full bg-orange-600 hover:bg-orange-500 text-white cursor-pointer shadow-md transition-transform active:scale-90"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
              </button>

              <div>
                <span className="text-xs font-mono font-bold text-slate-200 block">
                  Voice Note Ready ({formatTime(recordingTime)})
                </span>
                <span className="text-[10px] font-mono text-orange-400">
                  Preview playback before attaching
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDiscard}
                className="p-2 rounded-lg bg-slate-800 hover:bg-red-950/50 hover:text-red-400 text-slate-400 transition-colors cursor-pointer text-xs flex items-center gap-1 font-mono"
                title="Discard recording"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Discard</span>
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-mono flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/20"
                id="attach-voice-recording-btn"
              >
                <Check className="w-4 h-4 text-white" />
                <span>Attach Audio</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
