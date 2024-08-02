const puppeteer = require('puppeteer');
const fs = require('fs');

const scriptPath = './script.json'; // puppeteer script generated by Katalon Recorder
const script = JSON.parse(fs.readFileSync(scriptPath, 'utf8'));

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    for (const step of script) {
        const { command, target, value } = step;

        switch (command) {
            case 'open':
                await page.goto(target, { waitUntil: 'networkidle0' });
                break;
            case 'click':
                await clickElement(page, target);
                break;
            case 'type':
                await page.type(convertSelector(target), value);
                break;
            //TODO: Add more cases here for other actions as needed
            default:
                console.log(`Unknown command: ${command}`);
        }
    }

    //TODO: Add any additional logic or cleanup here
    await browser.close();
})();

// Make Katalon selectors to Puppeteer selectors
function convertSelector(katalonSelector) {
    if (katalonSelector.startsWith('id=')) {
        return `#${katalonSelector.substring(3)}`;
    } else if (katalonSelector.startsWith('name=')) {
        return `[name=${katalonSelector.substring(5)}]`;
    } else if (katalonSelector.startsWith('css=')) {
        return katalonSelector.substring(4);
    } else if (katalonSelector.startsWith('xpath=')) {
        return katalonSelector;
    }
    return katalonSelector;
}

async function clickElement(page, katalonSelector) {
    if (katalonSelector.startsWith('link=')) {
        const linkText = katalonSelector.substring(5);
        await page.evaluate(linkText => {
            const link = Array.from(document.querySelectorAll('a')).find(a => a.textContent.includes(linkText));
            if (link) {
                link.click();
            } else {
                throw new Error(`Link with text "${linkText}" not found`);
            }
        }, linkText);
    } else if (katalonSelector.startsWith('xpath=')) {
        const xpath = katalonSelector.substring(6);
        const elementHandle = await page.evaluateHandle(xpath => {
            const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            return result.singleNodeValue;
        }, xpath);

        if (elementHandle) {
            await Promise.all([
                elementHandle.click(),
                page.waitForNavigation({ waitUntil: 'networkidle0' }),
            ]);
        } else {
            throw new Error(`XPath "${xpath}" not found`);
        }
    } else {
        await Promise.all([
            page.click(convertSelector(katalonSelector)),
            page.waitForNavigation({ waitUntil: 'networkidle0' }),
        ]);
    }
}