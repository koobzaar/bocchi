import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { SkinInfo } from '../main/types'

// Custom APIs for renderer
const api = {
  // Game detection
  detectGame: () => ipcRenderer.invoke('detect-game'),
  browseGameFolder: () => ipcRenderer.invoke('browse-game-folder'),
  
  // Skin management
  downloadSkin: (url: string) => ipcRenderer.invoke('download-skin', url),
  listDownloadedSkins: () => ipcRenderer.invoke('list-downloaded-skins'),
  deleteSkin: (championName: string, skinName: string) => 
    ipcRenderer.invoke('delete-skin', championName, skinName),
  
  // Patcher controls
  runPatcher: (gamePath: string, selectedSkins: string[]) => 
    ipcRenderer.invoke('run-patcher', gamePath, selectedSkins),
  stopPatcher: () => ipcRenderer.invoke('stop-patcher'),
  isPatcherRunning: () => ipcRenderer.invoke('is-patcher-running'),
  
  // Champion data
  fetchChampionData: () => ipcRenderer.invoke('fetch-champion-data'),
  loadChampionData: () => ipcRenderer.invoke('load-champion-data'),
  checkChampionUpdates: () => ipcRenderer.invoke('check-champion-updates'),
  
  // Favorites
  addFavorite: (championKey: string, skinId: string, skinName: string) => 
    ipcRenderer.invoke('add-favorite', championKey, skinId, skinName),
  removeFavorite: (championKey: string, skinId: string) => 
    ipcRenderer.invoke('remove-favorite', championKey, skinId),
  isFavorite: (championKey: string, skinId: string) => 
    ipcRenderer.invoke('is-favorite', championKey, skinId),
  getFavorites: () => ipcRenderer.invoke('get-favorites'),
  
  // Tools management
  checkToolsExist: () => ipcRenderer.invoke('check-tools-exist'),
  downloadTools: () => ipcRenderer.invoke('download-tools'),
  getToolsInfo: () => ipcRenderer.invoke('get-tools-info'),
  onToolsDownloadProgress: (callback: (progress: number) => void) => {
    ipcRenderer.on('tools-download-progress', (_, progress) => callback(progress))
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
