import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Auth from '../containers/Auth';
import Theater from '../containers/Theater';
import Room from '../containers/Room';
import PrivateRoute from './privateRoute';

export const routes = () => (
  <Router >
    <Switch>
      <Route exact={true} path='/' component={Auth} />
      <PrivateRoute path='/theater'>
        <Theater />
      </PrivateRoute>
      <Route exact={true} path='/rooms' component={Room} />
    </Switch>
  </Router >
);