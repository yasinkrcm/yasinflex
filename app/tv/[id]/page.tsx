import { Metadata } from 'next';
import { getTVDetails } from '@/lib/tmdb';
import TVDetailClient from './TVDetailClient';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const show = await getTVDetails(id);
    return {
      title: `${show.name || show.title} - Yasinflex`,
      description: show.overview?.slice(0, 160),
    };
  } catch {
    return { title: 'TV Show - Yasinflex' };
  }
}

export default async function TVPage({ params }: Props) {
  const { id } = await params;
  return <TVDetailClient id={id} />;
}
