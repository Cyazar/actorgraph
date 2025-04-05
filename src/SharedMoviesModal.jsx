import * as Dialog from '@radix-ui/react-dialog';
import './SharedMoviesModel.css'; // import your styles
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';

export default function SharedMoviesModal({ open, onOpenChange, mainActor,
                                            coActor, sharedMovies }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content className="modal-content">
          <Dialog.Title> <VisuallyHidden.Root>"Movies"</VisuallyHidden.Root></Dialog.Title>
       
        <div className="actor-photos">
        {mainActor && (
          <div className="actor">
            <img
              src={`https://image.tmdb.org/t/p/w185${mainActor.profile_path}`}
              alt={mainActor.name}
            />
            <div className="actor-name">{mainActor.name}</div>
          </div>
        )}
          <span className="versus">⇄</span>
        {coActor && (
          <div className="actor">
            <img
              src={`https://image.tmdb.org/t/p/w185${coActor.image}`}
              alt={coActor.name}
            />
            <div className="actor-name">{coActor.name}</div>
          </div>
        )}
        </div>


          <Dialog.Description className="modal-description">
            These are the movies both actors appeared in together.
          </Dialog.Description>

          {sharedMovies.length > 0 ? (
            <ul className="movie-list">
              {sharedMovies.map((movie) => (
                   <li key={movie.id} className="movie-item-with-poster">
                   <img
                     src={
                       movie.poster_path
                         ? `https://image.tmdb.org/t/p/w92${movie.poster_path}`
                         : '/actorgraph/no_photo.jpg'
                     }
                     alt={movie.title}
                     className="movie-poster"
                   />
                   <a
                     href={`https://www.themoviedb.org/movie/${movie.id}`}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="movie-link"
                   >
                     {movie.title} ({movie.release_date?.split('-')[0]})
                   </a>
                 </li>
              ))}
            </ul>
          ) : (
            <p className="no-movies">No shared movies found.</p>
          )}

          <div className="modal-actions">
            <Dialog.Close asChild>
              <button className="close-button">Close</button>
            </Dialog.Close>
            <Dialog.Close asChild>
              <button className="modal-close-button" aria-label="Close">
                &times;
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
