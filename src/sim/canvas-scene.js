const CANVAS_PADDING = 32;
const VEHICLE_WIDTH = 56;
const VEHICLE_HEIGHT = 24;

function worldToCanvasX(position, minPosition, maxPosition, width) {
  const worldSpan = Math.max(maxPosition - minPosition, 1);
  const drawableWidth = width - CANVAS_PADDING * 2;
  return CANVAS_PADDING + ((position - minPosition) / worldSpan) * drawableWidth;
}

export function createCanvasScene({ width, height, simulation, vehicles }) {
  const positions = vehicles.map((vehicle) => vehicle.position);
  const minPosition = Math.min(...positions, -10);
  const maxPosition = Math.max(...positions, 4);
  const laneTop = height * 0.35;
  const laneHeight = height * 0.3;
  const centerY = laneTop + laneHeight / 2;

  return {
    width,
    height,
    lane: {
      x: CANVAS_PADDING,
      y: laneTop,
      width: width - CANVAS_PADDING * 2,
      height: laneHeight,
    },
    stopLineX: worldToCanvasX(0, minPosition, maxPosition, width),
    light: {
      state: simulation.phase === 'completed' ? 'red' : 'green',
      x: width - CANVAS_PADDING - 18,
      y: laneTop - 18,
      radius: 12,
    },
    vehicles: vehicles.map((vehicle) => ({
      id: vehicle.id,
      isTracked: vehicle.isTracked,
      x: worldToCanvasX(vehicle.position, minPosition, maxPosition, width),
      y: centerY,
      width: VEHICLE_WIDTH,
      height: VEHICLE_HEIGHT,
    })),
  };
}
