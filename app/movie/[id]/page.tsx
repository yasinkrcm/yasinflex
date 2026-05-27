import { Metadata } from 'next';
import { getMovieDetails } from '@/lib/tmdb';
import MovieDetailClient from './MovieDetailClient';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const movie = await getMovieDetails(id);
    return {
      title: `${movie.title || movie.name} - Yasinflex`,
      description: movie.overview?.slice(0, 160),
    };
  } catch {
    return { title: 'Movie - Yasinflex' };
  }
}

export default async function MoviePage({ params }: Props) {
  const { id } = await params;
  return <MovieDetailClient id={id} />;
}
