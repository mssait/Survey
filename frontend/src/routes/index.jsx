import SurveysListPage from '../pages/SurveysListPage';
import SurveyBuilderPage from '../pages/SurveyBuilderPage';
import TakeSurveyPage from '../pages/TakeSurveyPage';
import ResultsPage from '../pages/ResultsPage';

// Routes rendered inside the sidebar Layout (authenticated shell)
export const appRoutes = [
  { path: '/', element: <SurveysListPage /> },
  { path: '/surveys/new', element: <SurveyBuilderPage /> },
  { path: '/surveys/:id/edit', element: <SurveyBuilderPage /> },
  { path: '/surveys/:id/results', element: <ResultsPage /> },
];

// Routes rendered without the sidebar (public-facing)
export const publicRoutes = [
  { path: '/surveys/:id/take', element: <TakeSurveyPage /> },
];
