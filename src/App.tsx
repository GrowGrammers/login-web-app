import { BrowserRouter as Router } from 'react-router-dom';
import AppContent from './components/layout/AppContent';
import './App.css';

// Router로 감싸는 최상위 App 컴포넌트
function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;