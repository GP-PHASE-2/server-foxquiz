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
    
    // Fallback questions for when AI service is unavailable
    this.fallbackQuestions = this.getFallbackQuestions();
    
    // Track recently generated questions to avoid duplicates
    this.recentQuestions = new Set();
    this.maxRecentQuestions = 100; // Keep track of last 100 questions
  }

  getFallbackQuestions() {
    return {
      'Umum': [
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
        },
        {
          "question": "Siapa presiden pertama Indonesia?",
          "options": [
            { "key": "A", "text": "Soekarno" },
            { "key": "B", "text": "Soeharto" },
            { "key": "C", "text": "Habibie" },
            { "key": "D", "text": "Megawati" }
          ],
          "correctAnswer": "A",
          "explanation": "Soekarno adalah presiden pertama Indonesia yang menjabat dari 1945-1967."
        },
        {
          "question": "Berapa banyak pulau di Indonesia?",
          "options": [
            { "key": "A", "text": "Lebih dari 17.000 pulau" },
            { "key": "B", "text": "Sekitar 10.000 pulau" },
            { "key": "C", "text": "Kurang dari 5.000 pulau" },
            { "key": "D", "text": "Sekitar 20.000 pulau" }
          ],
          "correctAnswer": "A",
          "explanation": "Indonesia memiliki lebih dari 17.000 pulau, menjadikannya negara kepulauan terbesar di dunia."
        }
      ],
      'Sains': [
        {
          "question": "Apa rumus kimia untuk air?",
          "options": [
            { "key": "A", "text": "H2O" },
            { "key": "B", "text": "CO2" },
            { "key": "C", "text": "O2" },
            { "key": "D", "text": "H2SO4" }
          ],
          "correctAnswer": "A",
          "explanation": "H2O adalah rumus kimia untuk air, terdiri dari 2 atom hidrogen dan 1 atom oksigen."
        },
        {
          "question": "Planet mana yang terdekat dengan matahari?",
          "options": [
            { "key": "A", "text": "Merkurius" },
            { "key": "B", "text": "Venus" },
            { "key": "C", "text": "Mars" },
            { "key": "D", "text": "Bumi" }
          ],
          "correctAnswer": "A",
          "explanation": "Merkurius adalah planet terdekat dengan matahari dalam tata surya kita."
        }
      ],
      'Sejarah': [        {
          "question": "Kapan Indonesia merdeka?",
          "options": [
            { "key": "A", "text": "17 Agustus 1945" },
            { "key": "B", "text": "17 Agustus 1944" },
            { "key": "C", "text": "17 Agustus 1946" },
            { "key": "D", "text": "17 Agustus 1947" }
          ],
          "correctAnswer": "A",
          "explanation": "Indonesia merdeka pada tanggal 17 Agustus 1945."
        }
      ],
      'Geografi': [
        {
          "question": "Benua mana yang terbesar di dunia?",
          "options": [
            { "key": "A", "text": "Asia" },
            { "key": "B", "text": "Afrika" },
            { "key": "C", "text": "Amerika Utara" },
            { "key": "D", "text": "Eropa" }
          ],
          "correctAnswer": "A",
          "explanation": "Asia adalah benua terbesar di dunia baik dari segi luas maupun populasi."
        },
        {
          "question": "Sungai terpanjang di dunia adalah?",
          "options": [
            { "key": "A", "text": "Sungai Nil" },
            { "key": "B", "text": "Sungai Amazon" },
            { "key": "C", "text": "Sungai Yangtze" },
            { "key": "D", "text": "Sungai Mississippi" }
          ],
          "correctAnswer": "A",
          "explanation": "Sungai Nil dengan panjang sekitar 6.650 km adalah sungai terpanjang di dunia."
        }
      ],
      'Olahraga': [
        {
          "question": "Berapa jumlah pemain dalam satu tim sepak bola?",
          "options": [
            { "key": "A", "text": "11 pemain" },
            { "key": "B", "text": "10 pemain" },
            { "key": "C", "text": "12 pemain" },
            { "key": "D", "text": "9 pemain" }
          ],
          "correctAnswer": "A",
          "explanation": "Dalam sepak bola, setiap tim memiliki 11 pemain di lapangan."
        },
        {
          "question": "Olimpiade pertama kali diadakan di negara mana?",
          "options": [
            { "key": "A", "text": "Yunani" },
            { "key": "B", "text": "Italia" },
            { "key": "C", "text": "Prancis" },
            { "key": "D", "text": "Inggris" }
          ],
          "correctAnswer": "A",
          "explanation": "Olimpiade modern pertama diadakan di Athena, Yunani pada tahun 1896."
        }
      ],
      'Hiburan': [
        {
          "question": "Siapa sutradara film Titanic?",
          "options": [
            { "key": "A", "text": "James Cameron" },
            { "key": "B", "text": "Steven Spielberg" },
            { "key": "C", "text": "Martin Scorsese" },
            { "key": "D", "text": "Christopher Nolan" }
          ],
          "correctAnswer": "A",
          "explanation": "James Cameron adalah sutradara film Titanic yang dirilis pada tahun 1997."
        }
      ],
      'Teknologi': [
        {
          "question": "Siapa pendiri perusahaan Microsoft?",
          "options": [
            { "key": "A", "text": "Bill Gates" },
            { "key": "B", "text": "Steve Jobs" },
            { "key": "C", "text": "Mark Zuckerberg" },
            { "key": "D", "text": "Larry Page" }
          ],
          "correctAnswer": "A",
          "explanation": "Bill Gates bersama Paul Allen mendirikan Microsoft pada tahun 1975."
        },
        {
          "question": "Apa kepanjangan dari HTML?",
          "options": [
            { "key": "A", "text": "HyperText Markup Language" },
            { "key": "B", "text": "High Tech Modern Language" },
            { "key": "C", "text": "Home Tool Markup Language" },
            { "key": "D", "text": "Hyperlink and Text Markup Language" }
          ],
          "correctAnswer": "A",
          "explanation": "HTML adalah singkatan dari HyperText Markup Language, bahasa markup standar untuk membuat halaman web."
        }
      ]
    };
  }  async generateQuestions(category = 'Umum', difficulty = 'medium', count = 1) {
    const startTime = Date.now();
    const maxRetries = 3;
    let retryCount = 0;
    
    // Generate unique seed for each request to ensure variety
    const timestamp = Date.now();
    const randomSeed = Math.random().toString(36).substring(2, 15);
    
    console.log(`Starting question generation: ${count} questions, Category: ${category}, Difficulty: ${difficulty}`);
    
    while (retryCount < maxRetries) {
      try {const prompt = `
          TASK: Buatkan ${count} soal kuis yang UNIK dan BERVARIASI dengan format JSON yang SANGAT KETAT berikut:
          - Kategori: ${category}
          - Tingkat kesulitan: ${difficulty}
          - Seed: ${timestamp}_${randomSeed} (gunakan untuk memastikan keunikan)
          
          ${this.getRecentQuestionsPrompt()}
          
          ${this.getAdvancedPromptEnhancement(category, difficulty, count)}
          
          ${this.getCategoryQuestionTypes(category)}
          
          ATURAN KERAGAMAN & KEUNIKAN:
          1. WAJIB membuat soal yang BERBEDA dari soal-soal umum/populer
          2. Hindari soal klise seperti "Apa ibu kota Indonesia?" atau "Siapa presiden pertama Indonesia?"
          3. Buatlah soal yang MENANTANG dan KREATIF sesuai tingkat kesulitan
          4. Variasikan jenis pertanyaan: fakta, konsep, analisis, perhitungan (sesuai kategori)
          5. Gunakan konteks yang BERAGAM dan MENARIK dalam setiap soal
          6. Pastikan setiap soal memiliki sudut pandang yang BERBEDA
          7. HINDARI pengulangan pattern atau struktur yang sama dengan soal sebelumnya
          
          TINGKAT KESULITAN:
          - EASY: Pengetahuan dasar yang umum diketahui
          - MEDIUM: Pengetahuan menengah yang memerlukan pemahaman lebih
          - HARD: Pengetahuan mendalam, detail spesifik, atau konsep kompleks
          
          SPESIFIKASI KATEGORI:
          ${this.getCategorySpecification(category)}
          
          ATURAN TEKNIS WAJIB:
          1. Setiap soal HARUS memiliki tepat 4 pilihan jawaban dengan key A, B, C, D
          2. correctAnswer HARUS berupa string "A", "B", "C", atau "D" (bukan angka)
          3. correctAnswer HARUS sesuai dengan salah satu key di options
          4. Semua pilihan jawaban harus MASUK AKAL dan RELEVAN dengan pertanyaan
          5. Hanya ada SATU jawaban yang benar
          6. Pilihan jawaban yang salah harus MENANTANG (bukan jawaban yang jelas salah)
          
          CONTOH SOAL YANG BAGUS (BERVARIASI):
          ${this.getExampleQuestions(category, difficulty)}
          
          FORMAT JSON YANG HARUS DIIKUTI:
          [
            {
              "question": "Pertanyaan yang UNIK dan MENANTANG?",
              "options": [
                { "key": "A", "text": "Pilihan jawaban A yang masuk akal" },
                { "key": "B", "text": "Pilihan jawaban B yang masuk akal" },
                { "key": "C", "text": "Pilihan jawaban C yang masuk akal" },
                { "key": "D", "text": "Pilihan jawaban D yang masuk akal" }
              ],
              "correctAnswer": "A",
              "explanation": "Penjelasan detail mengapa jawaban A benar dengan konteks yang kaya"
            }
          ]
          
          PASTIKAN:
          - Setiap soal memiliki KEUNIKAN tersendiri
          - Jawaban benar-benar AKURAT secara faktual
          - Pilihan jawaban yang salah MENANTANG tapi jelas salah
          - Penjelasan memberikan KONTEKS dan INSIGHT yang berharga
          - Format JSON VALID dan dapat di-parse
          - Hindari pengulangan pola atau struktur pertanyaan yang sama
          - TIDAK ADA DUPLIKASI dengan soal-soal yang sudah pernah dibuat
          
          MULAI MEMBUAT ${count} SOAL YANG BENAR-BENAR UNIK SEKARANG:
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
        
        // Check for duplicate questions
        const uniqueQuestions = this.filterDuplicateQuestions(validatedQuestions);
        
        // Add questions to recent tracking
        uniqueQuestions.forEach(q => {
          this.addToRecentQuestions(q.question);
        });
        
        // Log question generation statistics
        this.logQuestionGenerationStats(category, difficulty, count, uniqueQuestions, Date.now() - timestamp);
          console.log('Parsed and validated questions:', JSON.stringify(uniqueQuestions, null, 2));
        
        // Log generation statistics
        const timeTaken = Date.now() - startTime;
        this.logQuestionGenerationStats(category, difficulty, count, uniqueQuestions, timeTaken);
        
        return uniqueQuestions;
        
      } catch (error) {
        console.error(`Error generating questions (attempt ${retryCount + 1}/${maxRetries}):`, error);
        retryCount++;
          // If it's a 503 error (service unavailable) or we've reached max retries, use fallback
        if (error.status === 503 || retryCount >= maxRetries) {
          console.log('Using fallback questions due to AI service unavailability');
          return this.getFallbackQuestionsForCategory(category, count);
        }
        
        // Wait before retrying (exponential backoff)
        const waitTime = Math.pow(2, retryCount) * 1000;
        console.log(`Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  getFallbackQuestionsForCategory(category = 'Umum', count = 1) {
    const categoryQuestions = this.fallbackQuestions[category] || this.fallbackQuestions['Umum'];
    
    // If we need more questions than available, repeat the questions
    const questions = [];
    for (let i = 0; i < count; i++) {
      questions.push(categoryQuestions[i % categoryQuestions.length]);
    }
    
    return questions;
  }

  async validateAnswer(question, userAnswer) {
    return question.correctAnswer === userAnswer;
  }

  getCategorySpecification(category) {
    const specifications = {
      'Umum': `
        - Fokus pada pengetahuan umum yang luas: budaya, tokoh, peristiwa, fakta menarik
        - Hindari soal yang terlalu dasar seperti ibu kota atau presiden pertama
        - Eksplorasi topik seperti: tradisi unik, inovasi, prestasi, fenomena alam, dll
        - Variasikan geografis: lokal, nasional, internasional
      `,
      'Sains': `
        - Cakup berbagai bidang: fisika, kimia, biologi, astronomi, geologi, matematika
        - Tingkat kesulitan: konsep dasar hingga aplikasi kompleks
        - Fokus pada: penemuan, teori, eksperimen, aplikasi praktis
        - Hindari rumus kimia basic, pilih konsep yang lebih menantang
      `,
      'Sejarah': `
        - Jangkauan luas: sejarah dunia, nasional, regional
        - Periode beragam: kuno, klasik, modern, kontemporer  
        - Fokus pada: peristiwa penting, tokoh berpengaruh, perkembangan peradaban
        - Hindari tanggal kemerdekaan basic, pilih peristiwa yang lebih spesifik
      `,
      'Geografi': `
        - Cakup: geografi fisik, manusia, ekonomi, lingkungan
        - Skala: lokal, nasional, benua, global
        - Fokus pada: fenomena alam, pola iklim, pembangunan, demografi
        - Hindari "sungai terpanjang" basic, pilih aspek geografis yang unik
      `,
      'Olahraga': `
        - Berbagai jenis: individual, tim, tradisional, modern
        - Aspek: sejarah, aturan, teknik, prestasi, organisasi
        - Tingkat: lokal, nasional, internasional, olimpiade
        - Fokus pada detail dan fakta menarik yang tidak umum diketahui
      `,
      'Hiburan': `
        - Media beragam: film, musik, TV, teater, seni, games
        - Era berbeda: klasik, modern, kontemporer
        - Aspek: sejarah, tokoh, karya, penghargaan, tren
        - Fokus pada detail dan trivia yang menantang
      `,
      'Teknologi': `
        - Bidang luas: komputer, internet, AI, robotika, biotech, nanotech
        - Aspek: sejarah, inovasi, aplikasi, dampak, masa depan
        - Tingkat: konsep dasar hingga perkembangan terkini
        - Fokus pada teknologi yang berkembang dan implikasinya
      `
    };
    
    return specifications[category] || specifications['Umum'];
  }

  getExampleQuestions(category, difficulty) {
    const examples = {
      'Umum': {
        'easy': `
          {
            "question": "Makanan tradisional Indonesia yang terbuat dari kedelai fermentasi adalah?",
            "options": [
              { "key": "A", "text": "Tempeh" },
              { "key": "B", "text": "Tahu" },
              { "key": "C", "text": "Oncom" },
              { "key": "D", "text": "Tauco" }
            ],
            "correctAnswer": "A",
            "explanation": "Tempeh adalah makanan tradisional Indonesia yang dibuat dari kedelai yang difermentasi dengan jamur Rhizopus."
          }
        `,
        'medium': `
          {
            "question": "Filosofi Jawa yang mengajarkan tentang keseimbangan hidup dengan alam adalah?",
            "options": [
              { "key": "A", "text": "Hamemayu Hayuning Bawana" },
              { "key": "B", "text": "Gotong Royong" },
              { "key": "C", "text": "Tepa Selira" },
              { "key": "D", "text": "Unggah-ungguh" }
            ],
            "correctAnswer": "A",
            "explanation": "Hamemayu Hayuning Bawana adalah filosofi Jawa yang mengajarkan untuk memelihara keselamatan dan keindahan dunia."
          }
        `,
        'hard': `
          {
            "question": "Konsep waktu dalam budaya Jawa yang menggambarkan siklus kehidupan adalah?",
            "options": [
              { "key": "A", "text": "Pranata Mangsa" },
              { "key": "B", "text": "Weton" },
              { "key": "C", "text": "Sengkala" },
              { "key": "D", "text": "Wedhawati" }
            ],
            "correctAnswer": "A",
            "explanation": "Pranata Mangsa adalah sistem penanggalan tradisional Jawa yang mengatur aktivitas pertanian berdasarkan siklus alam."
          }
        `
      },
      'Sains': {
        'easy': `
          {
            "question": "Proses fotosintesis pada tumbuhan menghasilkan gas apa?",
            "options": [
              { "key": "A", "text": "Oksigen" },
              { "key": "B", "text": "Karbon dioksida" },
              { "key": "C", "text": "Nitrogen" },
              { "key": "D", "text": "Hidrogen" }
            ],
            "correctAnswer": "A",
            "explanation": "Fotosintesis menghasilkan oksigen sebagai produk sampingan saat tumbuhan mengubah CO2 dan air menjadi glukosa."
          }
        `,
        'medium': `
          {
            "question": "Fenomena fisika yang menjelaskan mengapa langit tampak biru adalah?",
            "options": [
              { "key": "A", "text": "Hamburan Rayleigh" },
              { "key": "B", "text": "Refraksi atmosfer" },
              { "key": "C", "text": "Absorpsi ozon" },
              { "key": "D", "text": "Refleksi awan" }
            ],
            "correctAnswer": "A",
            "explanation": "Hamburan Rayleigh terjadi ketika cahaya matahari berinteraksi dengan partikel kecil di atmosfer, menghamburkan cahaya biru lebih banyak."
          }
        `,
        'hard': `
          {
            "question": "Dalam mekanika kuantum, prinsip yang menyatakan bahwa tidak mungkin mengetahui posisi dan momentum partikel secara bersamaan dengan akurasi sempurna adalah?",
            "options": [
              { "key": "A", "text": "Prinsip Ketidakpastian Heisenberg" },
              { "key": "B", "text": "Prinsip Pauli" },
              { "key": "C", "text": "Prinsip Superposisi" },
              { "key": "D", "text": "Prinsip Komplementaritas" }
            ],
            "correctAnswer": "A",
            "explanation": "Prinsip Ketidakpastian Heisenberg adalah salah satu fondasi mekanika kuantum yang membatasi presisi pengukuran simultan."
          }
        `
      }
    };
    
    const categoryExamples = examples[category] || examples['Umum'];
    return categoryExamples[difficulty] || categoryExamples['medium'];
  }

  filterDuplicateQuestions(questions) {
    return questions.filter(q => {
      const questionKey = this.normalizeQuestion(q.question);
      return !this.recentQuestions.has(questionKey);
    });
  }

  normalizeQuestion(question) {
    // Normalize question text for comparison
    return question.toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  addToRecentQuestions(question) {
    const questionKey = this.normalizeQuestion(question);
    this.recentQuestions.add(questionKey);
    
    // Keep only the most recent questions
    if (this.recentQuestions.size > this.maxRecentQuestions) {
      // Convert to array, remove oldest, convert back to Set
      const questionsArray = Array.from(this.recentQuestions);
      this.recentQuestions = new Set(questionsArray.slice(-this.maxRecentQuestions));
    }
  }

  // Add method to get recently used questions for prompt enhancement
  getRecentQuestionsPrompt() {
    if (this.recentQuestions.size === 0) return '';
    
    const recentList = Array.from(this.recentQuestions).slice(-10); // Last 10 questions
    return `
      HINDARI MEMBUAT SOAL SERUPA DENGAN YANG BARU SAJA DIBUAT:
      ${recentList.map(q => `- ${q}`).join('\n      ')}
      
      PASTIKAN SOAL YANG DIBUAT BENAR-BENAR BERBEDA DARI DAFTAR DI ATAS.
    `;
  }

  // Add method to enhance prompt with advanced techniques
  getAdvancedPromptEnhancement(category, difficulty, count) {
    const difficultyMultipliers = {
      'easy': 1.0,
      'medium': 1.3,
      'hard': 1.7
    };
    
    const complexityScore = difficultyMultipliers[difficulty] || 1.0;
    
    return `
      TEKNIK LANJUTAN UNTUK MEMBUAT SOAL BERKUALITAS TINGGI:
      
      1. KEDALAMAN KONTEKS (Complexity Score: ${complexityScore}):
         - Gunakan konteks historis, geografis, atau budaya yang spesifik
         - Kaitkan dengan peristiwa, tokoh, atau konsep yang saling terkait
         - Berikan latar belakang yang memperkaya pemahaman
         
      2. VARIASI STRUKTUR PERTANYAAN:
         - Pertanyaan langsung: "Apa yang dimaksud dengan...?"
         - Pertanyaan analisis: "Manakah yang BUKAN merupakan..."
         - Pertanyaan komparasi: "Perbedaan utama antara A dan B adalah..."
         - Pertanyaan aplikasi: "Dalam situasi X, pendekatan yang tepat adalah..."
         
      3. PILIHAN JAWABAN YANG MENANTANG:
         - Gunakan distractor yang memiliki kesamaan dengan jawaban benar
         - Buat pilihan yang memerlukan pengetahuan mendalam untuk dibedakan
         - Hindari pilihan yang terlalu jelas salah atau tidak masuk akal
         
      4. TINGKAT SPESIFISITAS:
         - Easy: Pengetahuan yang diketahui 70-80% orang
         - Medium: Pengetahuan yang diketahui 30-50% orang  
         - Hard: Pengetahuan yang diketahui 5-20% orang
         
      5. ELEMEN SURPRISE:
         - Tambahkan fakta menarik yang tidak umum diketahui
         - Gunakan sudut pandang yang tidak biasa
         - Kaitkan konsep yang tampaknya tidak berhubungan
    `;
  }

  // Add method to get category-specific question types
  getCategoryQuestionTypes(category) {
    const questionTypes = {
      'Umum': [
        'Fakta budaya unik', 'Tradisi regional', 'Prestasi nasional', 'Inovasi lokal',
        'Tokoh berpengaruh', 'Peristiwa bersejarah', 'Fenomena sosial', 'Kearifan lokal'
      ],
      'Sains': [
        'Teori ilmiah', 'Penemuan penting', 'Konsep dasar', 'Aplikasi praktis',
        'Fenomena alam', 'Eksperimen bersejarah', 'Teknologi terapan', 'Hukum sains'
      ],
      'Sejarah': [
        'Peristiwa penting', 'Tokoh berpengaruh', 'Peradaban kuno', 'Revolusi',
        'Perjanjian internasional', 'Perang bersejarah', 'Dinasti', 'Kolonialisme'
      ],
      'Geografi': [
        'Fenomena fisik', 'Iklim regional', 'Formasi geologi', 'Demografi',
        'Pola migrasi', 'Sumber daya alam', 'Bencana alam', 'Urbanisasi'
      ],
      'Olahraga': [
        'Sejarah cabang olahraga', 'Teknik dan strategi', 'Prestasi atlet',
        'Peraturan kompetisi', 'Olimpiade', 'Rekor dunia', 'Organisasi olahraga'
      ],
      'Hiburan': [
        'Sejarah film', 'Penghargaan internasional', 'Perkembangan musik',
        'Tren entertainment', 'Tokoh berpengaruh', 'Karya ikonik', 'Industri kreatif'
      ],
      'Teknologi': [
        'Sejarah komputer', 'Perkembangan internet', 'Artificial Intelligence',
        'Robotika', 'Bioteknologi', 'Energi terbarukan', 'Inovasi digital'
      ]
    };
    
    const types = questionTypes[category] || questionTypes['Umum'];
    return `
      TIPE SOAL YANG DIREKOMENDASIKAN UNTUK KATEGORI ${category}:
      ${types.map(type => `- ${type}`).join('\n      ')}
      
      PILIH SALAH SATU TIPE DI ATAS DAN KEMBANGKAN MENJADI SOAL YANG MENARIK.
    `;
  }

  // Add method to log question generation statistics
  logQuestionGenerationStats(category, difficulty, count, questionsGenerated, timeTaken) {
    const stats = {
      timestamp: new Date().toISOString(),
      category,
      difficulty,
      requestedCount: count,
      generatedCount: questionsGenerated.length,
      timeTaken: timeTaken,
      uniqueQuestions: questionsGenerated.length,
      averageQuestionLength: questionsGenerated.reduce((sum, q) => sum + q.question.length, 0) / questionsGenerated.length,
      complexityScore: this.calculateComplexityScore(questionsGenerated)
    };
    
    console.log('Question Generation Stats:', JSON.stringify(stats, null, 2));
    return stats;
  }

  calculateComplexityScore(questions) {
    // Simple complexity scoring based on question length, options variety, and explanation depth
    let totalScore = 0;
    
    questions.forEach(q => {
      let score = 0;
      
      // Question length factor
      score += Math.min(q.question.length / 10, 5);
      
      // Options variety factor
      const optionsLengthVariety = Math.max(...q.options.map(opt => opt.text.length)) - 
                                   Math.min(...q.options.map(opt => opt.text.length));
      score += Math.min(optionsLengthVariety / 10, 3);
      
      // Explanation depth factor
      score += Math.min(q.explanation.length / 20, 4);
      
      totalScore += score;
    });
    
    return totalScore / questions.length;
  }
}

module.exports = new AIService();