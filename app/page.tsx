import Navbar from '@/components/Navbar';
import HeroSlider from '@/components/HeroSlider';
import ContinueWatchingRow from '@/components/ContinueWatchingRow';
import { MovieRow } from '@/components/MovieCard';
import Footer from '@/components/Footer';
import {
  getTrending,
  getPopularMovies,
  getPopularTV,
  getNowPlaying,
  getTopRatedMovies,
  getAiringToday,
} from '@/lib/tmdb';

export default async function HomePage() {
  const [trending, popular, popularTV, nowPlaying, topRated, airingToday] = await Promise.all([
    getTrending('all', 'week').catch(() => ({ results: [] })),
    getPopularMovies().catch(() => ({ results: [] })),
    getPopularTV().catch(() => ({ results: [] })),
    getNowPlaying().catch(() => ({ results: [] })),
    getTopRatedMovies().catch(() => ({ results: [] })),
    getAiringToday().catch(() => ({ results: [] })),
  ]);

  const heroMovies = trending.results.filter(m => m.backdrop_path).slice(0, 8);

  return (
    <>
      <Navbar />
      <main>
        <HeroSlider movies={heroMovies} />

        {/* Continue Watching Section */}
        <ContinueWatchingRow />

        <MovieRow
          title="Trending This Week"
          movies={trending.results.slice(0, 20)}
          viewAllHref="/movies"
        />

        <MovieRow
          title="Popular Movies"
          movies={popular.results}
          mediaType="movie"
          viewAllHref="/movies"
        />

        <MovieRow
          title="Now Playing"
          movies={nowPlaying.results}
          mediaType="movie"
          viewAllHref="/movies"
        />

        <MovieRow
          title="Popular TV Shows"
          movies={popularTV.results}
          mediaType="tv"
          viewAllHref="/tv"
        />

        <MovieRow
          title="Top Rated Movies"
          movies={topRated.results}
          mediaType="movie"
          viewAllHref="/movies"
        />

        <MovieRow
          title="Airing Today"
          movies={airingToday.results}
          mediaType="tv"
          viewAllHref="/tv"
        />
      </main>
      <Footer />
    </>
  );
}
