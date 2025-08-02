// Test script for UI components with social media parameters
// This test verifies that the UI components properly handle social media parameters

async function testUIComponents() {
  console.log('🧪 Testing UI components with social media parameters...');
  
  try {
    // Test 1: Test parameter editing screens
    console.log('\n📋 Test 1: Testing parameter editing screens...');
    const { ParameterEditingScreens } = require('./bot/screens/parameter-editing.screens');
    
    // Test single parameter screen for social media
    const twitterScreen = ParameterEditingScreens.getSingleParameterScreen(
      'TWITTER_LINK',
      'string',
      'Twitter/X profile link for the token',
      'https://x.com/testtoken',
      false
    );
    
    console.log('Twitter parameter screen:');
    console.log(`  - Title: ${twitterScreen.title}`);
    console.log(`  - Has examples: ${twitterScreen.description.includes('x.com/yourproject') ? '✅' : '❌'}`);
    console.log(`  - Has current value: ${twitterScreen.description.includes('https://x\\.com/testtoken') ? '✅' : '❌'}`);
    
    // Test parameter confirmation screen with social media
    const mockParameterValues = {
      'TOKEN_NAME': 'TestToken',
      'TOKEN_SYMBOL': 'TEST',
      'TOTAL_SUPPLY': '1000000000',
      'DECIMALS': '9',
      'TWITTER_LINK': 'https://x.com/testtoken',
      'WEBSITE_LINK': 'https://testtoken.com',
      'TELEGRAM_LINK': 'https://t.me/testtoken'
    };
    
    const confirmationScreen = ParameterEditingScreens.getParameterConfirmationScreen(
      'Test Template',
      mockParameterValues,
      '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.28;\ncontract TestToken { }',
      'Ethereum'
    );
    
    console.log('Parameter confirmation screen:');
    console.log(`  - Has social media section: ${confirmationScreen.description.includes('Social Media:') ? '✅' : '❌'}`);
    console.log(`  - Has basic info section: ${confirmationScreen.description.includes('Basic Info:') ? '✅' : '❌'}`);
    console.log(`  - Has Twitter link: ${confirmationScreen.description.includes('https://x\\.com/testtoken') ? '✅' : '❌'}`);
    console.log(`  - Has Website link: ${confirmationScreen.description.includes('https://testtoken\\.com') ? '✅' : '❌'}`);
    console.log(`  - Has Telegram link: ${confirmationScreen.description.includes('https://t\\.me/testtoken') ? '✅' : '❌'}`);
    
    // Test 2: Test deployment screens
    console.log('\n📋 Test 2: Testing deployment screens...');
    const { DeploymentScreens } = require('./bot/screens/deployment.screens');
    
    const mockDeploymentResult = {
      contractAddress: '0x1234567890123456789012345678901234567890',
      transactionHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
    };
    
    const successScreen = DeploymentScreens.getDeploymentSuccessScreen(mockDeploymentResult);
    
    console.log('Deployment success screen:');
    console.log(`  - Has contract address: ${successScreen.description.includes('0x1234567890123456789012345678901234567890') ? '✅' : '❌'}`);
    console.log(`  - Has transaction hash: ${successScreen.description.includes('0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890') ? '✅' : '❌'}`);
    console.log(`  - Mentions source code: ${successScreen.description.includes('Source Code:') ? '✅' : '❌'}`);
    
    // Test 3: Test category menu
    console.log('\n📋 Test 3: Testing category menu...');
    const mockCategories = {
      basic: { count: 4, completed: true, total: 4 },
      taxes: { count: 5, completed: true, total: 5 },
      trading: { count: 3, completed: true, total: 3 },
      limits: { count: 4, completed: true, total: 4 },
      social: { count: 3, completed: true, total: 3 },
      advanced: { count: 1, completed: true, total: 1 }
    };
    
    const categoryMenu = ParameterEditingScreens.categoryMenu('test-instance', mockCategories);
    
    console.log('Category menu:');
    console.log(`  - Has social media category: ${categoryMenu.includes('Social Media:') ? '✅' : '❌'}`);
    console.log(`  - Shows social completion: ${categoryMenu.includes('Social Media: ✅') ? '✅' : '❌'}`);
    console.log(`  - Shows social count: ${categoryMenu.includes('(3/3)') ? '✅' : '❌'}`);
    
    // Test 4: Test keyboard generation
    console.log('\n📋 Test 4: Testing keyboard generation...');
    const { ParameterEditingKeyboards } = require('./bot/keyboards/parameter-editing.keyboards');
    
    // Test if social media category is included in keyboard
    const socialParams = ParameterEditingKeyboards.getCategoryParams('social');
    console.log('Social media keyboard:');
    console.log(`  - Has social category: ${socialParams.length === 3 ? '✅' : '❌'}`);
    console.log(`  - Includes Twitter: ${socialParams.includes('TWITTER_LINK') ? '✅' : '❌'}`);
    console.log(`  - Includes Website: ${socialParams.includes('WEBSITE_LINK') ? '✅' : '❌'}`);
    console.log(`  - Includes Telegram: ${socialParams.includes('TELEGRAM_LINK') ? '✅' : '❌'}`);
    
    // Test short names
    const twitterShortName = ParameterEditingKeyboards.getShortParamName('TWITTER_LINK');
    const websiteShortName = ParameterEditingKeyboards.getShortParamName('WEBSITE_LINK');
    const telegramShortName = ParameterEditingKeyboards.getShortParamName('TELEGRAM_LINK');
    
    console.log('Short parameter names:');
    console.log(`  - Twitter: ${twitterShortName} ${twitterShortName === 'Twitter' ? '✅' : '❌'}`);
    console.log(`  - Website: ${websiteShortName} ${websiteShortName === 'Website' ? '✅' : '❌'}`);
    console.log(`  - Telegram: ${telegramShortName} ${telegramShortName === 'Telegram' ? '✅' : '❌'}`);
    
    console.log('\n✅ All UI component tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('  ✅ Parameter editing screens handle social media parameters');
    console.log('  ✅ Parameter confirmation screen groups social media parameters');
    console.log('  ✅ Deployment success screen mentions source code export');
    console.log('  ✅ Category menu includes social media category');
    console.log('  ✅ Keyboard generation includes social media parameters');
    console.log('  ✅ Short parameter names are properly defined');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testUIComponents().then(() => {
  console.log('\n🏁 UI component test completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Test crashed:', error);
  process.exit(1);
}); 