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
  const modeRef = useRef<Mode>("stopped");

  const [mode, setMode] = useState<Mode>("stopped");
  const [finalText, setFinalText] = useState("");
  const [interimText, setInterimText] = useState("");

  const isMobile =
    typeof navigator !== "undefined" &&
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  // keep ref synced with state (avoids stale closures)
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  // initialize SpeechRecognition ONCE
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = !isMobile; // ignored on mobile anyway
    recognition.interimResults = !isMobile;

    recognition.onresult = (event: any) => {
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

    recognition.onend = () => {
      // MOBILE: silence means paused
      if (isMobile) {
        if (modeRef.current === "recording") {
          setMode("idle");
        }
        return;
      }

      // DESKTOP: auto resume if still recording
      if (modeRef.current === "recording") {
        try {
          recognition.start();
        } catch {}
      }
    };

    recognition.onerror = () => {
      // defensive fallback
      if (modeRef.current === "recording") {
        setMode("idle");
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.onresult = null;
      recognition.onend = null;
      recognition.onerror = null;
      recognition.stop();
    };
  }, [isMobile]);

  const startOrResume = () => {
    try {
      recognitionRef.current?.start();
      setMode("recording");
    } catch {}
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setMode("stopped");
    setInterimText("");
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
            ? "If paused, tap Resume to continue speaking"
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
            ? "Paused — no speech detected"
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
          readOnly={mode === "recording"}
          placeholder="Your speech will appear here…"
        />
      </div>

      <footer className={styles.footer}>
        Internal tool • Activity-based mobile dictation
      </footer>
    </div>
  );
}
