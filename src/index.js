const apiFetcher = require('./api-fetcher');
const unusualDetector = require('./unusual-detector');
const Utils = require('./utils');
const Config = require('./config');

var unusualVolumeLevel = 0;
var averageVolume = 0;
var numberOfUnusualColumn = 0;
var numberOfColumnBackUsual = 0;
var unusualColumns = [];
var tradeQueue = [];
var isFetchingTrades = false;
var lastTradeFetchingTimestamp = Utils.getCurrentTimestamp() - 10;

setInterval(() => {
  if (isFetchingTrades) return;
  fetchTrades();
}, 20000); // 5 seconds

setInterval(() => {
  fetchVolume();
}, 60000); // 1 minutes

const fetchVolume = () => {
  console.log('------------------------------------------------------------');
  apiFetcher.fetchVolume(Config.ohlcTimeframe, Config.ohlcSampleNumber)
    .then(result => checkVolume(result))
    .then(_ => {
      console.log('Average volume: ', averageVolume);
      console.log('Level of Unusual: ', unusualVolumeLevel);
      console.log('Number of unusual column: ', numberOfUnusualColumn);
      console.log('Number of back to usual column: ', numberOfColumnBackUsual);
      console.log('Unusual ohlcs: ', unusualColumns);
    })
    .catch(error => {
      console.log('ERROR: ', error);
    });
}

const checkVolume = (volumeData) => {
  const volumes = volumeData.volumes;
  const curVolume = volumes[volumes.length-1];

  if (unusualVolumeLevel === 0) {
    const lastVolumes = volumes.splice(0, volumes.length - 1);
    averageVolume = Utils.averageOf(lastVolumes);
  }

  const unusualLevel = unusualDetector.detectUnusualVolume(curVolume, averageVolume);
  if (unusualLevel) {
    numberOfUnusualColumn += 1;
    increaseLevelOfUnusualIfLower(unusualLevel);
    resetNumberOfColumnBackUsual();
    storeCurrentColumnIfUnusual(volumeData.ohlc);
  } else {
    increaseNumberOfColumnBackToUsual();
    resetIfBackToUsual();
  }
  console.log('checkVolume response');
}

const increaseLevelOfUnusualIfLower = (expectLevel) => {
  if (unusualVolumeLevel < expectLevel) {
    unusualVolumeLevel = expectLevel;
  }
}

const increaseNumberOfColumnBackToUsual = () => {
  if (unusualVolumeLevel > 0) {
    numberOfColumnBackUsual += 1;
  }
}

const resetNumberOfColumnBackUsual = () => {
  numberOfColumnBackUsual = 0;
}

const storeCurrentColumnIfUnusual = (ohlcs) => {
  if (unusualVolumeLevel <= 0) {
    return;
  }
  const curOhlc = ohlcs[ohlcs.length-1];
  const columnTrades = Utils.filterTrades(tradeQueue, curOhlc[0] - Config.ohlcTimeframe, curOhlc[0]);
  const curColumn = {
    ohlc: curOhlc,
    statistics: Utils.getTradeStatistics(columnTrades)
  }
  unusualColumns.push(curColumn);
}

const resetIfBackToUsual = () => {
  if (numberOfColumnBackUsual >= Config.stopUnusualNumber) {
    unusualVolumeLevel = 0;
    averageVolume = 0;
    numberOfUnusualColumn = 0;
    numberOfColumnBackUsual = 0;
    unusualColumns = [];
  }
}

const fetchTrades = () => {
  isFetchingTrades = true;
  return apiFetcher.fetchTrades(lastTradeFetchingTimestamp)
    .then(trades => ([...trades, ...tradeQueue]))
    .then(trades => (Utils.removeDuplicateTrades(trades)))
    .then(trades => {
      tradeQueue = Utils.filterTradesForSecond(trades, Config.secondToKeepTrades);
      return tradeQueue;
    })
    .then(trades => {
      if (trades.length > 0) {
        lastTradeFetchingTimestamp = trades[0].timestamp;
      }
      return trades;
    })
    .then(trades => {
      console.log('========================================================');
      console.log('TRADES STATISTICS:');
      console.log(Utils.getTradeStatistics(trades));
    })
    .then(_ => {
      console.log('FETCH TRADES DONE ========================================================');
      isFetchingTrades = false;
    })
    .catch(error => {
      console.log('ERROR: ', error);
      isFetchingTrades = false;
    });
}