const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const Player = require('../models/Player');

// Get room by code
router.get('/rooms/:code', async (req, res) => {
  try {
    const room = await Room.findOne({
      where: { code: req.params.code },
      include: [{ model: Player }]
    });

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.json(room);
  } catch (error) {
    console.error('Error fetching room:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get available avatars
router.get('/avatars', (req, res) => {
  // Gunakan DiceBear API langsung
  const avatars = [
    'https://api.dicebear.com/7.x/bottts/svg?seed=1',
    'https://api.dicebear.com/7.x/bottts/svg?seed=2',
    'https://api.dicebear.com/7.x/bottts/svg?seed=3',
    'https://api.dicebear.com/7.x/bottts/svg?seed=4',
    'https://api.dicebear.com/7.x/bottts/svg?seed=5',
    'https://api.dicebear.com/7.x/bottts/svg?seed=6',
    'https://api.dicebear.com/7.x/bottts/svg?seed=7',
    'https://api.dicebear.com/7.x/bottts/svg?seed=8',
  ];
  
  res.json(avatars);
});

// Get quiz categories
router.get('/categories', (req, res) => {
  const categories = [
    'Umum',
    'Sains',
    'Sejarah',
    'Geografi',
    'Olahraga',
    'Hiburan',
    'Teknologi'
  ];
  
  res.json(categories);
});

module.exports = router;