import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { app } from 'electron';

interface Champion {
  id: number;
  key: string;
  name: string;
  title: string;
  image: string;
  skins: Skin[];
  tags: string[];
}

interface Skin {
  id: string;
  num: number;
  name: string;
  chromas: boolean;
}

export class ChampionDataService {
  private dataPath: string;
  private apiVersion: string = '';

  constructor() {
    const userData = app.getPath('userData');
    this.dataPath = path.join(userData, 'champion-data.json');
  }

  private async getApiVersion(): Promise<string> {
    const response = await axios.get('https://ddragon.leagueoflegends.com/api/versions.json');
    return response.data[0];
  }

  private async getChampionDetails(champId: string): Promise<any> {
    const url = `https://ddragon.leagueoflegends.com/cdn/${this.apiVersion}/data/en_US/champion/${champId}.json`;
    const response = await axios.get(url);
    return response.data.data[champId];
  }

  public async fetchAndSaveChampionData(): Promise<{ success: boolean; message: string; championCount?: number }> {
    try {
      // Get latest API version
      this.apiVersion = await this.getApiVersion();
      
      // Get all champions
      const championsUrl = `https://ddragon.leagueoflegends.com/cdn/${this.apiVersion}/data/en_US/champion.json`;
      const response = await axios.get(championsUrl);
      const championsData = response.data.data;

      const champions: Champion[] = [];

      // Fetch detailed data for each champion
      for (const [champId, champBasicInfo] of Object.entries(championsData)) {
        try {
          const champDetails = await this.getChampionDetails(champId);
          
          const champion: Champion = {
            id: parseInt(champBasicInfo.key),
            key: champId,
            name: champBasicInfo.name,
            title: champBasicInfo.title,
            image: `https://ddragon.leagueoflegends.com/cdn/${this.apiVersion}/img/champion/${champBasicInfo.image.full}`,
            tags: champDetails.tags || [],
            skins: champDetails.skins.map((skin: any) => ({
              id: skin.id,
              num: skin.num,
              name: skin.name,
              chromas: skin.chromas || false
            }))
          };

          champions.push(champion);
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 50));
        } catch (error) {
          console.error(`Failed to fetch details for ${champId}:`, error);
        }
      }

      // Sort champions by name
      champions.sort((a, b) => a.name.localeCompare(b.name));

      // Save to JSON file
      const data = {
        version: this.apiVersion,
        lastUpdated: new Date().toISOString(),
        champions
      };

      await fs.writeFile(this.dataPath, JSON.stringify(data, null, 2));

      return {
        success: true,
        message: `Successfully fetched and saved data for ${champions.length} champions`,
        championCount: champions.length
      };
    } catch (error) {
      console.error('Error fetching champion data:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch champion data'
      };
    }
  }

  public async loadChampionData(): Promise<{ version: string; champions: Champion[] } | null> {
    try {
      const data = await fs.readFile(this.dataPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }

  public async checkForUpdates(): Promise<boolean> {
    try {
      const currentData = await this.loadChampionData();
      if (!currentData) return true; // No data, needs update

      const latestVersion = await this.getApiVersion();
      return currentData.version !== latestVersion;
    } catch (error) {
      return true; // On error, assume update needed
    }
  }
}