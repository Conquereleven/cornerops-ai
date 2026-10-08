import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { NotFound } from './routes/NotFound';
import { PublicLanding } from './routes/PublicLanding';

// The informational site only. No sign-in, no workspace routes and no API
// calls: /login and /app/* do not exist in this build and answer 404.
export default function PublicApp() {
  return <BrowserRouter><Routes>
    <Route path="/" element={<PublicLanding/>}/>
    <Route path="*" element={<NotFound/>}/>
  </Routes></BrowserRouter>;
}
