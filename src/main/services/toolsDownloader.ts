import { app } from 'electron'
import axios from 'axios'
import * as fs from 'fs'
import * as path from 'path'
import AdmZip from 'adm-zip'

export class ToolsDownloader {
  private toolsPath: string

  constructor() {
    const appPath = app.getAppPath()
    if (process.env.NODE_ENV === 'development') {
      // In development, tools should be in parent directory
      this.toolsPath = path.join(path.dirname(appPath), '..', 'cslol-tools')
    } else {
      // In production, tools should be next to the executable
      this.toolsPath = path.join(path.dirname(app.getPath('exe')), 'cslol-tools')
    }
  }

  async checkToolsExist(): Promise<boolean> {
    try {
      const modToolsPath = path.join(this.toolsPath, 'mod-tools.exe')
      await fs.promises.access(modToolsPath, fs.constants.F_OK)
      return true
    } catch {
      return false
    }
  }

  async getLatestReleaseInfo(): Promise<{ downloadUrl: string; version: string }> {
    try {
      const response = await axios.get(
        'https://api.github.com/repos/LeagueToolkit/cslol-manager/releases/latest',
        {
          headers: {
            Accept: 'application/vnd.github.v3+json'
          }
        }
      )

      const release = response.data
      const asset = release.assets.find((a: any) => a.name === 'cslol-manager.zip')

      if (!asset) {
        throw new Error('Could not find cslol-manager.zip in latest release')
      }

      return {
        downloadUrl: asset.browser_download_url,
        version: release.tag_name
      }
    } catch (error) {
      throw new Error(
        `Failed to get latest release info: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  async downloadAndExtractTools(onProgress?: (progress: number) => void): Promise<void> {
    try {
      const { downloadUrl } = await this.getLatestReleaseInfo()

      // Create temp directory
      const tempDir = path.join(app.getPath('temp'), 'cslol-download')
      await fs.promises.mkdir(tempDir, { recursive: true })

      const zipPath = path.join(tempDir, 'cslol-manager.zip')

      // Download the file
      const response = await axios.get(downloadUrl, {
        responseType: 'stream',
        onDownloadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100)
            onProgress(progress)
          }
        }
      })

      // Save to file
      const writer = fs.createWriteStream(zipPath)
      response.data.pipe(writer)

      await new Promise<void>((resolve, reject) => {
        writer.on('finish', () => resolve())
        writer.on('error', reject)
      })

      // Extract the zip
      const zip = new AdmZip(zipPath)
      const extractPath = path.join(tempDir, 'extracted')
      zip.extractAllTo(extractPath, true)

      // Find the cslol-tools folder
      const cslolManagerPath = path.join(extractPath, 'cslol-manager')
      const cslolToolsSource = path.join(cslolManagerPath, 'cslol-tools')

      // Check if source exists
      const sourceExists = await fs.promises
        .access(cslolToolsSource)
        .then(() => true)
        .catch(() => false)

      if (!sourceExists) {
        throw new Error('Could not find cslol-tools folder in the extracted archive')
      }

      // Create parent directory if needed
      const parentDir = path.dirname(this.toolsPath)
      await fs.promises.mkdir(parentDir, { recursive: true })

      // Remove existing tools directory if it exists
      try {
        await fs.promises.rm(this.toolsPath, { recursive: true, force: true })
      } catch {
        // Ignore if doesn't exist
      }

      // Move the cslol-tools folder to the correct location
      await this.copyDirectory(cslolToolsSource, this.toolsPath)

      // Clean up temp files
      await fs.promises.rm(tempDir, { recursive: true, force: true })
    } catch (error) {
      throw new Error(
        `Failed to download and extract tools: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  private async copyDirectory(src: string, dest: string): Promise<void> {
    await fs.promises.mkdir(dest, { recursive: true })
    const entries = await fs.promises.readdir(src, { withFileTypes: true })

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name)
      const destPath = path.join(dest, entry.name)

      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath)
      } else {
        await fs.promises.copyFile(srcPath, destPath)
      }
    }
  }

  getToolsPath(): string {
    return this.toolsPath
  }
}
