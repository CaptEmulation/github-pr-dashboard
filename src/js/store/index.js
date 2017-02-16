import { createStore, combineReducers, compose, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';

import { configReducer, loadingReducer, pullRequestsReducer, failedReposReducer, errorReducer } from '../reducers';

export default function configureStore() {
  const reducer = combineReducers({
    config: configReducer,
    pullRequests: pullRequestsReducer,
    failedRepos: failedReposReducer,
    loading: loadingReducer,
    error: errorReducer
  });

  return createStore(reducer, {}, compose(
    applyMiddleware(thunk),
    window.devToolsExtension ? window.devToolsExtension() : f => f
  ));
}
