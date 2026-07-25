import * as React from "react"
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const CarouselContext = React.createContext(null)

function useCarousel() {
  const context = React.useContext(CarouselContext)

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />")
  }

  return context
}

const MOBILE_BREAKPOINT = 767

const Carousel = React.forwardRef((
  {
    orientation = "horizontal",
    opts,
    setApi,
    plugins,
    className,
    children,
    ...props
  },
  ref
) => {
  // Detect mobile so we can tune Embla options and UI for small screens while keeping desktop unchanged
  const [isMobile, setIsMobile] = React.useState(
    typeof window !== "undefined" ? window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches : false
  )

  React.useEffect(() => {
    if (typeof window === "undefined") return
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`)
    const onChange = () => setIsMobile(mql.matches)
    mql.addEventListener?.("change", onChange)
    mql.addListener?.(onChange) // fallback
    return () => {
      mql.removeEventListener?.("change", onChange)
      mql.removeListener?.(onChange)
    }
  }, [])

  // Merge incoming opts with defaults that improve mobile UX while not breaking desktop:
  const emblaOptions = React.useMemo(() => ({
    containScroll: "trimSnaps",
    align: "start",
    // enable a smoother, more forgiving drag on mobile only; desktop keeps existing behavior
    dragFree: isMobile ? true : opts?.dragFree ?? false,
    // don't skip snaps so pagination / dots align predictably
    skipSnaps: false,
    // improve swipe momentum by allowing pointer momentum handling
    // NOTE: embla exposes "dragFree" and "inViewThreshold" — we set a forgiving threshold on mobile
    inViewThreshold: isMobile ? 0.4 : opts?.inViewThreshold ?? 0,
    // allow caller to override anything via opts
    ...(opts || {})
  }), [opts, isMobile])

  const [carouselRef, api] = useEmblaCarousel({
    ...emblaOptions,
    axis: orientation === "horizontal" ? "x" : "y",
  }, plugins)
  const [canScrollPrev, setCanScrollPrev] = React.useState(false)
  const [canScrollNext, setCanScrollNext] = React.useState(false)
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const [slidesCount, setSlidesCount] = React.useState(0)
  const autoplayRef = React.useRef(null)
  const isPausedRef = React.useRef(false)

  const AUTOPLAY_INTERVAL = 5000 // 5 seconds

  const onSelect = React.useCallback((api) => {
    if (!api) {
      return
    }

    setCanScrollPrev(api.canScrollPrev())
    setCanScrollNext(api.canScrollNext())

    // selected index and slides count used for pagination dots
    try {
      const selected = typeof api.selectedScrollSnap === "function" ? api.selectedScrollSnap() : (typeof api.selectedSnap === "function" ? api.selectedSnap() : 0)
      setSelectedIndex(typeof selected === "number" ? selected : 0)
      const snaps = typeof api.scrollSnapList === "function" ? api.scrollSnapList() : []
      setSlidesCount(Array.isArray(snaps) ? snaps.length : 0)
    } catch (e) {
      // fail gracefully if Embla version doesn't expose methods as expected
      setSlidesCount(0)
      setSelectedIndex(0)
    }
  }, [])

  const scrollPrev = React.useCallback(() => {
    api?.scrollPrev()
  }, [api])

  const scrollNext = React.useCallback(() => {
    api?.scrollNext()
  }, [api])

  const scrollTo = React.useCallback((index) => {
    api?.scrollTo(index)
  }, [api])

  const handleKeyDown = React.useCallback((event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault()
      scrollPrev()
    } else if (event.key === "ArrowRight") {
      event.preventDefault()
      scrollNext()
    }
  }, [scrollPrev, scrollNext])

  // Autoplay implementation that respects pause while hovering or dragging.
  React.useEffect(() => {
    if (!api) return

    const startAutoplay = () => {
      if (autoplayRef.current) return
      autoplayRef.current = window.setInterval(() => {
        if (isPausedRef.current) return
        // prefer snapping to next; scrollNext will respect embla's snapping settings
        api.scrollNext()
      }, AUTOPLAY_INTERVAL)
    }

    const stopAutoplay = () => {
      if (autoplayRef.current) {
        clearInterval(autoplayRef.current)
        autoplayRef.current = null
      }
    }

    // pause/resume on drag
    const onPointerDown = () => { isPausedRef.current = true }
    const onPointerUp = () => { isPausedRef.current = false }
    // pause while user is interacting with the page (visibility change)
    const onVisibility = () => { isPausedRef.current = document.hidden }

    api.on("pointerDown", onPointerDown)
    api.on("pointerUp", onPointerUp)
    api.on("dragStart", onPointerDown)
    api.on("dragEnd", onPointerUp)

    document.addEventListener("visibilitychange", onVisibility)

    // Start autoplay when ready
    startAutoplay()

    return () => {
      stopAutoplay()
      api.off("pointerDown", onPointerDown)
      api.off("pointerUp", onPointerUp)
      api.off("dragStart", onPointerDown)
      api.off("dragEnd", onPointerUp)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [api])

  React.useEffect(() => {
    if (!api || !setApi) {
      return
    }

    setApi(api)
  }, [api, setApi])

  React.useEffect(() => {
    if (!api) {
      return
    }

    onSelect(api)
    api.on("reInit", onSelect)
    api.on("select", onSelect)

    return () => {
      api?.off("select", onSelect)
    };
  }, [api, onSelect])

  // pause autoplay while hovering over carousel
  const onMouseEnter = React.useCallback(() => { isPausedRef.current = true }, [])
  const onMouseLeave = React.useCallback(() => { isPausedRef.current = false }, [])

  return (
    <CarouselContext.Provider
      value={{
        carouselRef,
        api: api,
        opts,
        orientation:
          orientation || (opts?.axis === "y" ? "vertical" : "horizontal"),
        scrollPrev,
        scrollNext,
        scrollTo,
        canScrollPrev,
        canScrollNext,
        selectedIndex,
        slidesCount,
        isMobile
      }}>
      <div
        ref={ref}
        onKeyDownCapture={handleKeyDown}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className={cn("relative", className)}
        role="region"
        aria-roledescription="carousel"
        {...props}>
        {children}

        {/* Pagination dots: visible on mobile only so desktop layout is unchanged */}
        {slidesCount > 1 && (
          <div className="absolute left-1/2 -translate-x-1/2 bottom-2 md:hidden pointer-events-auto">
            <div className="flex gap-2 items-center">
              {Array.from({ length: slidesCount }).map((_, idx) => (
                <motion.button
                  key={idx}
                  onClick={() => scrollTo(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                  aria-current={selectedIndex === idx ? "true" : "false"}
                  initial={false}
                  animate={{ width: selectedIndex === idx ? 32 : 12, opacity: selectedIndex === idx ? 1 : 0.6 }}
                  transition={{ type: "spring", stiffness: 200, damping: 25 }}
                  className={cn(
                    "h-2 rounded-full bg-muted",
                    // use inline transform handled by motion; allow focus ring
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  )} />
              ))}
            </div>
          </div>
        )}
      </div>
    </CarouselContext.Provider>
  );
})
Carousel.displayName = "Carousel"

const CarouselContent = React.forwardRef(({ className, ...props }, ref) => {
  const { carouselRef, orientation } = useCarousel()

  return (
    <div ref={carouselRef} className="overflow-hidden">
      <div
        ref={ref}
        className={cn(
          "flex",
          orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col",
          className
        )}
        {...props} />
    </div>
  );
})
CarouselContent.displayName = "CarouselContent"

const CarouselItem = React.forwardRef(({ className, ...props }, ref) => {
  // Reduce card height on mobile while keeping desktop unchanged.
  // Cards can still be overridden by passing className from the caller.
  const { orientation, selectedIndex, isMobile } = useCarousel()
  const elRef = React.useRef(null)
  const combinedRef = React.useCallback((node) => {
    elRef.current = node
    if (typeof ref === "function") ref(node)
    else if (ref) ref.current = node
  }, [ref])

  const [index, setIndex] = React.useState(null)

  React.useEffect(() => {
    // determine this slide's index within the track to animate based on selectedIndex
    try {
      if (!elRef.current) return
      const track = elRef.current.parentElement
      if (!track) return
      const children = Array.from(track.children)
      const idx = children.indexOf(elRef.current)
      setIndex(idx)
    } catch (e) {
      setIndex(null)
    }
  }, [elRef.current, props.children])

  // Determine whether this slide is active
  const isActive = typeof index === "number" && selectedIndex === index

  // Animation values
  const MOBILE_ACTIVE_SCALE = 1.02
  const MOBILE_INACTIVE_SCALE = 0.97
  const DESKTOP_ACTIVE_SCALE = 1
  const DESKTOP_INACTIVE_SCALE = 1

  const targetScale = isMobile ? (isActive ? MOBILE_ACTIVE_SCALE : MOBILE_INACTIVE_SCALE) : (isActive ? DESKTOP_ACTIVE_SCALE : DESKTOP_INACTIVE_SCALE)
  const targetOpacity = isActive ? 1 : 0.92

  return (
    <div
      ref={combinedRef}
      role="group"
      aria-roledescription="slide"
      className={cn(
        // keep full-width slide behavior
        "min-w-0 shrink-0 grow-0 basis-full",
        // mobile: set approx card height ~280px while keeping desktop natural height
        "h-[280px] md:h-auto overflow-hidden",
        orientation === "horizontal" ? "pl-4" : "pt-4",
        className
      )}
      {...props}>
      {/* We wrap children in a motion.div to animate scale and fade; Embla will handle translate.
          Use a spring-like transition for the scale/opacity changes to feel Apple-like. */}
      <motion.div
        className="h-full w-full will-change-transform will-change-opacity"
        initial={false}
        animate={{ scale: targetScale, opacity: targetOpacity }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{
          transformOrigin: "center",
        }}>
        {props.children}
      </motion.div>
    </div>
  );
})
CarouselItem.displayName = "CarouselItem"

const GlassButtonBase = ({ children, className, ...props }) => (
  <Button
    variant="ghost"
    size="icon"
    {...props}
    className={cn(
      "backdrop-blur-sm bg-white/30 dark:bg-black/30 border border-white/20 dark:border-black/20 shadow-md",
      "hover:bg-white/40 dark:hover:bg-black/40",
      "transition-colors",
      "h-10 w-10 rounded-full",
      className
    )}>
    {children}
  </Button>
)

const CarouselPrevious = React.forwardRef(({ className, variant = "outline", size = "icon", ...props }, ref) => {
  const { orientation, scrollPrev, canScrollPrev, isMobile } = useCarousel()

  return (
    <GlassButtonBase
      ref={ref}
      onClick={scrollPrev}
      aria-label="Previous slide"
      disabled={!canScrollPrev}
      className={cn(
        // reposition arrows on mobile (inside visible area) while keeping desktop positioning unchanged
        "absolute",
        orientation === "horizontal"
          ? (isMobile ? "left-3 top-1/2 -translate-y-1/2" : "-left-12 top-1/2 -translate-y-1/2")
          : (isMobile ? "top-3 left-1/2 -translate-x-1/2 rotate-90" : "-top-12 left-1/2 -translate-x-1/2 rotate-90"),
        className
      )}
      {...props}>
      <ArrowLeft className="h-4 w-4" />
      <span className="sr-only">Previous slide</span>
    </GlassButtonBase>
  );
})
CarouselPrevious.displayName = "CarouselPrevious"

const CarouselNext = React.forwardRef(({ className, variant = "outline", size = "icon", ...props }, ref) => {
  const { orientation, scrollNext, canScrollNext, isMobile } = useCarousel()

  return (
    <GlassButtonBase
      ref={ref}
      onClick={scrollNext}
      aria-label="Next slide"
      disabled={!canScrollNext}
      className={cn(
        "absolute",
        orientation === "horizontal"
          ? (isMobile ? "right-3 top-1/2 -translate-y-1/2" : "-right-12 top-1/2 -translate-y-1/2")
          : (isMobile ? "bottom-3 left-1/2 -translate-x-1/2 rotate-90" : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90"),
        className
      )}
      {...props}>
      <ArrowRight className="h-4 w-4" />
      <span className="sr-only">Next slide</span>
    </GlassButtonBase>
  );
})
CarouselNext.displayName = "CarouselNext"

export { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext };
