import { forwardRef, memo, useEffect, useRef, useState } from "react";
import { VariantProps, tv } from "tailwind-variants";
import Skeleton from "@/components/base/Skeleton";
import SuspenseComponent from "@/components/base/SuspenseComponent";
import { cn } from "@/core/utils/ComponentUtils";
import { DimensionMap } from "@/core/utils/VariantUtils";

const CachedImageVariants = tv(
    {
        variants: {
            size: DimensionMap.all,
            w: DimensionMap.width,
            h: DimensionMap.height,
        },
        defaultVariants: {
            size: undefined,
            width: undefined,
            height: undefined,
        },
    },
    {
        responsiveVariants: true,
    }
);

interface ICachedImageProps extends React.ImgHTMLAttributes<HTMLImageElement>, VariantProps<typeof CachedImageVariants> {
    fallback?: React.ReactNode;
}

const imageCache = new Map<string, HTMLImageElement>();

const lazyImage = (src: string) => {
    return new Promise((resolve, reject) => {
        if (imageCache.has(src)) {
            resolve(imageCache.get(src));
            return;
        }

        const image = new Image();
        image.onload = () => {
            imageCache.set(src, image);
            resolve(image);
        };
        image.onerror = reject;
        image.src = src;
    });
};

const CachedImage = memo(
    forwardRef<HTMLImageElement, ICachedImageProps>(({ size, w, h, src, fallback, className, ...props }, ref) => {
        const [image, setImage] = useState<React.ReactNode | null>(null);
        const imageKeyRef = useRef(src);

        const classNames = cn(CachedImageVariants({ size, w, h }), className);

        useEffect(() => {
            if (!src) {
                setImage(fallback ?? null);
                return;
            }

            lazyImage(src)
                .then(() => {
                    setImage(<img key={imageKeyRef.current} ref={ref} src={src} className={classNames} {...props} />);
                })
                .catch(() => {
                    setImage(fallback ?? <Skeleton className={classNames} />);
                });
        }, [src]);

        return <SuspenseComponent className={classNames}>{image}</SuspenseComponent>;
    }),
    (prev, next) => {
        const checkableProps = ["src", "className", "size", "w", "h"] as const;
        for (let i = 0; i < checkableProps.length; ++i) {
            const key = checkableProps[i];
            if (prev[key] !== next[key]) {
                return false;
            }
        }
        return true;
    }
);

export default CachedImage;
