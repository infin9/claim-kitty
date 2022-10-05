/**
 * Asynchronously loads the component for AppPage
 */

import { lazyLoad } from 'utils/loadable';

export const AppPage = lazyLoad(
  () => import('./index'),
  module => module.AppPage,
);
