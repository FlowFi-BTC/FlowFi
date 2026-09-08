import { BrowserRouter } from 'react-router-dom';
import { AppRouter } from './routes/AppRouter';
import { UserProvider } from './context/UserContext';

export const App = () => {
  return (
    <BrowserRouter>
      <UserProvider>
        <AppRouter />
      </UserProvider>
    </BrowserRouter>
  );
};

export default App;
