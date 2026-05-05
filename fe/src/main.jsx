
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ServiceProvider } from './context/ServiceContext';
import { ThemeProvider } from './context/ThemeContext';

createRoot(document.getElementById('root')).render(

  <ThemeProvider>
    <ServiceProvider>
      <App />
    </ServiceProvider>
  </ThemeProvider>
  ,
)