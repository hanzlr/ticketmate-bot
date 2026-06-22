# Changelog

All notable changes to TicketMate will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-06-22

### Added
- 🎫 Open ticket via button panel (`open_ticket`)
- 🔒 Close ticket with auto transcript generation (`close_ticket`)
- 📁 Transcript saved as `.txt` file in a thread inside `#ticket-archive`
- ♻️ Auto-recreate `#ticket-panel` and `#ticket-archive` if deleted
- ☁️ Firebase Firestore integration for persistent ticket data
- ⚙️ `/setup` — automatically creates category, panel, and archive channel
- 🔄 `/reset` — reset TicketMate configuration for the server
- 👥 `/add @user` — add a user to the current ticket
- 🚫 `/remove @user` — remove a user from the current ticket
- 🎫 `/ticket` — manually create a ticket via slash command
- ❓ `/help` — show all available commands