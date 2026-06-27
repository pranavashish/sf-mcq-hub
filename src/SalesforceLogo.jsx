export function CloudLogo({ size = 96, glow = true, float = true }) {
  return (
    <span className={`cloudmark ${float ? 'cloudmark--float' : ''} ${glow ? 'cloudmark--glow' : ''}`} style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 100 100" width={size} height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="cloudGrad" x1="15" y1="20" x2="85" y2="85" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#FFC24D" /><stop offset="0.5" stopColor="#FF8A3D" /><stop offset="1" stopColor="#FF4D2E" />
          </linearGradient>
          <linearGradient id="cloudShine" x1="20" y1="30" x2="60" y2="55" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#fff" stopOpacity="0.85" /><stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g fill="url(#cloudGrad)">
          <rect x="16" y="50" width="68" height="32" rx="16" /><circle cx="50" cy="42" r="23" />
          <circle cx="29" cy="56" r="16" /><circle cx="70" cy="54" r="18" />
        </g>
        <ellipse cx="40" cy="40" rx="20" ry="13" fill="url(#cloudShine)" opacity="0.7" />
        <path className="cloud-spark" d="M54 35 L46 52 L53 52 L48 66 L62 47 L54 47 Z" fill="#FFFFFF" opacity="0.95" />
      </svg>
    </span>
  )
}
export function CloudMarkMini({ size = 26 }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs><linearGradient id="miniGrad" x1="15" y1="20" x2="85" y2="85" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#FFB020" /><stop offset="1" stopColor="#FF4D2E" /></linearGradient></defs>
      <g fill="url(#miniGrad)"><rect x="16" y="50" width="68" height="32" rx="16" /><circle cx="50" cy="42" r="23" />
        <circle cx="29" cy="56" r="16" /><circle cx="70" cy="54" r="18" /></g>
      <path d="M54 35 L46 52 L53 52 L48 66 L62 47 L54 47 Z" fill="#fff" opacity="0.9" />
    </svg>
  )
}
