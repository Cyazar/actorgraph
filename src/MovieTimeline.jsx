import './MovieTimeline.css';

export default function MovieTimeline({ movies }) {
  if (!movies || movies.length === 0) return null;

  const sorted = [...movies]
    .filter((m) => m.release_date && m.release_date.trim() !== '')
    .sort((a, b) => a.release_date.localeCompare(b.release_date));


  return (
    <div className="timeline-container">
    {sorted.map((movie) => (
        <a
        key={movie.id}
        href={`https://www.themoviedb.org/movie/${movie.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="timeline-item"
        >
        <div className="timeline-year">{movie.release_date.split('-')[0]}</div>
        <img
            src={
            movie.poster_path
                ? `https://image.tmdb.org/t/p/w154${movie.poster_path}`
                : '/actorgraph/no_photo.jpg'
            }
            alt={movie.title}
            className="timeline-poster"
            onError={(e) => {
                e.target.onerror = null; // prevent infinite loop
                e.target.src = '/actorgraph/no_photo.jpg';
              }}
        />
        <div className="timeline-title">{movie.title}</div>
        </a>
    ))}
    </div>

  );
}
