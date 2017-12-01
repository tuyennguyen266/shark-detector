const ApiFetcher = require('./api-fetcher');
const UnusualDetector = require('./unusual-detector');
const Utils = require('./utils');
const Config = require('./config');
const DataRepo = require('./data-repository');
const TradeUtils = require('./trades-utils');

var unusualVolumeLevel = 0;
var averageVolume = 0;
var numberOfUnusualColumn = 0;
var numberOfColumnBackUsual = 0;
var unusualColumns = [];
var isFetchingTrades = false;
var lastTradeFetchingTimestamp = Utils.getCurrentTimestamp() - 10;
var lastTradeId = 0;

setInterval(() => {
  if (isFetchingTrades) return;
  fetchTrades();
}, 5000); // 10 seconds

setInterval(() => {
  fetchVolume();
}, 60000); // 1 minutes

const fetchVolume = () => {
  console.log('------------------------------------------------------------');
  ApiFetcher.fetchVolume(Config.ohlcTimeframe, Config.ohlcSampleNumber)
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
  if (volumes.length < Config.ohlcSampleNumber) {
    return;
  }

  const curVolume = volumes[volumes.length-1];

  if (unusualVolumeLevel === 0) {
    const lastVolumes = volumes.splice(0, volumes.length - 1);
    averageVolume = Utils.averageOf(lastVolumes);
  }

  const unusualLevel = UnusualDetector.detectUnusualVolume(curVolume, averageVolume);
  if (unusualLevel) {
    numberOfUnusualColumn += 1;
    increaseLevelOfUnusualIfLower(unusualLevel);
    resetNumberOfColumnBackUsual();
    storeCurrentColumnIfUnusual(volumeData.ohlc);
  } else {
    increaseNumberOfColumnBackToUsual();
    resetIfBackToUsual();
  }
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
  const columnTrades = TradeUtils.filterTrades(DataRepo.getTrades(), curOhlc[0] - Config.ohlcTimeframe, curOhlc[0]);
  const curColumn = {
    ohlc: curOhlc,
    statistics: TradeUtils.getTradeStatistics(columnTrades)
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
  console.log('========================================================');
  isFetchingTrades = true;
  return ApiFetcher.fetchTrades(lastTradeFetchingTimestamp)
    // .then(trades => {
    //   console.log('New Trade Beginning: ', trades[0]);
    //   return trades;
    // })
    .then(trades => {
      console.log('NEW TRADES STATISTICS:');
      console.log(TradeUtils.getTradeStatistics(trades));
      return trades;
    })
    .then(trades => ([...trades, ...DataRepo.getTrades()]))
    .then(trades => (TradeUtils.removeDuplicateTrades(trades)))
    .then(trades => {
      return DataRepo.saveTrades(TradeUtils.filterTradesForSecond(trades, Config.secondToKeepTrades));
    })
    .then(trades => {
      if (trades.length > 0) {
        lastTradeFetchingTimestamp = trades[0].timestamp;
      }
      return trades;
    })
    .then(trades => {
      console.log('FETCH TRADES DONE ========================================================');
      isFetchingTrades = false;
      return trades
    })
    .catch(error => {
      console.log('ERROR: ', error);
      isFetchingTrades = false;
    });
}