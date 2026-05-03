// ── 設定 ──────────────────────────────────────────────────────
var ARTWORK_NAME = 'artwork-01'
var STORY_URL = 'https://example.com'
var YUKAWA_IMAGE = './yukawa.png'
var APPEAR_MIN = 4
var APPEAR_MAX = 8
var TRIGGER_DISTANCE = 1.5

var DIALOGS = [
  '……你來了。我在這裡等了很久。',
  '這幅字，是我晚年寫下的。世界是一體的——不論是原子，還是人心。',
  '當年我們劈開了原子，卻沒能劈開人與人之間的隔閡。',
  '現在，這個選擇交給你了。你願意繼續往下看嗎？',
]

// ── 狀態 ──────────────────────────────────────────────────────
var state = {
  artworkFound: false,
  yukawaPlaced: false,
  dialogStarted: false,
  dialogIndex: 0,
  typing: false,
}

// ── UI ────────────────────────────────────────────────────────
var scanHint   = document.getElementById('scan-hint')
var foundHint  = document.getElementById('found-hint')
var dialogBox  = document.getElementById('dialog-box')
var dialogText = document.getElementById('dialog-text')
var dialogNext = document.getElementById('dialog-next')
var enterBtn   = document.getElementById('enter-btn')

// ── 對話系統 ──────────────────────────────────────────────────
var typingTimer = null

function typeText(text) {
  state.typing = true
  dialogNext.style.display = 'none'
  dialogText.innerHTML = ''
  var i = 0
  typingTimer = setInterval(function() {
    if (i < text.length) {
      dialogText.innerHTML = text.slice(0, i + 1) + '<span class="dialog-cursor"></span>'
      i++
    } else {
      clearInterval(typingTimer)
      dialogText.innerHTML = text
      state.typing = false
      dialogNext.style.display = 'block'
    }
  }, 65)
}

function showNextDialog() {
  if (state.typing) {
    clearInterval(typingTimer)
    dialogText.innerHTML = DIALOGS[state.dialogIndex - 1] || ''
    state.typing = false
    dialogNext.style.display = 'block'
    return
  }
  if (state.dialogIndex >= DIALOGS.length) {
    dialogBox.classList.remove('visible')
    enterBtn.style.display = 'block'
    return
  }
  typeText(DIALOGS[state.dialogIndex++])
}

// 點畫面推進對話 / 對焦
document.addEventListener('click', function(e) {
  if (e.target.id === 'start-btn' || e.target.id === 'enter-btn') return
  if (state.dialogStarted) { showNextDialog(); return }

  var video = document.querySelector('video')
  if (video && video.srcObject) {
    var track = video.srcObject.getVideoTracks()[0]
    if (track && track.getCapabilities) {
      var caps = track.getCapabilities()
      if (caps.focusMode) {
        track.applyConstraints({ advanced: [{ focusMode: 'single-shot' }] })
      }
    }
  }
})

// ── 自製 Three.js Pipeline Module ────────────────────────────
var threeScene, threeCamera, threeRenderer
var yukawaMesh = null
var glowMesh = null
var yukawaPos = { x: 0, z: 0 }
var proximityInterval = null

function customThreejsPipelineModule() {
  return {
    name: 'custom-threejs',

    onStart: function(args) {
      var canvas = args.canvas
      threeRenderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: true,
        preserveDrawingBuffer: true,
      })
      threeRenderer.autoClear = false
      threeRenderer.setPixelRatio(window.devicePixelRatio)
      threeRenderer.setSize(canvas.width, canvas.height)

      threeScene = new THREE.Scene()
      threeCamera = new THREE.PerspectiveCamera(
        60,
        canvas.width / canvas.height,
        0.01,
        1000
      )
      threeScene.add(threeCamera)

      // 環境光
      threeScene.add(new THREE.AmbientLight(0xffffff, 1.5))

      // 建立湯川立牌
      var loader = new THREE.TextureLoader()
      loader.load(YUKAWA_IMAGE, function(tex) {
        var aspect = tex.image.width / tex.image.height
        var h = 1.7
        var geo = new THREE.PlaneGeometry(h * aspect, h)
        var mat = new THREE.MeshBasicMaterial({
          map: tex, transparent: true,
          side: THREE.DoubleSide, depthWrite: false,
        })
        yukawaMesh = new THREE.Mesh(geo, mat)
        yukawaMesh.visible = false
        threeScene.add(yukawaMesh)

        // 地板光暈
        var gGeo = new THREE.CircleGeometry(0.7, 32)
        var gMat = new THREE.MeshBasicMaterial({
          color: 0xffd764, transparent: true,
          opacity: 0.18, side: THREE.DoubleSide, depthWrite: false,
        })
        glowMesh = new THREE.Mesh(gGeo, gMat)
        glowMesh.rotation.x = -Math.PI / 2
        glowMesh.visible = false
        threeScene.add(glowMesh)
      })
    },

    onUpdate: function(args) {
      // 用 XrController 的相機姿態更新 Three.js 相機
      if (args.processCpuResult && args.processCpuResult.reality) {
        var r = args.processCpuResult.reality
        if (r.rotation) {
          threeCamera.quaternion.set(r.rotation.x, r.rotation.y, r.rotation.z, r.rotation.w)
        }
        if (r.position) {
          threeCamera.position.set(r.position.x, r.position.y, r.position.z)
        }
        if (r.intrinsics) {
          for (var i = 0; i < 16; i++) {
            threeCamera.projectionMatrix.elements[i] = r.intrinsics[i]
          }
          threeCamera.projectionMatrixInverse.copy(threeCamera.projectionMatrix).invert()
        }
      }

      // 光暈閃爍
      if (glowMesh && glowMesh.visible) {
        glowMesh.material.opacity = 0.12 + Math.sin(Date.now() * 0.003) * 0.08
      }

      // 人物面向相機
      if (yukawaMesh && yukawaMesh.visible) {
        yukawaMesh.lookAt(threeCamera.position.x, yukawaMesh.position.y, threeCamera.position.z)
      }
    },

    onRender: function() {
      threeRenderer.clearDepth()
      threeRenderer.render(threeScene, threeCamera)
    },

    onCanvasSizeChange: function(args) {
      if (threeRenderer) {
        threeRenderer.setSize(args.canvasWidth, args.canvasHeight)
        threeCamera.aspect = args.canvasWidth / args.canvasHeight
        threeCamera.updateProjectionMatrix()
      }
    },
  }
}

// ── 放置湯川 ─────────────────────────────────────────────────
function placeYukawa() {
  if (!yukawaMesh) {
    setTimeout(placeYukawa, 300); return
  }

  var angle = Math.random() * Math.PI * 2
  var dist = APPEAR_MIN + Math.random() * (APPEAR_MAX - APPEAR_MIN)
  var x = Math.sin(angle) * dist
  var z = -Math.cos(angle) * dist
  yukawaPos = { x: x, z: z }

  yukawaMesh.position.set(x, 0.85, z)
  yukawaMesh.visible = true

  if (glowMesh) {
    glowMesh.position.set(x, 0.01, z)
    glowMesh.visible = true
  }

  state.yukawaPlaced = true

  // 顯示找人提示
  scanHint.style.display = 'none'
  foundHint.style.display = 'block'
  setTimeout(function() {
    foundHint.style.transition = 'opacity 1s'
    foundHint.style.opacity = '0'
    setTimeout(function() { foundHint.style.display = 'none' }, 1000)
  }, 4000)

  // 開始偵測距離
  proximityInterval = setInterval(function() {
    if (!threeCamera || state.dialogStarted) return
    var dx = threeCamera.position.x - yukawaPos.x
    var dz = threeCamera.position.z - yukawaPos.z
    var dist2 = Math.sqrt(dx * dx + dz * dz)
    if (dist2 < TRIGGER_DISTANCE) {
      clearInterval(proximityInterval)
      state.dialogStarted = true
      if (navigator.vibrate) navigator.vibrate([100, 50, 100])
      dialogBox.classList.add('visible')
      showNextDialog()
    }
  }, 400)
}

// ── Image Target 模組 ─────────────────────────────────────────
function buildImageTargetModule() {
  return {
    name: 'calligraphy-ar',
    listeners: [
      {
        event: 'reality.imagefound',
        process: function(e) {
          if (state.artworkFound) return
          if (e.detail.name !== ARTWORK_NAME) return
          state.artworkFound = true
          if (navigator.vibrate) navigator.vibrate(200)
          setTimeout(placeYukawa, 1500)
        },
      },
    ],
  }
}

// ── 8th Wall 初始化 ───────────────────────────────────────────
var targetDataLoaded = []

fetch('./image-targets/' + ARTWORK_NAME + '/' + ARTWORK_NAME + '.json')
  .then(function(r) {
    if (!r.ok) throw new Error('找不到 JSON')
    return r.json()
  })
  .then(function(data) { targetDataLoaded = [data] })
  .catch(function(err) {
    scanHint.innerHTML = '<p style="color:red;">錯誤：' + err.message + '</p>'
  })

function onxrloaded() {
  if (targetDataLoaded.length === 0) { setTimeout(onxrloaded, 200); return }

  XR8.XrController.configure({
    imageTargetData: targetDataLoaded,
    disableWorldTracking: false,
  })

  XR8.addCameraPipelineModules([
    XR8.GlTextureRenderer.pipelineModule(),
    customThreejsPipelineModule(),
    XR8.XrController.pipelineModule(),
    buildImageTargetModule(),
  ])

  XR8.run({ canvas: document.getElementById('xr-canvas') })
}

// ── Canvas 尺寸 ───────────────────────────────────────────────
function resizeCanvas() {
  var canvas = document.getElementById('xr-canvas')
  var dpr = window.devicePixelRatio || 1
  canvas.width = window.innerWidth * dpr
  canvas.height = window.innerHeight * dpr
  canvas.style.width = window.innerWidth + 'px'
  canvas.style.height = window.innerHeight + 'px'
}

// ── 啟動 ──────────────────────────────────────────────────────
function startAR() {
  document.getElementById('start-screen').style.display = 'none'
  scanHint.style.display = 'block'
  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)
  screen.orientation && screen.orientation.addEventListener('change', function() {
    setTimeout(resizeCanvas, 200)
  })
  window.XR8 ? onxrloaded() : window.addEventListener('xrloaded', onxrloaded)
}

document.getElementById('start-btn').addEventListener('click', startAR)
enterBtn.addEventListener('click', function() { window.location.href = STORY_URL })
