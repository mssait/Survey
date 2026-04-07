import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { appRoutes, publicRoutes } from './routes/index.jsx';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes — no sidebar */}
        {publicRoutes.map(({ path, element }) => (
          <Route key={path} path={path} element={element} />
        ))}

        {/* App routes — inside sidebar Layout */}
        <Route
          path="/*"
          element={
            <Layout>
              <Routes>
                {appRoutes.map(({ path, element }) => (
                  <Route key={path} path={path} element={element} />
                ))}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
