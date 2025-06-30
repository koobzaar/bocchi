import { useState, useEffect, useCallback } from 'react'
import { TitleBar } from './components/TitleBar'
import { useTranslation } from 'react-i18next'
import { LocaleProvider } from './contexts/LocaleContextProvider'
import { useLocale } from './contexts/useLocale'

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
  nameEn?: string
  chromas: boolean
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

function AppContent(): React.JSX.Element {
  const { t } = useTranslation()
  const { currentLanguage } = useLocale()
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
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(false)
  const [toolsExist, setToolsExist] = useState<boolean | null>(null)
  const [downloadingTools, setDownloadingTools] = useState<boolean>(false)
  const [toolsDownloadProgress, setToolsDownloadProgress] = useState<number>(0)

  const loadChampionData = useCallback(
    async (preserveSelection = false) => {
      const result = await window.api.loadChampionData(currentLanguage)
      if (result.success && result.data) {
        setChampionData(result.data)

        if (preserveSelection) {
          // Try to preserve the current selection
          setSelectedChampion((prevSelected) => {
            if (prevSelected) {
              const sameChampion = result.data.champions.find((c) => c.key === prevSelected.key)
              return sameChampion || result.data.champions[0]
            }
            return result.data.champions[0]
          })
        } else {
          // Only select first champion if none is selected
          setSelectedChampion((prevSelected) => {
            if (!prevSelected && result.data.champions.length > 0) {
              return result.data.champions[0]
            }
            return prevSelected
          })
        }
      }
    },
    [currentLanguage]
  )

  const detectGamePath = useCallback(async () => {
    const result = await window.api.detectGame()
    if (result.success && result.gamePath) {
      setGamePath(result.gamePath)
      setStatusMessage(t('status.gameDetected'))
    } else {
      setStatusMessage(t('status.gameNotFound'))
    }
  }, [t])

  // Load data on component mount
  useEffect(() => {
    checkPatcherStatus()
    loadChampionData()
    detectGamePath()
    loadDownloadedSkins()
    loadFavorites()
    checkToolsExist()
  }, [detectGamePath, loadChampionData])

  // Set up tools download progress listener
  useEffect(() => {
    window.api.onToolsDownloadProgress((progress) => {
      setToolsDownloadProgress(progress)
    })
  }, [])

  // Reload champion data when language changes
  useEffect(() => {
    if (championData) {
      loadChampionData(true) // preserve selection
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLanguage])

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

  const loadDownloadedSkins = async () => {
    const result = await window.api.listDownloadedSkins()
    if (result.success && result.skins) {
      setDownloadedSkins(result.skins)
    }
  }

  const loadFavorites = async () => {
    const result = await window.api.getFavorites()
    if (result.success && result.favorites) {
      const favoriteKeys = new Set(result.favorites.map((f) => `${f.championKey}_${f.skinId}`))
      setFavorites(favoriteKeys)
    }
  }

  const toggleFavorite = async (champion: Champion, skin: Skin) => {
    const key = `${champion.key}_${skin.id}`
    const isFav = favorites.has(key)

    if (isFav) {
      await window.api.removeFavorite(champion.key, skin.id)
      setFavorites((prev) => {
        const newSet = new Set(prev)
        newSet.delete(key)
        return newSet
      })
    } else {
      await window.api.addFavorite(champion.key, skin.id, skin.name)
      setFavorites((prev) => new Set(prev).add(key))
    }
  }

  const fetchChampionData = async () => {
    setLoading(true)
    setStatusMessage(t('status.fetchingData'))

    const result = await window.api.fetchChampionData(currentLanguage)
    if (result.success) {
      setStatusMessage(t('status.dataFetched', { count: result.championCount }))
      await loadChampionData()
    } else {
      setStatusMessage(`${t('errors.generic')}: ${result.message}`)
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
        await new Promise((resolve) => setTimeout(resolve, 500)) // Small delay
      }

      // Check if skin/chroma is already downloaded
      let skinFileName: string
      let githubUrl: string
      const downloadName = (skin.nameEn || skin.name).replace(/:/g, '') // Use English name for download and remove colons

      if (chromaId) {
        // Handle chroma
        skinFileName = `${downloadName} ${chromaId}.zip`
        const isChromaDownloaded = downloadedSkins.some(
          (ds) => ds.championName === champion.key && ds.skinName === skinFileName
        )

        if (!isChromaDownloaded) {
          githubUrl = `https://github.com/darkseal-org/lol-skins/blob/main/skins/${champion.key}/chromas/${encodeURIComponent(downloadName)}/${encodeURIComponent(skinFileName)}`

          setStatusMessage(t('status.downloading', { name: `${skin.name} (Chroma)` }))

          const downloadResult = await window.api.downloadSkin(githubUrl)
          if (!downloadResult.success) {
            throw new Error(downloadResult.error || 'Failed to download chroma')
          }

          await loadDownloadedSkins()
        }
      } else {
        // Handle regular skin
        skinFileName = `${downloadName}.zip`
        const isSkinDownloaded = downloadedSkins.some(
          (ds) => ds.championName === champion.key && ds.skinName === skinFileName
        )

        if (!isSkinDownloaded) {
          githubUrl = `https://github.com/darkseal-org/lol-skins/blob/main/skins/${champion.key}/${encodeURIComponent(skinFileName)}`

          setStatusMessage(t('status.downloading', { name: skin.name }))

          const downloadResult = await window.api.downloadSkin(githubUrl)
          if (!downloadResult.success) {
            throw new Error(downloadResult.error || 'Failed to download skin')
          }

          await loadDownloadedSkins()
        }
      }

      // Generate skin key for the patcher
      const skinKey = `${champion.key}/${skinFileName}`

      setStatusMessage(t('status.applying', { name: skin.name }))

      // Run patcher with the selected skin
      const patcherResult = await window.api.runPatcher(gamePath, [skinKey])
      if (patcherResult.success) {
        setStatusMessage(t('status.applied', { name: skin.name }))
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
  const filteredChampions =
    championData?.champions.filter((champ) =>
      champ.name.toLowerCase().includes(championSearchQuery.toLowerCase())
    ) || []

  // Get all skins across all champions that match the search
  const getFilteredSkins = () => {
    if (!championData || !skinSearchQuery.trim()) {
      return selectedChampion?.skins.filter((skin) => skin.num !== 0) || []
    }

    const searchLower = skinSearchQuery.toLowerCase()
    const allSkins: Array<{ champion: Champion; skin: Skin }> = []

    championData.champions.forEach((champion) => {
      champion.skins.forEach((skin) => {
        // Filter out default skins (skin.num === 0)
        if (skin.num !== 0 && skin.name.toLowerCase().includes(searchLower)) {
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

  return (
    <>
      <TitleBar />
      <div className="flex flex-col h-screen pt-8 bg-anthracite-900 text-text-primary overflow-hidden">
        {toolsExist === false && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-anthracite-700 rounded-lg p-6 max-w-md w-full mx-4 border border-anthracite-500">
              <h3 className="text-lg font-semibold mb-2">{t('tools.required')}</h3>
              <p className="text-text-secondary mb-4">{t('tools.description')}</p>
              {downloadingTools ? (
                <div>
                  <p className="text-sm text-text-secondary mb-2">{t('tools.downloading', { progress: toolsDownloadProgress })}</p>
                  <div className="w-full bg-anthracite-600 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-claude-purple h-full transition-all duration-300 animate-progress"
                      style={{ width: `${toolsDownloadProgress}%` }}
                    ></div>
                  </div>
                </div>
              ) : (
                <button 
                  className="w-full px-4 py-2 bg-claude-orange hover:bg-claude-orange-dark text-white font-medium rounded-md transition-colors"
                  onClick={downloadTools}
                >
                  {t('tools.downloadTools')}
                </button>
              )}
            </div>
          </div>
        )}
        <div className="flex items-center justify-between px-4 py-3 bg-anthracite-800 border-b border-anthracite-500">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <input
                type="text"
                value={gamePath}
                placeholder="Game path not set"
                readOnly
                className="flex-1 px-3 py-1.5 text-sm bg-anthracite-700 border border-anthracite-500 rounded-md text-text-secondary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-claude-purple"
              />
              <button
                className="px-3 py-1.5 text-sm bg-anthracite-600 hover:bg-anthracite-500 text-text-secondary hover:text-text-primary rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={browseForGame}
                disabled={loading}
              >
                {t('actions.browse')}
              </button>
            </div>
            <button
              className={`px-3 py-1.5 text-sm rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5
                ${showFavoritesOnly 
                  ? 'bg-claude-purple text-white' 
                  : 'bg-anthracite-600 hover:bg-anthracite-500 text-text-secondary hover:text-text-primary'
                }`}
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              disabled={loading}
            >
              <span>❤️</span> {t('nav.favorites')}
            </button>
            {!championData && (
              <button 
                className="px-4 py-1.5 text-sm bg-claude-orange hover:bg-claude-orange-dark text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={fetchChampionData} 
                disabled={loading}
              >
                {t('champion.downloadData')}
              </button>
            )}
            {championData && (
              <button 
                className="px-3 py-1.5 text-sm bg-anthracite-600 hover:bg-anthracite-500 text-text-secondary hover:text-text-primary rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={fetchChampionData} 
                disabled={loading}
              >
                {t('champion.updateData')}
              </button>
            )}
            {isPatcherRunning && (
              <button 
                className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={stopPatcher} 
                disabled={loading}
              >
                {t('actions.stop')} Patcher
              </button>
            )}
          </div>
        </div>

        {championData ? (
          <div className="flex flex-1 overflow-hidden">
            <div className="w-64 bg-anthracite-800 border-r border-anthracite-500 flex flex-col">
              <div className="p-3">
                <input
                  type="text"
                  placeholder="Search champions"
                  value={championSearchQuery}
                  onChange={(e) => setChampionSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-anthracite-700 border border-anthracite-500 rounded-md text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-claude-purple"
                />
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-anthracite scrollbar-thumb-anthracite">
                {filteredChampions.map((champion, index) => {
                  const showLetter =
                    index === 0 ||
                    filteredChampions[index - 1].name[0].toUpperCase() !==
                      champion.name[0].toUpperCase()

                  return (
                    <div key={champion.key}>
                      {showLetter && (
                        <div className="px-3 py-1 text-xs font-semibold text-text-muted uppercase">
                          {champion.name[0].toUpperCase()}
                        </div>
                      )}
                      <div
                        className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors
                          ${selectedChampion?.key === champion.key 
                            ? 'bg-claude-purple text-white' 
                            : 'hover:bg-anthracite-600 text-text-secondary hover:text-text-primary'
                          }`}
                        onClick={() => setSelectedChampion(champion)}
                      >
                        <img 
                          src={champion.image} 
                          alt={champion.name} 
                          className="w-8 h-8 rounded" 
                        />
                        <span className="text-sm font-medium">{champion.name}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
              {championData && (
                <div className="px-3 py-2 text-xs text-text-muted border-t border-anthracite-500">
                  Version: {championData.version}
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col bg-anthracite-900 overflow-hidden">
              <div className="p-4">
                <input
                  type="text"
                  placeholder="Search skins across all champions..."
                  value={skinSearchQuery}
                  onChange={(e) => setSkinSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 bg-anthracite-800 border border-anthracite-500 rounded-md text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-claude-purple"
                />
              </div>
              {(selectedChampion || isSearchingGlobally) && (
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-anthracite scrollbar-thumb-anthracite p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {isSearchingGlobally
                      ? // Show global search results
                        (getFilteredSkins() as Array<{ champion: Champion; skin: Skin }>).map(
                          ({ champion, skin }) => {
                            const skinFileName = `${skin.name}.zip`
                            const isDownloaded = downloadedSkins.some(
                              (ds) =>
                                ds.championName === champion.key && ds.skinName === skinFileName
                            )
                            const isFavorite = favorites.has(`${champion.key}_${skin.id}`)

                            return (
                              <div
                                key={`${champion.key}_${skin.id}`}
                                className={`group relative bg-anthracite-800 rounded-lg overflow-hidden border-2 transition-all
                                  ${selectedSkinId === skin.id && !selectedChromaId 
                                    ? 'border-claude-purple shadow-lg' 
                                    : 'border-anthracite-600 hover:border-anthracite-400'
                                  } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                `}
                              >
                                <div className="relative aspect-[0.67] overflow-hidden bg-anthracite-700">
                                  <img
                                    src={getSkinImageUrl(champion, skin.num)}
                                    alt={skin.name}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    onClick={() => !loading && handleSkinClick(champion, skin)}
                                  />
                                  <div className="absolute top-2 left-2 px-2 py-1 bg-black bg-opacity-75 rounded text-xs text-white font-medium">
                                    {champion.name}
                                  </div>
                                  {selectedSkinId === skin.id && !selectedChromaId && (
                                    <div className="absolute inset-0 bg-claude-purple bg-opacity-20 flex items-center justify-center">
                                      <div className="w-12 h-12 bg-claude-purple rounded-full flex items-center justify-center text-white text-xl font-bold">
                                        ✓
                                      </div>
                                    </div>
                                  )}
                                  {isDownloaded && selectedSkinId !== skin.id && (
                                    <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center" title="Downloaded">
                                      <span className="text-white text-xs">↓</span>
                                    </div>
                                  )}
                                  <button
                                    className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all
                                      ${isFavorite 
                                        ? 'bg-red-500 text-white' 
                                        : 'bg-black bg-opacity-50 text-white hover:bg-opacity-75'
                                      }`}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      toggleFavorite(champion, skin)
                                    }}
                                    title={
                                      isFavorite ? 'Remove from favorites' : 'Add to favorites'
                                    }
                                  >
                                    {isFavorite ? '❤️' : '🤍'}
                                  </button>
                                </div>
                                <div className="p-3">
                                  <p className="text-sm font-medium text-text-primary truncate">{skin.name}</p>
                                </div>
                              </div>
                            )
                          }
                        )
                      : // Show skins for selected champion
                        (selectedChampion?.skins || [])
                          .filter((skin) => {
                            // Filter out default skins (skin.num === 0)
                            if (skin.num === 0) return false
                            if (!showFavoritesOnly) return true
                            const key = `${selectedChampion?.key}_${skin.id}`
                            return favorites.has(key)
                          })
                          .map((skin) => {
                            const skinFileName = `${skin.name}.zip`
                            const isDownloaded = downloadedSkins.some(
                              (ds) =>
                                ds.championName === selectedChampion?.key &&
                                ds.skinName === skinFileName
                            )
                            const isFavorite = favorites.has(`${selectedChampion?.key}_${skin.id}`)

                            return (
                              <div
                                key={skin.id}
                                className={`group relative bg-anthracite-800 rounded-lg overflow-hidden border-2 transition-all
                                  ${selectedSkinId === skin.id && !selectedChromaId 
                                    ? 'border-claude-purple shadow-lg' 
                                    : 'border-anthracite-600 hover:border-anthracite-400'
                                  } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                `}
                              >
                                <div className="relative aspect-[0.67] overflow-hidden bg-anthracite-700">
                                  <img
                                    src={
                                      selectedChampion
                                        ? getSkinImageUrl(selectedChampion, skin.num)
                                        : ''
                                    }
                                    alt={skin.name}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    onClick={() =>
                                      !loading &&
                                      selectedChampion &&
                                      handleSkinClick(selectedChampion, skin)
                                    }
                                  />
                                  {selectedSkinId === skin.id && !selectedChromaId && (
                                    <div className="absolute inset-0 bg-claude-purple bg-opacity-20 flex items-center justify-center">
                                      <div className="w-12 h-12 bg-claude-purple rounded-full flex items-center justify-center text-white text-xl font-bold">
                                        ✓
                                      </div>
                                    </div>
                                  )}
                                  {isDownloaded && selectedSkinId !== skin.id && (
                                    <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center" title="Downloaded">
                                      <span className="text-white text-xs">↓</span>
                                    </div>
                                  )}
                                  <button
                                    className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all
                                      ${isFavorite 
                                        ? 'bg-red-500 text-white' 
                                        : 'bg-black bg-opacity-50 text-white hover:bg-opacity-75'
                                      }`}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      selectedChampion && toggleFavorite(selectedChampion, skin)
                                    }}
                                    title={
                                      isFavorite ? 'Remove from favorites' : 'Add to favorites'
                                    }
                                  >
                                    {isFavorite ? '❤️' : '🤍'}
                                  </button>
                                </div>
                                <div className="p-3">
                                  <p className="text-sm font-medium text-text-primary truncate">{skin.name}</p>
                                </div>
                              </div>
                            )
                          })}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <p className="text-lg text-text-secondary mb-4">{t('champion.noData')}</p>
            <button 
              className="px-6 py-2 bg-claude-orange hover:bg-claude-orange-dark text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={fetchChampionData} 
              disabled={loading}
            >
              {t('champion.downloadData')}
            </button>
          </div>
        )}

        <div className="border-t border-anthracite-500 bg-anthracite-800 px-4 py-2">
          <div className={`text-sm text-text-secondary ${loading ? 'after:content-["..."] after:animate-dots' : ''}`}>
            {statusMessage || t('app.ready')}
          </div>
        </div>
      </div>
    </>
  )
}

function App(): React.JSX.Element {
  return (
    <LocaleProvider>
      <AppContent />
    </LocaleProvider>
  )
}

export default App
