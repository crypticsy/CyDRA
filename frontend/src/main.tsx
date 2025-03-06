import React from 'react';
import ReactDOM from 'react-dom/client';
import { createHashRouter, RouterProvider } from 'react-router-dom';

import { PrimeReactProvider } from 'primereact/api';
import Tailwind from 'primereact/passthrough/tailwind';

import { Home, Project } from './pages';

import './index.css';

// Configure and create a router with specific routes
const routes = [
  { path: "/", element: <Home /> },
  { path: "/project", element: <Project /> }
];

const router = createHashRouter(
  routes.map(route => ({
    ...route,
    element: (
      <PrimeReactProvider value={{ unstyled: true, pt: Tailwind }}>
        {route.element}
      </PrimeReactProvider>
    )
  }))
);

// Set the default theme
localStorage.setItem('theme', 'light');

// Render the application
const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement as HTMLElement);
root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

