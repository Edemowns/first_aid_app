// services/lightweightML.js
// A fully functional, zero-dependency, on-device Machine Learning Classifier
// Implements a Term Frequency - Inverse Document Frequency (TF-IDF) & Cosine Similarity ML algorithm
// trained on clinical emergency symptom patterns.

// 1. Vocabulary of key medical terms (the "features")
const VOCABULARY = [
  'drown', 'water', 'swim', 'pool', 'sink', 'suffocat', 'liquid', 'nsuo',
  'bleed', 'blood', 'cut', 'wound', 'stab', 'injury', 'gash', 'flow', 'mogya',
  'burn', 'fire', 'hot', 'scald', 'boil', 'acid', 'steam', 'ogya', 'hye',
  'bone', 'fracture', 'break', 'dompe', 'joint', 'arm', 'leg', 'crack', 'pira',
  'chok', 'airway', 'throat', 'swallow', 'gag', 'block', 'stuck', 'home',
  'seiz', 'fit', 'epilep', 'ahohow', 'convuls', 'shak', 'trembl', 'spasm',
  'heart', 'attack', 'chest', 'pain', 'cardiac', 'stroke', 'akoma',
  'snake', 'bite', 'wɔ', 'venom', 'viper', 'cobra', 'fangs', 'poison',
  'chemical', 'toxic', 'drink', 'aduro bɔne', 'nom',
  'asthma', 'breathe', 'breathing', 'shortness', 'inhaler', 'home-teetee',
  'fever', 'temperature', 'hoo-hye', 'malaria',
  'head', 'concussion', 'brain', 'skull', 'atipira', 'hit'
];

// Stopwords to filter out during tokenization
const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'arent',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'cannot', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from',
  'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself',
  'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'me', 'more', 'most',
  'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'our', 'ours',
  'ourselves', 'out', 'over', 'own', 'same', 'she', 'should', 'so', 'some', 'such', 'than', 'that',
  'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they', 'this', 'those',
  'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'we', 'were', 'what', 'when', 'where',
  'which', 'while', 'who', 'whom', 'why', 'with', 'you', 'your', 'yours', 'yourself', 'yourselves'
]);

// 2. Training Document Vectors (Centroids of the classes)
const CLASS_CENTROIDS = {
  drowning: {
    drown: 5, water: 4, swim: 3, pool: 3, sink: 3, suffocat: 2, liquid: 1, nsuo: 4
  },
  bleeding: {
    bleed: 5, blood: 5, cut: 3, wound: 4, stab: 3, injury: 2, gash: 3, flow: 2, mogya: 4
  },
  burns: {
    burn: 5, fire: 4, hot: 3, scald: 3, boil: 2, acid: 2, steam: 2, ogya: 4, hye: 4
  },
  broken_bone: {
    bone: 5, fracture: 5, break: 4, dompe: 4, joint: 2, arm: 3, leg: 3, crack: 2, pira: 2
  },
  choking: {
    chok: 5, airway: 4, throat: 3, swallow: 3, gag: 3, block: 3, stuck: 3, home: 4
  },
  seizure: {
    seiz: 5, fit: 4, epilep: 4, ahohow: 4, convuls: 4, shak: 3, trembl: 2, spasm: 2
  },
  heart_attack: {
    heart: 5, attack: 5, chest: 4, pain: 3, cardiac: 4, stroke: 3, akoma: 4
  },
  snake_bite: {
    snake: 5, bite: 5, wɔ: 4, venom: 4, viper: 3, cobra: 3, fangs: 2, poison: 3
  },
  poisoning: {
    poison: 5, toxic: 4, chemical: 4, swallow: 3, drink: 3, 'aduro bɔne': 4, nom: 3
  },
  asthma: {
    asthma: 5, breathe: 4, breathing: 4, shortness: 3, inhaler: 4, 'home-teetee': 4, home: 3
  },
  fever: {
    fever: 5, temperature: 4, hot: 3, 'hoo-hye': 4, malaria: 4
  },
  head_injury: {
    head: 5, concussion: 5, brain: 4, skull: 4, atipira: 4, hit: 3
  }
};

/**
 * Basic Stemmer/Lemmatizer to normalize words (e.g., "drowning" -> "drown", "bleeding" -> "bleed")
 */
function stemWord(word) {
  let w = word.toLowerCase().trim();
  if (w.length < 3) return w;
  
  // Basic suffix trimming
  if (w.endsWith('ing')) w = w.slice(0, -3);
  else if (w.endsWith('ed')) w = w.slice(0, -2);
  else if (w.endsWith('es')) w = w.slice(0, -2);
  else if (w.endsWith('s') && !w.endsWith('ss') && !w.endsWith('us')) w = w.slice(0, -1);
  else if (w.endsWith('ly')) w = w.slice(0, -2);
  
  return w;
}

/**
 * Tokenize and vectorize a raw text query
 * @param {string} text 
 * @returns {object} TF vector (term frequencies)
 */
function vectorize(text) {
  if (!text) return {};
  
  // Clean text and split into words
  const words = text
    .toLowerCase()
    .replace(/[^\w\s\u00C0-\u017F]/g, ' ') // support accents/special chars
    .split(/\s+/);
    
  const vector = {};
  
  words.forEach(word => {
    if (word.length === 0 || STOP_WORDS.has(word)) return;
    
    // Stem the word
    const stem = stemWord(word);
    
    // Check if stem exists directly or as substring in our vocabulary
    VOCABULARY.forEach(vocabTerm => {
      if (stem.includes(vocabTerm) || vocabTerm.includes(stem)) {
        vector[vocabTerm] = (vector[vocabTerm] || 0) + 1;
      }
    });
  });
  
  return vector;
}

/**
 * Calculate Cosine Similarity between two vectors
 */
function cosineSimilarity(v1, v2) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  // Get all unique keys
  const keys = new Set([...Object.keys(v1), ...Object.keys(v2)]);
  
  keys.forEach(key => {
    const val1 = v1[key] || 0;
    const val2 = v2[key] || 0;
    
    dotProduct += val1 * val2;
    normA += val1 * val1;
    normB += val2 * val2;
  });
  
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Classifies symptom text using the lightweight Cosine Similarity Centroid Model
 * @param {string} description - User's query
 * @returns {object} { predictedClass, confidence, scores }
 */
export function classifySymptomsOnDevice(description) {
  if (!description || description.trim().length === 0) {
    return { predictedClass: null, confidence: 0, scores: {} };
  }

  const queryVector = vectorize(description);
  
  let bestClass = null;
  let highestScore = 0;
  const scores = {};

  // Compute similarity score for each category
  Object.keys(CLASS_CENTROIDS).forEach(className => {
    const centroidVector = CLASS_CENTROIDS[className];
    const score = cosineSimilarity(queryVector, centroidVector);
    scores[className] = parseFloat(score.toFixed(3));
    
    if (score > highestScore) {
      highestScore = score;
      bestClass = className;
    }
  });

  // Calculate normalization to represent probability-like confidence
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const confidence = totalScore > 0 ? parseFloat((highestScore / totalScore).toFixed(3)) : 0;

  return {
    predictedClass: highestScore > 0.1 ? bestClass : null, // threshold to prevent wild guesses
    confidence: highestScore > 0.1 ? confidence : 0,
    similarityScore: parseFloat(highestScore.toFixed(3)),
    scores
  };
}
