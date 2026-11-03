import { Prisma, SourceKind } from '@prisma/client';
import Joi from 'joi';

const str = Joi.string().required();
const url = Joi.string().uri().required();

const SCHEMAS: Record<SourceKind, Joi.ObjectSchema> = {
  WORKDAY: Joi.object({ host: str, tenant: str, site: str }),
  GREENHOUSE: Joi.object({ boardToken: str }),
  LEVER: Joi.object({ company: str }),
  ASHBY: Joi.object({ boardName: str }),
  ORACLE_HCM: Joi.object({ host: str, siteNumber: str }),
  SUCCESSFACTORS: Joi.object({ baseUrl: url, theme: Joi.string().valid('classic', 'unify').required() }),
  RIPPLEHIRE: Joi.object({ careersUrl: url }),
  SMARTRECRUITERS: Joi.object({ companyId: str }),
  EIGHTFOLD: Joi.object({ host: str, domain: str }),
  ZOHO_RECRUIT: Joi.object({ portalUrl: url }),
  KULA: Joi.object({ host: str, company: str }),
  CUSTOM_JSON: Joi.object({ url, parser: str }),
  CUSTOM_HTML: Joi.object({ url, parser: str }),
  CUSTOM_PLAYWRIGHT: Joi.object({ url, parser: str }),
};

export const validateSourceConfig = (
  kind: SourceKind,
  config: Prisma.InputJsonObject,
): Prisma.InputJsonObject => {
  const { error, value } = SCHEMAS[kind].validate(config, { abortEarly: false });
  if (error) {
    throw new Error(`Invalid ${kind} config: ${error.details.map((d) => d.message).join('; ')}`);
  }
  return value;
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
