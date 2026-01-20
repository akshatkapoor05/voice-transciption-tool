import { useEffect, useRef, useState } from "react";
import styles from "@/styles/voice.module.css";

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export default function VoiceTool() {
  const recognitionRef = useRef<any>(null);

  // User intent: should we be listening?
  const [listening, setListening] = useState(false);

  const [finalText, setFinalText] = useState("");
  const [interimText, setInterimText] = useState("");

  const isMobile =
    typeof navigator !== "undefined" &&
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

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
      // 🔥 KEY FIX
      // If user still wants listening, restart automatically
      if (listening) {
        setTimeout(() => {
          try {
            recognition.start();
          } catch {
            // mobile may block sometimes — ignore silently
          }
        }, 400);
      }
    };

    recognition.onerror = () => {
      // Retry if user intent is still listening
      if (listening) {
        setTimeout(() => {
          try {
            recognition.start();
          } catch {}
        }, 600);
      }
    };

    recognitionRef.current = recognition;
  }, [isMobile, listening]);

  const startMic = () => {
    if (!recognitionRef.current) return;
    recognitionRef.current.start();
    setListening(true);
  };

  const stopMic = () => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setListening(false);
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
            ? "Speak freely. Pauses are handled automatically."
            : "Speak freely. Pauses won’t stop recording."}
        </p>
      </header>

      <div className={styles.card}>
        {!listening ? (
          <button className={styles.micButton} onClick={startMic}>
            🎤 Start speaking
          </button>
        ) : (
          <button
            className={`${styles.micButton} ${styles.listening}`}
            onClick={stopMic}
          >
            ⏹ Stop
          </button>
        )}

        <div className={styles.status}>
          {listening ? "Listening…" : "Not listening"}
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
        Internal tool • Mobile-friendly speech-to-text
      </footer>
    </div>
  );
}
