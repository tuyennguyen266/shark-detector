const Utils = require('./utils');

const removeDuplicateTrades = (trades) => {
  return trades.filter((elem, index, self) => index == self.indexOf(elem));
}

const filterTradesForSecond = (inTrades, timeInSecond) => {
  return inTrades.filter(trade => trade.timestamp > Utils.getCurrentTimestamp() - timeInSecond)
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

// leave timeframe for now, default is 1 minute
// TODO: calculate timeframe startPoint and endPoint
const getOhlcs = (trades, columnNumber, timeframe) => {
  const now = Utils.getCurrentTimestamp();
  const roundedNowByTimeframe = (Math.round(now / 60) - 1) * 60;

  var ohlcs = [];
  var columnIndex = 1;
  while (columnIndex <= columnNumber) {
    const columnEndTimestamp = roundedNowByTimeframe - 60 * (columnNumber - columnIndex);
    const columnStartTimestamp = columnEndTimestamp - 59;
    const tradesInColumn = filterTrades(trades, columnStartTimestamp, columnEndTimestamp);
    if (tradesInColumn.length <= 0 && ohlcs.length <= 0) {
      columnIndex += 1;
      continue;
    }
    const openPrice = parseFloat(tradesInColumn[0].price);
    const closePrice = parseFloat(tradesInColumn[tradesInColumn.length - 1].price);
    const highPrice = tradesInColumn.reduce((accumulator, trade) => Math.max(accumulator, parseFloat(trade.price)), 0);
    const lowPrice = tradesInColumn.reduce((accumulator, trade) => Math.min(accumulator, parseFloat(trade.price)), 999999999999);
    const volume = tradesInColumn.reduce((accumulator, trade) => accumulator + parseFloat(trade.amount), 0);
    const ohlc = [columnEndTimestamp, openPrice, highPrice, lowPrice, closePrice, volume];
    ohlcs.push(ohlc);
    columnIndex += 1;
  }

  return ohlcs;
}


module.exports = {
  removeDuplicateTrades,
  filterTradesForSecond,
  filterTrades,
  getTradeStatistics,
  getOhlcs
}