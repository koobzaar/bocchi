import React, { useState, useRef, useEffect } from 'react'
import { useLocale } from '../contexts/useLocale'
import './LanguageSwitcher.css'

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
    <div className="language-switcher" ref={dropdownRef}>
      <button
        className="language-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select language"
      >
        <span className="language-flag">{currentLang?.flag}</span>
        <span className="language-code">{currentLang?.code.split('_')[0]}</span>
        <svg
          className={`dropdown-arrow ${isOpen ? 'open' : ''}`}
          width="10"
          height="6"
          viewBox="0 0 10 6"
        >
          <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      </button>

      {isOpen && (
        <div className="language-dropdown">
          {languages.map((lang) => (
            <button
              key={lang.code}
              className={`language-option ${lang.code === currentLanguage ? 'active' : ''}`}
              onClick={() => handleLanguageChange(lang.code)}
            >
              <span className="language-flag">{lang.flag}</span>
              <span className="language-name">{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
