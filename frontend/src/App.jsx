import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import BookingPage from './pages/BookingPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="reservar" element={<BookingPage />} />
          <Route path="login" element={<div className="container mx-auto p-8">Próximamente: Login de barberos</div>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;