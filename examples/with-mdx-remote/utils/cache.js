const LRU = require('lru-cache')

export const cache = new LRU(50)
