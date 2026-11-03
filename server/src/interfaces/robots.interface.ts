export interface RobotsResponse {
  status: number;
  body: string;
}

export type RobotsFetcher = (origin: string) => Promise<RobotsResponse>;

export interface RobotsRule {
  allow: boolean;
  path: string;
}

export interface RobotsGroup {
  agents: string[];
  rules: RobotsRule[];
}
