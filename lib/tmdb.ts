const TMDB_BASE = 'https://api.themoviedb.org/3';
const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || '';

export const IMG_BASE = 'https://image.tmdb.org/t/p';
export const IMG_PROXY = 'https://wsrv.nl/?url=';

export function proxyImg(path: string, size = 'w342') {
  if (!path) return '/placeholder.jpg';
  const url = `${IMG_BASE}/${size}${path}`;
  return `${IMG_PROXY}${encodeURIComponent(url)}&output=webp&q=70&n=-1`;
}

async function fetcher<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${TMDB_BASE}${endpoint}`);
  url.searchParams.set('api_key', API_KEY);
  url.searchParams.set('language', 'en-US');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
  return res.json();
}

export interface TMDBMovie {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  media_type?: string;
  runtime?: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
  tagline?: string;
  status?: string;
}

export interface TMDBCast {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export interface TMDBSeason {
  id: number;
  season_number: number;
  episode_count: number;
  name: string;
  poster_path: string | null;
}

export interface TMDBEpisode {
  id: number;
  episode_number: number;
  name: string;
  overview: string;
  still_path: string | null;
  air_date: string;
  runtime: number;
}

export interface TMDBVideo {
  key: string;
  site: string;
  type: string;
}

export interface TMDBListResult<T> {
  results: T[];
  total_pages: number;
  total_results: number;
  page: number;
}

// Home page data
export async function getTrending(mediaType: 'movie' | 'tv' | 'all' = 'all', timeWindow: 'day' | 'week' = 'week') {
  return fetcher<TMDBListResult<TMDBMovie>>(`/trending/${mediaType}/${timeWindow}`);
}

export async function getPopularMovies(page = 1) {
  return fetcher<TMDBListResult<TMDBMovie>>('/movie/popular', { page: String(page) });
}

export async function getPopularTV(page = 1) {
  return fetcher<TMDBListResult<TMDBMovie>>('/tv/popular', { page: String(page) });
}

export async function getNowPlaying(page = 1) {
  return fetcher<TMDBListResult<TMDBMovie>>('/movie/now_playing', { page: String(page) });
}

export async function getTopRatedMovies(page = 1) {
  return fetcher<TMDBListResult<TMDBMovie>>('/movie/top_rated', { page: String(page) });
}

export async function getUpcomingMovies(page = 1) {
  return fetcher<TMDBListResult<TMDBMovie>>('/movie/upcoming', { page: String(page) });
}

export async function getAiringToday(page = 1) {
  return fetcher<TMDBListResult<TMDBMovie>>('/tv/airing_today', { page: String(page) });
}

// Detail pages
export async function getMovieDetails(id: string) {
  return fetcher<TMDBMovie>(`/movie/${id}`);
}

export async function getTVDetails(id: string) {
  return fetcher<TMDBMovie>(`/tv/${id}`);
}

export async function getMovieCredits(id: string) {
  return fetcher<{ cast: TMDBCast[] }>(`/movie/${id}/credits`);
}

export async function getTVCredits(id: string) {
  return fetcher<{ cast: TMDBCast[] }>(`/tv/${id}/credits`);
}

export async function getMovieVideos(id: string) {
  return fetcher<{ results: TMDBVideo[] }>(`/movie/${id}/videos`);
}

export async function getTVVideos(id: string) {
  return fetcher<{ results: TMDBVideo[] }>(`/tv/${id}/videos`);
}

export async function getSimilarMovies(id: string) {
  return fetcher<TMDBListResult<TMDBMovie>>(`/movie/${id}/similar`);
}

export async function getSimilarTV(id: string) {
  return fetcher<TMDBListResult<TMDBMovie>>(`/tv/${id}/similar`);
}

export async function getMovieRecommendations(id: string) {
  return fetcher<TMDBListResult<TMDBMovie>>(`/movie/${id}/recommendations`);
}

export async function getTVRecommendations(id: string) {
  return fetcher<TMDBListResult<TMDBMovie>>(`/tv/${id}/recommendations`);
}

export async function getTVSeasonDetails(tvId: string, season: number) {
  return fetcher<{ episodes: TMDBEpisode[]; name: string; season_number: number }>(`/tv/${tvId}/season/${season}`);
}

// Search
export async function searchMulti(query: string, page = 1) {
  return fetcher<TMDBListResult<TMDBMovie>>('/search/multi', { query, page: String(page) });
}

export async function searchMovies(query: string, page = 1) {
  return fetcher<TMDBListResult<TMDBMovie>>('/search/movie', { query, page: String(page) });
}

export async function searchTV(query: string, page = 1) {
  return fetcher<TMDBListResult<TMDBMovie>>('/search/tv', { query, page: String(page) });
}

// Genres
export async function getMovieGenres() {
  return fetcher<{ genres: { id: number; name: string }[] }>('/genre/movie/list');
}

export async function getTVGenres() {
  return fetcher<{ genres: { id: number; name: string }[] }>('/genre/tv/list');
}

export async function discoverMovies(params: Record<string, string>) {
  return fetcher<TMDBListResult<TMDBMovie>>('/discover/movie', params);
}

export async function discoverTV(params: Record<string, string>) {
  return fetcher<TMDBListResult<TMDBMovie>>('/discover/tv', params);
}

// Embed URL builders
export function getEmbedURL(type: 'movie' | 'tv', id: number, season?: number, episode?: number) {
  if (type === 'movie') {
    return `https://vidsrc.me/embed/movie?tmdb=${id}`;
  }
  return `https://vidsrc.me/embed/tv?tmdb=${id}&season=${season ?? 1}&episode=${episode ?? 1}`;
}

export function getDisplayTitle(item: TMDBMovie) {
  return item.title || item.name || 'Unknown';
}

export function getDisplayDate(item: TMDBMovie) {
  return item.release_date || item.first_air_date || '';
}

export function getYear(item: TMDBMovie) {
  const date = getDisplayDate(item);
  return date ? new Date(date).getFullYear() : '';
}

export function formatRating(rating: number) {
  return rating.toFixed(1);
}

export const GENRE_MAP: Record<number, string> = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
  80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
  14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
  9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 10770: 'TV Movie',
  53: 'Thriller', 10752: 'War', 37: 'Western',
  10759: 'Action & Adventure', 10762: 'Kids', 10763: 'News',
  10764: 'Reality', 10765: 'Sci-Fi & Fantasy', 10766: 'Soap',
  10767: 'Talk', 10768: 'War & Politics',
};
