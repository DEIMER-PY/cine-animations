import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Play, Film } from 'lucide-react'

export default function TrailerModal({ isOpen, onClose, movieId, movieTitle, movieBackdropPath }) {
  const dialogRef = useRef(null)
  const [trailer, setTrailer] = useState(null)
  const [relatedVideos, setRelatedVideos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedVideo, setSelectedVideo] = useState(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen) {
      dialog.showModal()
    } else {
      dialog.close()
    }
  }, [isOpen])

  useEffect(() => {
    if (!movieId) return

    setLoading(true)
    setError(null)
    setTrailer(null)
    setRelatedVideos([])
    setSelectedVideo(null)

    fetch(`https://api.themoviedb.org/3/movie/${movieId}/videos`, {
      headers: {
        Authorization: 'Bearer ' + import.meta.env.VITE_TMDB_TOKEN,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch videos')
        return res.json()
      })
      .then((data) => {
        const ytVideos = (data.results || []).filter((v) => v.site === 'YouTube')
        const trailers = ytVideos.filter((v) => v.type === 'Trailer')
        const mainTrailer = trailers.length > 0 ? trailers[0] : ytVideos[0] || null
        const others = ytVideos.filter((v) => v.key !== mainTrailer?.key)

        setTrailer(mainTrailer)
        setRelatedVideos(others)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [movieId])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    const handleClose = () => onClose()

    dialog.addEventListener('close', handleClose)
    return () => dialog.removeEventListener('close', handleClose)
  }, [onClose])

  useEffect(() => {
    const dialog = dialogRef.current
    return () => {
      if (dialog && dialog.open) dialog.close()
    }
  }, [])

  const handleBackdropClick = (e) => {
    if (e.target === dialogRef.current) {
      onClose()
    }
  }

  const activeVideo = selectedVideo || trailer
  const backdropUrl = movieBackdropPath
    ? `https://image.tmdb.org/t/p/w1280${movieBackdropPath}`
    : null

  return (
    <AnimatePresence>
      {isOpen && (
        <dialog
          ref={dialogRef}
          onClick={handleBackdropClick}
          className="bg-transparent p-0 border-none max-w-none max-h-none w-full h-full backdrop:bg-black/80 backdrop:backdrop-blur-sm"
          style={{ colorScheme: 'dark' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="flex flex-col items-center w-full max-w-[min(96vw,56rem)] mx-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="fixed top-4 right-4 z-50 glass-panel-tight rounded-full p-2 text-white hover:bg-white/20 transition-colors cursor-pointer"
              aria-label="Close trailer"
            >
              <X size={22} />
            </button>

            <div className="w-full aspect-video rounded-xl overflow-hidden shadow-[0_24px_64px_rgb(0_0_0/_0.45)] bg-neutral-900 relative">
              {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/60">
                  <div className="w-10 h-10 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
                  <span className="text-sm font-medium">Loading trailers…</span>
                </div>
              )}

              {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/60 px-6 text-center">
                  <Film size={40} className="opacity-40" />
                  <span className="text-sm font-medium">Something went wrong loading the trailer.</span>
                  <span className="text-xs opacity-60">{error}</span>
                </div>
              )}

              {!loading && !error && !activeVideo && (
                <div
                  className="absolute inset-0 bg-cover bg-center flex flex-col items-center justify-center gap-3"
                  style={
                    backdropUrl
                      ? { backgroundImage: `url(${backdropUrl})` }
                      : undefined
                  }
                >
                  <div className="absolute inset-0 bg-black/60" />
                  <div className="relative z-10 flex flex-col items-center gap-2 text-white/70">
                    <Film size={44} className="opacity-50" />
                    <span className="text-sm font-medium">No trailer available</span>
                  </div>
                </div>
              )}

              {!loading && !error && activeVideo && (
                <iframe
                  key={activeVideo.key}
                  src={`https://www.youtube-nocookie.com/embed/${activeVideo.key}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
                  title={activeVideo.name || `${movieTitle} trailer`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              )}
            </div>

            <p className="mt-4 text-lg font-semibold text-white text-center px-4">
              {movieTitle}
            </p>

            {relatedVideos.length > 0 && (
              <div className="w-full mt-5">
                <p className="text-xs uppercase tracking-wider text-white/40 font-semibold mb-3 px-1">
                  Related Videos
                </p>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                  {relatedVideos.map((video) => (
                    <button
                      key={video.key}
                      onClick={() => setSelectedVideo(video)}
                      className={`flex-shrink-0 w-56 rounded-lg overflow-hidden border transition-colors cursor-pointer group ${
                        selectedVideo?.key === video.key
                          ? 'border-white/50 bg-white/10'
                          : 'border-white/5 bg-white/[0.03] hover:bg-white/[0.07]'
                      }`}
                    >
                      <div className="aspect-video relative bg-neutral-800">
                        <img
                          src={`https://img.youtube.com/vi/${video.key}/mqdefault.jpg`}
                          alt={video.name}
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Play
                            size={28}
                            className="text-white opacity-0 group-hover:opacity-90 transition-opacity drop-shadow-lg"
                            fill="currentColor"
                          />
                        </div>
                      </div>
                      <div className="px-2.5 py-2 text-left">
                        <p className="text-xs text-white/70 line-clamp-2 leading-snug">
                          {video.name}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </dialog>
      )}
    </AnimatePresence>
  )
}
