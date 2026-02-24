import React from 'react';

interface Props {
  children: React.ReactNode;
}

export const ErrorBoundary: React.FC<Props> = ({ children }) => {
  return <>{children}</>;
};
