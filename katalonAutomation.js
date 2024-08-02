const puppeteer = require('puppeteer');
const fs = require('fs');

// Read the JSON file exported from Katalon Recorder
const scriptPath = './script.json';
const script = JSON.parse(fs.readFileSync(scriptPath, 'utf8'));

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    for (const step of script) {
        const { type, selector, value } = step;

        switch (type) {
            case 'goto':
                await page.goto(value);
                break;
            case 'click':
                await page.click(selector);
                break;
            case 'type':
                await page.type(selector, value);
                break;
            case 'waitForSelector':
                await page.waitForSelector(selector);
                break;
            // Add more cases here for other actions
            default:
                console.log(`Unknown action type: ${type}`);
        }
    }

    // Add any additional logic or cleanup here
    await browser.close();
})();
