import axios from "axios";

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";

export const searchActors = async (query, totalPages = 1) => {
  const response = await axios.get(`${BASE_URL}/search/person`, {
    params: { api_key: API_KEY, query, totalPages },
  });
  return response.data.results;
};

export const getActorDetails = async (actorId) => {
  const response = await axios.get(`${BASE_URL}/person/${actorId}`, {
    params: { api_key: API_KEY, append_to_response: "movie_credits" },
  });
  return response.data;
};
