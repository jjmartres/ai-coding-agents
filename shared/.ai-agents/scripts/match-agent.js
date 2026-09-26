#!/usr/bin/env node

/**
 * match-agent.js
 * Finds the most relevant agent from ~/.ai-agents/agents/ or fallback directories,
 * handling typos, fuzzy matches, aliases, and partial names.
 */

const fs = require('fs');
const path = require('path');

// Common aliases and shortcuts
const ALIASES = {
  k8s: 'kubernetes-specialist',
  kube: 'kubernetes-specialist',
  kubernetes: 'kubernetes-specialist',
  py: 'python-pro',
  python: 'python-pro',
  js: 'javascript-pro',
  javascript: 'javascript-pro',
  ts: 'typescript-pro',
  typescript: 'typescript-pro',
  tf: 'terraform-engineer',
  terraform: 'terraform-engineer',
  sec: 'security-engineer',
  security: 'security-engineer',
  doc: 'documentation-engineer',
  docs: 'documentation-engineer',
  documentation: 'documentation-engineer',
  db: 'database-administrator',
  dba: 'database-administrator',
  database: 'database-administrator',
  sre: 'sre-engineer',
  qa: 'qa-expert',
  test: 'test-automator',
  testing: 'test-automator',
  ux: 'ux-researcher',
  ui: 'ux-researcher',
  ml: 'ml-engineer',
  ai: 'ai-engineer',
  devops: 'devops-engineer',
  backend: 'backend-developer',
  frontend: 'react-specialist',
  fullstack: 'fullstack-developer',
  docker: 'devops-engineer',
  container: 'devops-engineer',
  git: 'git-workflow-manager',
  review: 'code-reviewer',
  reviewer: 'code-reviewer',
  diagram: 'mermaid-diagram-specialist',
  mermaid: 'mermaid-diagram-specialist',
  architect: 'microservices-architect',
  incident: 'incident-responder',
  perf: 'performance-engineer',
  performance: 'performance-engineer',
};

// Calculate Levenshtein distance
function levenshtein(a, b) {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;
  const matrix = Array.from({ length: bn + 1 }, (_, i) => [i]);
  for (let j = 0; j <= an; j++) matrix[0][j] = j;

  for (let i = 1; i <= bn; i++) {
    for (let j = 1; j <= an; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[bn][an];
}

// Find all agent markdown files recursively
function findAgentFiles(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    try {
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        results = results.concat(findAgentFiles(fullPath));
      } else if (file.endsWith('.md')) {
        results.push(fullPath);
      }
    } catch {
      // Ignore unreadable or broken symlinks
    }
  }
  return results;
}

// Parse YAML frontmatter
function parseAgentFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  const baseName = path.basename(filePath, '.md');

  if (!match) {
    return {
      id: baseName,
      name: baseName,
      description: '',
      body: content.trim(),
      path: filePath,
    };
  }

  const frontmatter = match[1];
  const body = match[2].trim();

  let name = baseName;
  let description = '';

  const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
  if (nameMatch) name = nameMatch[1].trim().replace(/^["']|["']$/g, '');

  const descMatch = frontmatter.match(/^description:\s*([^\n\r]+)/m);
  if (descMatch) description = descMatch[1].trim().replace(/^["']|["']$/g, '');

  return {
    id: baseName,
    name,
    description,
    body,
    path: filePath,
  };
}

// Discover all agents from candidate locations
function loadAgents() {
  const home = process.env.HOME || '';
  const searchDirs = [
    path.join(home, '.config', 'opencode', 'agents'),
    path.join(home, '.ai-agents', 'agents'),
    path.join(__dirname, '..', 'agents'),
    path.join(__dirname, '..', 'shared', '.ai-agents', 'agents'),
    path.join(process.cwd(), 'shared', '.ai-agents', 'agents'),
  ];

  let files = [];
  for (const dir of searchDirs) {
    files = findAgentFiles(dir);
    if (files.length > 0) break;
  }

  const agents = new Map();
  for (const file of files) {
    const agent = parseAgentFile(file);
    if (!agents.has(agent.id)) {
      agents.set(agent.id, agent);
    }
  }
  return Array.from(agents.values());
}

// Score candidate match
function scoreMatch(query, agent) {
  const q = query.toLowerCase().replace(/^@/, '').trim();
  const name = agent.id.toLowerCase();
  const cleanName = name.replace(/[-_]/g, ' ');
  const cleanQ = q.replace(/[-_]/g, ' ');

  // 1. Direct alias match
  if (ALIASES[q] === agent.id) {
    return 1000;
  }

  // 2. Exact match
  if (name === q || cleanName === cleanQ) {
    return 950;
  }

  // 3. Name starts with query
  if (name.startsWith(q) || cleanName.startsWith(cleanQ)) {
    return 800 + (q.length / name.length) * 100;
  }

  // 4. Name contains query
  if (name.includes(q) || cleanName.includes(cleanQ)) {
    return 700 + (q.length / name.length) * 100;
  }

  // 5. Query contains name
  if (q.includes(name) || cleanQ.includes(cleanName)) {
    return 650;
  }

  // 6. Typo tolerance: Levenshtein distance on full name
  const maxLen = Math.max(q.length, name.length);
  const dist = levenshtein(q, name);
  const similarity = 1 - dist / maxLen;

  if (similarity >= 0.7) {
    return 600 * similarity;
  }

  // 7. Typo tolerance on word segments (e.g. "depovs" vs "devops")
  const qWords = cleanQ.split(/\s+/);
  const nameWords = cleanName.split(/\s+/);
  let wordScore = 0;

  for (const qw of qWords) {
    for (const nw of nameWords) {
      if (qw === nw) {
        wordScore += 250;
      } else {
        const wDist = levenshtein(qw, nw);
        const wMax = Math.max(qw.length, nw.length);
        const wSim = 1 - wDist / wMax;
        if (wSim >= 0.65) {
          wordScore += 200 * wSim;
        }
      }
    }
  }
  if (wordScore > 0) {
    return wordScore;
  }

  // 8. Keyword in description
  if (agent.description && agent.description.toLowerCase().includes(q)) {
    return 200;
  }

  return 0;
}

function matchAgent(query) {
  const agents = loadAgents();
  if (agents.length === 0) {
    return null;
  }

  if (!query || query.trim() === '') {
    return {
      agent: null,
      candidates: agents.map((a) => a.id).sort(),
    };
  }

  const scored = agents
    .map((agent) => ({
      agent,
      score: scoreMatch(query, agent),
    }))
    .sort((a, b) => b.score - a.score);

  const best = scored[0];
  const topCandidates = scored.slice(0, 5).filter((s) => s.score > 0);

  return {
    best: best.score > 100 ? best.agent : null,
    score: best.score,
    candidates: topCandidates.map((s) => ({ id: s.agent.id, score: Math.round(s.score) })),
  };
}

function main() {
  const query = process.argv[2] || '';
  const result = matchAgent(query);

  if (!result || (!result.best && (!result.candidates || result.candidates.length === 0))) {
    console.log(`[Call-Agent Error] No agent found matching '${query}'.`);
    console.log('Available agents: run `/agents` to browse the full list.');
    process.exit(0);
  }

  if (!result.best) {
    console.log(`[Call-Agent] Could not find an exact match for '${query}'.`);
    if (result.candidates && result.candidates.length > 0) {
      console.log(`Did you mean one of these?`);
      for (const c of result.candidates) {
        console.log(`  - ${c.id}`);
      }
      const fallback = result.candidates[0].id;
      const agents = loadAgents();
      const agent = agents.find((a) => a.id === fallback);
      if (agent) {
        console.log(`\nDefaulting to '${agent.id}':\n`);
        outputAgentActivation(agent);
      }
    }
    process.exit(0);
  }

  outputAgentActivation(result.best);
}

function outputAgentActivation(agent) {
  console.log(`[AGENT ACTIVATED: ${agent.id}]`);
  if (agent.description) {
    console.log(`Role: ${agent.description}`);
  }
  console.log('\n--- SYSTEM DIRECTIVE ---');
  console.log(`You are now acting as the '${agent.id}' agent.`);
  console.log('Embody this persona, apply all relevant domain standards, workflows, and checklists below to fulfill the user task.\n');
  console.log(agent.body);
  console.log('\n--- END SYSTEM DIRECTIVE ---\n');
}

if (require.main === module) {
  main();
}

module.exports = { matchAgent, loadAgents, scoreMatch };
