import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import * as cheerio from 'cheerio';

export const BASE_URL = 'https://www.iplt20.com';

export async function fetchPage(url: string) {
  try {
    const { data } = await axios.get(url);
    return cheerio.load(data);
  } catch (error) {
    console.error(`Failed to fetch ${url}:`, error instanceof Error ? error.message : String(error));
    return null;
  }
}

export async function downloadFile(url: string, outputPath: string) {
  try {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const response = await axios.get(url, { responseType: 'stream' });
    await pipeline(response.data, fs.createWriteStream(outputPath));
    // console.log(`Downloaded: ${outputPath}`);
    return true;
  } catch (error) {
    console.error(`Failed to download ${url}:`, error instanceof Error ? error.message : String(error));
    return false;
  }
}

export function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/✈️/g, '')
    .replace(/\(c\)/g, '')
    .replace(/\(wk\)/g, '')
    .replace(/[^a-z0-9\s_]/g, '')
    .trim()
    .replace(/\s+/g, '_');
}
