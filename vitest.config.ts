import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Test file patterns - include both unit and integration
    include: ['tests/**/*.test.ts'],
    
    // Coverage configuration
    coverage: {
      // Use V8 coverage provider for better TypeScript support
      provider: 'v8',
      
      // Only include src directory in coverage reports
      include: ['src/**/*.ts'],
      
      // Exclude patterns from coverage
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        // Exclude integration test directory entirely
        'tests/integration/**/*',
        // Common exclusions
        'node_modules/**',
        'dist/**',
        'integration-tests/**',
        '**/*.config.ts',
        '**/*.config.js',
      ],
      
      // Coverage thresholds (optional - adjust as needed)
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      },
      
      // Coverage reporters
      reporter: ['text', 'html', 'json'],
      
      // Output directory for coverage reports
      reportsDirectory: './coverage',
      
      // Clean coverage directory before running
      clean: true
    }
  }
});