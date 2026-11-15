export const INSTALL_COMMAND = 'npm install git+https://github.com/dhruvil-codes/koi-pond.git#v0.4.1'

export function generateSnippet(config, target = 'javascript') {
  const json = JSON.stringify(config, null, 2)
  if (target === 'html') return `<canvas id="pond" style="display:block;width:100%;height:480px"></canvas>\n<script src="./koi-pond.iife.js">` + '</scr' + `ipt>\n<script>\nconst config = ${json};\nconst pond = KoiPond.createKoiPond(document.querySelector('#pond'), config);\n` + '</scr' + 'ipt>'
  if (target === 'react' || target === 'next') return `${target === 'next' ? "'use client';\n\n" : ''}import { useEffect, useRef } from 'react';\nimport { createKoiPond } from '@dhruvil-codes/koi-pond';\n\nconst config = ${json};\n\nexport default function Pond() {\n  const canvas = useRef(null);\n  useEffect(() => {\n    const pond = createKoiPond(canvas.current, config);\n    return () => pond.destroy();\n  }, []);\n  return <canvas ref={canvas} style={{ display: 'block', width: '100%', height: 480 }} />;\n}`
  return `import { createKoiPond } from '@dhruvil-codes/koi-pond';\n\nconst config = ${json};\n\n// Give your canvas a CSS width and height.\nconst pond = createKoiPond(document.querySelector('#pond'), config);\n\n// When removing the canvas:\n// pond.destroy();`
}
