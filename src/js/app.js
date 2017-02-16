import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import qs from 'query-string';

import Main from './components/Main';
import { loadConfigFromUrl, oadPullRequests } from './actions';
import configureStore from './store';

import '../css/main.scss';

config.repos = config.repos.sort();

const store = configureStore();

store.dispatch(loadConfigFromUrl(qs.parse(location.search).config))
  .then(() => store.dispatch(loadPullRequests(undefined)));

ReactDOM.render(
  <Provider store={store}>
    <Main />
  </Provider>,
  document.getElementById('app')
);
