const MUSIC_VIDEO_ID = "6Wurxv2x9cA";
const MUSIC_EMBED_URL = `https://www.youtube.com/embed/${MUSIC_VIDEO_ID}?autoplay=1&controls=0&loop=1&playlist=${MUSIC_VIDEO_ID}&rel=0&modestbranding=1`;

export function RoomMusicPlayer({ isPlaying }) {
  if (!isPlaying) {
    return null;
  }

  return (
    <div className="focus-room-music-player" aria-hidden="true">
      <iframe
        src={MUSIC_EMBED_URL}
        title="Focus music"
        allow="autoplay; encrypted-media; picture-in-picture"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}
