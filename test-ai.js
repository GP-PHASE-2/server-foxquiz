require('dotenv').config();
const aiService = require('./services/aiService');

async function testAIService() {
  try {
    console.log('Testing AI Service...');
    console.log('API Key exists:', !!process.env.GEMINI_API_KEY);
    
    // Test with the same parameters used in the game
    const questions = await aiService.generateQuestions('Umum', 'medium', 2);
    
    console.log('✅ AI Service working!');
    console.log('Generated questions:', JSON.stringify(questions, null, 2));
    
  } catch (error) {
    console.error('❌ AI Service failed:');
    console.error('Error message:', error.message);
    console.error('Full error:', error);
  }
}

testAIService();