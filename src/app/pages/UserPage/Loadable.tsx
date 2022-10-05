/**
 * Asynchronously loads the component for UserPage
 */

import { lazyLoad } from 'utils/loadable';

export const UserPage = lazyLoad(
  () => import('./index'),
  module => module.UserPage,
);
