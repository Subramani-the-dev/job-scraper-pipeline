import { CompanyCategory, Prisma, SourceKind } from '@prisma/client';

export interface RegistrySource {
  kind: SourceKind;
  label: string;
  config: Prisma.InputJsonObject;
  note?: string;
}

export interface RegistryEntry {
  name: string;
  category: CompanyCategory;
  careersUrl?: string;
  sources: RegistrySource[];
}
