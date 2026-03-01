import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ShareView from './components/ShareView';
import { getSharedProject } from './share';
import './App.css';
import './print.css';

const shared = getSharedProject();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {shared ? <ShareView project={shared} /> : <App />}
  </React.StrictMode>
);
