import { ElectronAPI } from '@electron-toolkit/preload'
import { SkinInfo } from '../main/types'

export interface IApi {
  detectGame: () => Promise<{ success: boolean; gamePath?: string | null; error?: string }>
  browseGameFolder: () => Promise<{ success: boolean; gamePath?: string }>
  downloadSkin: (url: string) => Promise<{ success: boolean; skinInfo?: SkinInfo; error?: string }>
  listDownloadedSkins: () => Promise<{ success: boolean; skins?: SkinInfo[]; error?: string }>
  deleteSkin: (championName: string, skinName: string) => Promise<{ success: boolean; error?: string }>
  runPatcher: (gamePath: string, selectedSkins: string[]) => Promise<{ success: boolean; message?: string }>
  stopPatcher: () => Promise<{ success: boolean; error?: string }>
  isPatcherRunning: () => Promise<boolean>
  fetchChampionData: () => Promise<{ success: boolean; message: string; championCount?: number }>
  loadChampionData: () => Promise<{ success: boolean; data?: any; error?: string }>
  checkChampionUpdates: () => Promise<{ success: boolean; needsUpdate?: boolean; error?: string }>
  
  // Favorites
  addFavorite: (championKey: string, skinId: string, skinName: string) => Promise<{ success: boolean; error?: string }>
  removeFavorite: (championKey: string, skinId: string) => Promise<{ success: boolean; error?: string }>
  isFavorite: (championKey: string, skinId: string) => Promise<boolean>
  getFavorites: () => Promise<{ success: boolean; favorites?: any[]; error?: string }>
  
  // Tools management
  checkToolsExist: () => Promise<boolean>
  downloadTools: () => Promise<{ success: boolean; error?: string }>
  getToolsInfo: () => Promise<{ success: boolean; downloadUrl?: string; version?: string; error?: string }>
  onToolsDownloadProgress: (callback: (progress: number) => void) => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: IApi
  }
}