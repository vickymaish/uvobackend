const puppeteer = require('puppeteer');

describe('Hello World Test', () => {
	let browser;
	let page;

	beforeAll(async () => {
		browser = await puppeteer.launch();
		page = await browser.newPage();
	});

	afterAll(async () => {
		await browser.close();
	});

	test('should display "Hello World" on the page', async () => {
		await page.setContent('<h1>Hello World</h1>');
		const content = await page.$eval('h1', el => el.textContent);
		expect(content).toBe('Hello World');
	});
