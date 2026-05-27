import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-logo">Yasin<span>flex</span></div>
      <div className="footer-links">
        <Link href="/movies">Movies</Link>
        <Link href="/tv">TV Shows</Link>
        <Link href="/search">Browse</Link>
        <Link href="/watchlist">Watchlist</Link>
      </div>
      <p className="footer-disclaimer">
        Yasinflex does not store any files on its servers. All content is provided by non-affiliated third parties.
        This site is for educational purposes only.
      </p>
    </footer>
  );
}
