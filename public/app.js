const ARTWORKS = [
  {
    name: 'artwork-01',
    title: '無聲勝有聲',
    desc: '王大明 · 2024年',
    url: 'https://your-website.com/artwork/01',
  },
]

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

function onXrLoaded() {
  const fetches = ARTWORKS.map((a) =>
    fetch(`./image-targets/${a.name}/${a.name}.json`).then((r) => r.json())
  )

  Promise.all(fetches).then((targets) => {
    XR8.XrController.configure({ imageTargetData: targets })

    XR8.addCameraPipelineModules([
      XR8.GlTextureRenderer.pipelineModule(),
      XR8.XrController.pipelineModule(),
      XRExtras.FullWindowCanvas.pipelineModule(),
      XRExtras.Loading.pipelineModule(),
      XRExtras.RuntimeError.pipelineModule(),
      buildImageTargetModule(),
    ])

    XR8.run({ canvas: document.getElementById('xr-canvas') })
  })
}

function buildImageTargetModule() {
  return {
    name: 'calligraphy-ar',
    onAttach() { reticle.style.display = 'block' },
    listeners: [
      {
        event: 'reality.imagefound',
        process({ detail }) {
          const artwork = ARTWORKS.find((a) => a.name === detail.name)
          if (artwork) showOverlay(artwork)
        },
      },
      {
        event: 'reality.imagelost',
        process() { hideOverlay() },
      },
    ],
  }
}

if (window.XR8) {
  onXrLoaded()
} else {
  window.addEventListener('xrloaded', onXrLoaded, { once: true })
}