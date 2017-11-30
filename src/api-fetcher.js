const axios = require('axios');
const Config = require('./config');
const Utils = require('./utils');

const fetchVolume = (timeframeInSeconds, numberOfColumns) => {
  return fetchOHLC(timeframeInSeconds, numberOfColumns)
    .then(result => {
      if (result.length === 0) {
        throw 'empty result';
      }
      const volumes = result.map(ohlc => ohlc[5]);
      console.log('result: ', result);
      console.log('volumes: ', volumes);
      return {
        volumes,
        ohlc: result,
        startTimestamp: result[0][0],
        endTimestamp: result[result.length-1][0]
      }
    })
}

const fetchOHLC = (timeframeInSeconds, numberOfColumns) => {
  const nowTimestamp = Utils.getCurrentTimestamp();
  const afterTimestamp = nowTimestamp - numberOfColumns * timeframeInSeconds;
  const beforeTimestamp = nowTimestamp - timeframeInSeconds;
  const apiUrl = `https://api.cryptowat.ch/markets/${Config.market}/${Config.pair}/ohlc?after=${afterTimestamp}&before=${beforeTimestamp}&periods=${timeframeInSeconds}`;
  return axios.get(apiUrl)
    .then(response => {
      if (!response.data.result[`${timeframeInSeconds}`]) throw 'not have required key in response';
      return response.data.result[`${timeframeInSeconds}`];
    })
    .catch(error => console.log(error));
}

// Note this only fetch 100 trades
const fetchTrades = (fromTimestamp) => {
  const apiUrl = `https://api.bitfinex.com/v1/trades/${Config.pair}?timestamp=${fromTimestamp}&limit_trades=100`;
  console.log('apiUrl: ', apiUrl);
  return axios.get(apiUrl)
    .then(response => {
      return response.data;
    })
}

const fetchTradesAccummulateUntilNow = (trades) => {
  const fromTimestamp = trades.length > 0 ? trades[0].timestamp : Utils.getCurrentTimestamp() - 20;
  return fetchTrades(fromTimestamp)
    .then(newTrades => {
      const accummulatedTrades = Utils.removeDuplicateTrades([...newTrades, ...trades]);
      return accummulatedTrades;
    })
    .then(accummulatedTrades => {
      const latestTrade = accummulatedTrades.length > 0 ? accummulatedTrades[0] : null;
      if (!latestTrade) {
        return [];
      }
      if (latestTrade.timestamp >= Utils.getCurrentTimestamp() - 10) {
        return accummulatedTrades;
      }
      return fetchTradesAccummulateUntilNow(accummulatedTrades);
    });
}

module.exports = {
  fetchOHLC,
  fetchVolume,
  fetchTrades,
  fetchTradesAccummulateUntilNow
};