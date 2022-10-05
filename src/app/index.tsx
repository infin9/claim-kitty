/**
 *
 * App
 *
 * This component is the skeleton around the actual pages, and should only
 * contain code that should be seen on all pages. (e.g. navigation bar)
 */

import * as React from 'react';
import { Helmet } from 'react-helmet-async';
import { Switch, Route, BrowserRouter } from 'react-router-dom';

import { GlobalStyle } from 'styles/global-styles';

import { NotFoundPage } from './components/NotFoundPage/Loadable';
import { useTranslation } from 'react-i18next';
import { AppPage } from './pages/AppPage/Loadable';
import { UserPage } from './pages/UserPage/Loadable';

export function App() {
  const { i18n } = useTranslation();
  return (
    <BrowserRouter>
      <Helmet
        titleTemplate="ClaimKitty"
        defaultTitle="ClaimKitty"
        htmlAttributes={{ lang: i18n.language }}
      >
      </Helmet>

      <Switch>
        <Route exact path="/app" component={AppPage} />
        <Route exact path="/user" component={UserPage} />
        <Route component={NotFoundPage} />
      </Switch>
      <GlobalStyle />
    </BrowserRouter>
  );
}
