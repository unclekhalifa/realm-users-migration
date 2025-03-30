/**
 * Utility functions for the Realm users migration script
 */
import chalk from 'chalk';

/**
 * Logger utility for consistent logging with color formatting
 *
 * @example
 * log.info('Starting process');
 * log.success('Process completed successfully');
 * log.warning('Something might be wrong');
 * log.error('An error occurred', error);
 * log.debug(verbose, 'Detailed information', data);
 */
export const log = {
  /**
   * Log informational message in blue
   * @param {string} message - The message to log
   * @param {...any} args - Additional arguments to log
   */
  info: (message: string, ...args: any[]) => console.log(chalk.blue(message), ...args),

  /**
   * Log success message in green
   * @param {string} message - The message to log
   * @param {...any} args - Additional arguments to log
   */
  success: (message: string, ...args: any[]) => console.log(chalk.green(message), ...args),

  /**
   * Log warning message in yellow
   * @param {string} message - The message to log
   * @param {...any} args - Additional arguments to log
   */
  warning: (message: string, ...args: any[]) => console.log(chalk.yellow(message), ...args),

  /**
   * Log error message in red
   * @param {string} message - The message to log
   * @param {...any} args - Additional arguments to log
   */
  error: (message: string, ...args: any[]) => console.error(chalk.red(message), ...args),

  /**
   * Log debug message in magenta, only if verbose mode is enabled
   * @param {boolean} verbose - Whether to show the debug message
   * @param {string} message - The message to log
   * @param {...any} args - Additional arguments to log
   */
  debug: (verbose: boolean, message: string, ...args: any[]) => {
    if (verbose) {
      console.log(chalk.magenta(`[DEBUG] ${message}`), ...args);
    }
  },
};
