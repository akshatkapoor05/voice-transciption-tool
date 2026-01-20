import { useEffect, useRef, useState } from "react";
import styles from "@/styles/voice.module.css";

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

type Mode = "stopped" | "recording" | "idle";

export default function VoiceTool() {
  const recognitionRef = useRef<any>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [mode, setMode] = useState<Mode>("stopped");
  const [finalText, setFinalText] = useState("");
  const [interimText, setInterimText] = useState("");

  const isMobile =
    typeof navigator !== "undefined" &&
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  // Reset inactivity timer whenever new text appears
  const resetInactivityTimer = () => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    inactivityTimerRef.current = setTimeout(() => {
      if (mode === "recording") {
        setMode("idle"); // 🔥 switch Stop → Resume
      }
    }, 2500); // 2.5 seconds
  };

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = !isMobile;
    recognition.interimResults = !isMobile;

    recognition.onresult = (event: any) => {
      resetInactivityTimer();
      setMode("recording");

      let finalChunk = "";
      let interimChunk = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalChunk += transcript + " ";
        } else if (!isMobile) {
          interimChunk += transcript;
        }
      }

      if (finalChunk) {
        setFinalText((prev) => prev + finalChunk);
      }

      if (!isMobile) {
        setInterimText(interimChunk);
      }
    };

    // Desktop auto-resume only
    recognition.onend = () => {
      if (!isMobile && mode === "recording") {
        recognition.start();
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [isMobile, mode]);

  const startOrResume = () => {
    try {
      recognitionRef.current?.start();
      setMode("recording");
      resetInactivityTimer();
    } catch {}
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setMode("stopped");
    setInterimText("");

    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
  };

  const clearText = () => {
    setFinalText("");
    setInterimText("");
  };

  const copyText = () => {
    navigator.clipboard.writeText(finalText);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>🎙️ Voice Notes</h1>
        <p>
          {isMobile
            ? "If paused, tap Resume to continue speaking."
            : "Speak freely. Pauses won’t stop recording."}
        </p>
      </header>

      <div className={styles.card}>
        {mode === "recording" ? (
          <button
            className={`${styles.micButton} ${styles.listening}`}
            onClick={stopRecording}
          >
            ⏹ Stop
          </button>
        ) : (
          <button className={styles.micButton} onClick={startOrResume}>
            🎤 {mode === "idle" ? "Resume" : "Start speaking"}
          </button>
        )}

        <div className={styles.status}>
          {mode === "recording"
            ? "Listening…"
            : mode === "idle"
            ? "Paused — no new speech detected"
            : "Not listening"}
        </div>
      </div>

      <div className={styles.editor}>
        <div className={styles.editorHeader}>
          <span>Transcript</span>
          <div>
            <button onClick={copyText}>Copy</button>
            <button onClick={clearText} style={{ marginLeft: "12px" }}>
              Clear
            </button>
          </div>
        </div>

        <textarea
          className={styles.textarea}
          value={finalText + interimText}
          onChange={(e) => setFinalText(e.target.value)}
          placeholder="Your speech will appear here…"
        />
      </div>

      <footer className={styles.footer}>
        Internal tool • Activity-based mobile dictation
      </footer>
    </div>
  );
}
