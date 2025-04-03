import { useState, useRef, useEffect } from "react";
import Fuse from "fuse.js";
import { searchActors, getActorDetails } from "./api";
import ActorGraph from "./ActorGraph";
import Slider from '@mui/material/Slider';
import Box from '@mui/material/Box';
import { useCallback } from "react";

function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selectedActor, setSelectedActor] = useState(null);
  const [colleagues, setColleagues] = useState([]);
  const graphContainerRef = useRef(null);
  const [graphHeight, setGraphHeight] = useState(400);
  const [yearRange, setYearRange] = useState([1980, 2025]);       // selected range
  const [availableYears, setAvailableYears] = useState([1980, 2025]); // dynamic min/max
  const [selectedActorId, setSelectedActorId] = useState(null);
  const [allMovies, setAllMovies] = useState([]);

  
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

  const handleSearch = async (e) => {
    const value = e.target.value;
    setQuery(value);
    if (value.length > 2) {
      const data = await searchActors(value);
      const fuse = new Fuse(data, { keys: ["name"], threshold: 0.3 });
      setResults(fuse.search(value).map((r) => r.item));
    } else {
      setResults([]);
    }
  };

  const handleSelectById = useCallback(async (actorId) => {
    try {
      const details = await getActorDetails(actorId);
      const movies = details.movie_credits.cast || [];
  
      setSelectedActor(details);
      setSelectedActorId(actorId);
      setQuery(details.name);
      setAllMovies(movies); // 👈 store all movies once
  
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
  
  
  const handleSelect = useCallback(async (actor) => {
    try{

      const details = await getActorDetails(actor.id);
      const movies = details.movie_credits.cast || [];
      setSelectedActor(details);
      setSelectedActorId(actor.id);
      setQuery(details.name);
      setAllMovies(movies); // 👈 store all movies once
  
      const years = movies
        .map(m => parseInt(m.release_date?.split("-")[0]))
        .filter(y => !isNaN(y));
      if (years.length) {
        const minYear = Math.min(...years);
        const maxYear = Math.max(...years);
        setAvailableYears([minYear, maxYear]);
        setYearRange([minYear, maxYear]); // reset slider
      }

    // const coStarCounts = new Map();

    // for (const movie of movies) { // limit to 10 movies to reduce API hits
    //   const year = parseInt(movie.release_date?.split("-")[0]);
    //   if (isNaN(year) || year < yearRange[0] || year > yearRange[1]) {
    //     continue;
    //   }
    //   const movieDetails = await fetch(
    //     `https://api.themoviedb.org/3/movie/${movie.id}/credits?api_key=${import.meta.env.VITE_TMDB_API_KEY}`
    //   );
    //   const credits = await movieDetails.json();
    //   credits.cast.forEach((person) => {
    //     if (person.id !== actor.id) {
    //       const existing = coStarCounts.get(person.id);
    //       if (existing) {
    //         existing.count += 1;
    //       } else {
    //         coStarCounts.set(person.id, { ...person, count: 1 });
    //       }
    //     }
    //   });
  //   }
    
  // // 🔢 Sort by shared movie count and take top 100
  // const sortedCoStars = Array.from(coStarCounts.values())
  //   .sort((a, b) => b.count - a.count)
  //   .slice(0, 100);

  // setColleagues(sortedCoStars);
  
    } catch (err) {
      console.error("Error loading actor:", err);
    }
  }, []);
  
  useEffect(() => {
    const fetchColleagues = async () => {
      if (!selectedActorId || allMovies.length === 0) return;
  
      const coStarCounts = new Map();
  
      for (const movie of allMovies) {
        const year = parseInt(movie.release_date?.split("-")[0]);
        if (isNaN(year) || year < yearRange[0] || year > yearRange[1]) continue;
  
        const response = await fetch(
          `https://api.themoviedb.org/3/movie/${movie.id}/credits?api_key=${import.meta.env.VITE_TMDB_API_KEY}`
        );
        const credits = await response.json();
  
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
        .sort((a, b) => b.count - a.count)
        .slice(0, 100);
  
      setColleagues(sortedCoStars);
    };
  
    fetchColleagues();
  }, [yearRange, selectedActorId, allMovies]);
  



  return (
    <div style={{ width: "100vw", height: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "10px" }}>
        <input
          type="text"
          placeholder="Search actors/actresses..."
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


        <ul>
          {results.map((actor) => (
            <li key={actor.id} onClick={() => handleSelect(actor)} style={{ cursor: "pointer" }}>
              {actor.name}
            </li>
          ))}
        </ul>
      </div>
      <div style={{ flex: 1 }} ref={graphContainerRef}>
      <ActorGraph
        actor={selectedActor}
        colleagues={colleagues}
        height={graphHeight}
        onSelectActor={handleSelectById}
      />
      </div>
    </div>
  );
}

export default App;
