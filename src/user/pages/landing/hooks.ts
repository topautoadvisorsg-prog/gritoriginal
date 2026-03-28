import React, { useEffect, useRef, useState, useCallback } from 'react';

export function useScrollAnimation() {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('lp-visible'); }),
            { threshold: 0.1, rootMargin: '0px 0px -60px 0px' },
        );
        ref.current?.querySelectorAll('.lp-animate').forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, []);
    return ref;
}

export function AnimatedCounter({ end, suffix = '', prefix = '' }: { end: number; suffix?: string; prefix?: string }) {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const started = useRef(false);
    useEffect(() => {
        const obs = new IntersectionObserver(([e]) => {
            if (e.isIntersecting && !started.current) {
                started.current = true;
                const dur = 1800, step = Math.ceil(end / (dur / 16));
                let cur = 0;
                const t = setInterval(() => { cur = Math.min(cur + step, end); setCount(cur); if (cur >= end) clearInterval(t); }, 16);
            }
        }, { threshold: 0.5 });
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, [end]);
    return React.createElement('span', { ref }, `${prefix}${count.toLocaleString()}${suffix}`);
}

export function use3DTilt() {
    const ref = useRef<HTMLDivElement>(null);
    const handleMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const el = ref.current; if (!el) return;
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5;
        const y = (e.clientY - r.top) / r.height - .5;
        el.style.transform = `perspective(800px) rotateX(${-y * 6}deg) rotateY(${x * 6}deg) translateY(-4px)`;
    }, []);
    const handleLeave = useCallback(() => {
        if (ref.current) ref.current.style.transform = '';
    }, []);
    return { ref, onMouseMove: handleMove, onMouseLeave: handleLeave };
}
