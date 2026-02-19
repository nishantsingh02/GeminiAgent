# 🤖 Browser-Based AI Chat Automation (Puppeteer)

A lightweight Node.js automation tool built with **Puppeteer** that simulates real user interaction inside a Chrome browser window to send prompts and capture responses from a web-based AI chat interface.

This script mimics natural typing behavior and operates inside a visible browser session using stored authentication cookies.

---

## 🔎 What This Script Does

* Opens a real Chrome window (non-headless mode)
* Loads authentication cookies to maintain a logged-in session
* Detects the chat input dynamically
* Types your prompt with realistic human-like behavior
* Submits the message automatically
* Extracts the generated response
* Prints the reply inside the terminal

---

## ✨ Key Capabilities

* Session persistence via saved cookies
* Human-style typing simulation:

  * Randomized delays
  * Occasional typos
  * Backspace corrections
  * Natural pacing between words
* Adaptive selector detection (handles UI changes)
* Automatic response scraping
* Useful for automation testing, experiments, and workflow prototyping

---

## 🧰 Requirements

* Node.js (v16+ recommended)
* Chrome installed
* Exported authentication cookies from your browser

---

## 📥 Setup Instructions

### 1. Clone the Project

```bash
git clone https://github.com/your-username/your-repo
cd your-repo
```

### 2. Install Dependencies

```bash
npm install
```

---

## 🔐 Adding Authentication Cookies

To reuse your logged-in browser session:

1. Open Chrome
2. Log into the AI chat service
3. Use a browser extension to export cookies
4. Save them as:

```
cookies.json
```

Place this file in the root directory of the project.

Example format:

```json
[
  {
    "name": "SID",
    "value": "example_value",
    "domain": ".google.com",
    "path": "/",
    "secure": true,
    "httpOnly": true
  }
]
```

---

## ▶ Running the Script

Start the automation with:

```bash
node index.js
```

You’ll be asked:

```
Enter your prompt:
```

After entering your question, the script will:

1. Launch the browser
2. Inject session cookies
3. Navigate to the chat interface
4. Simulate human typing
5. Submit the query
6. Capture and print the response

---

## 📁 File Structure

```
project-root/
│
├── index.js        # Core automation logic
├── cookies.json    # Stored session cookies
└── README.md       # Documentation
```

---

## ⚙ How It Works Internally

### Browser Launch

The script starts a Chromium session in visible mode:

```js
puppeteer.launch({ headless: false })
```

---

### Cookie Injection

Authentication is restored using stored cookies:

```js
await page.setCookie(...cookies);
```

---

### Input Detection

Multiple fallback selectors are checked to locate the active message field:

* `rich-textarea`
* `[contenteditable="true"]`
* `textarea`
* `.ql-editor`

---

### Typing Simulation

Instead of pasting text instantly, the script:

* Sends keystrokes individually
* Randomizes delay timing
* Occasionally inserts and corrects typos
* Adds realistic pause intervals

---

### Message Submission

The send button is located dynamically and clicked programmatically.

---

### Response Extraction

The script scans potential response containers such as:

* `.message-content`
* `[class*="response"]`
* `[data-test-id*="message"]`

The latest generated reply is then printed to the console.

---

## ⚠ Usage Notice

This automation tool interacts with a third-party web service.

Please ensure:

* You comply with the platform’s terms of service
* You avoid excessive or abusive automated usage
* You use this project responsibly

This project is intended for educational and experimental purposes.

---

## 💡 Possible Improvements

* Save responses automatically to a JSON file
* Implement continuous conversation mode
* Add logging system
* Add headless execution support
* Package with Docker for portability

---
