<template>
  <div class="tool-wrapper">
    <button :disabled="editMode" v-on:click="toggleEdit">Edit</button>
    <button :disabled="!editMode" v-on:click="toggleEdit">Cancel</button>
    <svg class="canvas">
      <g class="walls">
        <path :d="path"></path>
        <path :d="previewPath"></path>
      </g>
      <g class="guides">
        <path :visibility="guideVisibility" :d="xGuidePath" class="guideline"></path>
        <path :visibility="guideVisibility" :d="yGuidePath" class="guideline"></path>
        <circle class="startGuide" :cx="startGuide.x" :cy="startGuide.y" :r="10"></circle>
        <rect class="measurementRect" :x="point.x - 50" :y="point.y - 30" width="100" height="30" v-for="point in wallMeasurements"></rect>
        <text :x="point.x - 20" :y="point.y - 10" v-for="point in wallMeasurements">{{ point.value }}</text>
      </g>
    </svg>
    {{ hoverCoord }}<br/>
    {{ path }}
  </div>
</template>

<script>
import * as d3 from 'd3';

const coordToLine = d3.line()
  .x(coord => coord[0])
  .y(coord => coord[1]);

function canvasHover(coords, vueThis) {
  const vue = vueThis;
  vue.hoverCoord = coords;
}

function canvasClicked(coords, points) {
  points.push(coords);
}

const initDraw = (vueThis) => {
  d3.select('svg')
    .on('click', () => {
      canvasClicked(vueThis.nextCoord, vueThis.wallpoints);
    })
    .on('mousemove', function boundMouseover() {
      canvasHover(d3.mouse(this), vueThis);
    });
  d3.select('.startGuide')
    .on('click', () => {
      const vue = vueThis;
      const lastWallpoint = vue.wallpoints[vue.wallpoints.length - 1];
      vue.wallpoints.push(vue.wallpoints[0]);
      // Compensate last point for 90 degree angle
      const xDiff = Math.abs(lastWallpoint[0] - vue.hoverCoord[0]);
      const yDiff = Math.abs(lastWallpoint[1] - vue.hoverCoord[1]);
      if (xDiff < yDiff) {
        lastWallpoint[0] = vue.wallpoints[0][0];
      } else {
        lastWallpoint[1] = vue.wallpoints[0][1];
      }
      vue.editMode = false;
      d3.select('svg')
        .on('click', null)
        .on('mousemove', null);
    });
};

export default {
  name: 'blueprint',
  data() {
    return {
      editMode: false,
      wallpoints: [],
      hoverCoord: [0, 0],
    };
  },
  computed: {
    path() {
      return coordToLine(this.wallpoints);
    },
    nextCoord() {
      if (this.wallpoints.length === 0) {
        return this.hoverCoord;
      }
      const prevWallpoint = this.wallpoints[this.wallpoints.length - 1];
      const xDiff = Math.abs(prevWallpoint[0] - this.hoverCoord[0]);
      const yDiff = Math.abs(prevWallpoint[1] - this.hoverCoord[1]);
      return xDiff > yDiff ?
        [this.hoverCoord[0], prevWallpoint[1]] :
        [prevWallpoint[0], this.hoverCoord[1]];
    },
    previewPath() {
      if (this.wallpoints.length === 0) {
        return coordToLine([]);
      }
      const prevWallpoint = this.wallpoints[this.wallpoints.length - 1];
      const guideCoords = [prevWallpoint, this.nextCoord];
      return coordToLine(guideCoords);
    },
    xGuidePath() {
      return coordToLine([[0, this.nextCoord[1]], [1200, this.nextCoord[1]]]);
    },
    yGuidePath() {
      return coordToLine([[this.nextCoord[0], 0], [this.nextCoord[0], 800]]);
    },
    startGuide() {
      if (this.wallpoints.length === 0) {
        return { x: 0, y: 0 };
      }
      const startPoint = this.wallpoints[0];
      return {
        x: startPoint[0],
        y: startPoint[1],
      };
    },
    guideVisibility() {
      return this.editMode ? 'visible' : 'hidden';
    },
    wallMeasurements() {
      const distanceFactor = 0.025;
      const measurementPoints = this.wallpoints.map((point, index) => {
        if (index === 0) {
          return null;
        }
        const prevPoint = this.wallpoints[index - 1];
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
          value: `${(value * distanceFactor).toFixed(1)}m`,
        };
      })
      .filter(point => point !== null);
      if (this.editMode && this.nextCoord !== undefined && this.wallpoints.length > 0) {
        const prevPoint = this.wallpoints[this.wallpoints.length - 1];
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
          value: `${(value * distanceFactor).toFixed(1)}m`,
        };
        measurementPoints.push(cursorPoint);
      }
      return measurementPoints;
    },
  },
  methods: {
    toggleEdit() {
      this.editMode = !this.editMode;
      if (this.editMode) {
        initDraw(this);
      }
    },
  },
  mounted() {

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

.walls {
  fill: none;
  stroke: white;
  stroke-width: 4px;
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
