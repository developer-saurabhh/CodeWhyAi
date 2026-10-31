export type AppRoute =
  | 'dashboard'
  | 'repository'
  | 'ask'
  | 'graph'
  | 'history'
  | 'settings';

export interface NavItemConfig {
  id: AppRoute;
  label: string;
  path: string;
  iconName: string;
  badge?: string;
  description: string;
}
