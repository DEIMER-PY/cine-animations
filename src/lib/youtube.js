let apiPromise;
const players = new Set();

export function loadYouTubeAPI() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve, reject) => {
    let interval;
    const finish = (error) => {
      clearInterval(interval);
      clearTimeout(timeout);
      if (error) { document.querySelector('script[data-cine-youtube]')?.remove(); apiPromise = null; reject(error); }
      else resolve(window.YT);
    };
    const timeout = setTimeout(() => finish(new Error('YouTube no respondió. Reintenta la reproducción.')), 15000);
    interval = setInterval(() => { if (window.YT?.Player) finish(); }, 50);
    if (!document.querySelector('script[data-cine-youtube]')) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.dataset.cineYoutube = 'true';
      script.async = true;
      script.onerror = () => { script.remove(); finish(new Error('No se pudo conectar con YouTube.')); };
      document.head.appendChild(script);
    }
  });
  return apiPromise;
}

export function registerPlayer(player) {
  players.add(player);
  return () => players.delete(player);
}

export function pauseOtherPlayers(current) {
  players.forEach((player) => { if (player !== current) player.pauseVideo?.(); });
}
