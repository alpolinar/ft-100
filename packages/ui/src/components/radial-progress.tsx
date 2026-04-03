"use client";

import { cn } from "@repo/ui/lib/utils";
import * as React from "react";

type SizePreset = "xs" | "sm" | "md" | "lg" | "xl";

const SIZE_CLASSES: Record<SizePreset, string> = {
  xs: "size-8",
  sm: "size-12",
  md: "size-16",
  lg: "size-24",
  xl: "size-32",
};

const SIZES: Record<
  SizePreset,
  { dimension: number; strokeWidth: number; fontSize: string }
> = {
  xs: { dimension: 32, strokeWidth: 2.5, fontSize: "text-[8px]" },
  sm: { dimension: 48, strokeWidth: 3, fontSize: "text-[10px]" },
  md: { dimension: 64, strokeWidth: 4, fontSize: "text-xs" },
  lg: { dimension: 96, strokeWidth: 5, fontSize: "text-sm" },
  xl: { dimension: 128, strokeWidth: 6, fontSize: "text-base" },
};

interface RadialProgressBaseProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** Current progress value */
  value: number;
  /** Maximum value for the progress ring. Defaults to `100` */
  max?: number;
  /** Custom stroke thickness in pixels. Overrides the preset thickness */
  thickness?: number;
  /** Custom font size class (string) or pixel value (number). Overrides the preset font size */
  fontSize?: string | number;
  /** Symbol to display after the value (e.g. "%", " XP"). No symbol shown by default */
  symbol?: string;
  /** Custom label to display inside the ring. Overrides the default `{value}{symbol}` label */
  label?: React.ReactNode;
  /** Whether to show the label inside the ring */
  showLabel?: boolean;
  /** Duration of the stroke animation in ms */
  animationDuration?: number;
  /** Color class for the progress stroke. Defaults to `stroke-primary` */
  strokeColor?: string;
  /** Color class for the track stroke. Defaults to `stroke-muted` */
  trackColor?: string;
}

interface RadialProgressPresetProps extends RadialProgressBaseProps {
  /** Predefined size preset */
  size?: SizePreset;
  /** Not available when using a preset size */
  width?: never;
  /** Not available when using a preset size */
  height?: never;
}

interface RadialProgressCustomProps extends RadialProgressBaseProps {
  /** Not available when using custom dimensions */
  size?: never;
  /** Custom width in pixels */
  width: number;
  /** Custom height in pixels */
  height: number;
}

export type RadialProgressProps =
  | RadialProgressPresetProps
  | RadialProgressCustomProps;

const RadialProgress = React.forwardRef<HTMLDivElement, RadialProgressProps>(
  (
    {
      className,
      value,
      max = 100,
      thickness,
      symbol,
      label,
      showLabel = true,
      animationDuration = 500,
      strokeColor = "stroke-primary",
      trackColor = "stroke-muted",
      style,
      fontSize: customFontSizeProp,
      ...props
    },
    ref
  ) => {
    const isCustom = "width" in props && props.width !== undefined;

    const dimension = isCustom
      ? Math.min(props.width, props.height)
      : SIZES[(props.size as SizePreset) ?? "md"].dimension;

    const preset = isCustom ? null : SIZES[(props.size as SizePreset) ?? "md"];
    const stroke = thickness ?? (preset ? preset.strokeWidth : 4);
    const presetFontSizeClass = customFontSizeProp === undefined ? preset?.fontSize : undefined;

    // Strip width/height/size from the rest props before spreading onto the div
    const {
      width: _w,
      height: _h,
      size: _s,
      ...restProps
    } = props as Record<string, unknown>;

    const clampedMax = Math.max(1, max);
    const clampedValue = Math.max(0, Math.min(clampedMax, value));
    const progress = clampedValue / clampedMax;

    const svgWidth = isCustom ? (props as RadialProgressCustomProps).width : dimension;
    const svgHeight = isCustom ? (props as RadialProgressCustomProps).height : dimension;

    const radius = (dimension - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - progress * circumference;

    const sizeClass = isCustom
      ? undefined
      : SIZE_CLASSES[(props.size as SizePreset) ?? "md"];

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={clampedMax}
        className={cn(
          "relative inline-flex items-center justify-center",
          sizeClass,
          className
        )}
        style={{
          ...(isCustom && { width: svgWidth, height: svgHeight }),
          ...style,
        }}
        {...restProps}
      >
        <svg
          aria-hidden="true"
          width={svgWidth}
          height={svgHeight}
          viewBox={`0 0 ${dimension} ${dimension}`}
          className="-rotate-90"
        >
          {/* Track */}
          <circle
            cx={dimension / 2}
            cy={dimension / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            className={cn("opacity-20", trackColor)}
          />
          {/* Progress */}
          <circle
            cx={dimension / 2}
            cy={dimension / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={cn(
              "transition-[stroke-dashoffset] ease-out",
              strokeColor
            )}
            style={{
              transitionDuration: `${animationDuration}ms`,
            }}
          />
        </svg>

        {showLabel && (
          <span
            className={cn(
              "absolute font-semibold text-foreground",
              presetFontSizeClass,
              typeof customFontSizeProp === "string" ? customFontSizeProp : undefined
            )}
            style={
              typeof customFontSizeProp === "number"
                ? { fontSize: customFontSizeProp }
                : undefined
            }
          >
            {label ?? `${clampedValue}${symbol ?? ""}`}
          </span>
        )}
      </div>
    );
  }
);
RadialProgress.displayName = "RadialProgress";

export { RadialProgress };
