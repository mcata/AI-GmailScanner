# AI Scanner for Gmail

Automatically scan your Gmail for bills, appointments, and deadlines using Gemini, and create events in Google Calendar with smart reminders.

## Features

- **AI-Powered**: Uses Gemini 2.5 Flash to understand email content and PDF attachments
- **PDF Support**: Extracts text from PDF bills and invoices automatically
- **Label-based**: Process only emails with specific Gmail labels (or search-based)
- **Smart Detection**: Distinguishes between bills (with amounts) and appointments
- **Auto-Reminders**: Sets appropriate reminders (3 days for bills, 1 day for appointments)
- **Idempotent**: Won't create duplicate events for the same email

## Quick Start

### Prerequisites

- Google Account (Gmail + Google Calendar)
- Google Apps Script (free)
- Google AI Studio account (free tier available)

### Step 1: Get Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"**

### Step 2: Create Apps Script Project

1. Go to [script.google.com](https://script.google.com)
2. Create new project
4. Create files matching the structure above (`Config.gs`, `Main.gs`, etc.)
5. Copy-paste content from each file

### Step 3: Configuration

1. **Set API Key**:
   - In Apps Script, click **Project Settings**
   - Scroll to **Script Properties**
   - Click **Edit script properties**
   - Add new property:
     - Key: `GEMINI_API_KEY`
     - Value: `your-api-key-from-step-1`
   - Click **Save**

2. **Initialize**:
   - Go to main.gs
   - Select function `setup` in dropdown
   - Click **Run**
   - Authorize permissions (Gmail, Calendar, Properties)

3. **Configure Gmail Label** (optional):
   - Create a label in Gmail (e.g., "Deadlines")
   - In Script Properties, add:
     - Key: `LABEL_TO_SCAN`
     - Value: `Deadlines`
   - Or leave empty to scan recent emails with attachments

### Step 4: Test

1. Select function `processEmails` in dropdown
2. Click **Run**
3. Check **Execution log** for results
4. Verify events appear in your Google Calendar

### Step 5: Automation

Run this to enable daily automatic scanning:

```javascript
createDailyTrigger();
```

To stop automation:
```javascript
removeTriggers();
```