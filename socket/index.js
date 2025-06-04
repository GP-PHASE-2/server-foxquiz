const { v4: uuidv4 } = require('uuid');
const Room = require('../models/Room');
const Player = require('../models/Player');
const aiService = require('../services/aiService');

// In-memory storage for active games
const activeGames = new Map();

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join or create room
    socket.on('join_room', async ({ username, avatar, roomCode, isHost }) => {
      try {
        let room;
        let roomId;

        if (isHost) {
          // Create new room
          const newRoomCode = generateRoomCode();
          room = await Room.create({
            code: newRoomCode,
            hostId: socket.id
          });
          roomId = room.id;
          
          // Initialize game state in memory
          activeGames.set(roomId, {
            players: [],
            questions: [],
            currentQuestionIndex: 0,
            answers: {},
            timer: null,
            isRevealing: false // Add this flag
          });
          socket.join(roomId);
          console.log(`Host ${username} created room ${newRoomCode}`);
        } else {
          // Join existing room
          room = await Room.findOne({ where: { code: roomCode } });
          
          if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
          }
          
          if (room.status !== 'waiting') {
            socket.emit('error', { message: 'Game already in progress' });
            return;
          }
          
          roomId = room.id;
          socket.join(roomId);
          console.log(`Player ${username} joined room ${roomCode}`);
        }

        // Create player
        // In the join_room handler, after creating the player
        const player = await Player.create({
          id: socket.id,
          username,
          avatar,
          roomId: room.id, // Make sure this is room.id, not roomId
          isHost
        });
        
        // Add verification logging
        console.log(`Player created: ${username}, isHost: ${isHost}, roomId: ${room.id}`);
        // Add player to in-memory game state
        const gameState = activeGames.get(roomId);
        if (gameState) {
          gameState.players.push({
            id: socket.id,
            username,
            avatar,
            score: 0,
            isHost
          });
        }

        // Notify room of new player
        const players = await Player.findAll({ where: { roomId } });
        io.to(roomId).emit('room_update', {
          room: room.toJSON(),
          players: players.map(p => p.toJSON())
        });

        // Send room info to the player who just joined
        socket.emit('room_joined', {
          room: room.toJSON(),
          players: players.map(p => p.toJSON()),
          playerId: socket.id
        });
      } catch (error) {
        console.error('Error joining room:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Start game (host only)
    socket.on('start_game', async ({ roomId, category, difficulty, totalQuestions }) => {
      try {
        // Validate host
        const room = await Room.findByPk(roomId);
        if (!room || room.hostId !== socket.id) {
          socket.emit('error', { message: 'Not authorized' });
          return;
        }

        // Ensure totalQuestions is at least 2
        const questionCount = Math.max(totalQuestions || 5, 2);
        console.log(`Starting game with ${questionCount} questions`);

        // Update room status
        await room.update({
          status: 'playing',
          category,
          difficulty,
          totalQuestions: questionCount,  // Use the validated question count
          currentQuestion: 0
        });
        console.log('Room updated successfully');

        // Generate questions using AI
        console.log('Generating questions...');
        // In the start_game handler
        const questions = await aiService.generateQuestions(category, difficulty, questionCount);
        console.log('Questions generated:', questions.length);
        
        // Add enhanced validation
        const validQuestions = questions.filter(q => {
          // Basic structure validation
          const hasBasicStructure = q && q.question && q.options && Array.isArray(q.options) && 
                                   q.options.length === 4 && q.correctAnswer && q.explanation;
          
          if (!hasBasicStructure) {
            console.error('Invalid question structure:', q);
            return false;
          }
          
          // Validate options format
          const hasValidOptions = q.options.every(option => 
            option && typeof option === 'object' && option.key && option.text &&
            ['A', 'B', 'C', 'D'].includes(option.key)
          );
          
          if (!hasValidOptions) {
            console.error('Invalid options format:', q.options);
            return false;
          }
          
          // Validate correctAnswer exists in options
          const correctAnswerExists = q.options.some(option => option.key === q.correctAnswer);
          
          if (!correctAnswerExists) {
            console.error('Correct answer not found in options:', {
              correctAnswer: q.correctAnswer,
              options: q.options.map(opt => opt.key)
            });
            return false;
          }
          
          // Validate unique option keys
          const optionKeys = q.options.map(opt => opt.key);
          const uniqueKeys = [...new Set(optionKeys)];
          
          if (optionKeys.length !== uniqueKeys.length) {
            console.error('Duplicate option keys found:', optionKeys);
            return false;
          }
          
          return true;
        });
        
        console.log(`Valid questions: ${validQuestions.length} out of ${questions.length}`);
        
        // Store questions in memory
        const gameState = activeGames.get(roomId);
        if (gameState) {
          gameState.questions = validQuestions;
          gameState.currentQuestionIndex = 0;
          gameState.answers = {};
        }

        // Notify all players that game is starting
        io.to(roomId).emit('game_starting', { 
          message: 'Game is starting!',
          room: {
            code: room.code,
            id: room.id
          }
        });
        
        // Send first question after a short delay
        setTimeout(() => {
          sendNextQuestion(io, roomId);
        }, 3000);
      } catch (error) {
        console.error('Detailed error starting game:', error);
        socket.emit('error', { message: 'Failed to start game' });
      }
    });

    // Submit answer dengan validasi yang lebih baik
    socket.on('submit_answer', async ({ roomId, answer, answerTime }) => {
      try {
        const gameState = activeGames.get(roomId);
        if (!gameState || gameState.isRevealing) return;
    
        const currentQuestion = gameState.questions[gameState.currentQuestionIndex];
        if (!currentQuestion) return;
    
        // Validate answer format
        if (answer && !['A', 'B', 'C', 'D'].includes(answer)) {
          console.error('Invalid answer format:', answer);
          return;
        }
    
        // Enhanced logging
        console.log('=== ANSWER SUBMISSION DEBUG ===');
        console.log('Player answer:', answer);
        console.log('Correct answer:', currentQuestion.correctAnswer);
        console.log('Question options:', currentQuestion.options.map(opt => `${opt.key}: ${opt.text}`));
        console.log('Is correct?', answer === currentQuestion.correctAnswer);
        console.log('===============================');
    
        // Store player's answer
        gameState.answers[socket.id] = {
          playerId: socket.id,
          answer,
          answerTime,
          isCorrect: answer === currentQuestion.correctAnswer
        };
    
        // Check if all players have answered
        const allPlayersAnswered = gameState.players.every(player => 
          gameState.answers[player.id] !== undefined
        );
    
        if (allPlayersAnswered) {
          if (gameState.timer) {
            clearTimeout(gameState.timer);
            gameState.timer = null;
          }
          revealAnswers(io, roomId);
        }
      } catch (error) {
        console.error('Error submitting answer:', error);
      }
    });

    // Chat message
    socket.on('chat_message', async ({ roomId, message }) => {
      try {
        const player = await Player.findByPk(socket.id);
        if (!player) return;

        io.to(roomId).emit('chat_message', {
          playerId: socket.id,
          username: player.username,
          avatar: player.avatar,
          message,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('Error sending chat message:', error);
      }
    });

    // Disconnect
    socket.on('disconnect', async () => {
      try {
        console.log(`User disconnected: ${socket.id}`);
        
        // Find player
        const player = await Player.findByPk(socket.id);
        if (!player) return;

        const roomId = player.roomId;
        const isHost = player.isHost;

        // Remove player
        await player.destroy();

        // Update in-memory game state
        const gameState = activeGames.get(roomId);
        if (gameState) {
          gameState.players = gameState.players.filter(p => p.id !== socket.id);
          delete gameState.answers[socket.id];
        }

        // If host left, end the game
        if (isHost) {
          const room = await Room.findByPk(roomId);
          if (room) {
            await room.update({ status: 'finished' });
            io.to(roomId).emit('game_ended', { reason: 'Host left the game' });
            
            // Clean up
            activeGames.delete(roomId);
          }
        } else {
          // Notify remaining players
          const players = await Player.findAll({ where: { roomId } });
          io.to(roomId).emit('room_update', {
            players: players.map(p => p.toJSON())
          });
        }
      } catch (error) {
        console.error('Error handling disconnect:', error);
      }
    });

    // Play again (host only)
    socket.on('play_again', async ({ roomId }) => {
      try {
        const room = await Room.findByPk(roomId);
        if (!room || room.hostId !== socket.id) {
          socket.emit('error', { message: 'Not authorized' });
          return;
        }
    
        // Reset room
        await room.update({
          status: 'waiting',
          currentQuestion: 0
        });
    
        // Reset players' scores
        await Player.update(
          { score: 0 },
          { where: { roomId } }
        );
    
        // Get current players from database instead of relying on gameState
        const currentPlayers = await Player.findAll({ where: { roomId } });
        const playerData = currentPlayers.map(p => ({
          id: p.id,
          username: p.username,
          avatar: p.avatar,
          score: 0,
          isHost: p.isHost
        }));
    
        // Reset in-memory game state
        activeGames.set(roomId, {
          players: playerData, // Use the players from database
          questions: [],
          currentQuestionIndex: 0,
          answers: {},
          timer: null
        });
    
        // Notify players
        io.to(roomId).emit('game_reset', {
          room: room.toJSON(),
          players: currentPlayers.map(p => p.toJSON())
        });
      } catch (error) {
        console.error('Detailed error resetting game:', error);
        socket.emit('error', { message: 'Failed to reset game' });
      }
    });
  });
}

// Helper functions
function sendNextQuestion(io, roomId) {
  const gameState = activeGames.get(roomId);
  if (!gameState) return;

  const { questions, currentQuestionIndex } = gameState;
  
  if (currentQuestionIndex >= questions.length) {
    endGame(io, roomId);
    return;
  }

  const question = questions[currentQuestionIndex];
  
  // Enhanced logging untuk debug
  console.log('=== SENDING QUESTION DEBUG ===');
  console.log('Question:', question.question);
  console.log('Options:', question.options);
  console.log('Correct Answer:', question.correctAnswer);
  console.log('Options Keys:', question.options.map(opt => opt.key));
  console.log('Correct Answer Exists:', question.options.some(opt => opt.key === question.correctAnswer));
  console.log('==============================');
  
  // Validate before sending
  const correctAnswerExists = question.options.some(opt => opt.key === question.correctAnswer);
  if (!correctAnswerExists) {
    console.error('CRITICAL ERROR: Correct answer not found in options!');
    console.error('Correct Answer:', question.correctAnswer);
    console.error('Available Options:', question.options.map(opt => opt.key));
    
    // Skip this question and move to next
    gameState.currentQuestionIndex++;
    setTimeout(() => {
      sendNextQuestion(io, roomId);
    }, 1000);
    return;
  }
  
  // Send question to all players
  io.to(roomId).emit('new_question', {
    questionNumber: currentQuestionIndex + 1,
    totalQuestions: questions.length,
    question: question.question,
    options: question.options,
    // Remove correctAnswer from client data for security
    // correctAnswer: question.correctAnswer // Only for debugging
  });

  // Reset answers for this question
  gameState.answers = {};

  // Set timer for this question (10 seconds)
  gameState.timer = setTimeout(() => {
    revealAnswers(io, roomId);
  }, 10000);
}

async function revealAnswers(io, roomId) {
  const gameState = activeGames.get(roomId);
  if (!gameState || gameState.isRevealing) return; // Prevent multiple calls
  
  gameState.isRevealing = true; // Add flag to prevent race condition

  const { questions, currentQuestionIndex, answers } = gameState;
  const question = questions[currentQuestionIndex];
  
  // Add this check to prevent the error
  if (!question) {
    console.error(`Question not found at index ${currentQuestionIndex}`);
    // Move to next question or end game
    gameState.currentQuestionIndex++;
    gameState.isRevealing = false; // Reset flag
    setTimeout(() => {
      sendNextQuestion(io, roomId);
    }, 1000);
    return;
  }

  // Update scores in database and memory
  for (const playerId in answers) {
    if (answers[playerId].isCorrect) {
      // Calculate score based on answer time (faster = more points)
      const baseScore = 100;
      const timeBonus = Math.floor((10000 - answers[playerId].answerTime) / 100);
      const score = Math.max(baseScore + timeBonus, 50); // Minimum 50 points

      // Update in database
      await Player.increment('score', {
        by: score,
        where: { id: playerId }
      });

      // Update in memory
      const playerIndex = gameState.players.findIndex(p => p.id === playerId);
      if (playerIndex !== -1) {
        gameState.players[playerIndex].score += score;
      }
    }
  }

  // Get updated players
  const players = await Player.findAll({ where: { roomId } });

  // Send answer reveal to all players with safe access to properties
  io.to(roomId).emit('answer_reveal', {
    correctAnswer: question.correctAnswer || 'Unknown',
    explanation: question.explanation || 'No explanation available',
    playerAnswers: answers,
    updatedPlayers: players.map(p => p.toJSON())
  });

  // Move to next question after 5 seconds
  gameState.currentQuestionIndex++;
  setTimeout(() => {
    gameState.isRevealing = false; // Reset flag
    sendNextQuestion(io, roomId);
  }, 5000);
}

async function endGame(io, roomId) {
  try {
    const room = await Room.findByPk(roomId);
    if (room) {
      await room.update({ status: 'finished' });
    }

    // Try database first
    let players = await Player.findAll({
      where: { roomId },
      order: [['score', 'DESC']]
    });
    
    // If no players found in database, use in-memory state
    if (players.length === 0) {
      console.log('No players found in database, using in-memory state');
      const gameState = activeGames.get(roomId);
      if (gameState && gameState.players.length > 0) {
        // Sort by score
        players = gameState.players
          .sort((a, b) => b.score - a.score)
          .map(p => ({
            toJSON: () => p // Convert to database-like format
          }));
      }
    }

    io.to(roomId).emit('game_ended', {
      reason: 'Game completed',
      leaderboard: players.map(p => p.toJSON()),
      roomCode: room.code
    });
  } catch (error) {
    console.error('Error ending game:', error);
  }
}

module.exports = { setupSocketHandlers };