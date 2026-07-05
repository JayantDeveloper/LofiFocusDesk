import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildYouTubeEmbedUrl } from "../utils/music";

const YT_STATE_PLAYING = 1;
const YT_STATE_BUFFERING = 3;
const AUTOPLAY_WATCHDOG_MS = 2500;

function sendYouTubeCommand(iframe, command, args = []) {
  if (!iframe?.contentWindow) return;
  iframe.contentWindow.postMessage(
    JSON.stringify({
      event: "command",
      func: command,
      args,
    }),
    "*",
  );
}

// Asks the YouTube iframe to start posting state updates back to us.
function sendYouTubeListeningHandshake(iframe) {
  if (!iframe?.contentWindow) return;
  iframe.contentWindow.postMessage(
    JSON.stringify({ event: "listening", id: 1, channel: "widget" }),
    "*",
  );
}

export function RoomMusicPlayer({ isPlaying, sourceUrl }) {
  const embedUrl = useMemo(() => buildYouTubeEmbedUrl(sourceUrl), [sourceUrl]);
  const iframeRef = useRef(null);
  const controlRetryRef = useRef(null);
  const watchdogRef = useRef(null);
  const playerStateRef = useRef(null);
  const isPlayingRef = useRef(isPlaying);
  const [isAutoplayBlocked, setIsAutoplayBlocked] = useState(false);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const clearTimers = useCallback(() => {
    if (controlRetryRef.current) {
      window.clearInterval(controlRetryRef.current);
      controlRetryRef.current = null;
    }
    if (watchdogRef.current) {
      window.clearTimeout(watchdogRef.current);
      watchdogRef.current = null;
    }
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  // Track the player's real state from the iframe's postMessage updates.
  useEffect(() => {
    const handleMessage = (event) => {
      if (!iframeRef.current || event.source !== iframeRef.current.contentWindow) {
        return;
      }
      let data = event.data;
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch {
          return;
        }
      }
      const playerState = data?.info?.playerState;
      if (typeof playerState === "number") {
        playerStateRef.current = playerState;
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  useEffect(() => {
    if (!embedUrl || !iframeRef.current) return undefined;
    sendYouTubeCommand(iframeRef.current, isPlaying ? "playVideo" : "pauseVideo");
    if (!isPlaying) {
      // The chip is render-guarded on isPlaying, so no state reset needed here.
      clearTimers();
      return undefined;
    }

    // If the player never reaches playing/buffering, the browser blocked
    // autoplay: fall back to muted playback and surface a click-to-start chip.
    if (watchdogRef.current) window.clearTimeout(watchdogRef.current);
    watchdogRef.current = window.setTimeout(() => {
      watchdogRef.current = null;
      const state = playerStateRef.current;
      if (!iframeRef.current || !isPlayingRef.current) return;
      if (state === YT_STATE_PLAYING || state === YT_STATE_BUFFERING) {
        setIsAutoplayBlocked(false);
        return;
      }
      sendYouTubeCommand(iframeRef.current, "mute");
      sendYouTubeCommand(iframeRef.current, "playVideo");
      setIsAutoplayBlocked(true);
    }, AUTOPLAY_WATCHDOG_MS);
    return undefined;
  }, [embedUrl, isPlaying, clearTimers]);

  const handleIframeLoad = () => {
    if (!iframeRef.current) return;
    playerStateRef.current = null;
    sendYouTubeListeningHandshake(iframeRef.current);
    sendYouTubeCommand(iframeRef.current, isPlayingRef.current ? "playVideo" : "pauseVideo");

    // Player API may not be ready immediately on load; retry briefly.
    let attempts = 0;
    if (controlRetryRef.current) {
      window.clearInterval(controlRetryRef.current);
      controlRetryRef.current = null;
    }
    controlRetryRef.current = window.setInterval(() => {
      attempts += 1;
      if (iframeRef.current) {
        sendYouTubeListeningHandshake(iframeRef.current);
        sendYouTubeCommand(
          iframeRef.current,
          isPlayingRef.current ? "playVideo" : "pauseVideo",
        );
      }
      if (attempts >= 8 && controlRetryRef.current) {
        window.clearInterval(controlRetryRef.current);
        controlRetryRef.current = null;
      }
    }, 180);
  };

  const handleUnblockClick = () => {
    if (iframeRef.current) {
      sendYouTubeCommand(iframeRef.current, "unMute");
      sendYouTubeCommand(iframeRef.current, "playVideo");
    }
    setIsAutoplayBlocked(false);
  };

  if (!embedUrl) return null;

  return (
    <>
      <div className="focus-room-music-player" aria-hidden="true">
        <iframe
          ref={iframeRef}
          src={embedUrl}
          title="Focus music"
          onLoad={handleIframeLoad}
          allow="autoplay; encrypted-media; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
      {isAutoplayBlocked && isPlaying ? (
        <button
          className="focus-room-music-unblock"
          onClick={handleUnblockClick}
          type="button"
        >
          <span aria-hidden="true">&#9658;</span> Tap to start music
        </button>
      ) : null}
    </>
  );
}
