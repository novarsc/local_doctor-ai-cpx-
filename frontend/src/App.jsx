/**
 * @file App.jsx
 * @description The root component of the application.
 * It sets up the main router.
 */

import React from 'react';
import AppRouter from './router';

function App() {
  return (
    <div className="App">
      <AppRouter />
    </div>
  );
}

export default App;
