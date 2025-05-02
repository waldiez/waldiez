/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useEffect, useRef } from "react";

import { useImageRetry } from "@waldiez/components/chatUI/hooks";

type ImageWithRetryProps = {
    src: string;
    alt?: string;
    className?: string;
    onClick?: () => void;
};

export const ImageWithRetry: React.FC<ImageWithRetryProps> = ({
    src,
    alt = "Chat image",
    className,
    onClick,
}) => {
    const imgRef = useRef<HTMLImageElement>(null);
    const { registerImage } = useImageRetry();

    useEffect(() => {
        if (imgRef.current) {
            registerImage(imgRef.current, src);
        }
    }, [src, registerImage]);

    return (
        <img
            ref={imgRef}
            src={src}
            alt={alt}
            className={`loading ${className}`}
            loading="lazy"
            onClick={onClick}
        />
    );
};
