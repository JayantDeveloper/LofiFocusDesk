import { useMemo } from "react";
import { buildYouTubeEmbedUrl } from "../utils/music";

export function RoomMusicPlayer({ isPlaying, sourceUrl }) {
  const embedUrl = useMemo(() => buildYouTubeEmbedUrl(sourceUrl), [sourceUrl]);

  if (!isPlaying || !embedUrl) {
    return null;
  }

  return (
    <div className="focus-room-music-player" aria-hidden="true">
      <iframe
        key={embedUrl}
        src={embedUrl}
        title="Focus music"
        allow="autoplay; encrypted-media; picture-in-picture"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}
