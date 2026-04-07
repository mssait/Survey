import React, { createContext, useContext, useState, useCallback } from 'react';
import { getSurveys } from '../services/api';

const SurveyContext = createContext(null);

export function SurveyProvider({ children }) {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getSurveys();
      setSurveys(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  const counts = {
    total: surveys.length,
    published: surveys.filter((s) => s.is_published).length,
    drafts: surveys.filter((s) => !s.is_published).length,
    totalResponses: surveys.reduce((sum, s) => sum + Number(s.response_count || 0), 0),
  };

  return (
    <SurveyContext.Provider value={{ surveys, setSurveys, loading, setLoading, refresh, counts }}>
      {children}
    </SurveyContext.Provider>
  );
}

export function useSurveys() {
  return useContext(SurveyContext);
}
