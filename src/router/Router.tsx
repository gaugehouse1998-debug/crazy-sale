import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';

interface RouterContextType {
  currentPath: string;
  queryParams: URLSearchParams;
  navigate: (path: string) => void;
}

const RouterContext = createContext<RouterContextType>({
  currentPath: '/',
  queryParams: new URLSearchParams(),
  navigate: () => {},
});

export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const getHashInfo = () => {
    let hash = window.location.hash.slice(1); // remove '#'
    if (!hash || hash === '') hash = '/';
    
    // Split path and query if any
    const [pathPart, queryPart] = hash.split('?');
    const cleanPath = pathPart.startsWith('/') ? pathPart : `/${pathPart}`;
    const query = new URLSearchParams(queryPart || '');
    return { path: cleanPath, query };
  };

  const [routeInfo, setRouteInfo] = useState(getHashInfo);

  useEffect(() => {
    const handleHashChange = () => {
      setRouteInfo(getHashInfo());
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (to: string) => {
    const targetHash = to.startsWith('/') ? `#${to}` : `#/${to}`;
    if (window.location.hash === targetHash) {
      // Force reload of same hash if triggered
      setRouteInfo(getHashInfo());
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.location.hash = targetHash;
    }
  };

  return (
    <RouterContext.Provider
      value={{
        currentPath: routeInfo.path,
        queryParams: routeInfo.query,
        navigate,
      }}
    >
      {children}
    </RouterContext.Provider>
  );
};

export const useRouter = () => useContext(RouterContext);

export interface RouteMatchResult {
  isMatch: boolean;
  params: Record<string, string>;
}

// Utility to match a pattern like "/category/:slug" against "/category/dinner-sets"
export function matchPath(pattern: string, path: string): RouteMatchResult {
  const patternSegments = pattern.split('/').filter(Boolean);
  const pathSegments = path.split('/').filter(Boolean);

  if (patternSegments.length !== pathSegments.length) {
    return { isMatch: false, params: {} };
  }

  const params: Record<string, string> = {};

  for (let i = 0; i < patternSegments.length; i++) {
    const patternPart = patternSegments[i];
    const pathPart = pathSegments[i];

    if (patternPart.startsWith(':')) {
      const paramName = patternPart.slice(1);
      params[paramName] = decodeURIComponent(pathPart);
    } else if (patternPart.toLowerCase() !== pathPart.toLowerCase()) {
      return { isMatch: false, params: {} };
    }
  }

  return { isMatch: true, params };
}
