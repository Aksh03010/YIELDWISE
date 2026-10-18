export default function FieldIllustration({ compact = false }) {
  return <div className={`field-illustration ${compact ? 'compact' : ''}`}>
    <svg viewBox="0 0 640 380" role="img" aria-label="Illustration of agricultural parcels. This is not satellite imagery or a surveyed field boundary." preserveAspectRatio="xMidYMid slice">
      <defs>
        <pattern id="cropRows" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(-20)"><rect width="9" height="9" fill="#96934e" /><path d="M0 0V9" stroke="#bab576" strokeWidth="3" /></pattern>
        <pattern id="greenRows" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(18)"><rect width="12" height="12" fill="#58724c" /><path d="M0 0V12" stroke="#839467" strokeWidth="3" /></pattern>
        <pattern id="darkRows" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(-20)"><rect width="8" height="8" fill="#526048" /><path d="M0 0V8" stroke="#748069" strokeWidth="2" /></pattern>
        <linearGradient id="landShade" x2="0.8" y2="1"><stop stopColor="#cfca97" stopOpacity=".05" /><stop offset="1" stopColor="#172a20" stopOpacity=".45" /></linearGradient>
      </defs>
      <rect width="640" height="380" fill="#a6aa7b" />
      <path d="M-20 0H232L185 156-20 103Z" fill="url(#greenRows)" />
      <path d="M243-10H445L406 208 200 156Z" fill="url(#cropRows)" />
      <path d="M458-10H660V119L428 207Z" fill="#7a8657" />
      <path d="M-10 118L181 171 138 390H-10Z" fill="url(#cropRows)" />
      <path d="M199 175L402 227 366 390H152Z" fill="url(#greenRows)" />
      <path d="M425 226L660 139V390H384Z" fill="url(#darkRows)" />
      <path d="M238-10L145 390M-10 109L412 218 650 129M451-10L375 390" stroke="#d6cba3" strokeWidth="9" fill="none" />
      <path d="M238-10L145 390M-10 109L412 218 650 129M451-10L375 390" stroke="#e2d7b2" strokeWidth="3" fill="none" />
      <path d="M425 227L660 139" stroke="#294d38" strokeWidth="14" fill="none" strokeDasharray="2 8" strokeLinecap="round" />
      <rect width="640" height="380" fill="url(#landShade)" />
      <path d="M247 18L430 18 399 197 211 149Z" fill="#d8eabc" fillOpacity=".1" stroke="#e1f4b5" strokeWidth="3" strokeDasharray="7 5" />
      <g transform="translate(316 101)"><circle r="22" fill="#1d3a2d" fillOpacity=".3" /><circle r="13" fill="#f1f5e4" /><circle r="5" fill="#33583c" /></g>
      <g fill="#e8edda" fontSize="11" fontFamily="sans-serif"><text x="585" y="31">N</text><path d="M589 40L583 57H595Z" /><text x="28" y="351" fontSize="9" letterSpacing="1.5">FIELD ILLUSTRATION</text></g>
    </svg>
  </div>
}
