# Realm Users Migration Tool

A command-line utility for exporting users and pending users from MongoDB Atlas App Services (formerly Realm).

## Features

- Export active and pending users from MongoDB Atlas App Services
- Customize the creation date for pending users
- Support for pagination when fetching large user datasets
- Dry run mode for testing without saving data
- Verbose logging for debugging
- Configurable batch size for processing users
- Output to JSON file or console

## Prerequisites

- Node.js 16 or higher
- MongoDB Atlas account with App Services application
- API key with appropriate permissions

## Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/realm-users-migration.git
   cd realm-users-migration
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Create a `.env` file based on the example:
   ```bash
   cp .env.example .env
   ```

4. Edit the `.env` file with your MongoDB Atlas credentials:
   ```
   USERNAME=your_mongodb_username
   API_KEY=your_mongodb_api_key
   GROUP_ID=your_mongodb_group_id
   APP_ID=your_mongodb_app_id
   ```

## Usage

Build the TypeScript project:
```bash
pnpm build
```

Run the migration script:
```bash
pnpm start
```

### Command Line Options

| Option | Description | Default |
|--------|-------------|---------|
| `--dryRun` | Run without saving data | `false` |
| `--verbose` | Enable detailed logging | `false` |
| `--batchSize` | Number of users to process in each batch | `100` |
| `--outputFile` | Path to save exported users (saved in output directory) | `undefined` |
| `--pendingUserDate` | Date for pending users' createdAt field (YYYY-MM-DD) | `2020-12-01` |
| `--help`, `-h` | Show help | |

### Examples

Export users to a JSON file:
```bash
pnpm start --outputFile users.json
```

Run in dry run mode with verbose logging:
```bash
pnpm start --dryRun --verbose
```

Set a custom date for pending users:
```bash
pnpm start --pendingUserDate 2023-01-15 --outputFile users.json
```

### Output Format

The output JSON file has the following structure:

```json
{
  "metadata": {
    "exportDate": "2025-03-30T12:15:00.000Z",
    "groupId": "your_group_id",
    "appId": "your_app_id",
    "totalUsers": 91,
    "totalPendingUsers": 40,
    "pendingUserDate": "2020-12-01"
  },
  "users": [
    {
      "id": "user_id",
      "email": "user@example.com",
      "createdAt": 1606857105,
      "status": "active"
    },
    ...
  ],
  "pendingUsers": [
    {
      "id": "pending_user_id",
      "email": "pending@example.com",
      "status": "pending",
      "createdAt": 1606780800
    },
    ...
  ]
}
```

## Development

### Project Structure

- `src/index.ts` - Main entry point and CLI handling
- `src/atlas.ts` - MongoDB Atlas API functions
- `src/utils.ts` - Utility functions for logging

### Available Scripts

- `pnpm build` - Build the TypeScript project
- `pnpm start` - Run the compiled script
- `pnpm dev` - Run in development mode with auto-reload
- `pnpm format` - Format code with Prettier
- `pnpm lint` - Run ESLint

## License

MIT