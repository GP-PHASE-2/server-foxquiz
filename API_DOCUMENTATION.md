# Quiz Game API Documentation

## Base URL
```
http://localhost:3000
```

## Table of Contents
1. [REST API Endpoints](#rest-api-endpoints)
2. [Socket.IO Events](#socketio-events)
3. [Data Models](#data-models)
4. [Error Handling](#error-handling)

---

## REST API Endpoints

### 1. Get Room by Code
**GET** `/api/rooms/:code`

Retrieve room information by room code.

**Parameters:**
- `code` (string, required): The room code (6-character uppercase string)

**Response:**
```json
{
  "id": "uuid",
  "code": "ABC123",
  "hostId": "socket-id",
  "status": "waiting",
  "category": "Umum",
  "difficulty": "medium",
  "currentQuestion": 0,
  "totalQuestions": 10,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "Players": [
    {
      "id": "socket-id",
      "username": "Player1",
      "avatar": "https://api.dicebear.com/7.x/bottts/svg?seed=1",
      "score": 0,
      "roomId": "uuid",
      "isHost": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Error Responses:**
- `404 Not Found`: Room not found
- `500 Internal Server Error`: Server error

### 2. Get Available Avatars
**GET** `/api/avatars`

Retrieve list of available avatar URLs.

**Response:**
```json
[
  "https://api.dicebear.com/7.x/bottts/svg?seed=1",
  "https://api.dicebear.com/7.x/bottts/svg?seed=2",
  "https://api.dicebear.com/7.x/bottts/svg?seed=3",
  "https://api.dicebear.com/7.x/bottts/svg?seed=4",
  "https://api.dicebear.com/7.x/bottts/svg?seed=5",
  "https://api.dicebear.com/7.x/bottts/svg?seed=6",
  "https://api.dicebear.com/7.x/bottts/svg?seed=7",
  "https://api.dicebear.com/7.x/bottts/svg?seed=8"
]
```

### 3. Get Quiz Categories
**GET** `/api/categories`

Retrieve list of available quiz categories.

**Response:**
```json
[
  "Umum",
  "Sains",
  "Sejarah",
  "Geografi",
  "Olahraga",
  "Hiburan",
  "Teknologi"
]
```

---

## Socket.IO Events

### Client to Server Events

#### 1. join_room
Join or create a room.

**Payload:**
```json
{
  "username": "Player1",
  "avatar": "https://api.dicebear.com/7.x/bottts/svg?seed=1",
  "roomCode": "ABC123",
  "isHost": true
}
```

**Description:**
- If `isHost` is `true`, creates a new room
- If `isHost` is `false`, joins existing room with `roomCode`

#### 2. start_game
Start the game (host only).

**Payload:**
```json
{
  "roomId": "uuid",
  "category": "Sains",
  "difficulty": "medium",
  "totalQuestions": 10
}
```

**Validation:**
- Only room host can start the game
- `totalQuestions` minimum is 2
- `difficulty` must be one of: "easy", "medium", "hard"

#### 3. submit_answer
Submit an answer to the current question.

**Payload:**
```json
{
  "roomId": "uuid",
  "answer": "A",
  "answerTime": 5000
}
```

**Description:**
- `answer` must be one of: "A", "B", "C", "D"
- `answerTime` is milliseconds taken to answer (used for scoring)

#### 4. chat_message
Send a chat message to the room.

**Payload:**
```json
{
  "roomId": "uuid",
  "message": "Hello everyone!"
}
```

### Server to Client Events

#### 1. room_joined
Sent when a player successfully joins a room.

**Payload:**
```json
{
  "room": {
    "id": "uuid",
    "code": "ABC123",
    "hostId": "socket-id",
    "status": "waiting",
    "category": "Umum",
    "difficulty": "medium",
    "currentQuestion": 0,
    "totalQuestions": 10
  },
  "players": [
    {
      "id": "socket-id",
      "username": "Player1",
      "avatar": "avatar-url",
      "score": 0,
      "roomId": "uuid",
      "isHost": true
    }
  ],
  "playerId": "socket-id"
}
```

#### 2. room_update
Sent when room state changes (new player joins, etc.).

**Payload:**
```json
{
  "room": {
    "id": "uuid",
    "code": "ABC123",
    "status": "waiting"
  },
  "players": [
    {
      "id": "socket-id",
      "username": "Player1",
      "avatar": "avatar-url",
      "score": 0,
      "isHost": true
    }
  ]
}
```

#### 3. game_starting
Sent when the game is about to start.

**Payload:**
```json
{
  "message": "Game is starting!",
  "room": {
    "code": "ABC123",
    "id": "uuid"
  }
}
```

#### 4. new_question
Sent when a new question is presented.

**Payload:**
```json
{
  "questionNumber": 1,
  "totalQuestions": 10,
  "question": "What is the capital of France?",
  "options": [
    {
      "key": "A",
      "text": "London"
    },
    {
      "key": "B",
      "text": "Berlin"
    },
    {
      "key": "C",
      "text": "Paris"
    },
    {
      "key": "D",
      "text": "Madrid"
    }
  ]
}
```

**Note:** `correctAnswer` is not included in client payload for security.

#### 5. answer_reveal
Sent after question time expires or all players answer.

**Payload:**
```json
{
  "correctAnswer": "C",
  "explanation": "Paris is the capital and largest city of France.",
  "playerAnswers": {
    "socket-id-1": {
      "playerId": "socket-id-1",
      "answer": "C",
      "answerTime": 3000,
      "isCorrect": true
    },
    "socket-id-2": {
      "playerId": "socket-id-2",
      "answer": "A",
      "answerTime": 5000,
      "isCorrect": false
    }
  },
  "updatedPlayers": [
    {
      "id": "socket-id-1",
      "username": "Player1",
      "score": 170,
      "isHost": true
    }
  ]
}
```

#### 6. game_ended
Sent when the game is completed.

**Payload:**
```json
{
  "reason": "Game completed",
  "leaderboard": [
    {
      "id": "socket-id-1",
      "username": "Player1",
      "avatar": "avatar-url",
      "score": 850,
      "isHost": true
    },
    {
      "id": "socket-id-2",
      "username": "Player2",
      "avatar": "avatar-url",
      "score": 650,
      "isHost": false
    }
  ],
  "roomCode": "ABC123"
}
```

#### 7. chat_message
Sent when a player sends a chat message.

**Payload:**
```json
{
  "playerId": "socket-id",
  "username": "Player1",
  "avatar": "avatar-url",
  "message": "Good luck everyone!",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### 8. error
Sent when an error occurs.

**Payload:**
```json
{
  "message": "Room not found"
}
```

**Common Error Messages:**
- "Room not found"
- "Game already in progress"
- "Not authorized"
- "Failed to join room"
- "Failed to start game"

---

## Data Models

### Room Model
```javascript
{
  id: "UUID (Primary Key)",
  code: "String (Unique, 6 characters)",
  hostId: "String (Socket ID)",
  status: "Enum ('waiting', 'playing', 'finished')",
  category: "String (Default: 'Umum')",
  difficulty: "Enum ('easy', 'medium', 'hard')",
  currentQuestion: "Integer (Default: 0)",
  totalQuestions: "Integer (Default: 10)",
  createdAt: "DateTime",
  updatedAt: "DateTime"
}
```

### Player Model
```javascript
{
  id: "String (Socket ID, Primary Key)",
  username: "String",
  avatar: "String (URL)",
  score: "Integer (Default: 0)",
  roomId: "UUID (Foreign Key)",
  isHost: "Boolean (Default: false)",
  createdAt: "DateTime",
  updatedAt: "DateTime"
}
```

### Question Structure (In-Memory)
```javascript
{
  question: "String",
  options: [
    {
      key: "String (A, B, C, D)",
      text: "String"
    }
  ],
  correctAnswer: "String (A, B, C, D)",
  explanation: "String"
}
```

---

## Error Handling

### HTTP Status Codes
- `200 OK`: Successful request
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

### Socket Error Events
All socket errors are sent via the `error` event with a message object:
```json
{
  "message": "Error description"
}
```

---

## Scoring System

### Score Calculation
- **Base Score**: 100 points for correct answer
- **Time Bonus**: `(10000 - answerTime) / 100` points
- **Minimum Score**: 50 points for correct answer
- **Incorrect Answer**: 0 points

### Example
If a player answers correctly in 3 seconds (3000ms):
- Base Score: 100
- Time Bonus: (10000 - 3000) / 100 = 70
- Total Score: 170 points

---

## Game Flow

1. **Room Creation/Joining**:
   - Host creates room → receives room code
   - Players join using room code
   - All players receive `room_update` events

2. **Game Start**:
   - Host selects category, difficulty, and question count
   - Server generates questions using AI service
   - All players receive `game_starting` event
   - First question sent after 3-second delay

3. **Question Phase**:
   - Players receive `new_question` event
   - 10-second timer starts
   - Players submit answers via `submit_answer`
   - When all answer or timer expires, `answer_reveal` sent

4. **Answer Reveal**:
   - Correct answer and explanation shown
   - Scores updated and broadcast
   - After 5 seconds, next question or game end

5. **Game End**:
   - Final leaderboard sent via `game_ended`
   - Room status updated to 'finished'

---

## Environment Variables

```env
PORT=3000
CLIENT_URL=http://localhost:5173
DATABASE_URL=your_database_url
GROQ_API_KEY=your_groq_api_key
```

---

## CORS Configuration

Allowed origins:
- `http://localhost:5173` (Default client)
- `http://localhost:5174`
- Process environment `CLIENT_URL`

Allowed methods: `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`
