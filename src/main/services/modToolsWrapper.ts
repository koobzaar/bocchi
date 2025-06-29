import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { app } from 'electron';
import { Preset, ModInfo } from '../types';
import { ToolsDownloader } from './toolsDownloader';

export class ModToolsWrapper {
  private modToolsPath: string;
  private profilesPath: string;
  private runningProcess: ChildProcess | null = null;

  constructor() {
    // Get mod-tools path from ToolsDownloader
    const toolsDownloader = new ToolsDownloader();
    const toolsPath = toolsDownloader.getToolsPath();
    this.modToolsPath = path.join(toolsPath, 'mod-tools.exe');
    
    const userData = app.getPath('userData');
    this.profilesPath = path.join(userData, 'profiles');
  }

  async checkModToolsExist(): Promise<boolean> {
    try {
      await fs.access(this.modToolsPath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  async applyPreset(preset: Preset): Promise<{ success: boolean; message: string }> {
    try {
      // Check if mod tools exist
      const toolsExist = await this.checkModToolsExist();
      if (!toolsExist) {
        return { success: false, message: 'CS:LOL tools not found. Please download them first.' };
      }

      // Stop any running overlay first
      await this.stopOverlay();

      // Create profile directory if it doesn't exist
      await fs.mkdir(this.profilesPath, { recursive: true });

      const profileName = `preset_${preset.id}`;
      const modsPath = path.join(app.getPath('userData'), 'mods');
      
      // Map skin keys to mod folder names
      const selectedSkins = preset.selectedSkins || preset.selectedMods || [];
      const modNames: string[] = [];
      
      for (const skinKey of selectedSkins) {
        const [champion, skinFile] = skinKey.split('/');
        if (champion && skinFile) {
          const modName = skinFile.replace('.zip', '');
          modNames.push(`${champion}_${modName}`);
        }
      }
      
      if (modNames.length === 0) {
        return { success: false, message: 'No skins selected' };
      }

      const modsArg = modNames.join('/');

      // Create overlay using mkoverlay command
      await this.runCommand([
        'mkoverlay',
        modsPath,
        path.join(this.profilesPath, profileName),
        `--game:${preset.gamePath}`,
        `--mods:${modsArg}`,
        preset.noTFT ? '--noTFT' : '',
        preset.ignoreConflict ? '--ignoreConflict' : ''
      ].filter(arg => arg !== ''));

      // Run the overlay
      this.runningProcess = spawn(this.modToolsPath, [
        'runoverlay',
        path.join(this.profilesPath, profileName),
        path.join(this.profilesPath, `${profileName}.config`),
        `--game:${preset.gamePath}`,
        '--opts:none'
      ], {
        detached: false,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.runningProcess.stdout?.on('data', (data) => {
        console.log(`[MOD-TOOLS]: ${data.toString()}`);
      });

      this.runningProcess.stderr?.on('data', (data) => {
        console.error(`[MOD-TOOLS ERROR]: ${data.toString()}`);
      });

      this.runningProcess.on('exit', (code) => {
        console.log(`Mod tools process exited with code ${code}`);
        this.runningProcess = null;
      });

      return { success: true, message: 'Preset applied successfully' };
    } catch (error) {
      console.error('Failed to apply preset:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async stopOverlay(): Promise<void> {
    if (this.runningProcess) {
      // Send newline to trigger exit
      this.runningProcess.stdin?.write('\n');
      
      // Wait a bit for graceful shutdown
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Force kill if still running
      if (this.runningProcess && !this.runningProcess.killed) {
        this.runningProcess.kill();
      }
      
      this.runningProcess = null;
    }
  }

  isRunning(): boolean {
    return this.runningProcess !== null && !this.runningProcess.killed;
  }

  private runCommand(args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const process = spawn(this.modToolsPath, args, {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      process.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('exit', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command failed with code ${code}: ${stderr}`));
        }
      });

      process.on('error', (error) => {
        reject(error);
      });
    });
  }
}