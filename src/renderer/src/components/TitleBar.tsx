import { useState, useEffect } from 'react'
import './TitleBar.css'
import { LanguageSwitcher } from './LanguageSwitcher'

export function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    const checkMaximized = async () => {
      const maximized = await window.api.isWindowMaximized()
      setIsMaximized(maximized)
    }

    checkMaximized()

    // Check when window state changes
    const interval = setInterval(checkMaximized, 100)
    return () => clearInterval(interval)
  }, [])

  const handleMinimize = () => {
    window.api.minimizeWindow()
  }

  const handleMaximize = () => {
    window.api.maximizeWindow()
  }

  const handleClose = () => {
    window.api.closeWindow()
  }

  return (
    <div className="titlebar">
      <div className="titlebar-drag-region">
        <div className="titlebar-title">CSLOL Skin Launcher</div>
      </div>
      <div className="titlebar-actions">
        <LanguageSwitcher />
      </div>
      <div className="titlebar-controls">
        <button className="titlebar-button minimize" onClick={handleMinimize} aria-label="Minimize">
          <div className="titlebar-button-icon"></div>
        </button>
        <button
          className="titlebar-button maximize"
          onClick={handleMaximize}
          aria-label={isMaximized ? 'Restore' : 'Maximize'}
        >
          <div className="titlebar-button-icon"></div>
        </button>
        <button className="titlebar-button close" onClick={handleClose} aria-label="Close">
          <div className="titlebar-button-icon"></div>
        </button>
      </div>
    </div>
  )
}
