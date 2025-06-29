import { useState, useEffect } from 'react'
import './App.css'

interface Champion {
  id: number
  key: string
  name: string
  title: string
  image: string
  skins: Skin[]
  tags: string[]
}

interface Skin {
  id: string
  num: number
  name: string
  chromas: boolean
}

interface ChromaInfo {
  id: string
  name: string
  colors?: string[]
}

interface ChampionData {
  version: string
  lastUpdated: string
  champions: Champion[]
}

interface DownloadedSkin {
  championName: string
  skinName: string
  url: string
  localPath?: string
}

function App(): React.JSX.Element {
  const [gamePath, setGamePath] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [statusMessage, setStatusMessage] = useState<string>('')
  const [isPatcherRunning, setIsPatcherRunning] = useState<boolean>(false)
  
  // Champion browser states
  const [championData, setChampionData] = useState<ChampionData | null>(null)
  const [selectedChampion, setSelectedChampion] = useState<Champion | null>(null)
  const [championSearchQuery, setChampionSearchQuery] = useState<string>('')
  const [skinSearchQuery, setSkinSearchQuery] = useState<string>('')
  const [selectedSkinId, setSelectedSkinId] = useState<string | null>(null)
  const [downloadedSkins, setDownloadedSkins] = useState<DownloadedSkin[]>([])
  const [selectedChromaId, setSelectedChromaId] = useState<string | null>(null)
  const [hoveredChroma, setHoveredChroma] = useState<{ skinId: string; chromaId: string } | null>(null)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(false)
  const [toolsExist, setToolsExist] = useState<boolean | null>(null)
  const [downloadingTools, setDownloadingTools] = useState<boolean>(false)
  const [toolsDownloadProgress, setToolsDownloadProgress] = useState<number>(0)

  // Load data on component mount
  useEffect(() => {
    checkPatcherStatus()
    loadChampionData()
    detectGamePath()
    loadDownloadedSkins()
    loadFavorites()
    checkToolsExist()
  }, [])

  // Set up tools download progress listener
  useEffect(() => {
    window.api.onToolsDownloadProgress((progress) => {
      setToolsDownloadProgress(progress)
    })
  }, [])

  const checkPatcherStatus = async () => {
    const isRunning = await window.api.isPatcherRunning()
    setIsPatcherRunning(isRunning)
  }

  const checkToolsExist = async () => {
    const exist = await window.api.checkToolsExist()
    setToolsExist(exist)
  }

  const downloadTools = async () => {
    setDownloadingTools(true)
    setStatusMessage('Downloading cslol-tools...')
    
    const result = await window.api.downloadTools()
    if (result.success) {
      setToolsExist(true)
      setStatusMessage('Tools downloaded successfully!')
    } else {
      setStatusMessage(`Failed to download tools: ${result.error}`)
    }
    
    setDownloadingTools(false)
    setToolsDownloadProgress(0)
  }

  const loadChampionData = async () => {
    const result = await window.api.loadChampionData()
    if (result.success && result.data) {
      setChampionData(result.data)
      // Select first champion by default
      if (result.data.champions.length > 0) {
        setSelectedChampion(result.data.champions[0])
      }
    }
  }

  const detectGamePath = async () => {
    const result = await window.api.detectGame()
    if (result.success && result.gamePath) {
      setGamePath(result.gamePath)
      setStatusMessage('Game path detected automatically')
    } else {
      setStatusMessage('Game path not found. Please browse manually.')
    }
  }

  const loadDownloadedSkins = async () => {
    const result = await window.api.listDownloadedSkins()
    if (result.success && result.skins) {
      setDownloadedSkins(result.skins)
    }
  }

  const loadFavorites = async () => {
    const result = await window.api.getFavorites()
    if (result.success && result.favorites) {
      const favoriteKeys = new Set(result.favorites.map(f => `${f.championKey}_${f.skinId}`))
      setFavorites(favoriteKeys)
    }
  }

  const toggleFavorite = async (champion: Champion, skin: Skin) => {
    const key = `${champion.key}_${skin.id}`
    const isFav = favorites.has(key)
    
    if (isFav) {
      await window.api.removeFavorite(champion.key, skin.id)
      setFavorites(prev => {
        const newSet = new Set(prev)
        newSet.delete(key)
        return newSet
      })
    } else {
      await window.api.addFavorite(champion.key, skin.id, skin.name)
      setFavorites(prev => new Set(prev).add(key))
    }
  }

  const fetchChampionData = async () => {
    setLoading(true)
    setStatusMessage('Fetching champion data...')
    
    const result = await window.api.fetchChampionData()
    if (result.success) {
      setStatusMessage(`Successfully fetched data for ${result.championCount} champions!`)
      await loadChampionData()
    } else {
      setStatusMessage(`Error: ${result.message}`)
    }
    
    setLoading(false)
  }

  const browseForGame = async () => {
    const result = await window.api.browseGameFolder()
    if (result.success && result.gamePath) {
      setGamePath(result.gamePath)
      setStatusMessage('Game path set successfully!')
    }
  }

  const handleSkinClick = async (champion: Champion, skin: Skin, chromaId?: string) => {
    if (!gamePath) {
      setStatusMessage('Please set game path first')
      return
    }

    setLoading(true)
    setSelectedSkinId(skin.id)
    setSelectedChromaId(chromaId || null)
    
    try {
      // Stop patcher if running
      if (isPatcherRunning) {
        setStatusMessage('Stopping current patcher...')
        await window.api.stopPatcher()
        await new Promise(resolve => setTimeout(resolve, 500)) // Small delay
      }

      // Check if skin/chroma is already downloaded
      let skinFileName: string
      let githubUrl: string
      
      if (chromaId) {
        // Handle chroma
        skinFileName = `${skin.name} ${chromaId}.zip`
        const isChromaDownloaded = downloadedSkins.some(
          ds => ds.championName === champion.key && ds.skinName === skinFileName
        )
        
        if (!isChromaDownloaded) {
          githubUrl = `https://github.com/darkseal-org/lol-skins/blob/main/skins/${champion.key}/chromas/${encodeURIComponent(skin.name)}/${encodeURIComponent(skinFileName)}`
          
          setStatusMessage(`Downloading ${skin.name} (Chroma)...`)
          
          const downloadResult = await window.api.downloadSkin(githubUrl)
          if (!downloadResult.success) {
            throw new Error(downloadResult.error || 'Failed to download chroma')
          }
          
          await loadDownloadedSkins()
        }
      } else {
        // Handle regular skin
        skinFileName = `${skin.name}.zip`
        const isSkinDownloaded = downloadedSkins.some(
          ds => ds.championName === champion.key && ds.skinName === skinFileName
        )
        
        if (!isSkinDownloaded) {
          githubUrl = `https://github.com/darkseal-org/lol-skins/blob/main/skins/${champion.key}/${encodeURIComponent(skinFileName)}`
          
          setStatusMessage(`Downloading ${skin.name}...`)
          
          const downloadResult = await window.api.downloadSkin(githubUrl)
          if (!downloadResult.success) {
            throw new Error(downloadResult.error || 'Failed to download skin')
          }
          
          await loadDownloadedSkins()
        }
      }
      
      // Generate skin key for the patcher
      const skinKey = `${champion.key}/${skinFileName}`
      
      setStatusMessage(`Applying ${skin.name}...`)
      
      // Run patcher with the selected skin
      const patcherResult = await window.api.runPatcher(gamePath, [skinKey])
      if (patcherResult.success) {
        setStatusMessage(`Applied ${skin.name} successfully!`)
        setIsPatcherRunning(true)
      } else {
        throw new Error(patcherResult.message || 'Failed to apply skin')
      }
    } catch (error) {
      setStatusMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setSelectedSkinId(null)
      // setSelectedChromaId(null)
    }
    
    setLoading(false)
  }

  const stopPatcher = async () => {
    setLoading(true)
    setStatusMessage('Stopping patcher...')
    
    const result = await window.api.stopPatcher()
    if (result.success) {
      setStatusMessage('Patcher stopped')
      setIsPatcherRunning(false)
      setSelectedSkinId(null)
      // setSelectedChromaId(null)
    }
    
    setLoading(false)
  }

  // Filter champions based on search
  const filteredChampions = championData?.champions.filter(champ =>
    champ.name.toLowerCase().includes(championSearchQuery.toLowerCase())
  ) || []

  // Get all skins across all champions that match the search
  const getFilteredSkins = () => {
    if (!championData || !skinSearchQuery.trim()) {
      return selectedChampion?.skins || []
    }

    const searchLower = skinSearchQuery.toLowerCase()
    const allSkins: Array<{ champion: Champion; skin: Skin }> = []

    championData.champions.forEach(champion => {
      champion.skins.forEach(skin => {
        if (skin.name.toLowerCase().includes(searchLower)) {
          allSkins.push({ champion, skin })
        }
      })
    })

    return allSkins
  }

  const isSearchingGlobally = skinSearchQuery.trim().length > 0

  // Get skin image URL
  const getSkinImageUrl = (champion: Champion, skinNum: number) => {
    const championKey = champion.key
    return `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${championKey}_${skinNum}.jpg`
  }
  
  // Generate chroma options for skins that have them
  const getChromaOptions = (skin: Skin): ChromaInfo[] => {
    // For now, we'll generate some example chromas based on the skin ID
    // In a real implementation, you might want to fetch this data from an API
    const chromaIds = [
      { id: '238024', name: 'Ruby' },
      { id: '238025', name: 'Catseye' },
      { id: '238026', name: 'Obsidian' },
      { id: '238027', name: 'Pearl' },
      { id: '238028', name: 'Rose Quartz' },
      { id: '238029', name: 'Sapphire' },
      { id: '238030', name: 'Turquoise' },
      { id: '238031', name: 'Emerald' },
    ]
    return chromaIds
  }
  
  // Get color for chroma display
  const getChromaColor = (chromaName: string): string => {
    const colorMap: { [key: string]: string } = {
      'Ruby': '#e74c3c',
      'Catseye': '#f39c12',
      'Obsidian': '#2c3e50',
      'Pearl': '#ecf0f1',
      'Rose Quartz': '#e8b4bc',
      'Sapphire': '#3498db',
      'Turquoise': '#1abc9c',
      'Emerald': '#27ae60',
    }
    return colorMap[chromaName] || '#95a5a6'
  }

  return (
    <div className="champion-browser">
      {toolsExist === false && (
        <div className="tools-download-modal">
          <div className="modal-content">
            <h3>CS:LOL Tools Required</h3>
            <p>The CS:LOL mod tools are required to apply skins. Would you like to download them now?</p>
            {downloadingTools ? (
              <div className="download-progress">
                <p>Downloading tools... {toolsDownloadProgress}%</p>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${toolsDownloadProgress}%` }}></div>
                </div>
              </div>
            ) : (
              <button className="btn btn-primary" onClick={downloadTools}>
                Download Tools
              </button>
            )}
          </div>
        </div>
      )}
      <div className="browser-header">
        <div className="browser-title">
          <h2>CSLOL Skin Launcher</h2>
          <p>Click on any skin to apply it instantly</p>
        </div>
        <div className="browser-controls">
          <div className="game-path-mini">
            <input
              type="text"
              value={gamePath}
              placeholder="Game path not set"
              readOnly
              className="game-path-input-mini"
            />
            <button
              className="btn btn-secondary btn-small"
              onClick={browseForGame}
              disabled={loading}
            >
              Browse
            </button>
          </div>
          <button
            className={`btn btn-secondary ${showFavoritesOnly ? 'btn-active' : ''}`}
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            disabled={loading}
          >
            ❤️ Favorites
          </button>
          {!championData && (
            <button 
              className="btn btn-primary"
              onClick={fetchChampionData}
              disabled={loading}
            >
              Download Champion Data
            </button>
          )}
          {championData && (
            <button
              className="btn btn-secondary"
              onClick={fetchChampionData}
              disabled={loading}
            >
              Update Data
            </button>
          )}
          {isPatcherRunning && (
            <button
              className="btn btn-danger"
              onClick={stopPatcher}
              disabled={loading}
            >
              Stop Patcher
            </button>
          )}
        </div>
      </div>

      {championData ? (
        <div className="browser-content">
          <div className="champion-sidebar">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search champions"
                value={championSearchQuery}
                onChange={(e) => setChampionSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="champion-list">
              {filteredChampions.map((champion, index) => {
                const showLetter = index === 0 || 
                  filteredChampions[index - 1].name[0].toUpperCase() !== champion.name[0].toUpperCase();
                
                return (
                  <div key={champion.key}>
                    {showLetter && (
                      <div className="champion-letter">{champion.name[0].toUpperCase()}</div>
                    )}
                    <div
                      className={`champion-item ${selectedChampion?.key === champion.key ? 'active' : ''}`}
                      onClick={() => setSelectedChampion(champion)}
                    >
                      <img 
                        src={champion.image} 
                        alt={champion.name}
                        className="champion-icon"
                      />
                      <span className="champion-name">{champion.name}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            {championData && (
              <div className="version-info">
                Version: {championData.version}
              </div>
            )}
          </div>

          <div className="skin-gallery">
            <div className="skin-search-container">
              <input
                type="text"
                placeholder="Search skins across all champions..."
                value={skinSearchQuery}
                onChange={(e) => setSkinSearchQuery(e.target.value)}
                className="skin-search-input"
              />
            </div>
            {(selectedChampion || isSearchingGlobally) && (
              <>
                <div className="skin-grid">
                  {isSearchingGlobally ? (
                    // Show global search results
                    getFilteredSkins().map(({ champion, skin }) => {
                    const skinFileName = `${skin.name}.zip`
                    const isDownloaded = downloadedSkins.some(
                      ds => ds.championName === champion.key && ds.skinName === skinFileName
                    )
                    const isFavorite = favorites.has(`${champion.key}_${skin.id}`)
                    
                    return (
                      <div 
                        key={`${champion.key}_${skin.id}`} 
                        className={`skin-card ${selectedSkinId === skin.id && !selectedChromaId ? 'selected' : ''} ${loading ? 'disabled' : ''}`}
                      >
                        <div className="skin-image-container">
                          <img 
                            src={getSkinImageUrl(champion, skin.num)}
                            alt={skin.name}
                            className="skin-image"
                            onClick={() => !loading && handleSkinClick(champion, skin)}
                          />
                          <div className="skin-champion-badge">
                            {champion.name}
                          </div>
                          {selectedSkinId === skin.id && !selectedChromaId && (
                            <div className="skin-active-indicator">
                              <div className="checkmark">✓</div>
                            </div>
                          )}
                          {isDownloaded && selectedSkinId !== skin.id && (
                            <div className="skin-downloaded-indicator" title="Downloaded">
                              <div className="download-icon">↓</div>
                            </div>
                          )}
                          <button
                            className={`skin-favorite-btn ${isFavorite ? 'active' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleFavorite(champion, skin)
                            }}
                            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                          >
                            {isFavorite ? '❤️' : '🤍'}
                          </button>
                        </div>
                        <div className="skin-info">
                          <p className="skin-title">{skin.name}</p>
                        </div>
                      </div>
                    )
                    })
                  ) : (
                    // Show skins for selected champion
                    selectedChampion.skins
                      .filter(skin => {
                        if (!showFavoritesOnly) return true
                        const key = `${selectedChampion.key}_${skin.id}`
                        return favorites.has(key)
                      })
                      .map((skin) => {
                      const skinFileName = `${skin.name}.zip`
                      const isDownloaded = downloadedSkins.some(
                        ds => ds.championName === selectedChampion.key && ds.skinName === skinFileName
                      )
                      const isFavorite = favorites.has(`${selectedChampion.key}_${skin.id}`)
                      
                      return (
                        <div 
                          key={skin.id} 
                          className={`skin-card ${selectedSkinId === skin.id && !selectedChromaId ? 'selected' : ''} ${loading ? 'disabled' : ''}`}
                        >
                          <div className="skin-image-container">
                            <img 
                              src={getSkinImageUrl(selectedChampion, skin.num)}
                              alt={skin.name}
                              className="skin-image"
                              onClick={() => !loading && handleSkinClick(selectedChampion, skin)}
                            />
                            {selectedSkinId === skin.id && !selectedChromaId && (
                              <div className="skin-active-indicator">
                                <div className="checkmark">✓</div>
                              </div>
                            )}
                            {isDownloaded && selectedSkinId !== skin.id && (
                              <div className="skin-downloaded-indicator" title="Downloaded">
                                <div className="download-icon">↓</div>
                              </div>
                            )}
                            <button
                              className={`skin-favorite-btn ${isFavorite ? 'active' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleFavorite(selectedChampion, skin)
                              }}
                              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                            >
                              {isFavorite ? '❤️' : '🤍'}
                            </button>
                          </div>
                          <div className="skin-info">
                            <p className="skin-title">{skin.name}</p>
                          </div>
                        </div>
                      )
                      })
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="no-data-message">
          <p>No champion data found</p>
          <button 
            className="btn btn-primary"
            onClick={fetchChampionData}
            disabled={loading}
          >
            Download Champion Data
          </button>
        </div>
      )}

      <div className="status-bar">
        <div className={`status-message ${loading ? 'loading' : ''}`}>
          {statusMessage || 'Ready'}
        </div>
      </div>
    </div>
  )
}

export default App