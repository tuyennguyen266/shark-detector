const averageOf = (values) => {
  const sum = values.reduce((accumulator, currentValue) => accumulator + currentValue);
  return sum / values.length;
}

const getCurrentTimestamp = () => {
  return Math.round((new Date()).getTime() / 1000);
}

const removeDuplicateTrades = (trades) => {
  return trades.filter((elem, index, self) => index == self.indexOf(elem));
}

const filterTradesForSecond = (inTrades, timeInSecond) => {
  return inTrades.filter(trade => trade.timestamp > getCurrentTimestamp() - timeInSecond)
}

const filterTrades = (inTrades, fromTimestamp, toTimestamp) => {
  return inTrades.filter(trade => trade.timestamp >= fromTimestamp && trade.timestamp <= toTimestamp);
}

const getTradeStatistics = (trades) => {
  const buyTrade = trades.filter(trade => trade.type === 'buy');
  const sellTrade = trades.filter(trade => trade.type === 'sell');
  const buyVolume = buyTrade.reduce((accumulator, currentTrade) => accumulator + parseFloat(currentTrade.amount), 0);
  const sellVolume = sellTrade.reduce((accumulator, currentTrade) => accumulator + parseFloat(currentTrade.amount), 0);
  const buyNumber = buyTrade.length;
  const sellNumber = sellTrade.length;
  const buyCap = buyTrade.reduce((accumulator, currentTrade) => accumulator + (parseFloat(currentTrade.amount) * parseFloat(currentTrade.price)), 0);
  const sellCap = sellTrade.reduce((accumulator, currentTrade) => accumulator + (parseFloat(currentTrade.amount) * parseFloat(currentTrade.price)), 0);
  return {
    buyVolume,
    sellVolume,
    buyNumber,
    sellNumber,
    buyCap,
    sellCap
  }
}

module.exports = {
  averageOf,
  getCurrentTimestamp,
  removeDuplicateTrades,
  filterTradesForSecond,
  filterTrades,
  getTradeStatistics
}
