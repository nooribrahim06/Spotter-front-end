import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";

/**
 * Creates a fresh QueryClient for each test to prevent state leakage.
 */
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * Custom render function that wraps components with all required providers.
 *
 * @param {React.ReactElement} ui - Component to render
 * @param {object} options
 * @param {string[]} options.initialEntries - Initial router entries for MemoryRouter
 * @param {QueryClient} options.queryClient - Custom query client (default: fresh test client)
 * @param {object} rest - Additional options passed to @testing-library/react's render
 */
export function renderWithProviders(
  ui,
  {
    initialEntries = ["/"],
    queryClient = createTestQueryClient(),
    ...rest
  } = {}
) {
  function Wrapper({ children }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={initialEntries}>
          {children}
          <Toaster />
        </MemoryRouter>
      </QueryClientProvider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...rest }),
    queryClient,
  };
}

export { createTestQueryClient };
