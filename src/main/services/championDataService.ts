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
  nameEn?: string; // English name for download purposes
  chromas: boolean;
}

export class ChampionDataService {
  private dataPath: string;
  private apiVersion: string = '';
  private supportedLanguages = ['en_US', 'vi_VN'];

  constructor() {
    const userData = app.getPath('userData');
    this.dataPath = path.join(userData, 'champion-data');
  }

  private async getApiVersion(): Promise<string> {
    const response = await axios.get('https://ddragon.leagueoflegends.com/api/versions.json');
    return response.data[0];
  }

  private async getChampionDetails(champId: string, language: string = 'en_US'): Promise<any> {
    const url = `https://ddragon.leagueoflegends.com/cdn/${this.apiVersion}/data/${language}/champion/${champId}.json`;
    const response = await axios.get(url);
    return response.data.data[champId];
  }

  private getDataPath(language: string): string {
    return `${this.dataPath}-${language}.json`;
  }

  public async fetchAndSaveChampionData(language: string = 'en_US'): Promise<{ success: boolean; message: string; championCount?: number }> {
    try {
      // Get latest API version
      this.apiVersion = await this.getApiVersion();
      
      // Get all champions in the specified language
      const championsUrl = `https://ddragon.leagueoflegends.com/cdn/${this.apiVersion}/data/${language}/champion.json`;
      const response = await axios.get(championsUrl);
      const championsData = response.data.data;

      const champions: Champion[] = [];

      // Fetch detailed data for each champion
      for (const [champId, champBasicInfo] of Object.entries(championsData) as [string, any][]) {
        try {
          const champDetails = await this.getChampionDetails(champId, language);
          
          // If we're not fetching English, also get English skin names for download
          let englishSkinNames: { [key: string]: string } = {};
          if (language !== 'en_US') {
            try {
              const champDetailsEn = await this.getChampionDetails(champId, 'en_US');
              champDetailsEn.skins.forEach((skin: any) => {
                englishSkinNames[skin.id] = skin.name;
              });
            } catch (error) {
              console.warn(`Failed to fetch English names for ${champId}`);
            }
          }
          
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
              nameEn: language !== 'en_US' ? englishSkinNames[skin.id] || skin.name : undefined,
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

      await fs.writeFile(this.getDataPath(language), JSON.stringify(data, null, 2));

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

  public async loadChampionData(language: string = 'en_US'): Promise<{ version: string; champions: Champion[] } | null> {
    try {
      const data = await fs.readFile(this.getDataPath(language), 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }

  public async checkForUpdates(language: string = 'en_US'): Promise<boolean> {
    try {
      const currentData = await this.loadChampionData(language);
      if (!currentData) return true; // No data, needs update

      const latestVersion = await this.getApiVersion();
      return currentData.version !== latestVersion;
    } catch (error) {
      return true; // On error, assume update needed
    }
  }

  public async fetchAllLanguages(): Promise<{ success: boolean; message: string }> {
    try {
      for (const lang of this.supportedLanguages) {
        console.log(`Fetching champion data for ${lang}...`);
        await this.fetchAndSaveChampionData(lang);
      }
      return {
        success: true,
        message: 'Successfully fetched data for all languages'
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch data'
      };
    }
  }
}