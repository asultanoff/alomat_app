import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "react-bootstrap";

const ChatButton = () => {
  const [isPressed, setIsPressed] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [micAccessGranted, setMicAccessGranted] = useState(false);
  const audioChunksRef = useRef([]);
  let mediaRecorder = useRef(null);
  let audioContext = useRef(null);

  useEffect(() => {
    const requestMicAccess = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        setMicAccessGranted(true);
        stream.getTracks().forEach((track) => track.stop());
      } catch (error) {
        console.error("Error accessing microphone: ", error);
      }
    };

    requestMicAccess();

    const handleTouchMove = (e) => {
      if (isPressed) {
        e.preventDefault();
      }
    };

    document.addEventListener("touchmove", handleTouchMove, { capture: true });

    return () => {
      document.removeEventListener("touchmove", handleTouchMove, {
        capture: true,
      });
    };
  }, [isPressed]);

  const handlePressStart = useCallback(async () => {
    if (isWaiting || !micAccessGranted) return;
    setIsPressed(true);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContext.current = new (window.AudioContext ||
        window.webkitAudioContext)();
      await audioContext.current.audioWorklet.addModule("worklet-processor.js");
      const source = audioContext.current.createMediaStreamSource(stream);
      mediaRecorder.current = new AudioWorkletNode(
        audioContext.current,
        "worklet-processor"
      );
      source.connect(mediaRecorder.current);

      mediaRecorder.current.port.onmessage = (e) => {
        if (e.data && e.data.length) {
          audioChunksRef.current.push(
            new Blob([e.data], { type: "audio/webm" })
          );
        }
      };

      stream.oninactive = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        console.log("Creating audio blob...");
        const formData = new FormData();
        formData.append("file", audioBlob);

        try {
          const backend_endpoint = "https://51e7-94-158-61-196.ngrok-free.app";
          const response = await fetch(`${backend_endpoint}/api/send_message`, {
            method: "POST",
            body: formData,
          });

          const audioData = await response.arrayBuffer();
          playAudio(audioData);
        } catch (error) {
          console.error("Error sending the audio blob: ", error);
          setIsWaiting(false);
        } finally {
          audioChunksRef.current = [];
        }
      };
    } catch (error) {
      console.error("Error accessing microphone: ", error);
      setIsPressed(false);
    }
  }, [isWaiting, micAccessGranted]);

  const handlePressEnd = useCallback(() => {
    if (isPressed && !isWaiting) {
      setIsPressed(false);
      setIsWaiting(true);
      if (mediaRecorder.current) {
        mediaRecorder.current.port.postMessage({ command: "stop" });
        mediaRecorder.current.disconnect();
        audioContext.current.close();
      }
    }
  }, [isPressed, isWaiting]);

  const playAudio = async (audioData) => {
    try {
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const buffer = await audioContext.decodeAudioData(audioData);
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.start(0);

      source.onended = () => {
        setIsWaiting(false); // Reset isWaiting after audio playback
      };
    } catch (error) {
      console.error("Error decoding audio data:", error);
      setIsWaiting(false);
    }
  };

  return (
    <Button
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      onTouchStart={(e) => handlePressStart()}
      onTouchEnd={handlePressEnd}
      onTouchCancel={handlePressEnd}
      disabled={isWaiting || !micAccessGranted}
      style={{
        width: "70vw",
        height: "70vw",
        borderRadius: "50%",
        fontSize: "12vw",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: isPressed || !isWaiting ? "#28a745" : "#343a40",
        color: "#fff",
        border: "none",
        transition:
          "transform 0.1s ease, box-shadow 0.1s ease, background-color 0.2s ease",
        transform: isPressed ? "scale(0.95)" : "scale(1)",
        boxShadow: isPressed
          ? "inset 0px 0px 10px rgba(0, 0, 0, 0.3)"
          : "0px 4px 15px rgba(0, 0, 0, 0.3)",
        backgroundImage:
          isPressed || !isWaiting
            ? "radial-gradient(circle, #3c3 30%, #28a231 70%)"
            : "radial-gradient(circle, #3c3f43 30%, #2f3135 70%)",
        pointerEvents: isWaiting || !micAccessGranted ? "none" : "auto",
      }}
      variant="primary"
    >
      {isWaiting
        ? "Listening..."
        : micAccessGranted
        ? "Press to talk"
        : "Mic access required"}
    </Button>
  );
};

export default ChatButton;
