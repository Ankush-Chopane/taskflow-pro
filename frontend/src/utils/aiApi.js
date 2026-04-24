import api from './api';

export const aiAPI = {
  chat:        (message, history) => api.post('/ai/chat',        { message, history }),
  breakdown:   (taskTitle, taskDesc) => api.post('/ai/breakdown',{ taskTitle, taskDesc }),
  dailyPlan:   ()                  => api.post('/ai/daily-plan', {}),
  prioritize:  ()                  => api.post('/ai/prioritize', {}),
  smartCreate: (prompt)            => api.post('/ai/smart-create',{ prompt }),
  insights:    ()                  => api.get('/ai/insights'),
};
