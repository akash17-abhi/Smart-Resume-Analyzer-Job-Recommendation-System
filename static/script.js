const skillCategories = {
  Programming: ['Python', 'Java', 'JavaScript', 'TypeScript'],
  Frontend: ['HTML', 'CSS', 'React', 'Angular', 'Vue'],
  Backend: ['Node.js', 'Express', 'Django', 'Flask', 'FastAPI'],
  Database: ['SQL', 'MySQL', 'PostgreSQL', 'MongoDB'],
  Data: ['Excel', 'Power BI', 'Tableau', 'pandas', 'NumPy', 'statistics', 'data analysis'],
  'DevOps / Tools': ['Git', 'GitHub', 'Docker', 'Linux', 'AWS', 'Azure', 'CI/CD'],
  'Soft Skills': ['communication', 'teamwork', 'problem solving', 'leadership']
};

const allSkills = Object.values(skillCategories).flat();
const actionWords = ['built', 'developed', 'created', 'improved', 'analyzed', 'designed', 'launched', 'delivered', 'optimized', 'automated', 'tested', 'deployed', 'led'];

const stopWords = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'are', 'will', 'have',
  'has', 'was', 'were', 'a', 'an', 'in', 'on', 'to', 'of', 'as', 'by', 'or',
  'at', 'it', 'is', 'be', 'their', 'your', 'you', 'we', 'us', 'our', 'can',
  'must', 'should', 'using', 'use', 'support', 'experience', 'development',
  'role', 'required', 'requirements', 'skills', 'candidate', 'team', 'work'
]);

const samplePresets = {
  frontend: {
    resume: `Full-stack web developer with hands-on experience building responsive apps using JavaScript, HTML, CSS, React, and REST APIs. Improved user workflows, collaborated on GitHub, and delivered frontend features that increased client satisfaction. Strong communication and problem solving skills in agile teams.`,
    job: `We are seeking a Frontend Developer skilled in HTML, CSS, JavaScript, React, and responsive design. The ideal candidate works with REST APIs, GitHub, and collaborates closely with product teams. Familiarity with testing and performance optimization is a plus.`
  },
  data: {
    resume: `Data analyst with experience using Excel, Power BI, SQL, and Python pandas to build dashboards and automate reports. Delivered data analysis that improved decision making and presented results to stakeholders. Strong communication, teamwork, and problem solving skills.`,
    job: `Hiring a Data Analyst who can use SQL, Excel, Power BI, and statistics to analyze business performance. The role requires data visualization, reporting, and communicating insights to cross-functional teams. Experience with Python or NumPy is a bonus.`
  },
  backend: {
    resume: `Backend engineer experienced building APIs with Node.js and Express, connecting to SQL and MongoDB, and deploying applications using Docker and AWS. Improved system reliability and automated deployment workflows. Demonstrated leadership and collaboration with engineering teams.`,
    job: `Seeking a Backend Developer with Node.js, Express, SQL, MongoDB, Docker, and AWS experience. The position requires API design, database optimization, and CI/CD awareness. Strong teamwork, communication, and problem solving are important.`
  }
};

const resumeText = document.getElementById('resumeText');
const jobText = document.getElementById('jobText');
const analyzeBtn = document.getElementById('analyzeBtn');
const clearBtn = document.getElementById('clearBtn');
const exportBtn = document.getElementById('exportBtn');
const sampleFrontendBtn = document.getElementById('sampleFrontendBtn');
const sampleDataBtn = document.getElementById('sampleDataBtn');
const sampleBackendBtn = document.getElementById('sampleBackendBtn');
const message = document.getElementById('message');
const resultsPanel = document.getElementById('resultsPanel');
const matchScoreEl = document.getElementById('matchScore');
const readinessLevelEl = document.getElementById('readinessLevel');
const readinessTextEl = document.getElementById('readinessText');
const skillSummaryEl = document.getElementById('skillSummary');
const keywordSummaryEl = document.getElementById('keywordSummary');
const skillMatchScoreEl = document.getElementById('skillMatchScore');
const keywordMatchScoreEl = document.getElementById('keywordMatchScore');
const textSimilarityScoreEl = document.getElementById('textSimilarityScore');
const actionMatchScoreEl = document.getElementById('actionMatchScore');
const skillMatchBar = document.getElementById('skillMatchBar');
const keywordMatchBar = document.getElementById('keywordMatchBar');
const textSimilarityBar = document.getElementById('textSimilarityBar');
const actionMatchBar = document.getElementById('actionMatchBar');
const qualityListEl = document.getElementById('qualityList');
const categorySummaryEl = document.getElementById('categorySummary');
const keywordTableBody = document.getElementById('keywordTableBody');
const suggestionsListEl = document.getElementById('suggestionsList');
const bulletListEl = document.getElementById('bulletList');
const copyAllBulletsBtn = document.getElementById('copyAllBulletsBtn');

let latestReport = null;

sampleFrontendBtn.addEventListener('click', () => loadSample('frontend'));
sampleDataBtn.addEventListener('click', () => loadSample('data'));
sampleBackendBtn.addEventListener('click', () => loadSample('backend'));
clearBtn.addEventListener('click', () => clearInputs());
analyzeBtn.addEventListener('click', () => analyzeResume());
exportBtn.addEventListener('click', () => latestReport && downloadReport(latestReport));
copyAllBulletsBtn.addEventListener('click', () => {
  if (!latestReport || !latestReport.atsBullets?.length) {
    return;
  }
  const allText = latestReport.atsBullets.map((item) => item.text).join('\n');
  copyTextToClipboard(allText);
  copyAllBulletsBtn.textContent = 'Copied!';
  setTimeout(() => {
    copyAllBulletsBtn.textContent = 'Copy All';
  }, 1400);
});

function loadSample(type) {
  resumeText.value = samplePresets[type].resume;
  jobText.value = samplePresets[type].job;
  hideMessage();
  disableExport(true);
  resultsPanel.classList.add('hidden');
  showMessage(`Loaded ${type.charAt(0).toUpperCase() + type.slice(1)} sample.`, 'success');
}

function clearInputs() {
  resumeText.value = '';
  jobText.value = '';
  hideMessage();
  disableExport(true);
  resultsPanel.classList.add('hidden');
}

function analyzeResume() {
  const resume = resumeText.value.trim();
  const job = jobText.value.trim();

  if (!resume || !job) {
    showMessage('Please paste both resume and job description text before analyzing.', 'error');
    return;
  }

  hideMessage();

  const resumeTokens = tokenize(resume);
  const jobTokens = tokenize(job);
  const resumeFreq = countFrequencies(resumeTokens);
  const jobFreq = countFrequencies(jobTokens);

  const keywords = extractTopKeywords(jobFreq);
  const keywordResults = keywords.map((keyword) => {
    const resumeCount = resumeFreq[keyword] || 0;
    const jobCount = jobFreq[keyword] || 0;
    const status = resumeCount === 0 ? 'Missing' : resumeCount < jobCount ? 'Low presence' : 'Found';
    return { text: keyword, resumeCount, jobCount, status };
  });

  const jobSkills = detectSkills(job);
  const resumeSkills = detectSkills(resume);
  const matchedSkills = resumeSkills.filter((skill) => jobSkills.includes(skill));
  const missingSkills = jobSkills.filter((skill) => !resumeSkills.includes(skill));

  const skillMatchPercent = jobSkills.length ? Math.round((matchedSkills.length / jobSkills.length) * 100) : 0;
  const keywordMatchPercent = keywords.length ? Math.round((keywordResults.filter((item) => item.resumeCount > 0).length / keywords.length) * 100) : 0;
  const textSimilarityPercent = Math.round(cosineSimilarity(resumeFreq, jobFreq) * 100);
  const actionMatchPercent = Math.round(Math.min(countActionWords(resume) / 3, 1) * 100);
  const finalScore = Math.round(skillMatchPercent * 0.45 + keywordMatchPercent * 0.25 + textSimilarityPercent * 0.2 + actionMatchPercent * 0.1);

  const qualityChecks = evaluateResumeQuality(resume, resumeSkills, job);
  const readiness = getReadiness(finalScore);
  const categoryReport = buildCategoryReport(matchedSkills, missingSkills);
  const hasMetrics = qualityChecks.some((check) => check.label === 'Contains measurable metrics' && check.passed);
  const atsBullets = generateRewriteBullets({
    resume,
    job,
    missingSkills,
    matchedSkills,
    keywords: keywordResults,
    qualityChecks,
    hasMetrics,
    roleCategory: detectRoleCategory(job)
  });
  const suggestions = buildSuggestions({ missingSkills, categoryReport, finalScore, qualityChecks });

  latestReport = {
    score: finalScore,
    readiness,
    matchedSkills,
    missingSkills,
    keywords: keywordResults,
    breakdown: {
      skill: skillMatchPercent,
      keyword: keywordMatchPercent,
      text: textSimilarityPercent,
      action: actionMatchPercent
    },
    qualityChecks,
    categoryReport,
    suggestions,
    atsBullets
  };

  renderResults(latestReport);
  disableExport(false);
}

function tokenize(text) {
  return normalizeText(text)
    .split(/\s+/)
    .filter((token) => token && !stopWords.has(token));
}

function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[“”‘’‚„«»]/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function countFrequencies(tokens) {
  return tokens.reduce((acc, token) => {
    acc[token] = (acc[token] || 0) + 1;
    return acc;
  }, {});
}

function extractTopKeywords(jobFreq) {
  const ignored = new Set(allSkills.map((skill) => normalizeText(skill)));
  return Object.keys(jobFreq)
    .filter((word) => word.length > 3 && !ignored.has(word))
    .sort((a, b) => jobFreq[b] - jobFreq[a])
    .slice(0, 12);
}

function normalizePhrase(phrase) {
  return phrase.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function detectSkills(text) {
  const lower = normalizeText(text);
  return allSkills.filter((skill) => {
    const normalizedSkill = normalizePhrase(skill);
    const phrasePattern = new RegExp(`\\b${escapeRegExp(normalizedSkill)}\\b`, 'i');
    return phrasePattern.test(lower);
  });
}

function countActionWords(text) {
  const lower = normalizeText(text);
  return actionWords.reduce((count, word) => {
    const pattern = new RegExp(`\\b${escapeRegExp(word)}\\b`, 'gi');
    const matches = lower.match(pattern);
    return count + (matches ? matches.length : 0);
  }, 0);
}

function cosineSimilarity(freqA, freqB) {
  const terms = new Set([...Object.keys(freqA), ...Object.keys(freqB)]);
  let dotProduct = 0;
  let magA = 0;
  let magB = 0;

  terms.forEach((term) => {
    const a = freqA[term] || 0;
    const b = freqB[term] || 0;
    dotProduct += a * b;
    magA += a * a;
    magB += b * b;
  });

  if (!magA || !magB) {
    return 0;
  }

  return dotProduct / (Math.sqrt(magA) * Math.sqrt(magB));
}

function evaluateResumeQuality(resume, resumeSkills, jobText) {
  const wordCount = resume.split(/\s+/).filter(Boolean).length;
  const hasNumbers = /\d/.test(resume);
  const hasMetrics = /\d+\s?(%|percent|projects?|years?|months?|clients?|users?)/i.test(resume);
  const hasActions = countActionWords(resume) >= 2;
  const mentionsTools = resumeSkills.length > 0;
  const tooShort = wordCount < 90;
  const titleKeywords = ['engineer', 'developer', 'analyst', 'manager', 'designer', 'specialist'];
  const jobTitleWords = titleKeywords.filter((term) => new RegExp(`\\b${escapeRegExp(term)}\\b`, 'i').test(jobText));
  const titleMatches = jobTitleWords.some((term) => new RegExp(`\\b${escapeRegExp(term)}\\b`, 'i').test(resume));

  return [
    { label: 'Contains measurable metrics', passed: hasNumbers && hasMetrics, detail: 'Numbers and percentages make achievements concrete.' },
    { label: 'Uses strong action verbs', passed: hasActions, detail: 'Action words show leadership and ownership.' },
    { label: 'Mentions tools or technologies', passed: mentionsTools, detail: 'Relevant tools demonstrate technical readiness.' },
    { label: 'Resume length is sufficient', passed: !tooShort, detail: 'A brief resume may miss important examples.' },
    { label: 'Job title keywords appear', passed: jobTitleWords.length ? titleMatches : true, detail: 'Matching role words improves relevance.' }
  ];
}

function getReadiness(score) {
  if (score >= 80) {
    return { level: 'Strong match', tone: 'status-strong', text: 'Your resume is well aligned with the job and ready for application.' };
  }
  if (score >= 60) {
    return { level: 'Good match', tone: 'status-good', text: 'The resume is strong, but a few targeted updates can improve fit.' };
  }
  if (score >= 40) {
    return { level: 'Needs improvement', tone: 'status-warning', text: 'Some skills and keywords are missing; refine your resume for this role.' };
  }
  return { level: 'Weak match', tone: 'status-neutral', text: 'The resume needs stronger alignment before applying for this role.' };
}

function buildCategoryReport(matchedSkills, missingSkills) {
  const categories = {};
  Object.entries(skillCategories).forEach(([category, list]) => {
    categories[category] = {
      matched: matchedSkills.filter((skill) => list.includes(skill)),
      missing: missingSkills.filter((skill) => list.includes(skill))
    };
  });
  return categories;
}

function buildSuggestions({ missingSkills, categoryReport, finalScore, qualityChecks }) {
  const suggestions = [];
  const missingCategories = Object.entries(categoryReport)
    .filter(([, data]) => data.missing.length)
    .map(([category]) => category);

  if (missingCategories.includes('Backend')) {
    suggestions.push('Add a backend or API project, and include technologies like Node.js, Express, Django, or Flask.');
  }
  if (missingCategories.includes('Database')) {
    suggestions.push('Add SQL or database work to show data modeling, queries, or ETL experience.');
  }
  if (missingCategories.includes('DevOps / Tools')) {
    suggestions.push('Highlight a deployment workflow, version control process, or tooling setup.');
  }
  if (missingCategories.includes('Soft Skills')) {
    suggestions.push('Include teamwork, leadership, or collaboration examples from projects or internships.');
  }
  if (missingCategories.includes('Frontend')) {
    suggestions.push('Add frontend work that shows responsive UI, accessibility, or user-focused features.');
  }
  if (missingCategories.includes('Data')) {
    suggestions.push('Add a data project with insights, dashboards, or analytical results.');
  }

  const failedChecks = qualityChecks.filter((check) => !check.passed).map((check) => check.label);
  if (failedChecks.includes('Uses strong action verbs')) {
    suggestions.push('Use action verbs like built, improved, created, and analyzed to describe your project contributions.');
  }
  if (failedChecks.includes('Contains measurable metrics')) {
    suggestions.push('Add metrics such as percent improvement, project counts, or user impact to demonstrate results.');
  }
  if (failedChecks.includes('Resume length is sufficient')) {
    suggestions.push('Expand your resume with clear accomplishments and project outcomes.');
  }
  if (failedChecks.includes('Job title keywords appear')) {
    suggestions.push('Mention the role name or similar job title keywords in your resume summary.');
  }
  if (finalScore < 60) {
    suggestions.push('Rewrite the summary section to mirror the job description and emphasize relevant skills.');
  }
  if (!suggestions.length) {
    suggestions.push('Your resume is aligned. Keep the strongest examples up front and maintain keyword relevance.');
  }
  return [...new Set(suggestions)];
}

function detectRoleCategory(jobText) {
  const lower = normalizeText(jobText);
  const categories = [];
  if (/(react|ui|frontend|html|css|angular|vue|javascript|typescript)/i.test(lower)) {
    categories.push('Frontend');
  }
  if (/(api|backend|node\.js|express|django|flask|fastapi|database|sql|mongodb|postgresql|mysql)/i.test(lower)) {
    categories.push('Backend');
  }
  if (/(sql|excel|power bi|tableau|dashboard|analytics|analysis|pandas|numpy|statistics|data)/i.test(lower)) {
    categories.push('Data');
  }
  if (/(docker|aws|azure|ci\/cd|linux|kubernetes|devops|terraform|jenkins)/i.test(lower)) {
    categories.push('DevOps');
  }
  return categories.length ? categories : ['General'];
}

function generateRewriteBullets({ resume, job, missingSkills, matchedSkills, keywords, qualityChecks, hasMetrics, roleCategory }) {
  const verbs = ['Built', 'Developed', 'Designed', 'Implemented', 'Optimized', 'Analyzed', 'Automated', 'Improved', 'Delivered'];
  const primary = roleCategory[0];
  const topKeywords = keywords
    .slice(0, 5)
    .filter((item) => item.jobCount > 0)
    .map((item) => item.text);
  const skillRollup = [...new Set([...matchedSkills.slice(0, 3), ...missingSkills.slice(0, 3)])];
  const skillText = skillRollup.length ? `using ${skillRollup.join(', ').replace(/, ([^,]+)$/, ' and $1')}` : '';
  const bullets = [];

  if (primary === 'Frontend') {
    bullets.push({ text: `Built responsive user interfaces ${skillText} to improve usability, accessibility, and customer satisfaction.`, tags: ['Frontend'] });
    bullets.push({ text: `Implemented UI features with strong performance and collaboration across design and engineering teams.`, tags: ['Frontend'] });
  }
  if (primary === 'Backend') {
    bullets.push({ text: `Developed REST API integrations ${skillText} to connect backend workflows with data stores and automate core services.`, tags: ['Backend'] });
    bullets.push({ text: `Improved application reliability by building scalable server-side components and streamlining deployment operations.`, tags: ['Backend', 'DevOps'] });
  }
  if (primary === 'Data') {
    bullets.push({ text: `Analyzed business datasets ${skillText} to identify trends and support data-driven decision-making.`, tags: ['Data'] });
    bullets.push({ text: `Created reports and dashboards to communicate insights, trends, and KPI performance to stakeholders.`, tags: ['Data', 'Metrics'] });
  }
  if (primary === 'DevOps') {
    bullets.push({ text: `Implemented CI/CD pipelines and Docker workflows to improve deployment speed and release stability.`, tags: ['DevOps'] });
    bullets.push({ text: `Automated infrastructure monitoring and tooling to reduce manual steps and increase operational confidence.`, tags: ['DevOps'] });
  }

  if (primary === 'General' || bullets.length < 3) {
    bullets.push({ text: `Delivered high-impact project outcomes ${skillText} while collaborating with cross-functional teams.`, tags: ['General'] });
    bullets.push({ text: `Optimized processes and documentation to improve efficiency, quality, and communication.`, tags: ['General'] });
  }

  if (missingSkills.length) {
    const missingText = missingSkills.slice(0, 3).join(', ').replace(/, ([^,]+)$/, ' and $1');
    bullets.push({ text: `Added or expanded experience with ${missingText} to better match the role’s technical expectations.`, tags: [primary === 'General' ? 'Skills' : primary] });
  }

  if (topKeywords.length) {
    bullets.push({ text: `Aligned work with ${topKeywords.join(', ').replace(/, ([^,]+)$/, ' and $1')} to reflect the job description and business priorities.`, tags: ['Keywords'] });
  }

  if (!hasMetrics) {
    bullets.push({ text: 'Add measurable impact, such as number of users, percentage improvement, dataset size, or project count.', tags: ['Metrics'] });
  }

  const uniqueBullets = [];
  const seen = new Set();
  bullets.forEach((item) => {
    if (uniqueBullets.length >= 6) return;
    const key = item.text.toLowerCase();
    if (!seen.has(key) && item.text.trim().length > 20) {
      uniqueBullets.push(item);
      seen.add(key);
    }
  });

  if (uniqueBullets.length < 4) {
    uniqueBullets.push({ text: 'Focus on concrete achievements and relevant technologies to strengthen your resume bullets.', tags: ['Metrics'] });
  }

  return uniqueBullets.slice(0, 6);
}

function renderAtsBullets(bullets) {
  bulletListEl.innerHTML = '';
  bullets.forEach((item) => {
    const entry = document.createElement('div');
    entry.className = 'bullet-item';

    const meta = document.createElement('div');
    meta.className = 'bullet-meta';
    item.tags.forEach((tag) => {
      const chip = document.createElement('span');
      chip.className = 'pill-tag';
      chip.textContent = tag;
      meta.appendChild(chip);
    });

    const text = document.createElement('p');
    text.className = 'bullet-text';
    text.textContent = item.text;

    const actions = document.createElement('div');
    actions.className = 'bullet-actions';
    const copyBtn = document.createElement('button');
    copyBtn.className = 'button tertiary copy-bullet-btn';
    copyBtn.type = 'button';
    copyBtn.textContent = 'Copy Bullet';
    copyBtn.addEventListener('click', () => {
      copyTextToClipboard(item.text);
      showCopyFeedback(copyBtn);
    });

    const feedback = document.createElement('span');
    feedback.className = 'copy-feedback';
    feedback.textContent = 'Copied!';
    actions.appendChild(copyBtn);
    actions.appendChild(feedback);

    entry.appendChild(meta);
    entry.appendChild(text);
    entry.appendChild(actions);
    bulletListEl.appendChild(entry);
  });
  copyAllBulletsBtn.disabled = bullets.length === 0;
}

function copyTextToClipboard(value) {
  if (!navigator.clipboard) {
    const temp = document.createElement('textarea');
    temp.value = value;
    temp.style.position = 'fixed';
    temp.style.left = '-9999px';
    document.body.appendChild(temp);
    temp.select();
    document.execCommand('copy');
    document.body.removeChild(temp);
    return;
  }
  navigator.clipboard.writeText(value).catch(() => {});
}

function showCopyFeedback(button) {
  const feedback = button.nextElementSibling;
  if (!feedback) return;
  feedback.classList.add('visible');
  setTimeout(() => feedback.classList.remove('visible'), 1400);
}

function renderResults(report) {
  resultsPanel.classList.remove('hidden');
  matchScoreEl.textContent = `${report.score}%`;
  readinessLevelEl.textContent = report.readiness.level;
  readinessLevelEl.className = `status-badge ${report.readiness.tone}`;
  readinessTextEl.textContent = report.readiness.text;
  skillSummaryEl.textContent = `${report.matchedSkills.length} of ${report.matchedSkills.length + report.missingSkills.length}`;
  keywordSummaryEl.textContent = `${report.keywords.filter((item) => item.resumeCount > 0).length} of ${report.keywords.length}`;

  renderBreakdown(report.breakdown);
  renderQualityChecks(report.qualityChecks);
  renderCategorySummary(report.categoryReport);
  renderKeywordTable(report.keywords);
  renderSuggestions(report.suggestions);
  renderAtsBullets(report.atsBullets || []);
}

function renderBreakdown(breakdown) {
  skillMatchScoreEl.textContent = `${breakdown.skill}%`;
  keywordMatchScoreEl.textContent = `${breakdown.keyword}%`;
  textSimilarityScoreEl.textContent = `${breakdown.text}%`;
  actionMatchScoreEl.textContent = `${breakdown.action}%`;
  skillMatchBar.style.width = `${breakdown.skill}%`;
  keywordMatchBar.style.width = `${breakdown.keyword}%`;
  textSimilarityBar.style.width = `${breakdown.text}%`;
  actionMatchBar.style.width = `${breakdown.action}%`;
}

function renderQualityChecks(checks) {
  qualityListEl.innerHTML = '';
  checks.forEach((check) => {
    const item = document.createElement('li');
    if (!check.passed) item.classList.add('fail');
    item.innerHTML = `<div><strong>${check.label}</strong><span>${check.detail}</span></div>`;
    qualityListEl.appendChild(item);
  });
}

function renderCategorySummary(report) {
  categorySummaryEl.innerHTML = '';
  Object.entries(report).forEach(([category, data]) => {
    if (!data.matched.length && !data.missing.length) {
      return;
    }
    const block = document.createElement('div');
    block.className = 'category-block';
    block.innerHTML = `
      <div class="category-title">
        <span>${category}</span>
        <span>${data.matched.length} matched · ${data.missing.length} missing</span>
      </div>
    `;
    const chips = document.createElement('div');
    chips.className = 'chip-list';

    data.matched.forEach((skill) => {
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.textContent = skill;
      chips.appendChild(chip);
    });
    data.missing.forEach((skill) => {
      const chip = document.createElement('span');
      chip.className = 'chip missing';
      chip.textContent = skill;
      chips.appendChild(chip);
    });
    if (!chips.childNodes.length) {
      const placeholder = document.createElement('span');
      placeholder.className = 'chip';
      placeholder.textContent = 'No skills found in this category';
      chips.appendChild(placeholder);
    }

    block.appendChild(chips);
    categorySummaryEl.appendChild(block);
  });
}

function renderKeywordTable(keywords) {
  keywordTableBody.innerHTML = '';
  keywords.forEach((item) => {
    const row = document.createElement('tr');
    const statusClass = item.status === 'Found' ? 'found' : item.status === 'Low presence' ? 'low' : 'missing';
    row.innerHTML = `
      <td>${item.text}</td>
      <td>${item.jobCount}</td>
      <td>${item.resumeCount}</td>
      <td><span class="keyword-status ${statusClass}">${item.status}</span></td>
    `;
    keywordTableBody.appendChild(row);
  });
}

function renderSuggestions(suggestions) {
  suggestionsListEl.innerHTML = '';
  suggestions.forEach((text) => {
    const item = document.createElement('li');
    item.textContent = text;
    suggestionsListEl.appendChild(item);
  });
}

function showMessage(text, type = 'success') {
  message.textContent = text;
  message.className = `message ${type}`;
  message.classList.remove('hidden');
}

function hideMessage() {
  message.textContent = '';
  message.className = 'message hidden';
}

function disableExport(disabled) {
  exportBtn.disabled = disabled;
}

function downloadReport(report) {
  const lines = [
    'Resume Matcher & Skill Gap Analyzer Report',
    '=========================================','',
    `Match score: ${report.score}%`,
    `Readiness: ${report.readiness.level}`,
    `Summary: ${report.readiness.text}`,
    '',
    'Score breakdown:',
    `- Skill match: ${report.breakdown.skill}%`,
    `- Keyword overlap: ${report.breakdown.keyword}%`,
    `- Text similarity: ${report.breakdown.text}%`,
    `- Action words: ${report.breakdown.action}%`,
    '',
    'Matching skills:',
    ...(report.matchedSkills.length ? report.matchedSkills.map((skill) => `- ${skill}`) : ['- None']),
    '',
    'Missing skills:',
    ...(report.missingSkills.length ? report.missingSkills.map((skill) => `- ${skill}`) : ['- None']),
    '',
    'Resume quality checks:',
    ...report.qualityChecks.map((check) => `- ${check.label}: ${check.passed ? 'Pass' : 'Needs improvement'}`),
    '',
    'Top keywords:',
    ...report.keywords.map((keyword) => `- ${keyword.text}: job ${keyword.jobCount}, resume ${keyword.resumeCount}, ${keyword.status}`),
    '',
    'Suggested improvements:',
    ...report.suggestions.map((suggestion) => `- ${suggestion}`),
    '',
    'ATS Rewrite Assistant Suggestions:',
    ...report.atsBullets.map((bullet) => `- ${bullet.text}`)
  ];

  const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'resume-match-report.txt';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
