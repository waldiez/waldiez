/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { motion } from "framer-motion";

import { type FC, useCallback } from "react";

import { AGENT_ICONS } from "@waldiez/theme";

const botVariants = [
    {
        // Assistant: tilts head
        animate: { rotate: [0, -10, 10, 0] },
        transition: { repeat: Infinity, duration: 2.2 },
    },
    {
        // Rag: jumps (reading)
        animate: { y: [0, -10, 0] },
        transition: { repeat: Infinity, duration: 2.5, delay: 0.3 },
    },
    {
        // Manager: waves (moves checklist)
        animate: { rotate: [0, 6, -6, 0] },
        transition: { repeat: Infinity, duration: 2.8, delay: 0.6 },
    },
    {
        // Reasoning: bobs up/down, pondering
        animate: { y: [0, 8, 0] },
        transition: { repeat: Infinity, duration: 2.0, delay: 0.9 },
    },
    {
        // Captain: points (tilts hat)
        animate: { rotate: [0, -8, 8, 0] },
        transition: { repeat: Infinity, duration: 3.0, delay: 1.2 },
    },
    {
        // User: shakes (looks lost)
        animate: { x: [0, 7, -7, 0] },
        transition: { repeat: Infinity, duration: 2.6, delay: 1.5 },
    },
];
const bots = [
    { src: AGENT_ICONS.assistant, alt: "Assistant Waldiez" },
    { src: AGENT_ICONS.rag_user_proxy, alt: "RAG Waldiez" },
    { src: AGENT_ICONS.group_manager, alt: "Manager Waldiez" },
    { src: AGENT_ICONS.reasoning, alt: "Reasoning Waldiez" },
    { src: AGENT_ICONS.captain, alt: "Captain Waldiez" },
    { src: AGENT_ICONS.user_proxy, alt: "User Waldiez" },
];

export const ErrorPage: FC<{ error?: Error }> = ({ error }) => {
    const handleReload = useCallback(() => {
        const inIframe = (() => {
            try {
                return window.self !== window.top;
            } catch {
                return true;
            }
        })();
        if (inIframe) {
            window.location.replace(window.location.href);
        } else {
            window.location.reload();
        }
    }, []);
    return (
        <div className="waldiez-error-container" data-testid="error-boundary">
            <div className="waldiez-bots-row">
                {bots.map((bot, idx) => (
                    <motion.img
                        key={bot.alt}
                        src={bot.src}
                        alt={bot.alt}
                        className="waldiez-bot-img"
                        animate={botVariants[idx]?.animate}
                        transition={botVariants[idx]?.transition}
                        style={{ zIndex: 10 + idx }}
                    />
                ))}
            </div>
            {/* Animated ERROR sign */}
            <motion.div
                className="waldiez-error-sign"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{
                    opacity: [0, 1, 0.7, 1],
                    scale: [0.9, 1.1, 1],
                }}
                transition={{
                    repeat: Infinity,
                    repeatType: "reverse",
                    duration: 1.2,
                    delay: 0.5,
                }}
            >
                <span>🚨 ERROR</span>
            </motion.div>
            <motion.div
                className="waldiez-error-message"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3 }}
            >
                <div className="waldiez-error-title">Oops, something went wrong!</div>
                <div className="waldiez-error-desc">
                    The Waldiez team is on the case. Please wait while we investigate...
                </div>
                {/* Refresh Button */}
                <div className="waldiez-refresh-btn-container">
                    <button
                        onClick={handleReload}
                        className="waldiez-refresh-btn"
                        onMouseDown={e => (e.currentTarget.style.transform = "scale(0.97)")}
                        onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}
                        onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
                    >
                        Refresh Page
                    </button>
                </div>
                {/* Error details, if provided */}
                {error && (
                    <div className="waldiez-error-details">
                        <strong>Error:</strong> {error.message}
                        {error.stack && <pre>{error.stack}</pre>}
                    </div>
                )}
            </motion.div>
        </div>
    );
};
