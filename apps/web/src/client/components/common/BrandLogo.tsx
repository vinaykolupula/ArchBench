import React from "react";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<BrandLogoProps["size"]>, string> = {
  sm: "h-5 w-auto",
  md: "h-6 w-auto",
  lg: "h-8 w-auto",
  xl: "h-11 sm:h-12 md:h-14 w-auto",
};

/**
 * Shared ArchBench brand logo rendering the workspace branding/logo.png asset directly.
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({ size = "md", className = "" }) => (
  <img
    src="/assets/branding/logo.png"
    alt="ArchBench Logo"
    className={`${SIZE_CLASSES[size]} object-contain select-none shrink-0 ${className}`}
    draggable={false}
  />
);

