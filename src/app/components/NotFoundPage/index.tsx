import * as React from 'react';
import { Helmet } from 'react-helmet-async';
import { ErrorComponent } from '../ErrorComponent/ErrorComponent';

export function NotFoundPage() {
  return (
    <>
      <Helmet>
        <title>404 Page Not Found</title>
        <meta name="description" content="Page not found" />
      </Helmet>
      <ErrorComponent
        title={
          <>
            4
            <span role="img" aria-label="Crying Face">
              😢
            </span>
            4
          </>
        }
        message={'Page not found.'}
      />
    </>
  );
}
