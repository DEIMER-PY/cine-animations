import { useEffect, useRef } from 'react';
import { loadYouTubeAPI, pauseOtherPlayers, registerPlayer } from '../lib/youtube';

export default function YouTubePlayer({ videoId, title, playing = true, muted = false, onState, onError, onBlocked }) {
  const host = useRef(null);
  const player = useRef(null);
  const ready = useRef(false);
  const latest = useRef({ playing, muted, onState, onError, onBlocked });
  latest.current = { playing, muted, onState, onError, onBlocked };

  useEffect(() => {
    let disposed = false;
    let unregister;
    const root = host.current;
    const mount = document.createElement('div');
    root.replaceChildren(mount);
    ready.current = false;
    loadYouTubeAPI().then((YT) => {
      if (disposed) return;
      player.current = new YT.Player(mount, {
        host: 'https://www.youtube-nocookie.com', videoId,
        playerVars: { autoplay: 0, playsinline: 1, rel: 0, origin: window.location.origin },
        events: {
          onReady: ({ target }) => {
            if (disposed) return;
            ready.current = true;
            target.getIframe().title = title || 'Trailer';
            target.getIframe().setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
            if (latest.current.muted) target.mute();
            if (latest.current.playing) { pauseOtherPlayers(target); target.playVideo(); }
          },
          onStateChange: ({ data, target }) => {
            if (disposed) return;
            if (data === 1) {
              if (!latest.current.playing || document.hidden) { target.pauseVideo(); return; }
              pauseOtherPlayers(target);
            }
            latest.current.onState?.(data);
          },
          onError: ({ data }) => { if (!disposed) latest.current.onError?.(data); },
          onAutoplayBlocked: () => { if (!disposed) latest.current.onBlocked?.(); },
        },
      });
      unregister = registerPlayer(player.current);
    }).catch((error) => { if (!disposed) latest.current.onError?.(error.message); });
    const hide = () => { if (document.hidden && ready.current) player.current?.pauseVideo(); };
    document.addEventListener('visibilitychange', hide);
    return () => {
      disposed = true;
      ready.current = false;
      unregister?.();
      document.removeEventListener('visibilitychange', hide);
      player.current?.destroy();
      player.current = null;
      root.replaceChildren();
    };
  }, [videoId, title]);

  useEffect(() => {
    if (!ready.current || !player.current) return;
    if (muted) player.current.mute();
    else player.current.unMute();
    if (playing) { pauseOtherPlayers(player.current); player.current.playVideo(); }
    else player.current.pauseVideo();
  }, [playing, muted]);
  return <div className="youtube-player" ref={host} />;
}
