/**
 * Main entry point for the Realm users migration script
 */
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import dotenv from 'dotenv';
import { getAPIToken, getUsers, getPendingUsers } from './atlas';
import { log } from './utils';
import fs from 'fs/promises';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

// Define command line arguments
const argv = yargs(hideBin(process.argv))
  .options({
    dryRun: {
      type: 'boolean',
      description: 'Run the script without making any changes',
      default: false,
    },
    verbose: {
      type: 'boolean',
      description: 'Enable verbose logging',
      default: false,
    },
    batchSize: {
      type: 'number',
      description: 'Number of users to process in each batch',
      default: 100,
    },
    outputFile: {
      type: 'string',
      description: 'Path to output file for exported users. Will be saved in output directory',
    },
    pendingUserDate: {
      type: 'string',
      description: 'Date to use for createdAt field of pending users in YYYY-MM-DD format',
      default: '2020-12-01',
    },
  })
  .help()
  .alias('help', 'h')
  .parseSync();

const main = async (): Promise<void> => {
  try {
    log.info('Realm users migration script started');

    // Get configuration from environment variables
    const username = process.env.USERNAME;
    const apiKey = process.env.API_KEY;
    const groupId = process.env.GROUP_ID;
    const appId = process.env.APP_ID;

    // Get configuration from command line arguments
    const {
      dryRun: explicitDryRun,
      verbose,
      batchSize,
      outputFile: rawOutputFile,
      pendingUserDate,
    } = argv;

    // Ensure output file is in the output directory
    const outputFile = rawOutputFile
      ? path.join('output', path.basename(rawOutputFile))
      : undefined;

    // If no output file is specified, treat it as a dry run
    const dryRun = explicitDryRun || !outputFile;

    // Validate required environment variables
    if (!username) {
      throw new Error(
        'Username is required. Please set the USERNAME environment variable in your .env file.'
      );
    }

    if (!apiKey) {
      throw new Error(
        'API key is required. Please set the API_KEY environment variable in your .env file.'
      );
    }

    if (!groupId) {
      throw new Error(
        'Group ID is required. Please set the GROUP_ID environment variable in your .env file.'
      );
    }

    if (!appId) {
      throw new Error(
        'App ID is required. Please set the APP_ID environment variable in your .env file.'
      );
    }

    // Validate pendingUserDate format
    if (pendingUserDate && !/^\d{4}-\d{2}-\d{2}$/.test(pendingUserDate)) {
      throw new Error('pendingUserDate must be in YYYY-MM-DD format');
    }

    // Log configuration
    log.debug(verbose, 'Configuration:');
    log.debug(verbose, `- Group ID: ${groupId}`);
    log.debug(verbose, `- App ID: ${appId}`);
    log.debug(verbose, `- Batch size: ${batchSize}`);
    log.debug(verbose, `- Output file: ${outputFile || 'Not specified'}`);
    log.debug(
      verbose,
      `- Dry run: ${dryRun ? 'Yes' : 'No'}${!outputFile ? ' (no output file specified)' : ''}`
    );
    log.debug(verbose, `- Verbose: ${verbose ? 'Yes' : 'No'}`);
    log.debug(verbose, `- Pending user date: ${pendingUserDate}`);

    // Get API token for authentication
    const apiToken = await getAPIToken(username, apiKey, verbose);
    log.success('Authentication successful');

    // Get users from App Services
    log.info('Fetching users...');
    const users = await getUsers(apiToken, groupId, appId, verbose);
    log.success(`Total users: ${users.length}`);

    // Get pending users from App Services
    log.info('Fetching pending users...');
    const pendingUsers = await getPendingUsers(apiToken, groupId, appId, pendingUserDate, verbose);
    log.success(`Total pending users: ${pendingUsers.length}`);

    // Prepare user data
    const userData = {
      metadata: {
        exportDate: new Date().toISOString(),
        groupId,
        appId,
        totalUsers: users.length,
        totalPendingUsers: pendingUsers.length,
        pendingUserDate,
      },
      users,
      pendingUsers,
    };

    // Save users to output file if specified and not in dry run mode
    if (outputFile && !dryRun) {
      log.info(`Saving users to ${outputFile}...`);

      // Create output directory if it doesn't exist
      const outputDir = path.dirname(outputFile);
      await fs.mkdir(outputDir, { recursive: true });

      // Save users to file
      await fs.writeFile(outputFile, JSON.stringify(userData, null, 2));
      log.success(`Users saved to ${outputFile}`);
    } else {
      // Either dry run mode or no output file specified
      log.info('Dry run mode or no output file specified. Logging summary data:');
      log.info('Metadata:');
      Object.entries(userData.metadata).forEach(([key, value]) => {
        log.info(`  ${key}: ${value}`);
      });

      // Log sample user data if available
      if (users.length > 0) {
        log.info('Sample user data (first user):');
        log.info(JSON.stringify(users[0], null, 2));
      }

      if (pendingUsers.length > 0) {
        log.info('Sample pending user data (first pending user):');
        log.info(JSON.stringify(pendingUsers[0], null, 2));
      }

      if (!outputFile) {
        log.warning('No output file specified. Use --outputFile to save data to a file.');
      } else {
        log.warning('Dry run mode enabled. Users not saved to file.');
      }
    }

    log.success('Migration script completed successfully');
  } catch (error) {
    log.error('Error in migration script:', error);
    process.exit(1);
  }
};

// Execute the main function
(async () => {
  await main();
})();
