import { useRef, useEffect } from "react";

interface ParticlesProps {
    className?: string;
    particleCount?: number;
    particleColors?: string[];
    speed?: number;
    size?: number;
}

export const Particles = ({
    className = "",
    particleCount = 100,
    particleColors = ["#6366f1", "#a855f7", "#3b82f6", "#ffffff"],
    speed = 0.5,
    size = 2,
}: ParticlesProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationFrameId: number;
        let particles: Particle[] = [];

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initParticles();
        };

        class Particle {
            x: number;
            y: number;
            vx: number;
            vy: number;
            size: number;
            color: string;
            alpha: number;

            constructor() {
                this.x = Math.random() * (canvas?.width || window.innerWidth);
                this.y = Math.random() * (canvas?.height || window.innerHeight);
                const angle = Math.random() * Math.PI * 2;
                const v = Math.random() * speed + 0.1;
                this.vx = Math.cos(angle) * v;
                this.vy = Math.sin(angle) * v;
                this.size = Math.random() * size + 0.5;
                this.color = particleColors[Math.floor(Math.random() * particleColors.length)];
                this.alpha = Math.random() * 0.5 + 0.2;
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;

                // Bounce off edges smoothly
                if (!canvas) return;

                if (this.x < 0 || this.x > canvas.width) {
                    this.vx *= -1;
                    this.x = Math.max(0, Math.min(this.x, canvas.width));
                }

                if (this.y < 0 || this.y > canvas.height) {
                    this.vy *= -1;
                    this.y = Math.max(0, Math.min(this.y, canvas.height));
                }
            }

            draw() {
                if (!ctx) return;
                ctx.save();
                ctx.globalAlpha = this.alpha;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();

                // Add a subtle glow
                ctx.shadowBlur = 10;
                ctx.shadowColor = this.color;
                ctx.restore();
            }
        }

        const initParticles = () => {
            particles = [];
            for (let i = 0; i < particleCount; i++) {
                particles.push(new Particle());
            }
        };

        const render = () => {
            if (!ctx || !canvas) return;

            // Clear with a slight fade for trailing effect
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Update and draw particles
            particles.forEach((particle, i) => {
                particle.update();
                particle.draw();

                // Draw connecting lines
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particle.x - particles[j].x;
                    const dy = particle.y - particles[j].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 120) {
                        ctx.save();
                        ctx.beginPath();
                        ctx.moveTo(particle.x, particle.y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        // Line opacity based on distance
                        const lineAlpha = (1 - distance / 120) * 0.15;
                        ctx.strokeStyle = `rgba(168, 85, 247, ${lineAlpha})`; // purple-500 tint
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                        ctx.restore();
                    }
                }
            });

            animationFrameId = requestAnimationFrame(render);
        };

        window.addEventListener("resize", resize);
        resize();
        render();

        return () => {
            window.removeEventListener("resize", resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [particleCount, speed, size]);

    return (
        <canvas
            ref={canvasRef}
            className={`absolute inset-0 pointer-events-none ${className}`}
        />
    );
};
