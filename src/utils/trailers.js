export const HERO_INTERVAL_MS = 8000;

export function rankTrailers(videos, originalLanguage = 'en') {
  const languages = [...new Set(['es', 'en', originalLanguage])];
  const languageRank = (video) => {
    const index = languages.indexOf(video.iso_639_1);
    return index < 0 ? languages.length : index;
  };
  return [...new Map(videos.filter((video) => video.site === 'YouTube' && video.type === 'Trailer' && /^[\w-]{11}$/.test(video.key || '')).map((video) => [video.key, video])).values()]
    .sort((a, b) => Number(Boolean(b.official)) - Number(Boolean(a.official)) || languageRank(a) - languageRank(b) || String(b.published_at || '').localeCompare(String(a.published_at || '')));
}

export function canAnimateHero({ visible, hidden, modalOpen, paused, reduced }) {
  return visible && !hidden && !modalOpen && !paused && !reduced;
}
