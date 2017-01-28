<template>
  <div id="app">
    <Blueprint></Blueprint>
  </div>
</template>

<script>
import Blueprint from './components/Blueprint';

export default {
  name: 'app',
  components: {
    Blueprint,
  },
};
</script>

<style>
body, html {
  height: 100%;
  width: 100%;
}
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  background-color: black;
  padding: 60px;
  height: 100%;
}
</style>
