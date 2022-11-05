import React from 'react';
import { ErrorComponent } from '../ErrorComponent/ErrorComponent';

type AppWrapperProps = {
  address: string | undefined;
  isSupportedNetwork: boolean;
  children: React.ReactNode;
};
export function AppWrapper({
  address,
  isSupportedNetwork,
  children,
}: AppWrapperProps) {
  return (
    <>
      {address === undefined && (
        <ErrorComponent
          title={'Connect your wallet'}
          message="Wallet not connected"
        />
      )}
      {isSupportedNetwork === false && (
        <ErrorComponent
          title={'Unsupported Network'}
          message="Switch to a supported network"
        />
      )}
      {address !== undefined && isSupportedNetwork && children}
    </>
  );
}
