import React, { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ReactPond } from './examples/ReactPond.jsx'

function App() {
  const [visible, setVisible] = useState(true)
  const [fishCount, setFishCount] = useState(7)
  return <>
    <button id="change" onClick={() => setFishCount(16)}>Change fish count</button>
    <button id="toggle" onClick={() => setVisible(value => !value)}>Toggle pond</button>
    {visible && <ReactPond fishCount={fishCount} environment="zen" />}
  </>
}

createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>)
