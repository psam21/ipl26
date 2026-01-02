#!/usr/bin/env npx tsx

/**
 * Master script to refresh all IPL data.
 * 
 * This script runs the entire data pipeline in order:
 * 1. Scrape teams & player images from iplt20.com
 * 2. Get player profile URLs
 * 3. Scrape player details (age, IPL years)
 * 4. Fill in missing player data
 * 5. Normalize image filenames
 * 6. Generate final ipl_data.json
 * 
 * Usage:
 *   npx tsx scripts/refresh-all.ts [--skip-scrape] [--skip-images]
 * 
 * Options:
 *   --skip-scrape   Skip web scraping steps (use existing scraped data)
 *   --skip-images   Skip image normalization step
 */

import { execSync } from 'child_process';
import path from 'path';

const SCRIPTS_DIR = path.dirname(__filename);

interface Step {
  name: string;
  script: string;
  args?: string;
  skipFlag?: string;
}

const steps: Step[] = [
  {
    name: 'Scraping teams & player images',
    script: 'scrape.ts',
    args: 'teams',
    skipFlag: 'skip-scrape'
  },
  {
    name: 'Getting player profile URLs',
    script: 'scrape-all-squads.ts',
    skipFlag: 'skip-scrape'
  },
  {
    name: 'Scraping player details (age, IPL years)',
    script: 'scrape-player-details.ts',
    skipFlag: 'skip-scrape'
  },
  {
    name: 'Finding missing player data',
    script: 'find-missing-players.ts',
    skipFlag: 'skip-scrape'
  },
  {
    name: 'Normalizing image filenames',
    script: 'normalize-images.ts',
    skipFlag: 'skip-images'
  },
  {
    name: 'Generating final ipl_data.json',
    script: 'seed-data.ts'
  }
];

function runStep(step: Step): boolean {
  const scriptPath = path.join(SCRIPTS_DIR, step.script);
  const command = `npx tsx ${scriptPath}${step.args ? ' ' + step.args : ''}`;
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`▶ ${step.name}`);
  console.log(`  Command: ${command}`);
  console.log('='.repeat(60));
  
  try {
    execSync(command, { 
      stdio: 'inherit',
      cwd: path.join(SCRIPTS_DIR, '..')
    });
    console.log(`✅ ${step.name} - Complete`);
    return true;
  } catch (error) {
    console.error(`❌ ${step.name} - Failed`);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const skipFlags = new Set(
    args
      .filter(arg => arg.startsWith('--'))
      .map(arg => arg.replace('--', ''))
  );

  console.log('\n🏏 IPL 2026 Data Refresh Pipeline');
  console.log('==================================\n');
  
  if (skipFlags.size > 0) {
    console.log(`Skipping: ${Array.from(skipFlags).join(', ')}`);
  }

  const startTime = Date.now();
  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;

  for (const step of steps) {
    if (step.skipFlag && skipFlags.has(step.skipFlag)) {
      console.log(`\n⏭️  Skipping: ${step.name}`);
      skipCount++;
      continue;
    }

    const success = runStep(step);
    if (success) {
      successCount++;
    } else {
      failCount++;
      // Ask whether to continue on failure
      console.error(`\n⚠️  Step failed. Continuing with remaining steps...`);
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 Pipeline Summary');
  console.log('='.repeat(60));
  console.log(`✅ Successful: ${successCount}`);
  console.log(`⏭️  Skipped:    ${skipCount}`);
  console.log(`❌ Failed:     ${failCount}`);
  console.log(`⏱️  Total time: ${elapsed}s`);
  console.log('='.repeat(60));

  if (failCount === 0) {
    console.log('\n🎉 Data refresh complete! Run `npm run dev` to see changes.\n');
  } else {
    console.log('\n⚠️  Some steps failed. Check the logs above.\n');
    process.exit(1);
  }
}

main();
