<template>
  <div>
    <canvas ref="experience"></canvas>
    <button @click="reloadNuxtApp()" v-if="hasParams" class="reload-btn">Reload Scene</button>
    <button @click="reset()" class="reset-btn">Clear all</button>
  </div>
</template>

<script setup>
import { Scene, PerspectiveCamera, CircleGeometry, DirectionalLight, TextureLoader, Vector3, Vector2, Raycaster, MeshBasicMaterial, SphereGeometry, WebGLRenderer, PlaneGeometry, BoxGeometry, Mesh, MeshStandardMaterial, Color, Group } from 'three';
import * as CANNON from 'cannon-es'

const reset = () => window.location.href = '/balls'

const scene = new Scene()

const { width, height } = useWindowSize()
const aspectRatio = computed(() => width.value / height.value)
const camera = new PerspectiveCamera(50, aspectRatio.value, 0.1, 1000);
camera.position.set(0, 0, 60)
camera.lookAt(0, 0, 0)
scene.add(camera)

const light = new DirectionalLight(0xffffff, 2);
light.position.set(0, 10, 20)
scene.add(light);

const world = new CANNON.World()
world.gravity.set(0, -9.82, 0)

const experience = ref()
let renderer;
const initRenderer = () => {
  if (experience.value) {
    renderer = new WebGLRenderer({ canvas: experience.value });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    updateRender()
  }
}
const updateRender = () => {
  renderer.setSize(width.value, height.value)
  renderer.render(scene, camera)
}

watch(aspectRatio, () => {
  camera.aspect = aspectRatio.value
  camera.updateProjectionMatrix()
  updateRender()
})


// 建立模型按鈕
const { createModel, createFadeMesh } = useThree()

const models = [{
  geometry: new SphereGeometry(0.5, 32, 32),
  color: '#eee',
  positionY: 17,
  name: 'ball'
}, {
  geometry: new BoxGeometry(20, 0.5, 4),
  color: 'orange',
  positionY: 15,
  scale: new Vector3(0.2, 1, 0.25),
  rotation: new Vector3(0, 0, Math.PI / 12),
  name: 'board15'
}, {
  geometry: new BoxGeometry(20, 0.5, 4),
  color: 'orange',
  positionY: 13,
  scale: new Vector3(0.2, 1, 0.25),
  rotation: new Vector3(0, 0, -Math.PI / 12),
  name: 'board-15'
}, {
  geometry: new BoxGeometry(0.6, 4, 1),
  color: 'blue',
  positionY: 10,
  scale: new Vector3(1, 0.5, 0.5),
  name: 'domino'
}, {
  geometry: new BoxGeometry(5, 0.5, 5),
  color: 'gold',
  positionY: 7.5,
  scale: new Vector3(0.5, 1, 0.5),
  name: 'jumpFloor'
}, {
  geometry: new BoxGeometry(5, 0.5, 5),
  color: 'green',
  positionY: 6,
  scale: new Vector3(0.5, 1, 0.5),
  name: 'reflectFloor'
}, {
  geometry: new BoxGeometry(2, 10, 1),
  color: 'red',
  name: 'cancel',
  scale: new Vector3(0.15, 0.15, 0.15),
  positionY: -3,
  rotation: new Vector3(0, 0, -Math.PI / 4)
}, {
  geometry: new BoxGeometry(2, 10, 1),
  color: 'red',
  name: 'cancel',
  scale: new Vector3(0.15, 0.15, 0.15),
  positionY: -3,
  rotation: new Vector3(0, 0, Math.PI / 4)
}, {
  geometry: new CircleGeometry(1, 32),
  name: 'save',
  color: new Color('#ceff9e'),
  positionY: -8,
}]

let save;
models.forEach(item => {
  const mesh = createModel(item)
  if (mesh.name === 'save') save = mesh
  scene.add(mesh)
})

const texture = new TextureLoader().load('/textures/link.jpg')
save.material.map = texture

const hammerModel = new Group();
const top = createModel({
  geometry: new BoxGeometry(10, 3, 3),
  color: '#eee',
  name: 'hammer',
});
top.position.set(0, 5, 0);

const bottom = createModel({
  geometry: new BoxGeometry(2, 15, 1),
  color: 'brown',
  name: 'hammer',
});

hammerModel.add(top, bottom);
hammerModel.rotation.set(0, 0, Math.PI / 8);
hammerModel.scale.set(0.15, 0.15, 0.15);
hammerModel.position.set(-40, 0, 0);
scene.add(hammerModel);


// 建立半透明模型
const fadeBall = createFadeMesh(new SphereGeometry(0.5, 32, 32), '#eee')
const fadeBoard = createFadeMesh(new BoxGeometry(20, 0.5, 4), 'orange')
const fadeDomino = createFadeMesh(new BoxGeometry(0.6, 4, 1), 'blue')
const fadeJumpFloor = createFadeMesh(new BoxGeometry(5, 0.5, 5), 'gold')
const fadeReflectFloor = createFadeMesh(new BoxGeometry(5, 0.5, 5), 'green')
const fadeTop = createFadeMesh(new BoxGeometry(10, 3, 3), '#eee')
fadeTop.position.set(0, 5, 0)
const fadeBottom = createFadeMesh(new BoxGeometry(2, 15, 1), 'brown')
const fadeHammer = new Group()
fadeHammer.add(fadeTop, fadeBottom)
fadeHammer.rotation.set(0, 0, Math.PI / 12)
fadeHammer.scale.set(0.2, 0.2, 0.2)


// 處理滑鼠移動事件
const objectMapping = {
  'hammer': fadeHammer,
  'ball': fadeBall,
  'board15': fadeBoard,
  'board-15': fadeBoard,
  'domino': fadeDomino,
  'jumpFloor': fadeJumpFloor,
  'reflectFloor': fadeReflectFloor
};
const selected = ref()
const mouse = new Vector2();
const raycaster = new Raycaster();
useEventListener(document, 'mousemove', (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children);
  // 根據選中的值，從 mapping 裡獲取對應的半透明物件
  const obj = objectMapping[selected.value]
  if (obj && intersects.length > 0) {
    if (obj === fadeHammer) {
      obj.children.forEach(item => item.material.opacity = 0.3)
      // 獲取當前 hover 的對象
      const inter = intersects.find(item => {
        return item.object.name.indexOf('ball') != -1 || item.object.name.indexOf('board') != -1 || item.object.name.indexOf('domino') != -1 || item.object.name.indexOf('jumpFloor') != -1 || item.object.name.indexOf('reflectFloor') != -1
      });
      if (inter) {
        inter.object.userData.isHover = true
      } else {
        meshs.forEach(mesh => mesh.userData.isHover = false)
      }
    } else {
      obj.material.opacity = 0.3
    }
    // 設定板子的 rotation
    if (obj === fadeBoard) {
      obj.rotation.z = selected.value === 'board15' ? Math.PI / 12 : -Math.PI / 12
    }
    // 設定半透明物體的位置跟隨滑鼠移動
    obj.position.set(intersects[0].point.x, intersects[0].point.y, 0)
    scene.add(obj)
  }
})


// 處理點擊事件
useEventListener(document, 'click', (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children);
  if (intersects.length > 0) {
    // 判斷點擊的物件是哪個 model
    const i = intersects.findIndex(item => ['ball', 'board15', 'board-15', 'domino', 'jumpFloor', 'reflectFloor', 'hammer', 'cancel', 'save'].includes(item.object.name))
    const selectedObj = intersects[i]?.object.name
    // 若沒點擊任何 model，又有選中的物件，就建立該物件到場景
    if (i === -1) {
      const intersectionPoint = intersects[0].point;
      switch (selected.value) {
        case 'ball':
          createBall(intersectionPoint.x, intersectionPoint.y);
          break;
        case 'jumpFloor':
          createJumpFloor(intersectionPoint.x, intersectionPoint.y);
          break;
        case 'reflectFloor':
          createReflectFloor(intersectionPoint.x, intersectionPoint.y);
          break;
        case 'board15':
          createBoard(intersectionPoint.x, intersectionPoint.y, Math.PI / 12);
          break;
        case 'board-15':
          createBoard(intersectionPoint.x, intersectionPoint.y, -Math.PI / 12);
          break;
        case 'domino':
          createDomino(intersectionPoint.x, intersectionPoint.y);
          break;
        case 'cancel':
          cancelSelect();
          break;
      }
    }
    if (selectedObj) {
      // 若已有選中的 model，且與現在點擊的物件不相等，就更新選中的 model
      if (selected.value != selectedObj) {
        cancelSelect()
        selected.value = selectedObj
        return
      }
      // 若選中的 model 為 save 就保存當前場景
      if (selectedObj === 'save') {
        saveMyScene()
        return
      }
    }
    // 若選中的物件是 hammer 且沒點擊到任何 model
    if (!selectedObj && selected.value === 'hammer') {
      // 判斷是否有點擊到任何場景中的物件，若有就刪除該物件
      const inter = intersects.findIndex(item => {
        return item.object.name.indexOf('ball') != -1 || item.object.name.indexOf('board') != -1 || item.object.name.indexOf('domino') != -1 || item.object.name.indexOf('jumpFloor') != -1 || item.object.name.indexOf('reflectFloor') != -1
      });
      const matches = intersects[inter]?.object.name.match(/([a-zA-Z]+)(\d+)/);
      const textPart = matches ? matches[1] : null;
      const index = matches ? parseInt(matches[2], 10) : null;
      switch (textPart) {
        case 'ball':
          removeObject(ballsMesh, ballsBody, 'ball', index);
          break;
        case 'jumpFloor':
          removeObject(jumpFloorsMesh, jumpFloorsBody, 'jumpFloor', index);
          break;
        case 'board':
          removeObject(boardsMesh, boardsBody, 'board', index);
          break;
        case 'domino':
          removeObject(dominosMesh, dominosBody, 'domino', index);
          break;
        case 'reflectFloor':
          removeObject(reflectFloorsMesh, reflectFloorsBody, 'reflectFloor', index);
          break;
      }
    }
  }
})


// 刪除物件
const removeObject = (meshArray, bodyArray, prefix, index) => {
  const i = meshArray.findIndex(item => item.name === `${prefix}${index}`);
  if (i !== -1) {
    scene.remove(meshArray[i]);
    meshArray.splice(i, 1);
    world.removeBody(bodyArray[i]);
    bodyArray.splice(i, 1);
  }
}


// 取消選中，並將所有半透明物體移除
const cancelSelect = () => {
  selected.value = undefined
  scene.remove(fadeBall, fadeBoard, fadeDomino, fadeHammer, fadeJumpFloor, fadeReflectFloor)
}


// 保存當前場景
const saveMyScene = () => {
  cancelSelect()
  const meshData = []
  meshs.forEach(mesh => {
    const matches = mesh.name.match(/([a-zA-Z]+)(\d+)/);
    const name = matches ? matches[1] : null;
    meshData.push({
      px: mesh.position.x,
      py: mesh.position.y,
      r: name === 'domino' ? [mesh.rotation.x, mesh.rotation.y, mesh.rotation.z] : mesh.rotation.z,
      name
    })
  })

  const meshDataString = JSON.stringify(meshData);
  const url = new URL(window.location.href)
  const urlWithMeshData = url.origin + url.pathname + '?mesh=' + encodeURIComponent(meshDataString);
  window.open(urlWithMeshData, '_blank');
}


// 建立地板與背板
const createFloor = () => {
  const floor = new Mesh(new PlaneGeometry(100, 25), new MeshStandardMaterial());
  floor.rotateX(-Math.PI / 2);
  floor.position.y = -20;
  floor.position.z = 10.5;
  scene.add(floor);

  const planeShape = new CANNON.Plane()
  const planeBody = new CANNON.Body({ mass: 0 })
  planeBody.addShape(planeShape)
  planeBody.position.y = floor.position.y
  planeBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2)
  world.addBody(planeBody)

  const bgPlane = new Mesh(new PlaneGeometry(100, 60), new MeshStandardMaterial());
  bgPlane.position.z = -2;
  scene.add(bgPlane);
  const bgPlaneShape = new CANNON.Plane()
  const bgPlaneBody = new CANNON.Body({ mass: 0 })
  bgPlaneBody.addShape(bgPlaneShape)
  bgPlaneBody.position.z = bgPlane.position.z
  world.addBody(bgPlaneBody)
};


// 建立球體
const ballsMesh = []
const ballsBody = []
const createBall = (x, y) => {
  const ball = new Mesh(new SphereGeometry(0.5, 32, 32), new MeshStandardMaterial({ color: new Color('#eee') }))
  ball.position.set(x, y, 0)
  scene.add(ball)
  ball.name = `ball${ballsMesh.length}`
  scene.remove(fadeBall)
  ballsMesh.push(ball)
  const ballBody = new CANNON.Body({ mass: 10 })
  const ballShape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5))
  ballBody.addShape(ballShape)
  ballBody.material = new CANNON.Material()
  ballBody.material.friction = 0
  ballBody.position.x = ball.position.x
  ballBody.position.y = ball.position.y
  ballBody.position.z = ball.position.z
  world.addBody(ballBody)
  ballsBody.push(ballBody)
  ballBody.id = ball.name
}


// 建立板子
const boardsMesh = []
const boardsBody = []
const createBoard = (x, y, r) => {
  const board = new Mesh(new BoxGeometry(20, 0.5, 4), new MeshStandardMaterial({ color: new Color('orange') }))
  board.position.set(x, y, 0)
  board.rotation.set(0, 0, r)
  scene.add(board)
  board.name = `board${boardsMesh.length}`
  boardsMesh.push(board)
  scene.remove(fadeBoard)
  const boardShape = new CANNON.Box(new CANNON.Vec3(10, 0.25, 2))
  const boardBody = new CANNON.Body({ mass: 0 })
  boardBody.material = new CANNON.Material()
  boardBody.material.friction = 0
  boardBody.addShape(boardShape)
  boardBody.position.x = board.position.x
  boardBody.position.y = board.position.y
  boardBody.position.z = board.position.z
  boardBody.quaternion.copy(board.quaternion)
  boardBody.id = board.name
  world.addBody(boardBody)
  boardsBody.push(boardBody)
}


// 建立骨牌
const dominosMesh = []
const dominosBody = []
const createDomino = (x, y, r) => {
  const domino = new Mesh(new BoxGeometry(0.6, 4, 1), new MeshStandardMaterial({ color: new Color('blue') }))
  domino.position.set(x, y, 0)
  if (r) {
    domino.rotation.x = r[0]
    domino.rotation.y = r[1]
    domino.rotation.z = r[2]
  }
  scene.add(domino)
  domino.name = `domino${dominosMesh.length}`
  dominosMesh.push(domino)
  scene.remove(fadeDomino)
  const dominoShape = new CANNON.Box(new CANNON.Vec3(0.3, 2, 0.5))
  const dominoBody = new CANNON.Body({ mass: 10 })
  dominoBody.material = new CANNON.Material()
  dominoBody.material.friction = 0
  dominoBody.addShape(dominoShape)
  dominoBody.position.x = domino.position.x
  dominoBody.position.y = domino.position.y
  dominoBody.position.z = domino.position.z
  if (r) {
    dominoBody.quaternion.copy(domino.quaternion)
  }
  world.addBody(dominoBody)
  dominosBody.push(dominoBody)
  dominosBody.id = domino.name
}


// 建立彈跳地板
const jumpFloorsMesh = []
const jumpFloorsBody = []
const createJumpFloor = (x, y) => {
  const jumpFloor = new Mesh(new BoxGeometry(5, 0.5, 5), new MeshStandardMaterial({ color: new Color('gold') }));
  jumpFloor.position.set(x, y, 0)
  jumpFloor.name = `jumpFloor${jumpFloorsMesh.length}`
  scene.add(jumpFloor);
  scene.remove(fadeJumpFloor)
  jumpFloorsMesh.push(jumpFloor)
  const jumpFloorShape = new CANNON.Box(new CANNON.Vec3(2.5, 0.25, 2.5))
  const jumpFloorBody = new CANNON.Body({ mass: 0 })
  jumpFloorBody.addShape(jumpFloorShape)
  jumpFloorBody.position.x = jumpFloor.position.x
  jumpFloorBody.position.y = jumpFloor.position.y
  jumpFloorBody.position.z = jumpFloor.position.z
  jumpFloorBody.id = jumpFloor.name
  world.addBody(jumpFloorBody)
  jumpFloorsBody.push(jumpFloorBody)
}


// 建立反射地板
const reflectFloorsMesh = []
const reflectFloorsBody = []
const createReflectFloor = (x, y) => {
  const reflectFloor = new Mesh(new BoxGeometry(5, 0.5, 5), new MeshStandardMaterial({ color: new Color('green') }));
  reflectFloor.position.set(x, y, 0)
  reflectFloor.name = `reflectFloor${reflectFloorsMesh.length}`
  scene.add(reflectFloor);
  scene.remove(fadeReflectFloor)
  reflectFloorsMesh.push(reflectFloor)
  const reflectFloorShape = new CANNON.Box(new CANNON.Vec3(2.5, 0.25, 2.5))
  const reflectFloorBody = new CANNON.Body({ mass: 0 })
  reflectFloorBody.addShape(reflectFloorShape)
  reflectFloorBody.position.x = reflectFloor.position.x
  reflectFloorBody.position.y = reflectFloor.position.y
  reflectFloorBody.position.z = reflectFloor.position.z
  reflectFloorBody.id = reflectFloor.name
  world.addBody(reflectFloorBody)
  reflectFloorsBody.push(reflectFloorBody)
}


// 建立箭頭
const arrows = []
const createArrow = (i) => {
  const arrow = new Group()
  const rect = new Mesh(new PlaneGeometry(0.2, 1), new MeshBasicMaterial({ transparent: true, opacity: 0, color: new Color('red') }))
  arrow.add(rect)
  const trig1 = new Mesh(new PlaneGeometry(0.2, 0.5), new MeshBasicMaterial({ transparent: true, opacity: 0, color: new Color('red') }))
  trig1.rotation.set(0, 0, Math.PI / 4)
  trig1.position.set(0.2, 0.2, 0)
  arrow.add(trig1)
  const trig2 = new Mesh(new PlaneGeometry(0.2, 0.5), new MeshBasicMaterial({ transparent: true, opacity: 0, color: new Color('red') }))
  trig2.rotation.set(0, 0, -Math.PI / 4)
  trig2.position.set(-0.2, 0.2, 0)
  arrow.add(trig2)
  arrow.position.set(ballsMesh[i].position.x, 26.7, 0)
  scene.add(arrow)
  arrows.push({ id: ballsBody[i].id, obj: arrow })
}


// 設定動畫
let meshs
const loop = () => {
  world.step(1 / 60)
  meshs = [...boardsMesh, ...dominosMesh, ...jumpFloorsMesh, ...reflectFloorsMesh, ...ballsMesh]
  if (ballsMesh.length) {
    for (let i = 0; i < ballsMesh.length; i++) {
      // 讓 ball 的位置跟旋轉角度與 ballBody 相等
      ballsMesh[i].position.set(ballsBody[i].position.x, ballsBody[i].position.y, ballsBody[i].position.z)
      ballsMesh[i].quaternion.set(ballsBody[i].quaternion.x, ballsBody[i].quaternion.y, ballsBody[i].quaternion.z, ballsBody[i].quaternion.w)
      // 限制球的 z 軸始終為 0
      if (ballsBody[i].position.z !== 0) ballsBody[i].position.z = 0
      // 當球往上跑道超過可是範圍時出現箭頭
      if (ballsBody[i].position.y > 27) {
        const arrow = arrows.find(item => item.id === ballsBody[i].id)
        if (!arrow) createArrow(i)
      } else {
        const index = arrows.findIndex(item => item.id === ballsBody[i].id)
        if (index !== -1) {
          scene.remove(arrows[index].obj)
          arrows.splice(index, 1)
        }
      }
      // 處理球產生的碰撞事件
      ballsBody[i].addEventListener('collide', (e) => {
        // 當球碰到彈跳地板就將速度改為 0, 30, 0
        if ((e.body.id).toString().indexOf('jumpFloor') != -1) {
          ballsBody[i].velocity.set(0, 30, 0)
        }
        // 當球碰到反射地板就將 y 軸的速度改為相反的兩倍，且讓其每 100 毫秒只觸發一次
        if ((e.body.id).toString().indexOf('reflectFloor') != -1) {
          if (!ballsMesh[i].userData.processedCollision) {
            ballsMesh[i].userData.processedCollision = true;
            ballsBody[i].velocity.set(ballsBody[i].velocity.x, -ballsBody[i].velocity.y * 2, 0)
            setTimeout(() => ballsMesh[i].userData.processedCollision = false, 100)
          }
        }
      })
    }
  }
  if (dominosMesh.length) {
    for (let i = 0; i < dominosMesh.length; i++) {
      // 讓 domino 的位置跟旋轉角度與 dominoBody 相等
      dominosMesh[i].position.set(dominosBody[i].position.x, dominosBody[i].position.y, dominosBody[i].position.z)
      dominosMesh[i].quaternion.set(dominosBody[i].quaternion.x, dominosBody[i].quaternion.y, dominosBody[i].quaternion.z, dominosBody[i].quaternion.w)
    }
  }
  if (arrows.length) {
    arrows.forEach(arrow => {
      // 讓箭頭的透明度根據其 y 軸高度增減
      const matches = arrow.id.match(/([a-zA-Z]+)(\d+)/);
      const index = matches ? parseInt(matches[2], 10) : null;
      arrow.obj.position.x = ballsMesh[index].position.x
      arrow.obj.children.forEach(m => {
        m.material.opacity = (ballsMesh[index].position.y - 19 % 100) / 100
      })
    })
  }

  // 執行 hover 時將材質變色的功能
  meshs.forEach(mesh => {
    if (mesh.userData.isHover) {
      mesh.material.color = new Color('red')
    } else {
      const matches = mesh.name.match(/([a-zA-Z]+)(\d+)/);
      const textPart = matches ? matches[1] : null;
      switch (textPart) {
        case 'ball':
          mesh.material.color = new Color('#eee')
          break;
        case 'board':
          mesh.material.color = new Color('orange')
          break;
        case 'domino':
          mesh.material.color = new Color('blue')
          break;
        case 'jumpFloor':
          mesh.material.color = new Color('gold')
          break;
        case 'reflectFloor':
          mesh.material.color = new Color('green')
          break;
      }
    }
  })

  renderer.render(scene, camera);
  requestAnimationFrame(loop);
};

const hasParams = ref(false)
onMounted(() => {
  createFloor();
  initRenderer()
  loop()

  const meshs = JSON.parse(new URLSearchParams(window.location.search).get('mesh'))
  if (!meshs) return hasParams.value = false
  hasParams.value = true
  meshs.forEach(m => {
    if (m.name.includes('jumpFloor')) {
      createJumpFloor(m.px, m.py)
    }
    if (m.name.includes('reflectFloor')) {
      createReflectFloor(m.px, m.py)
    }
    if (m.name.includes('board')) {
      createBoard(m.px, m.py, m.r)
    }
    if (m.name.includes('domino')) {
      createDomino(m.px, m.py, m.r)
    }
  })
})
</script>

<style>
.reset-btn,
.reload-btn {
  position: absolute;
  left: 0;
  top: 0;
  padding: 8px 12px;
  font-size: 18px;
}

.reload-btn {
  left: 100px;
}
</style>