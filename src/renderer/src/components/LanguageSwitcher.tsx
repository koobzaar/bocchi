import React, { useState, useRef, useEffect } from 'react'
import { useLocale } from '../contexts/useLocale'

export const LanguageSwitcher: React.FC = () => {
  const { currentLanguage, setLanguage, languages } = useLocale()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentLang = languages.find((lang) => lang.code === currentLanguage)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLanguageChange = async (langCode: (typeof languages)[number]['code']) => {
    await setLanguage(langCode)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-anthracite-700 hover:bg-anthracite-600 transition-colors text-text-secondary hover:text-text-primary"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select language"
      >
        <span className="text-base">{currentLang?.flag}</span>
        <span className="text-xs font-medium uppercase">{currentLang?.code.split('_')[0]}</span>
        <svg
          className={`w-2.5 h-2.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          width="10"
          height="6"
          viewBox="0 0 10 6"
        >
          <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-48 rounded-lg bg-anthracite-700 border border-anthracite-500 shadow-lg overflow-hidden animate-slide-down">
          {languages.map((lang) => (
            <button
              key={lang.code}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors
                ${lang.code === currentLanguage 
                  ? 'bg-claude-purple text-white' 
                  : 'text-text-secondary hover:bg-anthracite-600 hover:text-text-primary'
                }`}
              onClick={() => handleLanguageChange(lang.code)}
            >
              <span className="text-base">{lang.flag}</span>
              <span className="font-medium">{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
