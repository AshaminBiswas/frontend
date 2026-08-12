import React, { useState, useEffect, useRef } from 'react'

const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg=='

const LOADED_IMAGE_CACHE = new Set<string>()

export function ImageWithFallback(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const { src, alt, style, className = '', loading = 'lazy', decoding = 'async', ...rest } = props
  const imgRef = useRef<HTMLImageElement>(null)

  const isCached = typeof src === 'string' && LOADED_IMAGE_CACHE.has(src)
  const [didError, setDidError] = useState(false)
  const [loaded, setLoaded] = useState(isCached)

  useEffect(() => {
    if (typeof src === 'string' && LOADED_IMAGE_CACHE.has(src)) {
      setLoaded(true)
      return
    }
    if (imgRef.current && imgRef.current.complete) {
      if (typeof src === 'string') LOADED_IMAGE_CACHE.add(src)
      setLoaded(true)
    }
  }, [src])

  const handleLoad = () => {
    if (typeof src === 'string') LOADED_IMAGE_CACHE.add(src)
    setLoaded(true)
  }

  if (didError) {
    return (
      <div className={`bg-[#34150F]/10 flex items-center justify-center w-full h-full ${className}`} style={style}>
        <img src={ERROR_IMG_SRC} alt="Error loading image" className="opacity-40 max-w-full max-h-full" />
      </div>
    )
  }

  const isAbsolute = className.includes('absolute')
  const cleanClassName = className.replace('absolute', '').replace('inset-0', '').trim()

  return (
    <div className={`overflow-hidden ${isAbsolute ? 'absolute inset-0' : 'relative w-full h-full'}`}>
      {!loaded && (
        <div className="absolute inset-0 animate-shimmer bg-[#34150F]/10 pointer-events-none" />
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading={loading}
        decoding={decoding}
        style={style}
        onLoad={handleLoad}
        onError={() => setDidError(true)}
        className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'} ${cleanClassName}`}
        {...rest}
      />
    </div>
  )
}
