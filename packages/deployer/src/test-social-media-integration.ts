// Test script for social media parameter integration and source code export
import { ParameterEditorService } from './services/parameter-editor.service';
import { SourceExportService } from './services/source-export.service';

async function testSocialMediaIntegration() {
  console.log('🧪 Testing social media parameter integration...');
  
  try {
    // Check if we have the required environment variables
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      console.log('⚠️  Missing Supabase environment variables. Running offline tests only...');
      
      // Test 5: Test category calculation (offline test)
      console.log('\n📋 Test 5: Testing category calculation (offline)...');
      const testParametersArray = [
        { parameter_key: 'TOKEN_NAME', current_value: 'TestToken' },
        { parameter_key: 'TOKEN_SYMBOL', current_value: 'TEST' },
        { parameter_key: 'TOTAL_SUPPLY', current_value: '1000000000' },
        { parameter_key: 'DECIMALS', current_value: '9' },
        { parameter_key: 'TWITTER_LINK', current_value: 'https://x.com/testtoken' },
        { parameter_key: 'WEBSITE_LINK', current_value: 'https://testtoken.com' },
        { parameter_key: 'TELEGRAM_LINK', current_value: 'https://t.me/testtoken' }
      ];
      
      // Import the deployment handler to test category calculation
      const { DeploymentHandler } = require('./bot/handlers/deployment.handler');
      const categories = DeploymentHandler.calculateCategoryStatus(testParametersArray);
      
      console.log('Category completion status:');
      console.log(`  - Basic: ${categories.basic.completed ? '✅' : '⏳'} (${categories.basic.count}/${categories.basic.total})`);
      console.log(`  - Taxes: ${categories.taxes.completed ? '✅' : '⏳'} (${categories.taxes.count}/${categories.taxes.total})`);
      console.log(`  - Trading: ${categories.trading.completed ? '✅' : '⏳'} (${categories.trading.count}/${categories.trading.total})`);
      console.log(`  - Limits: ${categories.limits.completed ? '✅' : '⏳'} (${categories.limits.count}/${categories.limits.total})`);
      console.log(`  - Social: ${categories.social.completed ? '✅' : '⏳'} (${categories.social.count}/${categories.social.total})`);
      console.log(`  - Advanced: ${categories.advanced.completed ? '✅' : '⏳'} (${categories.advanced.count}/${categories.advanced.total})`);
      
      console.log('\n✅ Offline tests completed successfully!');
      return;
    }
    
    const parameterEditor = new ParameterEditorService();
    const exportService = new SourceExportService();
    
    // Test 1: Load parameter definitions to verify social media parameters exist
    console.log('\n📋 Test 1: Loading parameter definitions...');
    const definitionsResult = await parameterEditor.loadParameterDefinitions();
    
    if (definitionsResult.success && definitionsResult.data) {
      const socialParams = definitionsResult.data.filter(def => 
        ['TWITTER_LINK', 'WEBSITE_LINK', 'TELEGRAM_LINK'].includes(def.parameter_key)
      );
      
      console.log(`✅ Found ${socialParams.length} social media parameters:`);
      socialParams.forEach(param => {
        console.log(`  - ${param.parameter_key}: ${param.parameter_name} (${param.data_type})`);
        console.log(`    Default: ${param.default_value}`);
        console.log(`    Required: ${param.is_required}`);
      });
    } else {
      console.log('❌ Failed to load parameter definitions:', definitionsResult.error);
    }
    
    // Test 2: Load templates to verify social media placeholders
    console.log('\n📋 Test 2: Loading contract templates...');
    const templatesResult = await parameterEditor.loadTemplates();
    
    if (templatesResult.success && templatesResult.data) {
      const template = templatesResult.data[0]; // Get first template
      console.log(`✅ Found template: ${template.name}`);
      
      // Check if template contains social media placeholders
      const hasTwitter = template.source_code.includes('{{TWITTER_LINK}}');
      const hasWebsite = template.source_code.includes('{{WEBSITE_LINK}}');
      const hasTelegram = template.source_code.includes('{{TELEGRAM_LINK}}');
      
      console.log('Social media placeholders in template:');
      console.log(`  - Twitter: ${hasTwitter ? '✅' : '❌'}`);
      console.log(`  - Website: ${hasWebsite ? '✅' : '❌'}`);
      console.log(`  - Telegram: ${hasTelegram ? '✅' : '❌'}`);
      
      // Test parameter replacement
      console.log('\n📋 Test 3: Testing parameter replacement...');
      const testParameters = [
        { key: 'TOKEN_NAME', value: 'TestToken' },
        { key: 'TOKEN_SYMBOL', value: 'TEST' },
        { key: 'TOTAL_SUPPLY', value: '1000000000' },
        { key: 'DECIMALS', value: '9' },
        { key: 'TWITTER_LINK', value: 'https://x.com/testtoken' },
        { key: 'WEBSITE_LINK', value: 'https://testtoken.com' },
        { key: 'TELEGRAM_LINK', value: 'https://t.me/testtoken' }
      ];
      
      const replacedSource = parameterEditor.replaceParameters(template.source_code, testParameters);
      
      // Check if social media links were replaced
      const hasReplacedTwitter = replacedSource.includes('https://x.com/testtoken');
      const hasReplacedWebsite = replacedSource.includes('https://testtoken.com');
      const hasReplacedTelegram = replacedSource.includes('https://t.me/testtoken');
      
      console.log('Parameter replacement test:');
      console.log(`  - Twitter replaced: ${hasReplacedTwitter ? '✅' : '❌'}`);
      console.log(`  - Website replaced: ${hasReplacedWebsite ? '✅' : '❌'}`);
      console.log(`  - Telegram replaced: ${hasReplacedTelegram ? '✅' : '❌'}`);
      
      // Show a snippet of the replaced source code
      const lines = replacedSource.split('\n');
      const socialLines = lines.filter(line => 
        line.includes('Website:') || line.includes('Telegram:') || line.includes('X:')
      );
      
      console.log('\n📄 Sample of replaced source code (social media section):');
      socialLines.forEach(line => console.log(`  ${line}`));
      
    } else {
      console.log('❌ Failed to load templates:', templatesResult.error);
    }
    
    // Test 4: Test source export service (mock)
    console.log('\n📋 Test 4: Testing source export service...');
    const mockInstanceId = 'test-instance-id';
    const exportResult = await exportService.exportSourceCode(mockInstanceId);
    
    if (exportResult.success) {
      console.log('✅ Source export service working (mock test)');
      console.log(`  - File name: ${exportResult.fileName}`);
      console.log(`  - Content length: ${exportResult.fileContent?.length || 0} characters`);
    } else {
      console.log('❌ Source export service test failed:', exportResult.error);
    }
    
    // Test 5: Test category calculation
    console.log('\n📋 Test 5: Testing category calculation...');
    const testParametersArray = [
      { parameter_key: 'TOKEN_NAME', current_value: 'TestToken' },
      { parameter_key: 'TOKEN_SYMBOL', current_value: 'TEST' },
      { parameter_key: 'TOTAL_SUPPLY', current_value: '1000000000' },
      { parameter_key: 'DECIMALS', current_value: '9' },
      { parameter_key: 'TWITTER_LINK', current_value: 'https://x.com/testtoken' },
      { parameter_key: 'WEBSITE_LINK', current_value: 'https://testtoken.com' },
      { parameter_key: 'TELEGRAM_LINK', current_value: 'https://t.me/testtoken' }
    ];
    
    // Import the deployment handler to test category calculation
    const { DeploymentHandler } = require('./bot/handlers/deployment.handler');
    const categories = DeploymentHandler.calculateCategoryStatus(testParametersArray);
    
    console.log('Category completion status:');
    console.log(`  - Basic: ${categories.basic.completed ? '✅' : '⏳'} (${categories.basic.count}/${categories.basic.total})`);
    console.log(`  - Taxes: ${categories.taxes.completed ? '✅' : '⏳'} (${categories.taxes.count}/${categories.taxes.total})`);
    console.log(`  - Trading: ${categories.trading.completed ? '✅' : '⏳'} (${categories.trading.count}/${categories.trading.total})`);
    console.log(`  - Limits: ${categories.limits.completed ? '✅' : '⏳'} (${categories.limits.count}/${categories.limits.total})`);
    console.log(`  - Social: ${categories.social.completed ? '✅' : '⏳'} (${categories.social.count}/${categories.social.total})`);
    console.log(`  - Advanced: ${categories.advanced.completed ? '✅' : '⏳'} (${categories.advanced.count}/${categories.advanced.total})`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testSocialMediaIntegration().then(() => {
  console.log('\n🏁 Social media integration test completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Test crashed:', error);
  process.exit(1);
}); 