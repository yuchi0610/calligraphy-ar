// ── 設定 ──────────────────────────────────────────────────────
var ARTWORK_NAME = 'artwork-01'
var STORY_URL = 'https://calligraphy-ar.vercel.app/'
var YUKAWA_IMAGE = './yukawa.png'
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

document.addEventListener('click', function(e) {
  if (e.target.id === 'start-btn' || e.target.id === 'enter-btn') return
  if (state.dialogStarted) { showNextDialog(); return }
})

// ── Three.js（純 CSS2D 版本，不依賴 SLAM 相機矩陣） ──────────
// 策略：不用 Three.js 的 3D 世界座標
// 改用手機的 DeviceOrientation 控制「湯川」的螢幕位置
// 讓他看起來像站在現實空間裡

var yukawaEl = null  // HTML 元素版的湯川
var glowEl = null

function createYukawaHTML() {
  // 建立湯川 HTML 元素
  var container = document.createElement('div')
  container.id = 'yukawa-container'
  container.style.cssText = [
    'position:fixed',
    'top:0', 'left:0', 'width:100%', 'height:100%',
    'z-index:50',
    'pointer-events:none',
    'display:none',
    'overflow:hidden',
  ].join(';')

  // 光暈
  glowEl = document.createElement('div')
  glowEl.style.cssText = [
    'position:absolute',
    'bottom:15%',
    'left:50%',
    'transform:translateX(-50%)',
    'width:120px', 'height:30px',
    'background:radial-gradient(ellipse, rgba(255,215,100,0.4) 0%, transparent 70%)',
    'border-radius:50%',
    'animation:glowPulse 2s ease-in-out infinite',
  ].join(';')

  // 湯川圖片
  yukawaEl = document.createElement('img')
  yukawaEl.src = YUKAWA_IMAGE
  yukawaEl.style.cssText = [
    'position:absolute',
    'bottom:15%',
    'left:50%',
    'transform:translateX(-50%)',
    'height:55vh',
    'width:auto',
    'object-fit:contain',
    'filter:drop-shadow(0 0 20px rgba(255,215,100,0.3))',
    'animation:yukawaFloat 3s ease-in-out infinite',
  ].join(';')

  yukawaEl.onerror = function() {
    // 圖片載入失敗，改用紅色方塊
    yukawaEl.style.display = 'none'
    var box = document.createElement('div')
    box.style.cssText = [
      'position:absolute',
      'bottom:15%', 'left:50%',
      'transform:translateX(-50%)',
      'width:80px', 'height:160px',
      'background:#ff3300',
      'border:2px solid #fff',
    ].join(';')
    container.appendChild(box)
  }

  container.appendChild(glowEl)
  container.appendChild(yukawaEl)
  document.body.appendChild(container)

  // 加 CSS 動畫
  var style = document.createElement('style')
  style.innerHTML = [
    '@keyframes yukawaFloat{',
    '  0%,100%{transform:translateX(-50%) translateY(0)}',
    '  50%{transform:translateX(-50%) translateY(-8px)}',
    '}',
    '@keyframes glowPulse{',
    '  0%,100%{opacity:0.4;transform:translateX(-50%) scaleX(1)}',
    '  50%{opacity:0.9;transform:translateX(-50%) scaleX(1.2)}',
    '}',
  ].join('')
  document.head.appendChild(style)

  return container
}

var yukawaContainer = null
var deviceAlpha = 0  // 手機朝向角度

function setupDeviceOrientation() {
  window.addEventListener('deviceorientation', function(e) {
    deviceAlpha = e.alpha || 0  // 0-360 度，水平旋轉
  })
}

// 湯川「站在」展場某個方向
var yukawaDirection = 0  // 度數，相對於辨識當下手機朝向
var baseAlpha = null     // 辨識當下的手機朝向

function placeYukawa() {
  if (!yukawaContainer) return

  // 記錄辨識當下的朝向作為基準
  baseAlpha = deviceAlpha

  // 隨機選一個方向（左右各 90 度內，讓使用者需要轉身）
  var offset = (Math.random() > 0.5 ? 1 : -1) * (60 + Math.random() * 60)
  yukawaDirection = offset

  yukawaContainer.style.display = 'block'
  state.artworkFound = true

  scanHint.style.display = 'none'
  foundHint.style.display = 'block'
  setTimeout(function() {
    foundHint.style.transition = 'opacity 1s'
    foundHint.style.opacity = '0'
    setTimeout(function() { foundHint.style.display = 'none' }, 1000)
  }, 4000)

  // 開始更新湯川位置
  startPositionUpdate()
}

function startPositionUpdate() {
  var triggered = false

  setInterval(function() {
    if (!yukawaContainer || baseAlpha === null) return

    // 計算手機目前和湯川方向的角度差
    var diff = deviceAlpha - baseAlpha - yukawaDirection
    // 正規化到 -180 ~ 180
    while (diff > 180) diff -= 360
    while (diff < -180) diff += 360

    // 把角度差轉成螢幕 X 位置
    // diff = 0 → 正中間
    // diff = ±90 → 螢幕邊緣外
    var screenX = 50 - diff * 0.8  // 百分比

    // 距離感：diff 越大，湯川越小
    var absDiff = Math.abs(diff)
    var scale = Math.max(0.3, 1 - absDiff / 150)
    var opacity = Math.max(0.1, 1 - absDiff / 120)

    if (yukawaEl) {
      yukawaEl.style.left = screenX + '%'
      yukawaEl.style.transform = 'translateX(-50%) scale(' + scale + ')'
      yukawaEl.style.opacity = opacity
    }
    if (glowEl) {
      glowEl.style.left = screenX + '%'
      glowEl.style.opacity = opacity * 0.6
    }

    // 夠近（diff < 20 度）觸發對話
    if (!triggered && absDiff < 20) {
      triggered = true
      if (navigator.vibrate) navigator.vibrate([100, 50, 100])
      dialogBox.classList.add('visible')
      state.dialogStarted = true
      showNextDialog()
    }
  }, 50)
}

// ── Image Target 模組 ─────────────────────────────────────────
function buildImageTargetModule() {
  return {
    name: 'calligraphy-ar',
    listeners: [
      {
        event: 'reality.imagefound',
        process: function(e) {
          if (state.artworkFound || e.detail.name !== ARTWORK_NAME) return
          if (navigator.vibrate) navigator.vibrate(200)
          setTimeout(placeYukawa, 800)
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
    if (scanHint) scanHint.innerHTML = '<p style="color:red;">錯誤：' + err.message + '</p>'
  })

function onxrloaded() {
  if (targetDataLoaded.length === 0) { setTimeout(onxrloaded, 200); return }

  XR8.XrController.configure({
    imageTargetData: targetDataLoaded,
    disableWorldTracking: true,
  })

  XR8.addCameraPipelineModules([
    XR8.GlTextureRenderer.pipelineModule(),
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

  yukawaContainer = createYukawaHTML()
  setupDeviceOrientation()

  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)
  screen.orientation && screen.orientation.addEventListener('change', function() {
    setTimeout(resizeCanvas, 200)
  })

  window.XR8 ? onxrloaded() : window.addEventListener('xrloaded', onxrloaded)
}

document.getElementById('start-btn').addEventListener('click', startAR)
enterBtn.addEventListener('click', function() { window.location.href = STORY_URL })
