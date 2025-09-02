import { beforeAll, vi } from 'vitest'

// Global test setup
beforeAll(() => {
  // Setup test environment
  console.log('Setting up test environment')
})

// Mock Next.js router if needed for component tests
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
}

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/test',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: (props: any) => props,
}))
