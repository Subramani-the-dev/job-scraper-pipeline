import { RegistryEntry } from '../interfaces/registry.interface';

// Version-controlled registry. Add a company here, then run `npm run registry:sync`.
export const REGISTRY: RegistryEntry[] = [
  {
    name: 'Sigmoid',
    category: 'SERVICES_CONSULTING',
    careersUrl: 'https://www.sigmoid.com/careers/',
    sources: [{ kind: 'GREENHOUSE', label: 'greenhouse', config: { boardToken: 'sigmoid' } }],
  },
];
