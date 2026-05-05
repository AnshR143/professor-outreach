"use client"
import MapLibreGL, { type PopupOptions, type MarkerOptions } from "maplibre-gl"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { createPortal } from "react-dom"
import { X, Minus, Plus, Locate, Maximize, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Context ─────────────────────────────────────────────────────────────────

type MapContextValue = { map: MapLibreGL.Map | null; isLoaded: boolean }
const MapContext = createContext<MapContextValue | null>(null)

export function useMap() {
  const ctx = useContext(MapContext)
  if (!ctx) throw new Error("useMap must be used within a <Map>")
  return ctx
}

// ─── Map ─────────────────────────────────────────────────────────────────────

const STYLE_LIGHT = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
const STYLE_DARK  = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"

type MapProps = {
  children?: ReactNode
  darkMode?: boolean
} & Omit<MapLibreGL.MapOptions, "container" | "style">

function DefaultLoader() {
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
      <Loader2 style={{ width: 24, height: 24, color: "#94a3b8", animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

export function Map({ children, darkMode = false, ...props }: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreGL.Map | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isStyleLoaded, setIsStyleLoaded] = useState(false)

  useEffect(() => { setIsMounted(true) }, [])

  useEffect(() => {
    if (!isMounted || !containerRef.current) return
    const style = darkMode ? STYLE_DARK : STYLE_LIGHT
    const map = new MapLibreGL.Map({
      container: containerRef.current,
      style,
      renderWorldCopies: false,
      attributionControl: { compact: true },
      ...props,
    })
    map.on("styledata", () => setIsStyleLoaded(true))
    map.on("load", () => setIsLoaded(true))
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
      setIsLoaded(false)
      setIsStyleLoaded(false)
    }
  }, [isMounted]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (mapRef.current) {
      setIsStyleLoaded(false)
      mapRef.current.setStyle(darkMode ? STYLE_DARK : STYLE_LIGHT, { diff: true })
    }
  }, [darkMode])

  const loading = !isMounted || !isLoaded || !isStyleLoaded

  return (
    <MapContext.Provider value={{ map: mapRef.current, isLoaded: isMounted && isLoaded && isStyleLoaded }}>
      <div ref={containerRef} style={{ position: "relative", width: "100%", height: "100%" }}>
        {loading && <DefaultLoader />}
        {isMounted && children}
      </div>
    </MapContext.Provider>
  )
}

// ─── Marker ───────────────────────────────────────────────────────────────────

type MarkerCtxValue = {
  markerRef: React.RefObject<MapLibreGL.Marker | null>
  elementRef: React.RefObject<HTMLDivElement | null>
  map: MapLibreGL.Map | null
  isReady: boolean
}
const MarkerCtx = createContext<MarkerCtxValue | null>(null)

function useMarkerCtx() {
  const ctx = useContext(MarkerCtx)
  if (!ctx) throw new Error("Marker components must be inside <MapMarker>")
  return ctx
}

type MapMarkerProps = {
  longitude: number
  latitude: number
  children: ReactNode
  onClick?: (e: MouseEvent) => void
  onMouseEnter?: (e: MouseEvent) => void
  onMouseLeave?: (e: MouseEvent) => void
} & Omit<MarkerOptions, "element">

export function MapMarker({
  longitude, latitude, children, onClick, onMouseEnter, onMouseLeave, draggable = false, ...opts
}: MapMarkerProps) {
  const { map, isLoaded } = useMap()
  const markerRef = useRef<MapLibreGL.Marker | null>(null)
  const elementRef = useRef<HTMLDivElement | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (!isLoaded || !map) return
    const el = document.createElement("div")
    elementRef.current = el
    const marker = new MapLibreGL.Marker({ ...opts, element: el, draggable })
      .setLngLat([longitude, latitude])
      .addTo(map)
    markerRef.current = marker
    const handleClick = (e: MouseEvent) => onClick?.(e)
    const handleEnter = (e: MouseEvent) => onMouseEnter?.(e)
    const handleLeave = (e: MouseEvent) => onMouseLeave?.(e)
    el.addEventListener("click", handleClick)
    el.addEventListener("mouseenter", handleEnter)
    el.addEventListener("mouseleave", handleLeave)
    setIsReady(true)
    return () => {
      el.removeEventListener("click", handleClick)
      el.removeEventListener("mouseenter", handleEnter)
      el.removeEventListener("mouseleave", handleLeave)
      marker.remove()
      markerRef.current = null
      elementRef.current = null
      setIsReady(false)
    }
  }, [map, isLoaded]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { markerRef.current?.setLngLat([longitude, latitude]) }, [longitude, latitude])

  return (
    <MarkerCtx.Provider value={{ markerRef, elementRef, map, isReady }}>
      {children}
    </MarkerCtx.Provider>
  )
}

// ─── MarkerContent ────────────────────────────────────────────────────────────

export function MarkerContent({ children, className }: { children?: ReactNode; className?: string }) {
  const { elementRef, isReady } = useMarkerCtx()
  if (!isReady || !elementRef.current) return null
  return createPortal(
    <div className={cn("relative cursor-pointer", className)}>
      {children ?? <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid #fff", background: "#3b82f6", boxShadow: "0 2px 6px rgba(0,0,0,0.25)" }} />}
    </div>,
    elementRef.current,
  )
}

// ─── MarkerPopup ──────────────────────────────────────────────────────────────

type MarkerPopupProps = {
  children: ReactNode
  className?: string
  closeButton?: boolean
} & Omit<PopupOptions, "className">

export function MarkerPopup({ children, className, closeButton = false, ...opts }: MarkerPopupProps) {
  const { markerRef, isReady } = useMarkerCtx()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const popupRef = useRef<MapLibreGL.Popup | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (!isReady || !markerRef.current) return
    const el = document.createElement("div")
    containerRef.current = el
    const popup = new MapLibreGL.Popup({ offset: 16, ...opts, closeButton: false })
      .setMaxWidth("none")
      .setDOMContent(el)
    popupRef.current = popup
    markerRef.current.setPopup(popup)
    setMounted(true)
    return () => { popup.remove(); popupRef.current = null; containerRef.current = null; setMounted(false) }
  }, [isReady]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => popupRef.current?.remove()

  if (!mounted || !containerRef.current) return null
  return createPortal(
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 12, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", position: "relative", minWidth: 180 }} className={className}>
      {closeButton && (
        <button onClick={handleClose} aria-label="Close" style={{ position: "absolute", top: 6, right: 6, background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 2, display: "flex" }}>
          <X style={{ width: 14, height: 14 }} />
        </button>
      )}
      {children}
    </div>,
    containerRef.current,
  )
}

// ─── MarkerTooltip ────────────────────────────────────────────────────────────

export function MarkerTooltip({ children, className, ...opts }: { children: ReactNode; className?: string } & Omit<PopupOptions, "className" | "closeButton" | "closeOnClick">) {
  const { markerRef, elementRef, map, isReady } = useMarkerCtx()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const popupRef = useRef<MapLibreGL.Popup | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (!isReady || !markerRef.current || !elementRef.current || !map) return
    const el = document.createElement("div")
    containerRef.current = el
    const popup = new MapLibreGL.Popup({ offset: 16, ...opts, closeButton: false, closeOnClick: true })
      .setMaxWidth("none")
      .setDOMContent(el)
    popupRef.current = popup
    const marker = markerRef.current
    const markerEl = elementRef.current
    const show = () => popup.setLngLat(marker.getLngLat()).addTo(map)
    const hide = () => popup.remove()
    markerEl.addEventListener("mouseenter", show)
    markerEl.addEventListener("mouseleave", hide)
    setMounted(true)
    return () => {
      markerEl.removeEventListener("mouseenter", show)
      markerEl.removeEventListener("mouseleave", hide)
      popup.remove(); popupRef.current = null; containerRef.current = null; setMounted(false)
    }
  }, [isReady, map]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!mounted || !containerRef.current) return null
  return createPortal(
    <div style={{ background: "#1e293b", color: "#f8fafc", padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 500, whiteSpace: "nowrap" }} className={className}>
      {children}
    </div>,
    containerRef.current,
  )
}

// ─── MapPopup (standalone, not tied to marker) ────────────────────────────────

type MapPopupProps = {
  longitude: number
  latitude: number
  onClose?: () => void
  children: ReactNode
  closeButton?: boolean
  className?: string
} & Omit<PopupOptions, "className">

export function MapPopup({ longitude, latitude, onClose, children, closeButton = false, className, ...opts }: MapPopupProps) {
  const { map } = useMap()
  const popupRef = useRef<MapLibreGL.Popup | null>(null)
  const container = useMemo(() => document.createElement("div"), [])

  useEffect(() => {
    if (!map) return
    const popup = new MapLibreGL.Popup({ offset: 16, ...opts, closeButton: false })
      .setMaxWidth("none")
      .setDOMContent(container)
      .setLngLat([longitude, latitude])
      .addTo(map)
    popup.on("close", () => onClose?.())
    popupRef.current = popup
    return () => { if (popup.isOpen()) popup.remove(); popupRef.current = null }
  }, [map]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { popupRef.current?.setLngLat([longitude, latitude]) }, [longitude, latitude])

  const handleClose = () => { popupRef.current?.remove(); onClose?.() }

  return createPortal(
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 12, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", position: "relative" }} className={className}>
      {closeButton && (
        <button onClick={handleClose} style={{ position: "absolute", top: 6, right: 6, background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 2, display: "flex" }}>
          <X style={{ width: 14, height: 14 }} />
        </button>
      )}
      {children}
    </div>,
    container,
  )
}

// ─── MapControls ──────────────────────────────────────────────────────────────

const POS: Record<string, React.CSSProperties> = {
  "top-left":     { top: 8, left: 8 },
  "top-right":    { top: 8, right: 8 },
  "bottom-left":  { bottom: 40, left: 8 },
  "bottom-right": { bottom: 40, right: 8 },
}

type MapControlsProps = {
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right"
  showZoom?: boolean
  showLocate?: boolean
  showFullscreen?: boolean
  onLocate?: (coords: { longitude: number; latitude: number }) => void
}

export function MapControls({ position = "bottom-right", showZoom = true, showLocate = false, showFullscreen = false, onLocate }: MapControlsProps) {
  const { map, isLoaded } = useMap()
  const [locating, setLocating] = useState(false)

  const zoomIn  = useCallback(() => { map?.zoomTo((map.getZoom() ?? 10) + 1, { duration: 300 }) }, [map])
  const zoomOut = useCallback(() => { map?.zoomTo((map.getZoom() ?? 10) - 1, { duration: 300 }) }, [map])

  const locate = useCallback(() => {
    setLocating(true)
    navigator.geolocation?.getCurrentPosition(pos => {
      const coords = { longitude: pos.coords.longitude, latitude: pos.coords.latitude }
      map?.flyTo({ center: [coords.longitude, coords.latitude], zoom: 14, duration: 1500 })
      onLocate?.(coords)
      setLocating(false)
    }, () => setLocating(false))
  }, [map, onLocate])

  const fullscreen = useCallback(() => {
    const c = map?.getContainer()
    if (!c) return
    document.fullscreenElement ? document.exitFullscreen() : c.requestFullscreen()
  }, [map])

  if (!isLoaded) return null

  const btnStyle: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, background: "#fff", border: "none", cursor: "pointer", color: "#374151" }
  const groupStyle: React.CSSProperties = { display: "flex", flexDirection: "column", borderRadius: 8, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.12)", border: "1px solid #e2e8f0" }

  return (
    <div style={{ position: "absolute", zIndex: 10, display: "flex", flexDirection: "column", gap: 6, ...POS[position] }}>
      {showZoom && (
        <div style={groupStyle}>
          <button onClick={zoomIn} title="Zoom in" style={{ ...btnStyle, borderBottom: "1px solid #e2e8f0" }}>
            <Plus style={{ width: 14, height: 14 }} />
          </button>
          <button onClick={zoomOut} title="Zoom out" style={btnStyle}>
            <Minus style={{ width: 14, height: 14 }} />
          </button>
        </div>
      )}
      {showLocate && (
        <div style={groupStyle}>
          <button onClick={locate} title="My location" style={btnStyle}>
            {locating ? <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} /> : <Locate style={{ width: 14, height: 14 }} />}
          </button>
        </div>
      )}
      {showFullscreen && (
        <div style={groupStyle}>
          <button onClick={fullscreen} title="Toggle fullscreen" style={btnStyle}>
            <Maximize style={{ width: 14, height: 14 }} />
          </button>
        </div>
      )}
    </div>
  )
}

// ─── MapRoute ─────────────────────────────────────────────────────────────────

type MapRouteProps = {
  coordinates: [number, number][]
  color?: string
  width?: number
  opacity?: number
  dashArray?: [number, number]
}

export function MapRoute({ coordinates, color = "#3b82f6", width = 3, opacity = 0.8, dashArray }: MapRouteProps) {
  const { map, isLoaded } = useMap()
  const id = useId()
  const sourceId = `route-src-${id}`
  const layerId  = `route-lyr-${id}`

  useEffect(() => {
    if (!isLoaded || !map) return
    map.addSource(sourceId, { type: "geojson", data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [] } } })
    map.addLayer({
      id: layerId, type: "line", source: sourceId,
      layout: { "line-join": "round", "line-cap": "round" },
      paint: { "line-color": color, "line-width": width, "line-opacity": opacity, ...(dashArray ? { "line-dasharray": dashArray } : {}) },
    })
    return () => {
      try { if (map.getLayer(layerId)) map.removeLayer(layerId); if (map.getSource(sourceId)) map.removeSource(sourceId) } catch { /* ignore */ }
    }
  }, [isLoaded, map]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isLoaded || !map || coordinates.length < 2) return
    const src = map.getSource(sourceId) as MapLibreGL.GeoJSONSource
    src?.setData({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates } })
  }, [isLoaded, map, coordinates, sourceId])

  return null
}
