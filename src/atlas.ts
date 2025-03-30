/**
 * Atlas API functions for the Realm users migration script
 */
import axios from 'axios';
import { log } from './utils';

/**
 * Get an API token for authentication with MongoDB Atlas API
 *
 * @param {string} username - MongoDB Atlas username
 * @param {string} apiKey - MongoDB Atlas API key
 * @param {boolean} verbose - Whether to show debug logs
 * @returns {Promise<string>} - The API token for authentication
 * @throws {Error} - If authentication fails
 */
export const getAPIToken = async (
  username: string,
  apiKey: string,
  verbose: boolean
): Promise<string> => {
  try {
    log.debug(verbose, 'Authenticating with MongoDB Atlas...');

    const response = await axios.post(
      'https://services.cloud.mongodb.com/api/admin/v3.0/auth/providers/mongodb-cloud/login',
      {
        username,
        apiKey,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    );

    log.debug(verbose, 'Authentication successful');
    return response.data.access_token;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      log.error('Authentication failed:', error.response.status, error.response.statusText);
      log.debug(verbose, 'Error details:', error.response.data);
    } else {
      log.error('Error getting API token:', error);
    }
    throw error;
  }
};

/**
 * Get users from App Services with optional pagination
 *
 * @param {string} accessToken - API token for authentication
 * @param {string} groupID - MongoDB Atlas Group ID
 * @param {string} appID - MongoDB Atlas App ID
 * @param {boolean} verbose - Whether to show debug logs
 * @param {number} lastId - ID of the last user retrieved for pagination (optional)
 * @returns {Promise<any[]>} - Array of users from the API
 * @throws {Error} - If the API call fails
 */
export const getUsersFromAppServices = async (
  accessToken: string,
  groupID: string,
  appID: string,
  verbose: boolean,
  lastId = 0
): Promise<any[]> => {
  try {
    const userQuery = lastId === 0 ? '' : `?after=${lastId}`;
    const url = `https://services.cloud.mongodb.com/api/admin/v3.0/groups/${groupID}/apps/${appID}/users${userQuery}`;
    log.debug(verbose, `Fetching users from: ${url}`);

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    log.debug(verbose, `Retrieved ${response.data.length} users`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      log.error('Error fetching users:', error.response.status, error.response.statusText);
      log.debug(verbose, 'Error details:', error.response.data);
    } else {
      log.error('Error fetching users:', error);
    }
    throw error;
  }
};

/**
 * Get all users with pagination support
 *
 * @param {string} accessToken - API token for authentication
 * @param {string} groupID - MongoDB Atlas Group ID
 * @param {string} appID - MongoDB Atlas App ID
 * @param {boolean} verbose - Whether to show debug logs
 * @returns {Promise<any[]>} - Array of processed user data
 * @throws {Error} - If the API call fails
 */
export const getUsers = async (
  accessToken: string,
  groupID: string,
  appID: string,
  verbose: boolean
): Promise<any[]> => {
  try {
    log.debug(verbose, 'Getting all users...');

    let users: any[] = [];
    let returnedUsers = await getUsersFromAppServices(accessToken, groupID, appID, verbose);
    users = users.concat(returnedUsers);

    while (returnedUsers && returnedUsers.length) {
      const lastUser = returnedUsers[returnedUsers.length - 1];
      returnedUsers = await getUsersFromAppServices(
        accessToken,
        groupID,
        appID,
        verbose,
        lastUser._id
      );
      users = users.concat(returnedUsers);
    }

    log.debug(verbose, `Total users retrieved: ${users.length}`);

    const userData = users.map((user) => ({
      id: user._id,
      email: user.data.email,
      createdAt: user.creation_date,
      status: 'active',
    }));

    return userData;
  } catch (error) {
    log.error('Error getting all users:', error);
    throw error;
  }
};

/**
 * Get pending users from App Services with optional pagination
 *
 * @param {string} accessToken - API token for authentication
 * @param {string} groupID - MongoDB Atlas Group ID
 * @param {string} appID - MongoDB Atlas App ID
 * @param {boolean} verbose - Whether to show debug logs
 * @param {number} lastId - ID of the last pending user retrieved for pagination (optional)
 * @returns {Promise<any[]>} - Array of pending users from the API
 * @throws {Error} - If the API call fails
 */
export const getPendingUsersFromAppServices = async (
  accessToken: string,
  groupID: string,
  appID: string,
  verbose: boolean,
  lastId = 0
): Promise<any[]> => {
  try {
    const userQuery = lastId === 0 ? '' : `?after=${lastId}`;
    const url = `https://services.cloud.mongodb.com/api/admin/v3.0/groups/${groupID}/apps/${appID}/user_registrations/pending_users${userQuery}`;
    log.debug(verbose, `Fetching pending users from: ${url}`);

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    log.debug(verbose, `Retrieved ${response.data.length} pending users`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      log.error('Error fetching pending users:', error.response.status, error.response.statusText);
      log.debug(verbose, 'Error details:', error.response.data);
    } else {
      log.error('Error fetching pending users:', error);
    }
    throw error;
  }
};

/**
 * Get all pending users with pagination support
 *
 * @param {string} accessToken - API token for authentication
 * @param {string} groupID - MongoDB Atlas Group ID
 * @param {string} appID - MongoDB Atlas App ID
 * @param {string} pendingUserDate - Date to use for pending users in YYYY-MM-DD format
 * @param {boolean} verbose - Whether to show debug logs
 * @returns {Promise<any[]>} - Array of processed pending user data
 * @throws {Error} - If the API call fails
 */
export const getPendingUsers = async (
  accessToken: string,
  groupID: string,
  appID: string,
  pendingUserDate: string,
  verbose: boolean
): Promise<any[]> => {
  try {
    log.debug(verbose, 'Getting all pending users...');

    let pendingUsers: any[] = [];
    let returnedPendingUsers = await getPendingUsersFromAppServices(
      accessToken,
      groupID,
      appID,
      verbose
    );
    pendingUsers = pendingUsers.concat(returnedPendingUsers);

    while (returnedPendingUsers && returnedPendingUsers.length) {
      log.debug(
        verbose,
        `Fetching next batch of pending users after ID: ${returnedPendingUsers[returnedPendingUsers.length - 1]._id}`
      );

      const lastUser = returnedPendingUsers[returnedPendingUsers.length - 1];
      returnedPendingUsers = await getPendingUsersFromAppServices(
        accessToken,
        groupID,
        appID,
        verbose,
        lastUser._id
      );
      pendingUsers = pendingUsers.concat(returnedPendingUsers);
    }

    log.debug(verbose, `Total pending users retrieved: ${pendingUsers.length}`);
    log.debug(verbose, `Using ${pendingUserDate} as the creation date for pending users`);

    // Convert the pendingUserDate string to a timestamp
    const createdAtTimestamp = new Date(pendingUserDate).getTime() / 1000;

    const pendingUserData = pendingUsers.map((user) => ({
      id: user._id,
      email: user.login_ids[0].id,
      status: 'pending',
      createdAt: createdAtTimestamp,
    }));

    return pendingUserData;
  } catch (error) {
    log.error('Error getting all pending users:', error);
    throw error;
  }
};

/**
 * List all apps in the project
 *
 * @param {string} accessToken - API token for authentication
 * @param {string} groupID - MongoDB Atlas Group ID
 * @param {boolean} verbose - Whether to show debug logs
 * @returns {Promise<any[]>} - Array of apps in the project
 * @throws {Error} - If the API call fails
 */
export const listApps = async (
  accessToken: string,
  groupID: string,
  verbose: boolean
): Promise<any[]> => {
  try {
    const url = `https://services.cloud.mongodb.com/api/admin/v3.0/groups/${groupID}/apps`;
    log.debug(verbose, `Listing apps from: ${url}`);

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    log.debug(verbose, `Retrieved ${response.data.length} apps`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      log.error('Error listing apps:', error.response.status, error.response.statusText);
      log.debug(verbose, 'Error details:', error.response.data);
    } else {
      log.error('Error listing apps:', error);
    }
    throw error;
  }
};
