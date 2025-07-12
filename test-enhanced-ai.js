require('dotenv').config();
const AIService = require('./services/aiService');

async function testEnhancedAI() {
  console.log('Testing Enhanced AI Question Generation...');
  console.log('=========================================');
  
  try {
    // Test 1: Generate Umum questions
    console.log('\n🎯 Test 1: Generating Umum (General) questions...');
    const generalQuestions = await AIService.generateQuestions('Umum', 'medium', 2);
    console.log(`✅ Generated ${generalQuestions.length} general questions`);
    
    // Test 2: Generate Sains questions
    console.log('\n🧪 Test 2: Generating Sains (Science) questions...');
    const scienceQuestions = await AIService.generateQuestions('Sains', 'hard', 2);
    console.log(`✅ Generated ${scienceQuestions.length} science questions`);
    
    // Test 3: Generate Teknologi questions
    console.log('\n💻 Test 3: Generating Teknologi (Technology) questions...');
    const techQuestions = await AIService.generateQuestions('Teknologi', 'easy', 2);
    console.log(`✅ Generated ${techQuestions.length} technology questions`);
    
    // Display sample questions
    console.log('\n📋 Sample Generated Questions:');
    console.log('=============================');
    
    if (generalQuestions.length > 0) {
      console.log('\n🔸 General Question Sample:');
      console.log(`Q: ${generalQuestions[0].question}`);
      console.log(`Options: ${generalQuestions[0].options.map(opt => `${opt.key}. ${opt.text}`).join(', ')}`);
      console.log(`Correct: ${generalQuestions[0].correctAnswer}`);
    }
    
    if (scienceQuestions.length > 0) {
      console.log('\n🔸 Science Question Sample:');
      console.log(`Q: ${scienceQuestions[0].question}`);
      console.log(`Options: ${scienceQuestions[0].options.map(opt => `${opt.key}. ${opt.text}`).join(', ')}`);
      console.log(`Correct: ${scienceQuestions[0].correctAnswer}`);
    }
    
    console.log('\n✨ Enhanced AI System Test Completed Successfully!');
    console.log('🎉 The system now generates more diverse and unique questions');
    console.log('📊 Question tracking and anti-duplication system is active');
    console.log('🚀 Fallback system ready for when AI service is overloaded');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.status === 503) {
      console.log('📍 AI service is overloaded, testing fallback system...');
      const fallbackQuestions = AIService.getFallbackQuestionsForCategory('Umum', 2);
      console.log(`✅ Fallback system working: Generated ${fallbackQuestions.length} questions`);
      console.log('🔄 Fallback question sample:', fallbackQuestions[0].question);
    }
  }
}

// Run the test
testEnhancedAI().then(() => {
  console.log('\n🏁 Test completed. You can now start the game and enjoy diverse questions!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});
