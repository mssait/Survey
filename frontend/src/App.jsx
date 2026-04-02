import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SurveysListPage from './pages/SurveysListPage';
import SurveyBuilderPage from './pages/SurveyBuilderPage';
import TakeSurveyPage from './pages/TakeSurveyPage';
import ResultsPage from './pages/ResultsPage';
import Navbar from './components/Navbar';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-8 max-w-6xl">
          <Routes>
            <Route path="/" element={<SurveysListPage />} />
            <Route path="/surveys/new" element={<SurveyBuilderPage />} />
            <Route path="/surveys/:id/edit" element={<SurveyBuilderPage />} />
            <Route path="/surveys/:id/take" element={<TakeSurveyPage />} />
            <Route path="/surveys/:id/results" element={<ResultsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
