import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import '@saws/styles/saws.css';
import './index.css';

// NOTE: No AuthProvider at the top level — auth is optional in this app.
// The public submission form at "/" is fully accessible without login.
// AuthContext is managed inside components that need it (admin routes only).

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
