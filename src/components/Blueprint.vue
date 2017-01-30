<template>
  <div class="tool-wrapper">
    <button v-if="ready" v-on:click="save">Save</button>
    <svg class="canvas">
      <g class="walls">
        <path class="exteriorWall" :d="exteriorWallsPath"></path>
        <path class="interiorWall" :d="interiorWallsPath"></path>
        <path class="wallPreview" :d="previewPath"></path>
      </g>
      <g class="guides">
        <path :visibility="guideVisibility" :d="xGuidePath" class="guideline"></path>
        <path :visibility="guideVisibility" :d="yGuidePath" class="guideline"></path>
        <path style="stroke: green; stroke-width: 5px;" class="guideline" :d="unfinishedWallPath"></path>
        <circle style="stroke: red;" :cx="hoverCoord[0]" :cy="hoverCoord[1]" :r="nearestWall.distance"></circle>
        <circle style="fill: white; stroke: white;" :cx="nearestWall.wallPoint[0]" :cy="nearestWall.wallPoint[1]" r="10"></circle>
        <circle v-if="currentInteriorWall.length > 0" style="fill: white; stroke: white;" :cx="currentInteriorWall[0][0]" :cy="currentInteriorWall[0][1]" r="10"></circle>
        <rect class="measurementRect" :x="point.x - 50" :y="point.y - 30" width="100" height="30" v-for="point in wallMeasurements"></rect>
        <text :x="point.x - 20" :y="point.y - 10" v-for="point in wallMeasurements">{{ point.value }}</text>
        <circle :visibility="guideVisibility" class="startGuide" :cx="startGuide.x" :cy="startGuide.y" r="10"></circle>
      </g>
    </svg>
    {{ debugMessage }}<br/>
    {{ hoverCoord }}<br/>
  </div>
</template>

<script>
import * as d3 from 'd3';
import util from '../util/blueprintUtil';

const drawModes = {
  OUTSIDEWALLS: 'outsidewalls', // Drawing the closed loop of walls
  INSIDEWALLS1: 'insidewalls1', // Selecting interior wall beginning
  INSIDEWALLS2: 'insidewalls2', // Selecting interior wall end
};

const initDraw = (vueThis) => {
  const vue = vueThis;

  vue.drawMode = drawModes.OUTSIDEWALLS;

  d3.select('svg')
    .on('click', () => {
      if (vue.drawMode === drawModes.OUTSIDEWALLS) {
        vue.exteriorWallpoints.push(vue.nextCoord);
      } else if (vue.drawMode === drawModes.INSIDEWALLS1) {
        vue.debugMessage = 'Wall begin chosen';
        vue.drawMode = drawModes.INSIDEWALLS2;
        vue.currentInteriorWall = [vue.nearestWall.wallPoint];
      } else if (vue.drawMode === drawModes.INSIDEWALLS2) {
        vue.debugMessage = 'Wall end chosen';
        vue.drawMode = drawModes.INSIDEWALLS1;
        vue.currentInteriorWall[1] = vue.nearestWall.wallPoint;
        vue.interiorWalls.push(vue.currentInteriorWall);
        vue.currentInteriorWall = [];
      }
    })
    .on('mousemove', function boundMouseover() {
      vue.hoverCoord = d3.mouse(this);
    });

  d3.select('.startGuide')
    .on('click', () => {
      const lastWallpoint = vue.exteriorWallpoints[vue.exteriorWallpoints.length - 1];
      vue.exteriorWallpoints.push(vue.exteriorWallpoints[0]);
      // Compensate last point for 90 degree angle
      const xDiff = Math.abs(lastWallpoint[0] - vue.hoverCoord[0]);
      const yDiff = Math.abs(lastWallpoint[1] - vue.hoverCoord[1]);
      if (xDiff < yDiff) {
        lastWallpoint[0] = vue.exteriorWallpoints[0][0];
      } else {
        lastWallpoint[1] = vue.exteriorWallpoints[0][1];
      }
      vue.drawMode = drawModes.INSIDEWALLS1;
      vue.debugMessage = 'Exterior walls done';
      vue.ready = true;
      d3.event.stopPropagation();
    });
};

export default {
  name: 'blueprint',
  data() {
    return {
      editMode: true,
      ready: false,
      exteriorWallpoints: [],
      interiorWalls: [],
      hoverCoord: [0, 0],
      drawMode: '',
      debugMessage: 'debug',
      currentInteriorWall: [],
      distanceFactor: 0.025,
    };
  },
  computed: {
    exteriorWallsPath() {
      return util.coordToLine(this.exteriorWallpoints);
    },
    interiorWallsPath() {
      return util.coordPairsToLine(this.interiorWalls);
    },
    unfinishedWallPath() {
      let path = '';
      if (this.drawMode === drawModes.INSIDEWALLS1) {
        path = this.straightPathToNearestWall;
      } else if (this.drawMode === drawModes.INSIDEWALLS2) {
        path = util.coordToLine([this.nearestWall.wallPoint, this.currentInteriorWall[0]]);
      }
      return path;
    },
    nextCoord() {
      if (this.exteriorWallpoints.length === 0) {
        return this.hoverCoord;
      }
      const prevWallpoint = this.exteriorWallpoints[this.exteriorWallpoints.length - 1];
      const xDiff = Math.abs(prevWallpoint[0] - this.hoverCoord[0]);
      const yDiff = Math.abs(prevWallpoint[1] - this.hoverCoord[1]);
      return xDiff > yDiff ?
        [this.hoverCoord[0], prevWallpoint[1]] :
        [prevWallpoint[0], this.hoverCoord[1]];
    },
    previewPath() {
      if (this.exteriorWallpoints.length === 0) {
        return util.coordToLine([]);
      }
      const prevWallpoint = this.exteriorWallpoints[this.exteriorWallpoints.length - 1];
      const guideCoords = [prevWallpoint, this.nextCoord];
      return util.coordToLine(guideCoords);
    },
    xGuidePath() {
      return util.coordToLine([[0, this.nextCoord[1]], [1200, this.nextCoord[1]]]);
    },
    yGuidePath() {
      return util.coordToLine([[this.nextCoord[0], 0], [this.nextCoord[0], 800]]);
    },
    startGuide() {
      if (this.exteriorWallpoints.length === 0) {
        return { x: 0, y: 0 };
      }
      const startPoint = this.exteriorWallpoints[0];
      return {
        x: startPoint[0],
        y: startPoint[1],
      };
    },
    guideVisibility() {
      return this.drawMode === drawModes.OUTSIDEWALLS ? 'visible' : 'hidden';
    },
    wallMeasurements() {
      const measurementPoints = this.exteriorWallpoints.map((point, index) => {
        if (index === 0) {
          return null;
        }
        const prevPoint = this.exteriorWallpoints[index - 1];
        const xDiff = prevPoint[0] + point[0];
        const yDiff = prevPoint[1] + point[1];
        const x = xDiff / 2;
        const y = yDiff / 2;
        const value = Math.sqrt(
          Math.pow(point[0] - prevPoint[0], 2) +
          Math.pow(point[1] - prevPoint[1], 2));
        return {
          x,
          y,
          value: `${(value * this.distanceFactor).toFixed(1)}m`,
        };
      })
      .filter(point => point !== null);
      if (this.editMode && this.nextCoord !== undefined && this.exteriorWallpoints.length > 0) {
        const prevPoint = this.exteriorWallpoints[this.exteriorWallpoints.length - 1];
        const xDiff = prevPoint[0] + this.nextCoord[0];
        const yDiff = prevPoint[1] + this.nextCoord[1];
        const x = xDiff / 2;
        const y = yDiff / 2;
        const value = Math.sqrt(
          Math.pow(this.nextCoord[0] - prevPoint[0], 2) +
          Math.pow(this.nextCoord[1] - prevPoint[1], 2));
        const cursorPoint = {
          x,
          y,
          value: `${(value * this.distanceFactor).toFixed(1)}m`,
        };
        measurementPoints.push(cursorPoint);
      }
      return measurementPoints;
    },
    straightPathToNearestWall() {
      const line = this.nearestWall.line;
      // const distance = this.nearestWall.distance;
      const isHorizontal = line[0][1] === line[1][1];
      return isHorizontal ?
        util.coordToLine([this.hoverCoord, [this.hoverCoord[0], line[0][1]]]) :
        util.coordToLine([this.hoverCoord, [line[0][0], this.hoverCoord[1]]]);
    },
    nearestWall() {
      let nearestLine = {
        line: [[], []],
        distance: Number.MAX_SAFE_INTEGER,
        path: '',
        wallPoint: [],
      };

      this.exteriorWallpoints.forEach((point, index) => {
        if (index === 0) {
          return;
        }
        const prevPoint = this.exteriorWallpoints[index - 1];
        const line = [prevPoint, point];
        const distance = util.distanceToSegment(this.hoverCoord, line[0], line[1]);

        const isHorizontal = line[0][1] === line[1][1];
        const wallPoint = isHorizontal ?
          [this.hoverCoord[0], line[0][1]] :
          [line[0][0], this.hoverCoord[1]];
        const path = util.coordToLine([this.hoverCoord, wallPoint]);

        if (distance < nearestLine.distance) {
          nearestLine = {
            line,
            distance,
            path,
            wallPoint,
          };
        }
      });

      this.interiorWalls.forEach((wall) => {
        const distance = util.distanceToSegment(this.hoverCoord, wall[0], wall[1]);
        const isHorizontal = wall[0][1] === wall[1][1];
        const wallPoint = isHorizontal ?
          [this.hoverCoord[0], wall[0][1]] :
          [wall[0][0], this.hoverCoord[1]];
        const path = util.coordToLine([this.hoverCoord, wallPoint]);
        if (distance < nearestLine.distance) {
          nearestLine = {
            line: wall,
            distance,
            path,
            wallPoint,
          };
        }
      });

      return nearestLine;
    },
  },
  methods: {
    save() {
      this.editMode = false;
    },
  },
  mounted() {
    initDraw(this);
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.tool-wrapper {
  height: 800px;
  width: 1200px;
  background-color: gray;
  color: white;
}
svg {
  width: 100%;
  height: 100%;
}

.exteriorWall, .wallPreview {
  fill: none;
  stroke: white;
  stroke-width: 4px;
}

.interiorWall {
  fill: none;
  stroke: white;
  stroke-width: 2px;
}

.guides {
  fill: none;
  stroke: white;
  stroke-width: 1px;
  stroke-opacity: 0.5;
}
.startGuide {
  fill: black;
}
.guides > text {
  fill: white;
}
.measurementRect {
  fill: black;
  stroke-width: 2px;
}
</style>
