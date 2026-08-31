export const PREVIEW_SECONDS = 8;

export function rankTrailers(videos, originalLanguage = 'en') {
  const languages = [...new Set(['es', 'en', originalLanguage])];
  const languageRank = (video) => {
    const index = languages.indexOf(video.iso_639_1);
    return index < 0 ? languages.length : index;
  };
  return [...new Map(videos.filter((video) => video.site === 'YouTube' && video.type === 'Trailer' && /^[\w-]{11}$/.test(video.key || '')).map((video) => [video.key, video])).values()]
    .sort((a, b) => Number(Boolean(b.official)) - Number(Boolean(a.official)) || languageRank(a) - languageRank(b) || String(b.published_at || '').localeCompare(String(a.published_at || '')));
}

export function canPlayPreview({ visible, hidden, modalOpen, paused }) {
  return visible && !hidden && !modalOpen && !paused;
}

// Only actual PLAYING time counts; buffering and visibility pauses do not.
export function createPlaybackClock(limit = PREVIEW_SECONDS * 1000) {
  let elapsed = 0;
  let started = null;
  return {
    update(playing, now) {
      if (started !== null) elapsed += Math.max(0, now - started);
      started = playing ? now : null;
      return elapsed >= limit;
    },
    reset() { elapsed = 0; started = null; },
  };
}
