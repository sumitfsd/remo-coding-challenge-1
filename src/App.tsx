import React, { Suspense } from 'react';
import { FirebaseAppProvider } from 'reactfire';
import './App.scss';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import reducers from './reducers';
import { routes } from './routes';
import { firebaseConfig } from './services/firebase';

const store = createStore(reducers, {});

const App = () => {
  return (
    <FirebaseAppProvider firebaseConfig={firebaseConfig}>
      <Provider store={store}>
        <Suspense fallback={null}>
          {routes()}
        </Suspense>
      </Provider>
    </FirebaseAppProvider>
  );
};

export default App;
