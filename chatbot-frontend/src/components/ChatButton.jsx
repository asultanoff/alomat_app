import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "react-bootstrap";

const ChatButton = () => {
  const [isPressed, setIsPressed] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [micAccessGranted, setMicAccessGranted] = useState(false); // Track microphone access

  const audioChunksRef = useRef([]); // Use ref instead of state to store audio chunks

  useEffect(() => {
    const requestMicAccess = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        setMicAccessGranted(true);
        stream.getTracks().forEach((track) => track.stop()); // Stop the stream immediately after access is granted
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
    audioChunksRef.current = []; // Reset audio chunks

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
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
          stream.getTracks().forEach((track) => track.stop());
        }
      };

      recorder.start(500);
      setMediaRecorder(recorder);
    } catch (error) {
      console.error("Error accessing microphone: ", error);
      setIsPressed(false);
    }
  }, [isWaiting, micAccessGranted]);

  const handlePressEnd = useCallback(() => {
    if (isPressed && !isWaiting) {
      setIsPressed(false);
      setIsWaiting(true);
      if (mediaRecorder) {
        mediaRecorder.stop();
      }
    }
  }, [isPressed, isWaiting, mediaRecorder]);

  const playAudio = async (audioData) => {
    try {
      const audioContext = new AudioContext();
      const buffer = await audioContext.decodeAudioData(audioData);
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.start(0);

      source.onended = () => {
        setIsWaiting(false);
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
        width: "40vw",
        height: "40vw",
        borderRadius: "50%",
        fontSize: "5vw",
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
