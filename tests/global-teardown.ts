import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting YouThumbAI QA Teardown...');
  
  try {
    // Cleanup test artifacts
    console.log('🗑️ Cleaning up test artifacts...');
    
    // Remove temporary files if any
    // Add any cleanup logic here
    
    console.log('✅ QA Teardown completed successfully!');
    
  } catch (error) {
    console.error('❌ QA Teardown failed:', error);
    // Don't throw to avoid masking test failures
  }
}

export default globalTeardown; 