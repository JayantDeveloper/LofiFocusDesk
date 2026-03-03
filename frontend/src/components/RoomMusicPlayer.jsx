import { useEffect, useMemo, useRef } from "react";
import { buildYouTubeEmbedUrl } from "../utils/music";

function sendYouTubeCommand(iframe, command) {
  if (!iframe?.contentWindow) return;
  iframe.contentWindow.postMessage(
    JSON.stringify({
      event: "command",
      func: command,
      args: [],
    }),
    "*",
  );
}

export function RoomMusicPlayer({ isPlaying, sourceUrl }) {
  const embedUrl = useMemo(() => buildYouTubeEmbedUrl(sourceUrl), [sourceUrl]);
  const iframeRef = useRef(null);
  const controlRetryRef = useRef(null);

  useEffect(() => {
    return () => {
      if (controlRetryRef.current) {
        window.clearInterval(controlRetryRef.current);
        controlRetryRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!embedUrl || !iframeRef.current) return;
    sendYouTubeCommand(iframeRef.current, isPlaying ? "playVideo" : "pauseVideo");
  }, [embedUrl, isPlaying]);

  const handleIframeLoad = () => {
    if (!iframeRef.current) return;
    sendYouTubeCommand(iframeRef.current, isPlaying ? "playVideo" : "pauseVideo");

    // Player API may not be ready immediately on load; retry briefly.
    let attempts = 0;
    if (controlRetryRef.current) {
      window.clearInterval(controlRetryRef.current);
      controlRetryRef.current = null;
    }
    controlRetryRef.current = window.setInterval(() => {
      attempts += 1;
      if (!iframeRef.current) return;
      sendYouTubeCommand(iframeRef.current, isPlaying ? "playVideo" : "pauseVideo");
      if (attempts >= 8 && controlRetryRef.current) {
        window.clearInterval(controlRetryRef.current);
        controlRetryRef.current = null;
      }
    }, 180);
  };

  if (!embedUrl) return null;

  return (
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
  );
}
