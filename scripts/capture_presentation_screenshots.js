const puppeteer = require('../frontend-react/node_modules/puppeteer-core');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.resolve(__dirname, '../docs/screenshots');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const BASE_URL = 'https://nexus-cv-h5zf.onrender.com';

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

(async () => {
  console.log(`Launching Chrome and navigating to ${BASE_URL}...`);
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    defaultViewport: {
      width: 1440,
      height: 900,
      deviceScaleFactor: 2, // Crisp 2x retina output for pitch deck
    },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // 1. Login
  console.log('Navigating to login page...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2', timeout: 30000 });
  await wait(1500);

  const userInput = await page.$('input[type="text"]');
  const passInput = await page.$('input[type="password"]');
  if (userInput && passInput) {
    await userInput.type('admin');
    await passInput.type('admin12345678');
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) await submitBtn.click();
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
  }
  await wait(3000);

  // Ensure Job 6 (Senior Full-Stack Engineer) is selected in dropdown
  await page.evaluate(() => {
    const select = document.querySelector('select');
    if (select) {
      const opts = Array.from(select.options);
      const opt = opts.find((o) => o.text.includes('Senior Full-Stack Engineer'));
      if (opt) {
        select.value = opt.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  });
  await wait(2000);

  // 01. Recruiter Dashboard Full
  console.log('Capturing 01_recruiter_dashboard.png...');
  await page.screenshot({
    path: path.join(OUT_DIR, '01_recruiter_dashboard.png'),
    fullPage: false,
  });

  // 02. Job Creation Form
  console.log('Capturing 02_job_creation_form.png...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find((b) => b.innerText.includes('Create Job Requisition') || b.innerText.includes('Author Requisition'));
    if (btn) btn.click();
  });
  await wait(1500);
  await page.screenshot({
    path: path.join(OUT_DIR, '02_job_creation_form.png'),
    fullPage: false,
  });

  // Return to Pipeline Overview
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find((b) => b.innerText.includes('Candidate Pipeline') || b.innerText.includes('Pipeline Overview'));
    if (btn) btn.click();
  });
  await wait(1500);

  // 03. Job Management Actions
  console.log('Capturing 03_job_management_actions.png...');
  await page.screenshot({
    path: path.join(OUT_DIR, '03_job_management_actions.png'),
    clip: { x: 330, y: 70, width: 1080, height: 240 },
  });

  // 07. Candidate Ranking / Match Scores
  console.log('Capturing 07_candidate_ranking_scores.png...');
  await page.screenshot({
    path: path.join(OUT_DIR, '07_candidate_ranking_scores.png'),
    clip: { x: 330, y: 270, width: 1080, height: 600 },
  });

  // 12. Candidate Search & Filters
  console.log('Capturing 12_candidate_search_and_filters.png...');
  await page.screenshot({
    path: path.join(OUT_DIR, '12_candidate_search_and_filters.png'),
    clip: { x: 330, y: 180, width: 1080, height: 160 },
  });

  // 06. Bulk Resume Screening
  console.log('Capturing 06_bulk_resume_screening.png...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find((b) => b.innerText.includes('Batch Resume Screening') || b.innerText.includes('Batch Screen'));
    if (btn) btn.click();
  });
  await wait(1500);
  await page.screenshot({
    path: path.join(OUT_DIR, '06_bulk_resume_screening.png'),
    fullPage: false,
  });

  // Return to Candidate Pipeline
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find((b) => b.innerText.includes('Candidate Pipeline'));
    if (btn) btn.click();
  });
  await wait(1500);

  // Click on the top candidate card to open Evaluation Modal
  console.log('Opening Candidate Evaluation Modal for top candidate...');
  await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('div.group, div.cursor-pointer'));
    if (cards.length > 0) {
      cards[0].click();
    }
  });
  await wait(2000);

  // 08. Explainable AI Breakdown
  console.log('Capturing 08_explainable_ai_breakdown.png...');
  await page.screenshot({
    path: path.join(OUT_DIR, '08_explainable_ai_breakdown.png'),
    fullPage: false,
  });

  // 09. Candidate Pipeline Stage Machine
  console.log('Capturing 09_candidate_pipeline_stage.png...');
  await page.screenshot({
    path: path.join(OUT_DIR, '09_candidate_pipeline_stage.png'),
    clip: { x: 750, y: 120, width: 620, height: 420 },
  });

  // 11. Resume Download Action
  console.log('Capturing 11_resume_download_action.png...');
  await page.screenshot({
    path: path.join(OUT_DIR, '11_resume_download_action.png'),
    clip: { x: 250, y: 80, width: 940, height: 200 },
  });

  // 10. Audit History / Activity Timeline
  console.log('Capturing 10_audit_history_timeline.png...');
  await page.evaluate(() => {
    const scrollables = document.querySelectorAll('div.overflow-y-auto');
    for (const s of scrollables) {
      s.scrollTop = s.scrollHeight;
    }
  });
  await wait(1000);
  await page.screenshot({
    path: path.join(OUT_DIR, '10_audit_history_timeline.png'),
    fullPage: false,
  });

  // Close candidate modal
  await page.keyboard.press('Escape');
  await wait(1000);

  // 04. Public Career Portal
  console.log('Capturing 04_public_career_portal.png...');
  const careerPage = await browser.newPage();
  await careerPage.goto(`${BASE_URL}/careers`, { waitUntil: 'networkidle2', timeout: 30000 });
  await wait(2000);
  await careerPage.screenshot({
    path: path.join(OUT_DIR, '04_public_career_portal.png'),
    fullPage: false,
  });

  // 05. Job Application & Resume Upload Modal
  console.log('Capturing 05_candidate_application_modal.png...');
  await careerPage.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const applyBtn = btns.find((b) => b.innerText.includes('Apply Now') || b.innerText.includes('Apply'));
    if (applyBtn) applyBtn.click();
  });
  await wait(1500);
  await careerPage.screenshot({
    path: path.join(OUT_DIR, '05_candidate_application_modal.png'),
    fullPage: false,
  });

  await careerPage.close();
  await page.close();
  await browser.close();

  console.log('SUCCESS! All 12 screenshots captured from LIVE production site.');
})();
