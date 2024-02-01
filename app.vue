<template>
  <title>Nuxt3 - Three.js 建立球的小遊樂場</title>
  <ClientOnly>
    <Playground />
  </ClientOnly>
  <footer>Create By <a href="https://github.com/WangShuan/nuxt3-threejs-balls">WangXuan</a></footer>
</template>

<style>
* {
  margin: 0;
  padding: 0;
}

html,
body {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

footer {
  position: absolute;
  bottom: 16px;
  right: 16px;
  color: #222;
  font-size: 18px;
  font-weight: bold;
}

a {
  color: #222;
}
</style>