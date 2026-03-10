// SmartHR Logo — person silhouette + rising trend line
// Used in Navbar and Login page
interface LogoMarkProps {
    size?: number;
    className?: string;
}

export const LogoMark = ({ size = 32, className = "" }: LogoMarkProps) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        {/* Head circle */}
        <circle cx="16" cy="8" r="4.5" fill="url(#headGrad)" />

        {/* Shoulders / body */}
        <path
            d="M7 22c0-4.418 4.03-8 9-8s9 3.582 9 8"
            stroke="url(#bodyGrad)"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
        />

        {/* Trend arrow rising through the body area */}
        <path
            d="M5 27 L11 21 L16 24 L27 13"
            stroke="url(#trendGrad)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
        />
        {/* Arrow head */}
        <path
            d="M22 13 L27 13 L27 18"
            stroke="url(#trendGrad)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
        />

        <defs>
            <linearGradient id="headGrad" x1="11.5" y1="3.5" x2="20.5" y2="12.5" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#4f7ef7" />
            </linearGradient>
            <linearGradient id="bodyGrad" x1="7" y1="14" x2="25" y2="22" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#4f7ef7" />
                <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
            <linearGradient id="trendGrad" x1="5" y1="27" x2="27" y2="13" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#60a5fa" />
            </linearGradient>
        </defs>
    </svg>
);

// Full logo: mark + wordmark side by side
interface LogoProps {
    size?: number;
    className?: string;
    showText?: boolean;
}

export const Logo = ({ size = 32, className = "", showText = true }: LogoProps) => (
    <div className={`flex items-center gap-2.5 ${className}`}>
        <LogoMark size={size} />
        {showText && (
            <span className="text-white font-bold text-lg tracking-tight">
                Smart
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent1 to-brand-accent2">
                    HR
                </span>
            </span>
        )}
    </div>
);
