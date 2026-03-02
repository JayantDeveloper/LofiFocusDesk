import { useEffect, useMemo, useRef, useState } from "react";
import { buildYouTubeEmbedUrl } from "../utils/music";

export function RoomMusicPlayer({ isPlaying, sourceUrl }) {
  const embedUrl = useMemo(() => buildYouTubeEmbedUrl(sourceUrl), [sourceUrl]);
  const [activeEmbedUrl, setActiveEmbedUrl] = useState(null);
  const swapTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (swapTimeoutRef.current) {
        window.clearTimeout(swapTimeoutRef.current);
        swapTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (swapTimeoutRef.current) {
      window.clearTimeout(swapTimeoutRef.current);
      swapTimeoutRef.current = null;
    }

    if (!isPlaying || !embedUrl) {
      setActiveEmbedUrl(null);
      return;
    }

    setActiveEmbedUrl((currentUrl) => {
      if (!currentUrl) {
        return embedUrl;
      }
      if (currentUrl === embedUrl) {
        return currentUrl;
      }

      // Hard-stop the old player before mounting the next one.
      swapTimeoutRef.current = window.setTimeout(() => {
        setActiveEmbedUrl(embedUrl);
        swapTimeoutRef.current = null;
      }, 140);

      return null;
    });
  }, [embedUrl, isPlaying]);

  if (!isPlaying || !activeEmbedUrl) return null;

  return (
    <div className="focus-room-music-player" aria-hidden="true">
      <iframe
        key={activeEmbedUrl}
        src={activeEmbedUrl}
        title="Focus music"
        allow="autoplay; encrypted-media; picture-in-picture"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}
