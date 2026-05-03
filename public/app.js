// ── 作品設定 ──────────────────────────────────────────────────
const ARTWORKS = [
  {
    name: 'artwork-01',
    title: '世界は一つ',
    desc: '湯川秀樹',
    url: 'calligraphy-ar.vercel.app',
  },
]

// ── UI 元素 ───────────────────────────────────────────────────
const scanHint     = document.getElementById('scan-hint')
const reticle      = document.getElementById('target-reticle')
const overlay      = document.getElementById('ar-overlay')
const artworkTitle = document.getElementById('artwork-title')
const artworkDesc  = document.getElementById('artwork-desc')
const artworkLink  = document.getElementById('artwork-link')

function showOverlay(artwork) {
  artworkTitle.textContent = artwork.title
  artworkDesc.textContent  = artwork.desc
  artworkLink.href         = artwork.url
  overlay.classList.add('visible')
  scanHint.style.opacity   = '0'
  reticle.classList.add('found')
}

function hideOverlay() {
  overlay.classList.remove('visible')
  scanHint.style.opacity = '1'
  reticle.classList.remove('found')
}

// ── Canvas 全螢幕 ─────────────────────────────────────────────
function resizeCanvas() {
  const canvas = document.getElementById('xr-canvas')
  canvas.width  = window.innerWidth
  canvas.height = window.innerHeight
}
window.addEventListener('resize', resizeCanvas)
resizeCanvas()

// ── 8th Wall 初始化 ───────────────────────────────────────────
function onXrLoaded() {
  const fetches = ARTWORKS.map((a) =>
    fetch('./image-targets/' + a.name + '/' + a.name + '.json')
      .then(function(r) {
        if (!r.ok) throw new Error('找不到: image-targets/' + a.name + '/' + a.name + '.json')
        return r.json()
      })
  )

  Promise.all(fetches).then(function(targets) {
    XR8.XrController.configure({
      imageTargetData: targets,
      disableWorldTracking: true,
    })

    XR8.addCameraPipelineModules([
      XR8.GlTextureRenderer.pipelineModule(),
      XR8.XrController.pipelineModule(),
      buildImageTargetModule(),
    ])

    XR8.run({ canvas: document.getElementById('xr-canvas') })
    reticle.style.display = 'block'

  }).catch(function(err) {
    console.error('載入失敗:', err)
    document.getElementById('scan-hint').innerHTML =
      '<p style="color:red;padding:20px;font-size:14px;">錯誤：' + err.message + '</p>'
  })
}

// ── 圖像辨識事件 ──────────────────────────────────────────────
function buildImageTargetModule() {
  return {
    name: 'calligraphy-ar',
    listeners: [
      {
        event: 'reality.imagefound',
        process: function(e) {
          var artwork = ARTWORKS.find(function(a) { return a.name === e.detail.name })
          if (artwork) showOverlay(artwork)
        },
      },
      {
        event: 'reality.imageupdated',
        process: function(e) {
          var artwork = ARTWORKS.find(function(a) { return a.name === e.detail.name })
          if (artwork && !overlay.classList.contains('visible')) showOverlay(artwork)
        },
      },
      {
        event: 'reality.imagelost',
        process: function() { hideOverlay() },
      },
    ],
  }
}

// ── 啟動 ──────────────────────────────────────────────────────
if (window.XR8) {
  onXrLoaded()
} else {
  window.addEventListener('xrloaded', onXrLoaded, { once: true })
}
