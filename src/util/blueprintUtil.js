import * as d3 from 'd3';

const coordToLine = d3.line()
  .x(coord => coord[0])
  .y(coord => coord[1]);

const coordPairsToLine = cPairs => cPairs.map(pair => coordToLine([pair[0], pair[1]])).join('');

const sqr = x => x * x;
const dist2 = (v, w) => sqr(v[0] - w[0]) + sqr(v[1] - w[1]);
const distToSegmentSquared = (p, v, w) => {
  const l2 = dist2(v, w);
  if (l2 === 0) {
    return dist2(p, v);
  }
  let t = (((p[0] - v[0]) * (w[0] - v[0])) + ((p[1] - v[1]) * (w[1] - v[1]))) / l2;
  t = Math.max(0, Math.min(1, t));
  return dist2(p, [v[0] + (t * (w[0] - v[0])), v[1] + (t * (w[1] - v[1]))]);
};
const distanceToSegment = (p, w, v) => Math.sqrt(distToSegmentSquared(p, v, w));

const alignPoint = (point, target) => {
  const alignedPoint = point;
  const xDiff = Math.abs(point[0] - target[0]);
  const yDiff = Math.abs(point[1] - target[1]);
  if (xDiff < yDiff) {
    alignedPoint[0] = target[0];
  } else {
    alignedPoint[1] = target[1];
  }
  return alignedPoint;
};


export default {
  coordToLine,
  coordPairsToLine,
  distanceToSegment,
  alignPoint,
};
