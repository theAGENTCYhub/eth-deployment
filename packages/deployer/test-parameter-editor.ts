import { ParameterEditorService } from './src/services/parameter-editor.service';
import { ParameterValue } from '@eth-deployer/supabase';
import * as fs from 'fs';
import * as path from 'path';

async function testParameterEditor() {
  console.log('🧪 Testing Parameter Editor Service with Database Integration\n');

  const editor = new ParameterEditorService();

  try {
    // Test 1: Load templates from database
    console.log('1. 📋 Loading templates from database...');
    const templatesResult = await editor.loadTemplates();
    if (!templatesResult.success || !templatesResult.data) {
      console.log(`   ❌ Failed to load templates: ${templatesResult.error}`);
      return;
    }
    
    console.log(`   Found ${templatesResult.data.length} templates:`);
    templatesResult.data.forEach(template => {
      console.log(`   - ${template.name} (${template.id})`);
    });

    if (templatesResult.data.length === 0) {
      console.log('   ❌ No templates found. Please ensure the database has sample data.');
      return;
    }

    // Test 2: Load parameter definitions
    console.log('\n2. 📝 Loading parameter definitions...');
    const parameterDefinitionsResult = await editor.loadParameterDefinitions();
    if (!parameterDefinitionsResult.success || !parameterDefinitionsResult.data) {
      console.log(`   ❌ Failed to load parameter definitions: ${parameterDefinitionsResult.error}`);
      return;
    }
    
    console.log(`   Found ${parameterDefinitionsResult.data.length} parameter definitions:`);
    parameterDefinitionsResult.data.slice(0, 5).forEach(def => {
      console.log(`   - ${def.parameter_name} (${def.parameter_key}) - ${def.data_type}`);
    });

    // Test 3: Load a specific template and discover parameters
    console.log('\n3. 🔍 Discovering parameters in template...');
    const template = templatesResult.data[0];
    console.log(`   Using template: ${template.name}`);
    
    const discoveredParams = editor.discoverParameters(template.source_code);
    console.log(`   Found ${discoveredParams.length} parameters:`);
    discoveredParams.forEach(param => {
      console.log(`   - {{${param}}}`);
    });

    // Test 4: Test parameter replacement with sample values
    console.log('\n4. 📝 Testing parameter replacement...');
    
    // Create sample parameter values (using first 5 discovered parameters)
    const testParameters: ParameterValue[] = discoveredParams.slice(0, 5).map((param, index) => {
      const definition = parameterDefinitionsResult.data?.find(d => d.parameter_key === param);
      if (!definition) {
        return { key: param, value: `test_value_${index}` };
      }

      // Use appropriate default values based on type
      switch (definition.data_type) {
        case 'string':
          return { key: param, value: `Test${param}` };
        case 'number':
          return { key: param, value: '100' };
        case 'address':
          return { key: param, value: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6' };
        case 'boolean':
          return { key: param, value: 'true' };
        default:
          return { key: param, value: `test_value_${index}` };
      }
    });

    console.log('   Parameters to replace:');
    testParameters.forEach(param => {
      console.log(`   - {{${param.key}}} → "${param.value}"`);
    });

    // Test 5: Validate parameters
    console.log('\n5. ✅ Validating parameters...');
    const validationResult = await editor.validateParameters(testParameters);
    
    if (!validationResult.success && validationResult.errors) {
      console.log('   ❌ Validation errors:');
      validationResult.errors.forEach(error => {
        console.log(`   - ${error}`);
      });
    } else {
      console.log('   ✅ All parameters are valid!');
    }

    // Test 6: Replace parameters in contract
    console.log('\n6. 🔄 Replacing parameters in contract...');
    const modifiedContract = editor.replaceParameters(template.source_code, testParameters);

    // Test 7: Generate comparison
    console.log('\n7. 📊 Generating comparison...');
    const comparison = editor.generateComparison(template.source_code, modifiedContract, testParameters);
    
    // Save comparison to file
    const outputPath = path.join(__dirname, 'parameter-editor-test-output.txt');
    fs.writeFileSync(outputPath, comparison);
    
    console.log(`\n📄 Full comparison saved to: ${outputPath}`);
    
    // Show preview
    console.log('\n=== QUICK COMPARISON PREVIEW ===');
    console.log('\nORIGINAL (first 3 lines with placeholders):');
    const originalLines = template.source_code.split('\n').filter(line => line.includes('{{'));
    console.log(originalLines.slice(0, 3).join('\n'));
    
    console.log('\nMODIFIED (same lines with values):');
    const modifiedLines = modifiedContract.split('\n').filter(line => 
      testParameters.some(param => line.includes(param.value))
    );
    console.log(modifiedLines.slice(0, 3).join('\n'));

    // Test 8: Save contract instance (optional)
    console.log('\n8. 💾 Testing contract instance save...');
    const instanceId = await editor.saveContractInstance(
      'test_user_123',
      template.id,
      'Test Contract Instance',
      testParameters,
      modifiedContract
    );

    if (instanceId) {
      console.log(`   ✅ Contract instance saved with ID: ${instanceId}`);
    } else {
      console.log('   ❌ Failed to save contract instance');
    }

    console.log('\n🎉 Parameter editor test completed successfully!');
    console.log('\nNext steps:');
    console.log('1. View the full comparison in the output file');
    console.log('2. Integrate with Telegram bot interface');
    console.log('3. Add compilation service integration');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testParameterEditor(); 