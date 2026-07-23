import { useRef, useCallback } from "react";

/**
 * ClickSpark
 * Wraps children and produces a small burst of animated sparks on click.
 * CSS-only spark animation (no external libs) — safe with framer-motion.
 */
export default function ClickSpark({
    children,
    sparkColor = "#e4d3b5",
    sparkCount = 10,
    sparkSize = 8,
    sparkRadius = 22,
    duration = 500,
    className = "",
}) {
    const containerRef = useRef(null);

    const handleClick = useCallback(
        (e) => {
            const el = containerRef.current;
            if (!el) return;
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            for (let i = 0; i < sparkCount; i++) {
                const spark = document.createElement("span");
                const angle = (Math.PI * 2 * i) / sparkCount;
                const dx = Math.cos(angle) * sparkRadius;
                const dy = Math.sin(angle) * sparkRadius;
                spark.style.cssText = `
                    position: absolute;
                    left: ${x - sparkSize / 2}px;
                    top: ${y - sparkSize / 2}px;
                    width: ${sparkSize}px;
                    height: 2px;
                    background: ${sparkColor};
                    border-radius: 999px;
                    pointer-events: none;
                    transform: rotate(${angle}rad);
                    transform-origin: center;
                    box-shadow: 0 0 8px ${sparkColor};
                    opacity: 1;
                    transition: transform ${duration}ms ease-out, opacity ${duration}ms ease-out;
                    z-index: 999;
                `;
                el.appendChild(spark);
                requestAnimationFrame(() => {
                    spark.style.transform = `translate(${dx}px, ${dy}px) rotate(${angle}rad)`;
                    spark.style.opacity = "0";
                });
                setTimeout(() => spark.remove(), duration + 30);
            }
        },
        [sparkColor, sparkCount, sparkSize, sparkRadius, duration]
    );

    return (
        <span
            ref={containerRef}
            onClick={handleClick}
            className={`relative inline-block ${className}`}
        >
            {children}
        </span>
    );
}
