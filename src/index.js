const axios = require('axios');
const sleep = require('sleep');
const apiFetcher = require('./api-fetcher');
const dataAccess = require('./data-repository');

const SystemInterval = 60; // seconds


while (true) {

    // Fetching trades from market
    const trades = apiFetcher.getTrades();
    dataAccess.saveTrades(trades);

    const

    // Detect shark trades



    sleep(SystemInterval);
}