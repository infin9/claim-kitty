/**
 * Asynchronously loads the component for OwnerPage
 */

import { lazyLoad } from 'utils/loadable';

export const OwnerPage = lazyLoad(
  () => import('./index'),
  module => module.OwnerPage,
);
