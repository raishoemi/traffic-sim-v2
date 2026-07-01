import { useEffect, useRef, useState } from 'react';
import { createCanvasScene } from '../sim/canvas-scene.js';

const CANVAS_HEIGHT = 280;

function drawScene(context, scene) {
  context.clearRect(0, 0, scene.width, scene.height);
  context.fillStyle = '#f8fafc';
  context.fillRect(0, 0, scene.width, scene.height);

  context.fillStyle = '#dbe4f0';
  context.fillRect(scene.lane.x, scene.lane.y, scene.lane.width, scene.lane.height);

  context.strokeStyle = '#94a3b8';
  context.lineWidth = 2;
  context.setLineDash([12, 10]);
  context.beginPath();
  context.moveTo(scene.lane.x, scene.lane.y + scene.lane.height / 2);
  context.lineTo(scene.lane.x + scene.lane.width, scene.lane.y + scene.lane.height / 2);
  context.stroke();

  context.setLineDash([]);
  context.strokeStyle = '#b91c1c';
  context.lineWidth = 4;
  context.beginPath();
  context.moveTo(scene.stopLineX, scene.lane.y - 12);
  context.lineTo(scene.stopLineX, scene.lane.y + scene.lane.height + 12);
  context.stroke();

  context.fillStyle = scene.light.state === 'green' ? '#22c55e' : '#ef4444';
  context.beginPath();
  context.arc(scene.light.x, scene.light.y, scene.light.radius, 0, Math.PI * 2);
  context.fill();

  context.font = '12px system-ui, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';

  scene.vehicles.forEach((vehicle, index) => {
    const left = vehicle.x - vehicle.width / 2;
    const top = vehicle.y - vehicle.height / 2;

    context.fillStyle = vehicle.isTracked ? '#2563eb' : '#475569';
    context.fillRect(left, top, vehicle.width, vehicle.height);
    context.strokeStyle = vehicle.isTracked ? '#1d4ed8' : '#334155';
    context.lineWidth = vehicle.isTracked ? 3 : 2;
    context.strokeRect(left, top, vehicle.width, vehicle.height);

    context.fillStyle = '#ffffff';
    context.fillText(String(index + 1), vehicle.x, vehicle.y);
  });
}

export function CanvasAnimator({ vehicles, simulation }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [canvasWidth, setCanvasWidth] = useState(720);
  const canvasLabel = `Top-down traffic simulation canvas with ${vehicles.length} vehicles. The tracked car is blue and the light is ${
    simulation.phase === 'completed' ? 'red' : 'green'
  }.`;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    const updateWidth = () => {
      setCanvasWidth(Math.max(320, Math.floor(container.clientWidth)));
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(canvasWidth * dpr);
    canvas.height = Math.floor(CANVAS_HEIGHT * dpr);
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${CANVAS_HEIGHT}px`;

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawScene(
      context,
      createCanvasScene({
        width: canvasWidth,
        height: CANVAS_HEIGHT,
        vehicles,
        simulation,
      }),
    );
  }, [canvasWidth, simulation, vehicles]);

  return (
    <div ref={containerRef} className="canvas-frame">
      <canvas
        ref={canvasRef}
        className="simulation-canvas"
        role="img"
        aria-label={canvasLabel}
      />
    </div>
  );
}
