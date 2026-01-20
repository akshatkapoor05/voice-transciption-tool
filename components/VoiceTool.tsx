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

  const [listening, setListening] = useState(false);
  const [finalText, setFinalText] = useState("");
  const [interimText, setInterimText] = useState("");

  const isMobile =
    typeof navigator !== "undefined" &&
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  // Create recognition ONCE
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";

    // Desktop supports continuous; mobile does not
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

    // IMPORTANT: mobile cannot auto-resume
    recognition.onend = () => {
      if (!listening) return;

      if (isMobile) {
        // Stop and ask user to tap again
        setListening(false);
        setInterimText("");
      } else {
        // Desktop can safely auto-restart
        recognition.start();
      }
    };

    recognitionRef.current = recognition;
  }, [isMobile, listening]);

  const startMic = () => {
    recognitionRef.current.start();
    setListening(true);
  };

  const stopMic = () => {
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
            ? "Tap to speak. Pauses may require a tap to continue."
            : "Speak freely. Pauses won’t stop recording."}
        </p>
      </header>

      <div className={styles.card}>
        {!listening ? (
          <button className={styles.micButton} onClick={startMic}>
            🎤 {isMobile ? "Tap to speak" : "Start speaking"}
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
          {listening
            ? "Listening…"
            : isMobile
            ? "Paused — tap to continue"
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
        Internal tool • Mobile-safe speech-to-text
      </footer>
    </div>
  );
}
