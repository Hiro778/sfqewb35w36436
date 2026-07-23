import { useState } from "react";
import { motion } from "framer-motion";

/**
 * Stack — a photo-stack style gallery.
 * Click sends the top card to the back with random rotation.
 */
export default function Stack({
    images = [],
    randomRotation = true,
    sendToBackOnClick = true,
    cardWidth = 320,
    cardHeight = 420,
}) {
    const [order, setOrder] = useState(images.map((_, i) => i));

    const handleClick = () => {
        if (!sendToBackOnClick) return;
        setOrder((prev) => {
            if (prev.length < 2) return prev;
            const [first, ...rest] = prev;
            return [...rest, first];
        });
    };

    const rotations = images.map((_, i) => {
        if (!randomRotation) return 0;
        // deterministic pseudo-random per index so it doesn't jitter
        const seed = Math.sin(i * 13.37) * 10000;
        return ((seed - Math.floor(seed)) - 0.5) * 8; // -4..+4 deg
    });

    return (
        <div
            className="relative select-none"
            style={{
                width: cardWidth,
                height: cardHeight,
                maxWidth: "100%",
            }}
            data-testid="product-stack-gallery"
        >
            {order.map((imgIdx, stackIdx) => {
                const src = images[imgIdx];
                const isTop = stackIdx === 0;
                const rot = rotations[imgIdx] + stackIdx * 1.5;
                return (
                    <motion.div
                        key={imgIdx}
                        onClick={isTop ? handleClick : undefined}
                        initial={false}
                        animate={{
                            rotate: rot,
                            y: stackIdx * 4,
                            x: stackIdx * 2,
                            scale: 1 - stackIdx * 0.02,
                            zIndex: order.length - stackIdx,
                        }}
                        transition={{ type: "spring", stiffness: 260, damping: 26 }}
                        className={`absolute inset-0 rounded-2xl overflow-hidden border border-white/10 bg-zinc-900 shadow-[0_20px_60px_rgba(0,0,0,0.5)] ${
                            isTop ? "cursor-pointer" : ""
                        }`}
                        style={{ willChange: "transform" }}
                    >
                        <img
                            src={src}
                            alt=""
                            draggable={false}
                            className="w-full h-full object-cover"
                            loading="lazy"
                        />
                    </motion.div>
                );
            })}
        </div>
    );
}
