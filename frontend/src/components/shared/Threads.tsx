import React, { useRef, useEffect } from 'react';

interface ThreadsProps {
    color?: string;
    amplitude?: number;
    distance?: number;
    enableMouseInteraction?: boolean;
    className?: string;
}

export const Threads: React.FC<ThreadsProps> = ({
    color = "rgba(212, 168, 83, 0.2)", // brand primary with opacity
    amplitude = 1,
    distance = 1,
    enableMouseInteraction = true,
    className = ""
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;
        let animationFrameId: number;

        let mouseX = width / 2;
        let mouseY = height / 2;
        let targetMouseX = mouseX;
        let targetMouseY = mouseY;

        const linesCount = 40;
        let time = 0;

        const handleResize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (!enableMouseInteraction) return;
            const rect = canvas.getBoundingClientRect();
            targetMouseX = e.clientX - rect.left;
            targetMouseY = e.clientY - rect.top;
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', handleMouseMove);

        const draw = () => {
            ctx.clearRect(0, 0, width, height);

            // Smooth mouse interpolation
            mouseX += (targetMouseX - mouseX) * 0.05;
            mouseY += (targetMouseY - mouseY) * 0.05;

            ctx.lineWidth = 1;
            ctx.strokeStyle = color;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            for (let i = 0; i < linesCount; i++) {
                ctx.beginPath();

                // Map i to [0, 1]
                const normalizedI = i / linesCount;
                const offset = (normalizedI - 0.5) * distance * 200;

                // Mouse influence calculation
                const mouseInfluenceY = (mouseY / height - 0.5) * 2;

                // Create a flowing wave that spans across the width
                for (let x = -100; x <= width + 100; x += 30) {
                    const normalizedX = x / width;

                    // Complex noise-like wave generation
                    const wave1 = Math.sin(normalizedX * 4 + time * 0.5 + i * 0.1) * 30 * amplitude;
                    const wave2 = Math.cos(normalizedX * 8 - time * 0.3 + i * 0.05) * 20 * amplitude;

                    // Mouse warps the center part of the lines
                    const distToMouseX = Math.abs(x - mouseX);
                    const mouseWarp = Math.max(0, 1 - distToMouseX / 400) * mouseInfluenceY * 100 * amplitude;

                    const y = height / 2 + offset + wave1 + wave2 + mouseWarp;

                    if (x === -100) {
                        ctx.moveTo(x, y);
                    } else {
                        // Smooth curves
                        ctx.lineTo(x, y);
                    }
                }
                ctx.stroke();
            }

            time += 0.02;
            animationFrameId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, [color, amplitude, distance, enableMouseInteraction]);

    return (
        <canvas
            ref={canvasRef}
            className={`pointer-events-auto absolute inset-0 ${className}`}
            style={{ touchAction: 'none' }}
        />
    );
};
