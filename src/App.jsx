import { useState, useRef, useEffect } from "react";
import Fuse from "fuse.js";
import { searchActors, getActorDetails, getMovieCredits } from "./api";
import ActorGraph from "./ActorGraph";
import MovieTimeline from "./MovieTimeline";
import Slider from '@mui/material/Slider';
import Box from '@mui/material/Box';
import { useCallback } from "react";

function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selectedActor, setSelectedActor] = useState(null);
  const [colleagues, setColleagues] = useState([]);
  const graphContainerRef = useRef(null);
  const [graphHeight, setGraphHeight] = useState(800);
  const [yearRange, setYearRange] = useState([1980, 2025]);       // selected range
  const [availableYears, setAvailableYears] = useState([1980, 2025]); // dynamic min/max
  const [selectedActorId, setSelectedActorId] = useState(null);
  const [allMovies, setAllMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    // Get preference from localStorage if available
    return localStorage.getItem('theme') === 'dark';
  });

  
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      if (graphContainerRef.current) {
        const height = graphContainerRef.current.clientHeight;
        setGraphHeight(height);
      }
    });
    if (graphContainerRef.current) observer.observe(graphContainerRef.current);
    return () => observer.disconnect();
  }, []);
  
  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const handleSearch = async (e) => {
    const value = e.target.value;
    setQuery(value);
    if (value.length > 2) {
      const data = await searchActors(value, 2);

      const filtered = data.filter(actor => {
        // Keep only names with at least two words
        return actor.name.trim().split(" ").length > 1;
      });
      // Filter out actors without profile pictures
      const withPhotos = filtered.filter(actor => actor.profile_path);
      // Sort by popularity (highest first)
      const fuse = new Fuse(withPhotos, { keys: ['name'], threshold: 0.3 });
      const fuzzyResults = fuse.search(value).map(r => r.item);
      
      // Then sort by popularity
      fuzzyResults.sort((a, b) => b.popularity - a.popularity);
      
      setResults(fuzzyResults.slice(0, 5));
    } else {
      setResults([]);
    }
  };

  const handleSelectById = useCallback(async (actorId) => {
    setColleagues([]);  // removes old co-stars
    setAllMovies([]);   // (optional) clear shared movie data
    setSelectedActor(null); // (optional) clear previous actor temporarily

    if (loading) return;
    try {
      const details = await getActorDetails(actorId);
      
      var movies = details.movie_credits.cast || [];
      console.log(movies)
      movies.sort((a,b) => Number(b.release_date?.split('-')[0]) - Number(a.release_date?.split('-')[0]))
      setSelectedActor(details);
      setSelectedActorId(actorId);
      setQuery(details.name);
      setAllMovies(movies); // 👈 store all movies once
      
      if (details.profile_path) {
        const img = new Image();
        img.src = `https://image.tmdb.org/t/p/w185${details.profile_path}`;
        details.image = img;
      }

      const years = movies
        .map(m => parseInt(m.release_date?.split("-")[0]))
        .filter(y => !isNaN(y));
      if (years.length) {
        const minYear = Math.min(...years);
        const maxYear = Math.max(...years);
        setAvailableYears([minYear, maxYear]);
        setYearRange([minYear, maxYear]); // reset slider
      }
  
    } catch (err) {
      console.error("Error loading actor:", err);
    }
  }, []);
  
  
  const handleSelect = async (actor) => {
    setQuery(actor.name);         // fill search input
    setResults([]);               // ✅ clear suggestions
    setSelectedActorId(actor.id); // store ID
    await handleSelectById(actor.id); // load graph data
  };
  
  
  useEffect(() => {
    const fetchColleagues = async () => {
      if (!selectedActorId || allMovies.length === 0) return;
  
      const coStarCounts = new Map();
  
      for (const movie of allMovies) {
        const year = parseInt(movie.release_date?.split("-")[0]);
        if (isNaN(year) || year < yearRange[0] || year > yearRange[1]) continue;
  
        const credits = await getMovieCredits(movie.id)
  
        credits.cast.forEach((person) => {
          if (person.id !== selectedActorId) {
            const existing = coStarCounts.get(person.id);
            if (existing) {
              existing.count += 1;
            } else {
              coStarCounts.set(person.id, { ...person, count: 1 });
            }
          }
        });
      }
  
      const sortedCoStars = Array.from(coStarCounts.values())
        .filter(co => co.profile_path)
        .sort((a, b) => b.count - a.count)
        .slice(0, 100);
      sortedCoStars.forEach((co) => {
        if (co.profile_path) {
          const img = new Image();
          img.src = `https://image.tmdb.org/t/p/w185${co.profile_path}`;
          co.image = img;
        }
      });
      setColleagues(sortedCoStars);
    };
  
    fetchColleagues();
  }, [yearRange, selectedActorId, allMovies]);
  

  

  return (
    <div style={{ width: "100vw", height: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "10px" }}>
      <header style={{ padding: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? '🌞 Light Mode' : '🌙 Dark Mode'}
        </button>
      </header>
        <input
          type="text"
          placeholder="Search actors..."
          value={query}
          onChange={handleSearch}
          style={{ width: "100%", padding: "10px", fontSize: "16px" }}
        />
        <Box sx={{ mt: 2, mb: 2, px: 2 }}>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: 8 }}>
            Filter by Year: {yearRange[0]} – {yearRange[1]}
          </label>
          <Slider
            value={yearRange}
            min={availableYears[0]}
            max={availableYears[1]}
            step={1}
            onChange={(e, newVal) => setYearRange(newVal)}
            valueLabelDisplay="auto"
            marks={[
              { value: availableYears[0], label: availableYears[0].toString() },
              { value: availableYears[1], label: availableYears[1].toString() }
            ]}
          />
        </Box>
        


        <ul style={{ listStyle: 'none', padding: 0 }}>
          {results.map(actor => (
            <li
              key={actor.id}
              onClick={() => handleSelect(actor)}
              style={{
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                padding: "6px 10px",
                borderBottom: "1px solid #eee"
              }}
            >
              {actor.profile_path ? (
                <img
                  src={`https://image.tmdb.org/t/p/w92${actor.profile_path}`}
                  alt={actor.name}
                  style={{ width: 40, height: 60, objectFit: 'cover', borderRadius: 4, marginRight: 10 }}
                />
              ) : (
                <div
                  style={{
                    width: 40,
                    height: 60,
                    marginRight: 10,
                    background: "#ccc",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    borderRadius: 4,
                    color: "#555"
                  }}
                >
                  N/A
                </div>
              )}
              <span>{actor.name}</span>
            </li>
          ))}
        </ul>

        <MovieTimeline movies={allMovies} />
      </div>
      
      

      <div style={{ flex: 1 }} ref={graphContainerRef}>

      {loading && (
        <div className="loading-overlay">
          <div className="spinner" />
          <p>Loading graph...</p>
        </div>
      )}
      <ActorGraph
        actor={selectedActor}
        colleagues={colleagues}
        height={graphHeight}
        onSelectActor={handleSelectById}
        allMovies={allMovies}
        setLoading={setLoading}
        darkMode={darkMode}
      />
      </div>
    </div>
  );
}

export default App;
