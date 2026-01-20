import { useEffect, useRef, useState } from "react";
import styles from "@/styles/voice.module.css";

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

type MicState = "idle" | "listening" | "paused";

export default function VoiceTool() {
  const recognitionRef = useRef<any>(null);
  const watchdogRef = useRef<NodeJS.Timeout | null>(null);

  const [micState, setMicState] = useState<MicState>("idle");
  const [finalText, setFinalText] = useState("");
  const [interimText, setInterimText] = useState("");

  const isMobile =
    typeof navigator !== "undefined" &&
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  // 🔁 Reset watchdog timer
  const resetWatchdog = () => {
    if (!isMobile) return;

    if (watchdogRef.current) {
      clearTimeout(watchdogRef.current);
    }

    watchdogRef.current = setTimeout(() => {
      // No results for a while → mic likely stopped
      if (micState === "listening") {
        setMicState("paused");
        setInterimText("");
      }
    }, 2500); // 2.5s silence threshold
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
      resetWatchdog(); // 🔥 KEY

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
      if (!isMobile && micState === "listening") {
        recognition.start();
      }
    };

    recognition.onerror = () => {
      if (isMobile && micState === "listening") {
        setMicState("paused");
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (watchdogRef.current) {
        clearTimeout(watchdogRef.current);
      }
    };
  }, [isMobile, micState]);

  const startMic = () => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.start();
      setMicState("listening");
      resetWatchdog();
    } catch {}
  };

  const stopMic = () => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setMicState("idle");
    setInterimText("");

    if (watchdogRef.current) {
      clearTimeout(watchdogRef.current);
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
            ? "Tap to speak. Pauses may pause recording."
            : "Speak freely. Pauses won’t stop recording."}
        </p>
      </header>

      <div className={styles.card}>
        {micState === "listening" ? (
          <button
            className={`${styles.micButton} ${styles.listening}`}
            onClick={stopMic}
          >
            ⏹ Stop
          </button>
        ) : (
          <button className={styles.micButton} onClick={startMic}>
            🎤 {micState === "paused" ? "Tap to continue" : "Start speaking"}
          </button>
        )}

        <div className={styles.status}>
          {micState === "listening"
            ? "Listening…"
            : micState === "paused"
            ? "Paused — microphone stopped"
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
        Internal tool • Mobile-aware speech-to-text
      </footer>
    </div>
  );
}
