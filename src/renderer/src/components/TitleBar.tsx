import { useState, useEffect } from 'react'
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
    <div className="fixed top-0 left-0 right-0 h-8 bg-anthracite-800 border-b border-anthracite-500 flex items-center justify-between select-none z-50">
      <div className="flex-1 h-full flex items-center px-4" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
        <div className="text-sm font-medium text-text-primary">CSLOL Skin Launcher</div>
      </div>
      <div className="flex items-center px-2" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <LanguageSwitcher />
      </div>
      <div className="flex" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <button 
          className="w-12 h-8 flex items-center justify-center hover:bg-anthracite-600 transition-colors group"
          onClick={handleMinimize} 
          aria-label="Minimize"
        >
          <div className="w-3 h-[1px] bg-text-muted group-hover:bg-text-secondary"></div>
        </button>
        <button
          className="w-12 h-8 flex items-center justify-center hover:bg-anthracite-600 transition-colors group"
          onClick={handleMaximize}
          aria-label={isMaximized ? 'Restore' : 'Maximize'}
        >
          <div className={`${isMaximized ? 'w-2.5 h-2.5 border border-text-muted group-hover:border-text-secondary' : 'w-3 h-3 border border-text-muted group-hover:border-text-secondary'}`}></div>
        </button>
        <button 
          className="w-12 h-8 flex items-center justify-center hover:bg-red-600 transition-colors group"
          onClick={handleClose} 
          aria-label="Close"
        >
          <svg className="w-3 h-3 text-text-muted group-hover:text-white" viewBox="0 0 12 12">
            <path d="M1 1L11 11M1 11L11 1" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
        </button>
      </div>
    </div>
  )
}
