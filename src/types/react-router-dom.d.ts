declare module 'react-router-dom' {
  import { ComponentType } from 'react';
  import { RouteObject } from 'react-router';

  export interface NavigateProps {
    to: string;
    replace?: boolean;
  }

  export interface LinkProps {
    to: string;
    children: React.ReactNode;
    style?: React.CSSProperties;
  }

  export interface Location {
    pathname: string;
    search: string;
    hash: string;
    state: unknown;
    key: string;
  }

  export const Link: ComponentType<LinkProps>;
  export const Navigate: ComponentType<NavigateProps>;
  export const Routes: ComponentType<{ children: React.ReactNode }>;
  export const Route: ComponentType<RouteObject>;
  export const BrowserRouter: ComponentType<{ children: React.ReactNode }>;
  export const useNavigate: () => (to: string, options?: { replace?: boolean }) => void;
  export const useLocation: () => Location;
} 