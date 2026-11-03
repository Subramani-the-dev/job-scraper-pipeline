import { Prisma, SourceKind } from '@prisma/client';
import { z } from 'zod';
import { formatZodIssues } from '../utils/functions.utils';

const str = z.string().min(1);
const url = z.url();

// strictObject: unknown keys are rejected, matching the previous Joi default.
const SCHEMAS: Record<SourceKind, z.ZodType<Record<string, string>>> = {
  WORKDAY: z.strictObject({ host: str, tenant: str, site: str }),
  GREENHOUSE: z.strictObject({ boardToken: str }),
  LEVER: z.strictObject({ company: str }),
  ASHBY: z.strictObject({ boardName: str }),
  ORACLE_HCM: z.strictObject({ host: str, siteNumber: str }),
  SUCCESSFACTORS: z.strictObject({ baseUrl: url, theme: z.enum(['classic', 'unify']) }),
  RIPPLEHIRE: z.strictObject({ careersUrl: url }),
  SMARTRECRUITERS: z.strictObject({ companyId: str }),
  EIGHTFOLD: z.strictObject({ host: str, domain: str }),
  ZOHO_RECRUIT: z.strictObject({ portalUrl: url }),
  KULA: z.strictObject({ host: str, company: str }),
  CUSTOM_JSON: z.strictObject({ url, parser: str }),
  CUSTOM_HTML: z.strictObject({ url, parser: str }),
  CUSTOM_PLAYWRIGHT: z.strictObject({ url, parser: str }),
};

export const validateSourceConfig = (
  kind: SourceKind,
  config: Prisma.InputJsonObject,
): Prisma.InputJsonObject => {
  const result = SCHEMAS[kind].safeParse(config);
  if (!result.success) {
    throw new Error(`Invalid ${kind} config: ${formatZodIssues(result.error)}`);
  }
  return result.data;
};

// URLs a Source's adapter will request; robots.txt is checked against each.
export const routeUrls = (kind: SourceKind, config: Prisma.InputJsonObject): string[] => {
  const text = (key: string): string => String(config[key]);
  switch (kind) {
    case 'WORKDAY':
      return [`https://${text('host')}/wday/cxs/${text('tenant')}/${text('site')}/jobs`];
    case 'GREENHOUSE':
      return [`https://boards-api.greenhouse.io/v1/boards/${text('boardToken')}/jobs`];
    case 'LEVER':
      return [`https://api.lever.co/v0/postings/${text('company')}`];
    case 'ASHBY':
      return [`https://api.ashbyhq.com/posting-api/job-board/${text('boardName')}`];
    case 'ORACLE_HCM':
      return [`https://${text('host')}/hcmRestApi/resources/latest/recruitingCEJobRequisitions`];
    case 'SMARTRECRUITERS':
      return [`https://api.smartrecruiters.com/v1/companies/${text('companyId')}/postings`];
    case 'SUCCESSFACTORS':
      return [text('baseUrl')];
    case 'RIPPLEHIRE':
      return [text('careersUrl')];
    case 'EIGHTFOLD':
      return [`https://${text('host')}/api/pcsx/search`];
    case 'ZOHO_RECRUIT':
      return [text('portalUrl')];
    case 'KULA':
      return [`https://${text('host')}/${text('company')}`];
    case 'CUSTOM_JSON':
    case 'CUSTOM_HTML':
    case 'CUSTOM_PLAYWRIGHT':
      return [text('url')];
  }
};
