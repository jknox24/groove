"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { playCompletionSound } from "@/lib/sounds";

type TimerMode = "work" | "break";

const PRESETS = [
  { label: "25/5", work: 25, break: 5 },
  { label: "50/10", work: 50, break: 10 },
  { label: "90/20", work: 90, break: 20 },
];

const AMBIENT_SOUNDS = [
  { id: "rain", label: "Rain", emoji: "🌧️" },
  { id: "forest", label: "Forest", emoji: "🌲" },
  { id: "ocean", label: "Ocean", emoji: "🌊" },
  { id: "fire", label: "Fireplace", emoji: "🔥" },
  { id: "cafe", label: "Cafe", emoji: "☕" },
  { id: "none", label: "None", emoji: "🔇" },
];

// Generate ambient sounds using Web Audio API
function createAmbientSound(
  ctx: AudioContext,
  type: string
): { start: () => void; stop: () => void } | null {
  if (type === "none") return null;

  let noiseNode: AudioBufferSourceNode | null = null;
  let gainNode: GainNode | null = null;
  let filterNode: BiquadFilterNode | null = null;

  const start = () => {
    // Create noise buffer
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    noiseNode = ctx.createBufferSource();
    noiseNode.buffer = buffer;
    noiseNode.loop = true;

    gainNode = ctx.createGain();
    filterNode = ctx.createBiquadFilter();

    // Configure based on sound type
    switch (type) {
      case "rain":
        filterNode.type = "lowpass";
        filterNode.frequency.value = 1000;
        gainNode.gain.value = 0.15;
        break;
      case "forest":
        filterNode.type = "bandpass";
        filterNode.frequency.value = 2000;
        filterNode.Q.value = 0.5;
        gainNode.gain.value = 0.08;
        break;
      case "ocean":
        filterNode.type = "lowpass";
        filterNode.frequency.value = 400;
        gainNode.gain.value = 0.2;
        break;
      case "fire":
        filterNode.type = "lowpass";
        filterNode.frequency.value = 600;
        gainNode.gain.value = 0.1;
        break;
      case "cafe":
        filterNode.type = "bandpass";
        filterNode.frequency.value = 1500;
        filterNode.Q.value = 0.3;
        gainNode.gain.value = 0.05;
        break;
    }

    noiseNode.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(ctx.destination);
    noiseNode.start();
  };

  const stop = () => {
    if (noiseNode) {
      noiseNode.stop();
      noiseNode.disconnect();
    }
    if (filterNode) filterNode.disconnect();
    if (gainNode) gainNode.disconnect();
  };

  return { start, stop };
}

export default function FocusPage() {
  const [preset, setPreset] = useState(PRESETS[0]);
  const [mode, setMode] = useState<TimerMode>("work");
  const [timeLeft, setTimeLeft] = useState(preset.work * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [ambientSound, setAmbientSound] = useState("none");
  const [isMuted, setIsMuted] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const ambientRef = useRef<{ start: () => void; stop: () => void } | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize audio context
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Handle ambient sound changes
  useEffect(() => {
    if (ambientRef.current) {
      ambientRef.current.stop();
      ambientRef.current = null;
    }

    if (isRunning && ambientSound !== "none" && !isMuted) {
      const ctx = initAudio();
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      ambientRef.current = createAmbientSound(ctx, ambientSound);
      ambientRef.current?.start();
    }

    return () => {
      if (ambientRef.current) {
        ambientRef.current.stop();
      }
    };
  }, [ambientSound, isRunning, isMuted, initAudio]);

  // Timer logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((t) => t - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // Timer completed
      if (!isMuted) {
        playCompletionSound();
      }

      if (mode === "work") {
        setSessions((s) => s + 1);
        setMode("break");
        setTimeLeft(preset.break * 60);
      } else {
        setMode("work");
        setTimeLeft(preset.work * 60);
      }
      setIsRunning(false);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft, mode, preset, isMuted]);

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Calculate progress
  const totalTime = mode === "work" ? preset.work * 60 : preset.break * 60;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  // Reset timer
  const reset = () => {
    setIsRunning(false);
    setMode("work");
    setTimeLeft(preset.work * 60);
  };

  // Change preset
  const changePreset = (newPreset: typeof PRESETS[0]) => {
    setPreset(newPreset);
    setMode("work");
    setTimeLeft(newPreset.work * 60);
    setIsRunning(false);
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">
        Focus Timer
      </h1>
      <p className="text-gray-500 dark:text-gray-400 text-center mb-8">
        {sessions} sessions completed today
      </p>

      {/* Timer Display */}
      <div className="relative mb-8">
        {/* Progress Ring */}
        <div className="relative w-64 h-64 mx-auto">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="128"
              cy="128"
              r="120"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-gray-200 dark:text-gray-700"
            />
            <circle
              cx="128"
              cy="128"
              r="120"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={2 * Math.PI * 120}
              strokeDashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
              strokeLinecap="round"
              className={cn(
                "transition-all duration-1000",
                mode === "work" ? "text-primary" : "text-green-500"
              )}
            />
          </svg>

          {/* Time Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-bold text-gray-900 dark:text-white tabular-nums">
              {formatTime(timeLeft)}
            </span>
            <span
              className={cn(
                "text-sm font-medium mt-2 uppercase tracking-wide",
                mode === "work"
                  ? "text-primary"
                  : "text-green-500"
              )}
            >
              {mode === "work" ? "Focus Time" : "Break Time"}
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <button
          onClick={reset}
          className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        <button
          onClick={() => {
            initAudio();
            setIsRunning(!isRunning);
          }}
          className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center text-white shadow-lg transition-all hover:scale-105 active:scale-95",
            mode === "work" ? "bg-primary" : "bg-green-500"
          )}
        >
          {isRunning ? (
            <Pause className="w-8 h-8" />
          ) : (
            <Play className="w-8 h-8 ml-1" />
          )}
        </button>

        <button
          onClick={() => setIsMuted(!isMuted)}
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
            isMuted
              ? "bg-gray-200 dark:bg-gray-700 text-gray-500"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
          )}
        >
          {isMuted ? (
            <VolumeX className="w-5 h-5" />
          ) : (
            <Volume2 className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Presets */}
      <div className="mb-8">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 text-center">
          Timer Preset (work/break minutes)
        </p>
        <div className="flex justify-center gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => changePreset(p)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                preset.label === p.label
                  ? "bg-primary text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ambient Sounds */}
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 text-center">
          Ambient Sound
        </p>
        <div className="grid grid-cols-3 gap-2">
          {AMBIENT_SOUNDS.map((sound) => (
            <button
              key={sound.id}
              onClick={() => {
                initAudio();
                setAmbientSound(sound.id);
              }}
              className={cn(
                "flex flex-col items-center gap-1 p-3 rounded-xl transition-colors",
                ambientSound === sound.id
                  ? "bg-primary/10 text-primary border-2 border-primary"
                  : "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-transparent hover:bg-gray-100 dark:hover:bg-gray-700"
              )}
            >
              <span className="text-2xl">{sound.emoji}</span>
              <span className="text-xs font-medium">{sound.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
