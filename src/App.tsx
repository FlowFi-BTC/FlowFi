import { BrowserRouter } from 'react-router-dom';
import { AppRouter } from './routes/AppRouter';

export const App = () => {
  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  );
};

export default App;
