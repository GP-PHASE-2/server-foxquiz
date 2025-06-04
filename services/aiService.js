const { GoogleGenerativeAI } = require('@google/generative-ai');

class AIService {
  constructor() {
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
      throw new Error('GEMINI_API_KEY is required in environment variables');
    }
    
    this.genAI = new GoogleGenerativeAI(API_KEY);
    // Change from 'gemini-pro' to 'gemini-1.5-flash' or 'gemini-1.5-pro'
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async generateQuestions(category = 'Umum', difficulty = 'medium', count = 1) {
    try {
      const prompt = `
        Buatkan ${count} soal kuis dengan format JSON yang SANGAT KETAT berikut:
        - Kategori: ${category}
        - Tingkat kesulitan: ${difficulty}
        
        ATURAN WAJIB:
        1. Setiap soal HARUS memiliki tepat 4 pilihan jawaban dengan key A, B, C, D
        2. correctAnswer HARUS berupa string "A", "B", "C", atau "D" (bukan angka)
        3. correctAnswer HARUS sesuai dengan salah satu key di options
        4. Semua pilihan jawaban harus relevan dengan pertanyaan
        5. Hanya ada SATU jawaban yang benar
        
        Format JSON yang HARUS diikuti:
        [
          {
            "question": "Pertanyaan yang jelas dan spesifik?",
            "options": [
              { "key": "A", "text": "Pilihan jawaban A" },
              { "key": "B", "text": "Pilihan jawaban B" },
              { "key": "C", "text": "Pilihan jawaban C" },
              { "key": "D", "text": "Pilihan jawaban D" }
            ],
            "correctAnswer": "A",
            "explanation": "Penjelasan mengapa jawaban A benar"
          }
        ]
        
        CONTOH YANG BENAR:
        [
          {
            "question": "Apa ibu kota Indonesia?",
            "options": [
              { "key": "A", "text": "Jakarta" },
              { "key": "B", "text": "Surabaya" },
              { "key": "C", "text": "Bandung" },
              { "key": "D", "text": "Medan" }
            ],
            "correctAnswer": "A",
            "explanation": "Jakarta adalah ibu kota Indonesia sejak kemerdekaan pada tahun 1945."
          }
        ]
        
        PASTIKAN:
        - Jawaban benar-benar akurat secara faktual
        - Pilihan jawaban yang salah masuk akal tapi jelas salah
        - correctAnswer sesuai dengan key di options
        - Format JSON valid dan dapat di-parse
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('AI response text:', text);
      
      // Extract JSON from response
      const jsonMatch = text.match(/\[\s*\{.*\}\s*\]/s);
      if (!jsonMatch) {
        console.error('Failed to parse AI response as JSON. Full response:', text);
        throw new Error('Failed to parse AI response as JSON');
      }
      
      const parsedQuestions = JSON.parse(jsonMatch[0]);
      
      // Additional validation after parsing
      const validatedQuestions = parsedQuestions.map((q, index) => {
        // Ensure correctAnswer is string
        if (typeof q.correctAnswer !== 'string') {
          console.warn(`Converting correctAnswer to string for question ${index + 1}`);
          q.correctAnswer = String(q.correctAnswer);
        }
        
        // Ensure options have correct format
        if (q.options && Array.isArray(q.options)) {
          q.options = q.options.map(opt => ({
            key: String(opt.key).toUpperCase(),
            text: String(opt.text)
          }));
        }
        
        return q;
      });
      
      console.log('Parsed and validated questions:', JSON.stringify(validatedQuestions, null, 2));
      
      return validatedQuestions;
    } catch (error) {
      console.error('Error generating questions:', error);
      throw error;
    }
  }

  async validateAnswer(question, userAnswer) {
    return question.correctAnswer === userAnswer;
  }
}

module.exports = new AIService();