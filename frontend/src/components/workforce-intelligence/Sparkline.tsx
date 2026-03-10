export const Sparkline = ({ data = [], color = "#4f7ef7" }: { data?: number[], color?: string }) => {
    // Generate mock history if none provided (for demo purposes as API doesn't return history yet)
    const points = data.length > 0 ? data : Array.from({ length: 12 }, () => 40 + Math.random() * 60);

    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    const width = 80;
    const height = 24;

    const path = points.map((p, i) => {
        const x = (i / (points.length - 1)) * width;
        const y = height - ((p - min) / range) * height;
        return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
    }).join(' ');

    return (
        <div className="relative group">
            <svg width={width} height={height} className="overflow-visible">
                <defs>
                    <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.5" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                </defs>
                <path
                    d={path}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="drop-shadow-[0_0_8px_rgba(79,126,247,0.3)]"
                />
                <circle
                    cx={width}
                    cy={height - ((points[points.length - 1] - min) / range) * height}
                    r="2.5"
                    fill={color}
                    className="animate-pulse"
                />
            </svg>
        </div>
    );
};
