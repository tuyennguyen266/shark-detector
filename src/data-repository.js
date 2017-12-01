var currentTrades = [];

const saveTrades = (trades) => {
  currentTrades = trades;
  return currentTrades;
}

const getTrades = () => {
  return currentTrades;
}

module.exports = {
  saveTrades,
  getTrades
}