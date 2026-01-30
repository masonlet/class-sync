# Class Sync
Discord bot for syncing course deadlines across class channels and forums. Features automatic reminders, role-based cohort organization, and per-guild data isolation.

[![Privacy Policy](https://img.shields.io/badge/Privacy-Policy-blue)](https://github.com/masonlet/class-sync-legal/blob/main/privacy.md)
[![Terms of Service](https://img.shields.io/badge/Terms-of%20Service-blue)](https://github.com/masonlet/class-sync-legal/blob/main/tos.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

## Features
### Deadline Management
- **Multi-Course Support** - Track deadlines across multiple course channels/forums
- **Cohort-Based** - Organize deadlines by student cohorts using Discord roles
- **Smart Validation** - Prevents deadlines less than 2 hours in the future
- **Permission Controls** - Restrict deadline management to instructors/admins

### Reminders
- **Automatic Reminders** - Posts and updates deadline messages in dedicated locations
- **Multi-Stage Reminders** - Sends 24h, 8h, and 1h notifications with late-reminder recovery

### Architecture
- **Multi-Guild** - Supports multiple Discord servers with isolated data storage
- **Automatic Expiration** - Auto-removes past deadlines every 30 minutes
- **Downtime Recovery** - Catches up on missed reminders when bot restarts
- **Full Test Coverage** - Thoroughly tested with Vitest

## Usage

| Command | Description | Permissions |
| ------- | ----------- | ----------- |
| `/add-deadline` | Add a new course deadline | Helper role or Admin |
| `/remove-deadline` | Remove an existing deadline | Helper role or Admin |
| `/list-deadlines` | View all deadlines (with optional filters) | Everyone |
| `/status` | Check if bot is running | Everyone |

<br/>

## Setup

### Prerequisites

- Node.js 22.12.0+
- A Discord bot token ([create one here](https://discord.com/developers/applications))

### Installation

1. Clone the repository:
```bash
git clone https://github.com/masonlet/class-sync.git
cd class-sync
```

2. Install dependencies
```bash
npm install
```

3. Copy .env.example to .env, and update the variables.

**Required:**
- `DISCORD_TOKEN`: Your bot token from the Bot tab in Discord Developer Portal
- `CLIENT_ID`: Your application ID from General Information tab in Discord Developer Portal

**Optional:**
- `GUILD_ID`: Your test server ID for development (enables instant command updates)
- `HELPER_ROLE_NAME`: Role name that can manage deadlines (default: "Helper")
- `CLEANUP_INTERVAL_MINUTES`: Minutes between expired deadline removal (default: 30)
- `REMINDER_INTERVAL_MINUTES`: Minutes between reminder checks (default: 30)

4. Deploy slash commands:
```bash
npm run deploy
```

5. Start the bot:
```bash
npm start
```

### Data Storage
Deadlines are stored per-guild in `data/<guild-id>/`:
- `deadlines.json` - Course deadline data
- `messages.json` - Reminder message tracking
Note: `/data/` directory is git-ignored by default

### Development
Run Tests
```bash
npm test
```

<br/>

## Privacy & Legal
- [Privacy Policy](https://github.com/masonlet/class-sync-legal/blob/main/privacy.md)
- [Terms of Service](https://github.com/masonlet/class-sync-legal/blob/main/tos.md)

## License
MIT License - see [LICENSE](./LICENSE) for details.
