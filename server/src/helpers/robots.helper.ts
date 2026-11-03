import { RobotsGroup, RobotsResponse, RobotsRule } from '../interfaces/robots.interface';

const parseGroups = (body: string): RobotsGroup[] => {
  const groups: RobotsGroup[] = [];
  let current: RobotsGroup | null = null;
  let lastWasAgent = false;
  for (const raw of body.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, '').trim();
    const idx = line.indexOf(':');
    if (idx < 0) continue;
    const field = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();
    if (field === 'user-agent') {
      if (!current || !lastWasAgent) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
    } else if (current && (field === 'allow' || field === 'disallow')) {
      if (value) current.rules.push({ allow: field === 'allow', path: value });
      lastWasAgent = false;
    } else {
      lastWasAgent = false;
    }
  }
  return groups;
};

const matches = (pattern: string, path: string): boolean => {
  const anchored = pattern.endsWith('$');
  const body = anchored ? pattern.slice(0, -1) : pattern;
  const source = body.split('*').map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*');
  return new RegExp(`^${source}${anchored ? '$' : ''}`).test(path);
};

export const isPathAllowed = (robots: RobotsResponse, userAgent: string, path: string): boolean => {
  if (robots.status >= 300 && robots.status < 400) throw new Error(`robots.txt redirects (HTTP ${robots.status})`);
  if (robots.status >= 500) throw new Error(`robots.txt unavailable (HTTP ${robots.status})`);
  if (robots.status >= 400 || robots.status < 200) return true;

  const token = userAgent.split('/')[0]?.toLowerCase() ?? '';
  const groups = parseGroups(robots.body);
  const named = groups.filter((g) => g.agents.includes(token));
  const applicable = named.length > 0 ? named : groups.filter((g) => g.agents.includes('*'));
  if (applicable.length === 0) return true;

  let best: RobotsRule | null = null;
  for (const rule of applicable.flatMap((g) => g.rules)) {
    if (!matches(rule.path, path)) continue;
    if (!best || rule.path.length > best.path.length || (rule.path.length === best.path.length && rule.allow)) {
      best = rule;
    }
  }
  return best ? best.allow : true;
};
