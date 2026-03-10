

export const RetroGrid = ({ className = '', angle = 65 }: { className?: string, angle?: number }) => {
    return (
        <div
            className={`pointer-events-none absolute h-full w-full overflow-hidden opacity-30 [perspective:200px] ${className}`}
        >
            {/* Grid */}
            <div className="absolute inset-0" style={{ transform: `rotateX(${angle}deg)` }}>
                <div
                    className="animate-grid [background-repeat:repeat] [background-size:60px_60px] [height:300vh] [inset:0%_0px] [margin-left:-50%] [transform-origin:100%_0_0] [width:600vw]"
                    style={{
                        backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.2) 1px, transparent 0), linear-gradient(to bottom, rgba(255,255,255,0.2) 1px, transparent 0)`
                    }}
                />
            </div>

            {/* Background Gradient to mask top */}
            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-[#0a0a0a] to-90%" />
        </div>
    );
}
