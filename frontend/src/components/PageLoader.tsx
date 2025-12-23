import { useEffect, useRef } from 'react';

interface PageLoaderProps {
  onComplete?: () => void;
}

export default function PageLoader({ onComplete }: PageLoaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-complete after 1 second (one full car animation cycle)
    const timer = setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  useEffect(() => {
    // Generate stars
    const starsContainer = containerRef.current?.querySelector('.stars');
    if (starsContainer) {
      for (let i = 0; i < 100; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.animationDelay = Math.random() * 3 + 's';
        starsContainer.appendChild(star);
      }
    }

    // Track car position for effects
    let lastTrackPosition = 0;
    let lastSmokePosition = 0;
    let lastSpeedLinePosition = 0;
    let animationFrameId: number;

    const trackCar = () => {
      const carContainer = containerRef.current?.querySelector('.car-container') as HTMLElement;
      if (!carContainer) return;

      const currentPosition = carContainer.offsetLeft;
      const tracksContainer = containerRef.current?.querySelector('#tracksContainer');
      const dustContainer = containerRef.current?.querySelector('#dustContainer');

      // Create tracks every 30px
      if (currentPosition > lastTrackPosition + 30 && currentPosition > 0 && tracksContainer) {
        createTrack(currentPosition, tracksContainer);
        createDust(currentPosition, dustContainer);
        lastTrackPosition = currentPosition;
      }

      // Create exhaust smoke every 40px
      if (currentPosition > lastSmokePosition + 40 && currentPosition > 0 && dustContainer) {
        createExhaustSmoke(currentPosition, dustContainer);
        lastSmokePosition = currentPosition;
      }

      // Create speed lines every 15px
      if (currentPosition > lastSpeedLinePosition + 15 && currentPosition > 0 && dustContainer) {
        createSpeedLine(currentPosition, dustContainer);
        lastSpeedLinePosition = currentPosition;
      }

      animationFrameId = requestAnimationFrame(trackCar);
    };

    // Start tracking
    animationFrameId = requestAnimationFrame(trackCar);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  const createTrack = (left: number, container: Element | null) => {
    if (!container) return;
    const positions = [28, 53];

    positions.forEach((bottom) => {
      const tireMark = document.createElement('div');
      tireMark.className = 'tire-mark';
      tireMark.style.position = 'absolute';
      tireMark.style.left = left + 'px';
      tireMark.style.bottom = bottom + 'px';
      tireMark.style.width = '20px';
      tireMark.style.height = '4px';
      tireMark.style.background = 'repeating-linear-gradient(90deg, rgba(100, 100, 100, 0.6) 0px, rgba(100, 100, 100, 0.6) 3px, transparent 3px, transparent 6px)';
      tireMark.style.animation = 'tireMark 3s linear';
      container.appendChild(tireMark);

      setTimeout(() => tireMark.remove(), 3000);
    });
  };

  const createDust = (left: number, container: Element | null) => {
    if (!container) return;
    for (let i = 0; i < 2; i++) {
      setTimeout(() => {
        const dust = document.createElement('div');
        dust.className = 'dust';
        dust.style.position = 'absolute';
        dust.style.bottom = '40px';
        dust.style.left = left + Math.random() * 20 + 'px';
        dust.style.width = '3px';
        dust.style.height = '3px';
        dust.style.background = 'rgba(150, 150, 150, 0.3)';
        dust.style.borderRadius = '50%';
        dust.style.animation = 'dustFloat 2s ease-out';
        container.appendChild(dust);

        setTimeout(() => dust.remove(), 2000);
      }, i * 100);
    }
  };

  const createExhaustSmoke = (left: number, container: Element | null) => {
    if (!container) return;
    const smoke = document.createElement('div');
    smoke.style.position = 'absolute';
    smoke.style.bottom = '40px';
    smoke.style.left = left + 20 + 'px';
    smoke.style.width = '15px';
    smoke.style.height = '15px';
    smoke.style.background = 'radial-gradient(circle, rgba(100, 100, 100, 0.4) 0%, rgba(80, 80, 80, 0.3) 50%, rgba(60, 60, 60, 0.1) 100%)';
    smoke.style.borderRadius = '50%';
    smoke.style.animation = 'exhaustSmoke 1.5s ease-out forwards';
    smoke.style.pointerEvents = 'none';
    container.appendChild(smoke);

    setTimeout(() => smoke.remove(), 1500);
  };

  const createSpeedLine = (left: number, container: Element | null) => {
    if (!container) return;
    const positions = [50, 60, 70];

    positions.forEach((bottom, index) => {
      setTimeout(() => {
        const speedLine = document.createElement('div');
        speedLine.className = 'speed-line';
        speedLine.style.position = 'absolute';
        speedLine.style.left = left + 50 + 'px';
        speedLine.style.bottom = bottom + 'px';
        speedLine.style.height = '2px';
        speedLine.style.background = 'linear-gradient(90deg, rgba(150, 150, 150, 0) 0%, rgba(150, 150, 150, 0.6) 50%, rgba(150, 150, 150, 0) 100%)';
        speedLine.style.animation = 'speedLine 0.5s linear';
        container.appendChild(speedLine);

        setTimeout(() => speedLine.remove(), 500);
      }, index * 50);
    });
  };

  return (
    <div ref={containerRef} className="page-loader-container">
      <style>{`
        .page-loader-container {
          position: fixed;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 150px;
          z-index: 9999;
          animation: fadeIn 0.3s ease-in-out;
          pointer-events: none;
        }

        @keyframes fadeIn {
          from { 
            opacity: 0;
          }
          to { 
            opacity: 1;
          }
        }

        .road {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 150px;
          perspective: 500px;
          overflow: hidden;
        }

        .road::before {
          content: '';
          position: absolute;
          bottom: 0;
          left: -10%;
          width: 120%;
          height: 80px;
          background: linear-gradient(to bottom, 
            rgba(80, 80, 80, 0.15) 0%, 
            rgba(60, 60, 60, 0.15) 30%, 
            rgba(50, 50, 50, 0.15) 100%);
          transform: rotateX(65deg);
          transform-origin: bottom center;
          border-top: 3px solid rgba(245, 158, 11, 0.3);
          border-bottom: 3px solid rgba(245, 158, 11, 0.3);
          box-shadow: inset 0 5px 15px rgba(0, 0, 0, 0.1), 0 1px 5px rgba(0, 0, 0, 0.05);
        }

        .road-lines {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 80px;
          transform: rotateX(65deg);
          transform-origin: bottom center;
          pointer-events: none;
        }

        .road-line {
          position: absolute;
          top: 50%;
          left: 0;
          transform: translateY(-50%);
          width: 80px;
          height: 5px;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 3px;
          opacity: 0.8;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
          animation: moveLines 1s ease-out infinite;
        }

        @keyframes moveLines {
          0% { 
            left: -100px; 
            opacity: 0; 
            width: 40px; 
          }
          10% { 
            opacity: 0.8; 
          }
          90% { 
            opacity: 0.8; 
          }
          100% { 
            left: calc(100% + 100px); 
            opacity: 0; 
            width: 80px; 
          }
        }

        .road-line:nth-child(1) { animation-delay: 0s; }
        .road-line:nth-child(2) { animation-delay: 0.125s; }
        .road-line:nth-child(3) { animation-delay: 0.25s; }
        .road-line:nth-child(4) { animation-delay: 0.375s; }
        .road-line:nth-child(5) { animation-delay: 0.5s; }
        .road-line:nth-child(6) { animation-delay: 0.625s; }
        .road-line:nth-child(7) { animation-delay: 0.75s; }
        .road-line:nth-child(8) { animation-delay: 0.875s; }

        .car-container {
          position: absolute;
          bottom: 35px;
          left: -200px;
          animation: moveCar 1s cubic-bezier(0.4, 0.0, 0.2, 1);
          animation-fill-mode: forwards;
          z-index: 10;
          filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.3));
        }

        @keyframes moveCar {
          0% { 
            left: -200px; 
            opacity: 1;
            transform: translateX(0);
          }
          100% { 
            left: calc(100% + 50px); 
            opacity: 1;
            transform: translateX(0);
          }
        }

        .car {
          position: relative;
          width: 150px;
          height: 90px;
          animation: bounce 0.4s ease-in-out infinite;
        }

        @keyframes bounce {
          0%, 100% { 
            transform: translateY(0);
          }
          50% { 
            transform: translateY(-2px);
          }
        }

        .car-image {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 150px;
          height: auto;
          filter: drop-shadow(0 5px 15px rgba(255, 215, 0, 0.3));
        }

        .headlight-glow {
          position: absolute;
          bottom: 28px;
          right: -5px;
          width: 25px;
          height: 25px;
          background: radial-gradient(circle, rgba(255, 255, 200, 0.9) 0%, rgba(255, 255, 150, 0.6) 30%, rgba(255, 255, 100, 0) 70%);
          border-radius: 50%;
          animation: glowPulse 1s ease-in-out infinite;
          z-index: -1;
        }

        @keyframes glowPulse {
          0%, 100% { 
            transform: scale(1); 
            opacity: 0.7; 
          }
          50% { 
            transform: scale(1.2); 
            opacity: 1; 
          }
        }

        .light-beam {
          position: absolute;
          bottom: 20px;
          right: -100px;
          width: 120px;
          height: 40px;
          background: linear-gradient(90deg, rgba(255, 255, 200, 0.5) 0%, rgba(255, 255, 150, 0.3) 40%, rgba(255, 255, 100, 0) 100%);
          clip-path: polygon(0 35%, 100% 0, 100% 100%, 0 65%);
          animation: beamPulse 0.8s ease-in-out infinite;
          filter: blur(3px);
        }

        @keyframes beamPulse {
          0%, 100% { 
            opacity: 0.5; 
          }
          50% { 
            opacity: 0.85; 
          }
        }

        .smoke-container {
          position: absolute;
          bottom: 12px;
          left: 15px;
          width: 40px;
          height: 40px;
          pointer-events: none;
        }

        .smoke {
          position: absolute;
          width: 8px;
          height: 8px;
          background: radial-gradient(circle, rgba(100, 100, 100, 0.4) 0%, rgba(80, 80, 80, 0.3) 50%, rgba(60, 60, 60, 0.1) 100%);
          border-radius: 50%;
          animation: smokeRise 1.8s cubic-bezier(0.4, 0.0, 0.6, 1) infinite;
        }

        .smoke:nth-child(1) { animation-delay: 0s; }
        .smoke:nth-child(2) { animation-delay: 0.6s; }
        .smoke:nth-child(3) { animation-delay: 1.2s; }

        @keyframes smokeRise {
          0% { 
            transform: translate(0, 0) scale(0.5); 
            opacity: 0.5; 
          }
          50% { 
            transform: translate(-20px, 12px) scale(0.8); 
            opacity: 0.3; 
          }
          100% { 
            transform: translate(-40px, 25px) scale(1); 
            opacity: 0; 
          }
        }

        .tracks-container, .dust-container {
          position: absolute;
          bottom: 35px;
          left: 0;
          width: 100%;
          height: 80px;
          pointer-events: none;
          overflow: hidden;
        }

        @keyframes tireMark {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }

        @keyframes dustFloat {
          0% { transform: translate(0, 0) scale(1); opacity: 0.4; }
          100% { transform: translate(-80px, 25px) scale(0); opacity: 0; }
        }

        @keyframes exhaustSmoke {
          0% { 
            transform: translate(0, 0) scale(0.5); 
            opacity: 0.5; 
          }
          50% { 
            transform: translate(-30px, 20px) scale(1); 
            opacity: 0.3; 
          }
          100% { 
            transform: translate(-60px, 40px) scale(1.5); 
            opacity: 0; 
          }
        }

        @keyframes speedLine {
          0% { 
            width: 0; 
            opacity: 1; 
            transform: translateX(0); 
          }
          100% { 
            width: 80px; 
            opacity: 0; 
            transform: translateX(-100px); 
          }
        }

        .road-edge-left, .road-edge-right {
          position: absolute;
          bottom: 0;
          width: 2px;
          height: 80px;
          background: linear-gradient(to top, rgba(245, 158, 11, 0.3) 0%, rgba(245, 158, 11, 0.15) 50%, rgba(245, 158, 11, 0) 100%);
          transform: rotateX(65deg);
          transform-origin: bottom center;
        }

        .road-edge-left {
          left: 20%;
          transform: rotateX(65deg) skewY(-2deg);
        }

        .road-edge-right {
          right: 20%;
          transform: rotateX(65deg) skewY(2deg);
        }

        .horizon-glow {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 60%;
          height: 30px;
          background: radial-gradient(ellipse, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 50%, rgba(245, 158, 11, 0) 100%);
          filter: blur(15px);
        }
      `}</style>

      {/* Road */}
      <div className="road">
        {/* Horizon Glow */}
        <div className="horizon-glow" />

        {/* Road Edge Lines */}
        <div className="road-edge-left" />
        <div className="road-edge-right" />

        {/* Center Lines */}
        <div className="road-lines">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="road-line" />
          ))}
        </div>
      </div>

      {/* Tracks Container */}
      <div className="tracks-container" id="tracksContainer" />

      {/* Dust Container */}
      <div className="dust-container" id="dustContainer" />

      {/* Car */}
      <div className="car-container">
        <div className="car">
          {/* Car Image */}
          <img src="/loadercar.png" alt="Taxi" className="car-image" />

          {/* Light Effects */}
          <div className="headlight-glow" />
          <div className="light-beam" />

          {/* Smoke/Exhaust Effects */}
          <div className="smoke-container">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="smoke" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

