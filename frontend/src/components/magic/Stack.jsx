import { useState } from "react";
import { motion } from "framer-motion";

/**
 * Stack — draggable photo-stack gallery (React Bits pattern).
 * Interactions:
 *  - Drag/swipe the top card to fling it: released beyond threshold => sent to back
 *  - Below threshold => spring back to origin
 *  - Tap (short click without drag) => also sends top card to back (opt-in via sendToBackOnClick)
 * Rotation: each card has a deterministic pseudo-random tilt for natural "pile" feel.
 */
export default function Stack({
    images = [],
    randomRotation = true,
    sendToBackOnClick = true,
    cardWidth = 320,
    cardHeight = 420,
    dragDistanceThreshold = 90,
    dragVelocityThreshold = 400,
}) {
    const [order, setOrder] = useState(images.map((_, i) => i));

    const sendToBack = () => {
        setOrder((prev) => {
            if (prev.length < 2) return prev;
            const [first, ...rest] = prev;
            return [...rest, first];
        });
    };

    // Deterministic per-image rotation so it never jitters between renders.
    const rotations = images.map((_, i) => {
        if (!randomRotation) return 0;
        const seed = Math.sin(i * 13.37) * 10000;
        return ((seed - Math.floor(seed)) - 0.5) * 10; // -5deg .. +5deg
    });

    if (images.length === 0) return null;

    return (
        <div
            className="relative select-none"
            style={{
                width: cardWidth,
                height: cardHeight,
                maxWidth: "100%",
                perspective: 800,
            }}
            data-testid="product-stack-gallery"
        >
            {order.map((imgIdx, stackIdx) => {
                const src = images[imgIdx];
                const isTop = stackIdx === 0;
                const baseRot = rotations[imgIdx] + stackIdx * 1.5;

                return (
                    <motion.div
                        key={imgIdx}
                        data-testid={isTop ? "stack-top-card" : undefined}
                        drag={isTop}
                        dragElastic={0.7}
                        dragMomentum={false}
                        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                        onDragEnd={(_, info) => {
                            const strong =
                                Math.abs(info.offset.x) > dragDistanceThreshold ||
                                Math.abs(info.offset.y) > dragDistanceThreshold ||
                                Math.abs(info.velocity.x) > dragVelocityThreshold ||
                                Math.abs(info.velocity.y) > dragVelocityThreshold;
                            if (strong) sendToBack();
                        }}
                        onTap={() => {
                            // onTap fires ONLY on a true tap (no drag). Safe from double-fire.
                            if (isTop && sendToBackOnClick) sendToBack();
                        }}
                        animate={{
                            rotate: baseRot,
                            y: stackIdx * 4,
                            x: stackIdx * 2,
                            scale: 1 - stackIdx * 0.03,
                        }}
                        transition={{ type: "spring", stiffness: 260, damping: 22, mass: 0.7 }}
                        whileTap={isTop ? { scale: 1.02 } : undefined}
                        whileDrag={isTop ? { scale: 1.04, zIndex: 999 } : undefined}
                        style={{
                            zIndex: order.length - stackIdx,
                            touchAction: "none",
                            willChange: "transform",
                        }}
                        className={`absolute inset-0 rounded-2xl overflow-hidden border border-white/10 bg-zinc-900 shadow-[0_20px_60px_rgba(0,0,0,0.5)] ${
                            isTop ? "cursor-grab active:cursor-grabbing" : ""
                        }`}
                    >
                        <img
                            src={src}
                            alt=""
                            draggable={false}
                            className="w-full h-full object-cover pointer-events-none"
                            loading="lazy"
                        />
                    </motion.div>
                );
            })}
        </div>
    );
}
