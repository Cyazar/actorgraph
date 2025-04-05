import ForceGraph2D from "react-force-graph-2d";
import { useRef, useEffect, useMemo, useState } from "react";
import SharedMoviesModal from './SharedMoviesModal';
import * as d3 from 'd3';

export default function ActorGraph({ actor, colleagues, height, onSelectActor, allMovies, setLoading }) {
  const fgRef = useRef();
  const clickTimeout = useRef(null);
  const minDistance = 60;
  const btwMinDistance = 20;
  const btwMaxDistance = 50;
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [sharedMovies, setSharedMovies] = useState([]);

  // Find the max count among co-stars
  const maxCount = Math.max(...colleagues.map(c => c.count || 1), 1);

  const fetchSharedMovies = async (targetId) => {
    const response = await fetch(
      `https://api.themoviedb.org/3/person/${targetId}/movie_credits?api_key=${import.meta.env.VITE_TMDB_API_KEY}`
    );
    const targetCredits = await response.json();
    const targetMovies = targetCredits.cast.map((m) => m.id);
  
    const shared = allMovies.filter((movie) => targetMovies.includes(movie.id));
    return shared;
  };

  // Memoize node/link data only when actor/colleagues change
  const { nodes, links } = useMemo(() => {
    if (!actor) return { nodes: [], links: [] };

    const imageBase = "https://image.tmdb.org/t/p/w92";

    const nodes = [
      { id: actor.id, name: actor.name, main: true, fx: 0, fy: 0, image: actor.profile_path ? imageBase + actor.profile_path : null, },
      ...colleagues.map((col, i) => {
        const angle = Math.random() * 2 * Math.PI;
        const dist = 200 + Math.random() * 100;
        return {
          id: col.id,
          name: col.name,
          count: col.count,
          image: col.profile_path ? imageBase + col.profile_path : null,
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist,
        };
      }),
    ];

    const links = colleagues.map((col) => {
      const normalized = maxCount - col.count 
      const distance = (btwMinDistance + (btwMaxDistance - btwMinDistance) * Math.random()) * normalized + minDistance
      return {
        source: actor.id,
        target: col.id,
        distance: distance,
      }
    });

    return { nodes, links };
  }, [actor, colleagues]);

  // Force simulation to reapply custom distances
  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.d3Force("link").distance((link) => link.distance);
      fgRef.current.d3ReheatSimulation();
      fgRef.current.d3Force('collision', d3.forceCollide(node => {
        const size = node.main ? 12 : Math.min(4 + (node.count || 1) * 3, 20);
        return size + 10; // add small buffer
      }));
    
    }
  }, [nodes, links]);

  //if (!actor) return null;
  const imageCache = {};
  return (
    <div style={{ width: "100%", height: height || 400 }}>
      <ForceGraph2D
        ref={fgRef}
        graphData={{ nodes, links }}
        nodeLabel={(node) =>
          node.main
            ? `${node.name} (Selected)`
            : `${node.name} — ${node.count || 1} shared movie(s)`
        }
        onNodeClick={(node) => {
          // Cancel existing click if it's a double-click
          if (clickTimeout.current) {
            clearTimeout(clickTimeout.current);
            clickTimeout.current = null;
      
            // 🔁 Double-click: update selected actor
            if (!node.main) {
              onSelectActor(node.id);
            }
          } else {
            // ⏱️ Single-click: wait to see if it's a double-click
            clickTimeout.current = setTimeout(() => {
              (async () => {
                clickTimeout.current = null;

                if (!node.main) {
                  const shared = await fetchSharedMovies(node.id);
                  setSelectedNode(node);
                  setSharedMovies(shared);
                  setModalOpen(true);
                }
              })();
            }, 250); // ~250ms window for detecting double click
          }
        }}
        backgroundColor="#f1faee"
        nodePointerAreaPaint={(node, color, ctx) => {
          const radius = node.main ? 12 : Math.min(4 + (node.count || 1) * 3, 20);
          ctx.beginPath();
          ctx.arc(node.x, node.y, radius + 5, 0, 2 * Math.PI, false); // expand hit area
          ctx.fillStyle = color;
          ctx.fill();
        }}
        
        nodeCanvasObject={(node, ctx) => {
          const radius = node.main ? 20 : Math.min(10 + (node.count || 1) * 2, 24);
          const fontSize = 10;
        
          if (node.image) {
            if (!imageCache[node.image]) {
              const img = new Image();
              img.src = node.image;
              imageCache[node.image] = img;
            }
        
            const img = imageCache[node.image];
            if (img.complete && img.naturalWidth !== 0) {
              ctx.save();
              try {
                
                ctx.beginPath();
                ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(img, node.x - radius, node.y - radius, radius * 2, radius * 2);
                
              } catch (err) {
                console.error("Error loading actor:", err);
              } finally {
                ctx.restore();
              }

            } else {
              // fallback while loading
              ctx.beginPath();
              ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
              ctx.fillStyle = "#ccc";
              ctx.fill();
            }
          } else {
            // no image — fallback to color circle
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
            ctx.fillStyle = node.main ? "#e63946" : "#457b9d";
            ctx.fill();
          }
        
          // Draw label below
          // ctx.font = `${fontSize}px Sans-Serif`;
          // ctx.textAlign = "center";
          // ctx.textBaseline = "top";
          // ctx.fillStyle = "#000";
          // ctx.fillText(node.name, node.x, node.y + radius + 4);
        }}
        onEngineStop={() => setLoading?.(false)}
        onEngineStart={() => setLoading?.(true)}
        
      />
      <SharedMoviesModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        mainActor={actor}
        coActor={selectedNode}
        sharedMovies={sharedMovies}
      />


    </div>
  );
}
