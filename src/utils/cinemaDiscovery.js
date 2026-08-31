export function assignUniqueGenreMovies(movies, limit = 6) {
  const genreNames = [...new Set(movies.flatMap((movie) => (movie.genres || []).map((genre) => genre.name).filter(Boolean)))];
  const usedMovies = new Set();
  const usedBackdrops = new Set();
  return genreNames.slice(0, limit).flatMap((genre) => {
    const candidates = movies.filter((movie) => movie.backdrop_path && !usedMovies.has(String(movie.id)) && !usedBackdrops.has(movie.backdrop_path) && (movie.genres || []).some((item) => item.name === genre));
    const movie = candidates.find((item) => item.genres?.[0]?.name === genre) || candidates[0];
    if (!movie) return [];
    usedMovies.add(String(movie.id)); usedBackdrops.add(movie.backdrop_path);
    return [[genre, movie]];
  });
}

export const wrapCarouselIndex = (current, direction, length) => length > 0 ? (current + direction + length) % length : 0;
export const nextHeroIndex = (current, length) => wrapCarouselIndex(current, 1, length);
