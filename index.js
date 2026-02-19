const puppeteer = require("puppeteer");
const readlineSync = require("readline-sync");
const fs = require("fs");
const path = require("path");

(async () => {
  console.log("\n=== Gemini Automation Started ===\n");

  const userQuestion = readlineSync.question("What do you want to ask Gemini? ");
  console.log(`\nYou asked: "${userQuestion}"\n`);

  const profileDir = path.join(__dirname, "chrome-profile");

  const browser = await puppeteer.launch({
    headless: false,
    userDataDir: profileDir, // Saves login session permanently
    executablePath:
      process.platform === "win32"
        ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
        : process.platform === "darwin"
        ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
        : "/usr/bin/google-chrome",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled", // Hides bot detection
    ],
    ignoreDefaultArgs: ["--enable-automation"], // Removes "Chrome is being controlled" banner
  });

  const page = await browser.newPage();

  // Hide puppeteer fingerprint
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
  });

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  );

  console.log("Navigating to Gemini...");
  await page.goto("https://gemini.google.com/", {
    waitUntil: "networkidle2",
    timeout: 30000,
  });

  await new Promise(r => setTimeout(r, 3000));

  // ---- Check if logged in ----
  const currentUrl = page.url();
  console.log("Current URL:", currentUrl);

  if (currentUrl.includes("accounts.google.com")) {
    console.log("\n⚠️  NOT LOGGED IN — Please log in manually in the browser window.");
    console.log("✅ After logging in, the script will continue automatically...\n");

    // Wait until redirected back to Gemini (user logs in manually)
    await page.waitForFunction(
      () => window.location.href.includes("gemini.google.com") && !window.location.href.includes("accounts.google.com"),
      { timeout: 120000 } // 2 min to log in
    );

    console.log("✅ Logged in! Continuing...");
    await new Promise(r => setTimeout(r, 3000));
  } else {
    console.log("✅ Already logged in!");
  }

  // ---- Find input field ----
  console.log("Looking for input field...");

  const inputSelectors = [
    "rich-textarea div[contenteditable='true']",
    "div[contenteditable='true']",
    "textarea",
  ];

  let typed = false;
  for (const sel of inputSelectors) {
    try {
      await page.waitForSelector(sel, { timeout: 8000 });
      console.log(`✅ Found input: ${sel}`);
      await page.click(sel);
      await new Promise(r => setTimeout(r, 500));
      await page.keyboard.type(userQuestion, { delay: 60 });
      typed = true;
      break;
    } catch (e) {
      console.log(`❌ Selector not found: ${sel}`);
    }
  }

  if (!typed) {
    console.error("❌ Could not find input field. Taking screenshot...");
    await page.screenshot({ path: "debug.png", fullPage: true });
    console.log("Screenshot saved as debug.png — check it to see what went wrong.");
    await browser.close();
    process.exit(1);
  }

  await new Promise(r => setTimeout(r, 1000));

  // ---- Submit ----
  console.log("Submitting message...");
  await page.keyboard.press("Enter");

  // Fallback button click
  const sendButtonSelectors = [
    'button[aria-label="Send message"]',
    'button[aria-label="Submit"]',
    'button[data-test-id="send-button"]',
    'button[jsname="Qx7uuf"]',
  ];

  await new Promise(r => setTimeout(r, 1000));
  for (const sel of sendButtonSelectors) {
    const btn = await page.$(sel);
    if (btn) {
      await btn.click();
      console.log(`✅ Clicked send button: ${sel}`);
      break;
    }
  }

  // ---- Wait for response ----
  console.log("Waiting for Gemini to respond...");

  try {
    // Wait until a response element appears
    await page.waitForSelector("model-response", { timeout: 30000 });
    // Then wait a bit more for full response to stream
    await new Promise(r => setTimeout(r, 5000));
  } catch (e) {
    console.log("model-response not found, waiting extra time...");
    await new Promise(r => setTimeout(r, 10000));
  }

  // ---- Extract response ----
  console.log("Extracting response...");

  const response = await page.evaluate(() => {
    const selectors = [
      "model-response .markdown",
      "model-response",
      "response-container",
      ".model-response-text",
      'div[class*="response-content"]',
    ];

    for (const s of selectors) {
      const els = document.querySelectorAll(s);
      if (els.length > 0) {
        const texts = Array.from(els)
          .map(el => el.innerText || el.textContent)
          .filter(t => t && t.trim().length > 10);
        if (texts.length > 0) return { selector: s, texts };
      }
    }

    // Fallback: biggest text blocks on page
    const divs = Array.from(document.querySelectorAll("div"))
      .map(d => d.innerText)
      .filter(t => t && t.length > 150);
    return { selector: "fallback", texts: divs.slice(-3) };
  });

  if (response && response.texts.length > 0) {
    console.log(`\n=== ✅ Gemini Response (via ${response.selector}) ===\n`);
    response.texts.forEach((t, i) => console.log(`[${i + 1}]:\n${t}\n`));
  } else {
    console.log("❌ Could not extract response. Taking screenshot...");
    await page.screenshot({ path: "response-debug.png", fullPage: true });
    console.log("Screenshot saved as response-debug.png");
  }

  console.log("\n=== Done ===\n");
  // await browser.close();
})();