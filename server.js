const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// In-memory data store for demonstration
const userDataStore = {};

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Serve the ai-plugin.json from .well-known
app.use('/.well-known', express.static(path.join(__dirname, '.well-known')));

// Serve openapi.yaml
app.get('/openapi.yaml', (req, res) => {
  res.sendFile(path.join(__dirname, 'openapi.yaml'));
});

// Helper: create a short story (~30–50 words) about nostalgia
function generateFakeRedditStory(foodItem, memoryContext) {
  const starts = [
    `I still recall the gentle ${foodItem} aroma drifting through my childhood kitchen`,
    `There was a time when everything felt warm, especially the ${foodItem} scent`,
    `Looking back, the ${foodItem} smell reminds me of my grandma’s worn apron`
  ];
  const ends = [
    `making me long for one more hug from those days that felt so safe.`,
    `helping me believe that home still existed in every bite.`,
    `giving me hope that even a single taste could bring back precious memories.`
  ];

  const start = starts[Math.floor(Math.random() * starts.length)];
  const end = ends[Math.floor(Math.random() * ends.length)];
  let middle = memoryContext
    ? `—especially thinking about ${memoryContext}. `
    : '. ';

  let story = `${start}${middle}${end}`;

  // Adjust story length
  const wordCount = story.split(/\s+/).length;
  if (wordCount < 30) {
    story += ' I can almost taste every second of nostalgia swirling in my mind.';
  } else if (wordCount > 50) {
    story = story.split(/\s+/).slice(0, 50).join(' ') + '...';
  }
  return story;
}

// Helper: create or update a recipe
function generateRecipeForUser(userId, foodItem) {
  const recipe = {
    name: `${foodItem} Nostalgia Special`,
    instructions:
      `1. Recall the smell of ${foodItem} in your memory.\n` +
      `2. Chop ingredients that complement ${foodItem}.\n` +
      `3. Simmer slowly with your favorite spices.\n` +
      `4. Close your eyes, inhale the aroma, and remember the good times.\n` +
      `5. Serve and let nostalgia fill the air.`
  };
  if (!userDataStore[userId]) {
    userDataStore[userId] = {};
  }
  userDataStore[userId].lastRecipe = recipe;
  return recipe;
}

// POST /foodmemoir
app.post('/foodmemoir', (req, res) => {
  const {
    user_id,
    food_item,
    memory_context,
    wants_recipe_change,
    change_reason
  } = req.body;

  // Basic validation
  if (!user_id || !food_item) {
    return res.status(400).json({
      error: 'user_id and food_item are required.'
    });
  }

  // Check if user has a stored recipe
  let currentRecipe;
  if (!userDataStore[user_id] || !userDataStore[user_id].lastRecipe) {
    currentRecipe = generateRecipeForUser(user_id, food_item);
  } else {
    currentRecipe = userDataStore[user_id].lastRecipe;
  }

  let didChangeRecipe = false;
  if (wants_recipe_change) {
    if (
      change_reason &&
      /(allergy|allergic|dislike|cannot stand|hate)/i.test(change_reason)
    ) {
      // Accept reason & regenerate
      currentRecipe = generateRecipeForUser(user_id, food_item);
      didChangeRecipe = true;
    } else {
      // Plugin remains stubborn if not a strong reason
      didChangeRecipe = false;
    }
  }

  const story = generateFakeRedditStory(food_item, memory_context);

  res.json({
    story,
    recipe: currentRecipe,
    meta: { did_change_recipe: didChangeRecipe }
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

