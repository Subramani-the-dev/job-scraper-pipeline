export interface NewFilterConfig {
  keywords: string[];
  cities: string[];
  minExperienceYears?: number | null;
  includeUnknownExperience?: boolean;
}
