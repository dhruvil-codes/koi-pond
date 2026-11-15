'use client'

import { useState } from 'react'
import { ReactPond } from '../examples/ReactPond.jsx'

export default function Page() {
  const [fishCount, setFishCount] = useState(6)
  return <main>
    <h1>Packaged pond consumer</h1>
    <button id="next-change" onClick={() => setFishCount(13)}>Change fish count</button>
    <ReactPond fishCount={fishCount} />
  </main>
}
