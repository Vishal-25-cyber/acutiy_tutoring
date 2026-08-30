import React from "react";

export interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  fill?: boolean;
  priority?: boolean;
  unoptimized?: boolean;
  className?: string;
}

export default function Image({
  src,
  alt,
  width,
  height,
  fill,
  priority,
  unoptimized,
  className,
  style,
  ...props
}: ImageProps) {
  const computedStyle: React.CSSProperties = {
    ...style,
    ...(fill
      ? {
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }
      : {}),
  };

  return React.createElement("img", {
    src,
    alt,
    width: fill ? undefined : width,
    height: fill ? undefined : height,
    className,
    style: computedStyle,
    ...props,
  });
}
