import React, { createContext, useContext, useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

const OrientationContext = createContext({ orientation: 'portrait', isLandscape: false });

export const OrientationProvider = ({ children }) => {
  const { width, height } = useWindowDimensions();
  const orientation = useMemo(() => (width > height ? 'landscape' : 'portrait'), [width, height]);
  const isLandscape = orientation === 'landscape';

  return (
    <OrientationContext.Provider value={{ orientation, isLandscape, width, height }}>
      {children}
    </OrientationContext.Provider>
  );
};

export const useOrientation = () => useContext(OrientationContext);
