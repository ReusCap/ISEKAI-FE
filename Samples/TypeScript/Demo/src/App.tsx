import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Router } from '@/pages/Router';

function App() {
  return (
    <>
      <GlobalStyles />
      <QueryClientProvider client={queryClient}>
        <Router />
      </QueryClientProvider>
    </>
  );
}

export default App;