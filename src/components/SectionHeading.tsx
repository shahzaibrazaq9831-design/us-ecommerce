"use client";

import React from "react";

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  as?: "h1" | "h2";
  align?: "center" | "left";
  id?: string;
}

let nextId = 0;

/**
 * Generate a stable unique ID for the heading.
 * Placed outside the component so it persists across renders without
 * triggering re-renders (Math.random is impure).
 */
function generateId(base?: string) {
  nextId += 1;
  return base ? `${base}-${nextId}` : `section-heading-${nextId}`;
}

/**
 * Reusable section heading that matches the Customer Reviews heading style exactly.
 * - Serif font, responsive clamp() size, centered
 * - Two thin horizontal lines (left/right) vertically centered with title text
 * - Optional subtitle below title
 * - Lines hide below 360px so the title can center/wrap
 */
export function SectionHeading({
  title,
  subtitle,
  as = "h2",
  align = "center",
  id,
}: SectionHeadingProps) {
  const HeadingTag = as === "h1" ? "h1" : "h2";
  const headingId = id ? generateId(id) : generateId();

  return (
    <div className="flex flex-col items-center gap-4 pb-12">
      <div className="flex items-center justify-center gap-x-6 relative">
        {/* Left line – 28px mobile, 56px desktop, hidden below 360px */}
        <span
          className="line h-px w-7 md:w-14 bg-[rgba(23,23,23,0.24)] flex-none [aria-hidden:true]"
        />
        {/* Title – serif font, responsive clamp size, medium weight, dark color, centered */}
        <HeadingTag
          id={headingId}
          className={
            "font-medium text-secondary text-center" +
            (align === "left" ? " text-left" : "")
          }
        >
          {title}
        </HeadingTag>
        {/* Right line – 28px mobile, 56px desktop, hidden below 360px */}
        <span
          className="line h-px w-7 md:w-14 bg-[rgba(23,23,23,0.24)] flex-none [aria-hidden:true]"
        />
      </div>
      {subtitle && (
        <p
          className="mt-2 text-[1rem] font-normal italic text-gray-600 leading-[1.5] text-center"
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}