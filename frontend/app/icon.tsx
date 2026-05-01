import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = {
  width: 64,
  height: 64,
};
export const contentType = "image/png";

export default function Icon() {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <defs>
    <linearGradient id="bgGrad" x1="8" y1="6" x2="56" y2="58" gradientUnits="userSpaceOnUse">
      <stop stop-color="#12313f"/>
      <stop offset="1" stop-color="#0a1621"/>
    </linearGradient>
    <linearGradient id="ringGrad" x1="16" y1="16" x2="48" y2="48" gradientUnits="userSpaceOnUse">
      <stop stop-color="#3ed6ff"/>
      <stop offset="1" stop-color="#46ffb2"/>
    </linearGradient>
  </defs>

  <rect x="4" y="4" width="56" height="56" rx="16" fill="url(#bgGrad)"/>
  <rect x="12" y="14" width="40" height="30" rx="8" fill="#0f2233" stroke="url(#ringGrad)" stroke-width="2"/>

  <circle cx="18" cy="20" r="2" fill="#46ffb2"/>
  <circle cx="24" cy="20" r="2" fill="#3ed6ff"/>

  <path d="M20 30 L25 26 L20 22" stroke="#9fe8ff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M28 32 H40" stroke="#7fffd4" stroke-width="2.5" stroke-linecap="round"/>

  <circle cx="45" cy="39" r="8" fill="#0f2233" stroke="#3ed6ff" stroke-width="2"/>
  <path d="M45 34.5V43.5" stroke="#46ffb2" stroke-width="2" stroke-linecap="round"/>
  <path d="M40.5 39H49.5" stroke="#46ffb2" stroke-width="2" stroke-linecap="round"/>

  <path d="M18 50 H36" stroke="#46ffb2" stroke-width="3" stroke-linecap="round" opacity="0.9"/>
</svg>
`;

  return new ImageResponse(svg, {
    ...size,
  });
}
