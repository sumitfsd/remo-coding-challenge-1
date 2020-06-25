import React, { ReactElement } from 'react';
import { Route, Redirect } from 'react-router-dom';
import { getToken } from '../services/tokenManager';

const PrivateRoute = ({ children, ...rest }: { children: ReactElement, path: string }) => (
  <Route
    {...rest}
    render={({ location }) => getToken() 
      ? (children) 
      : (
        <Redirect
          to={{
            pathname: '/',
            state: { from: location }
          }}
        />
      )
    }
  />
);

export default PrivateRoute;