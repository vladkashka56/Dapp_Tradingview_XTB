import Xapi from 'xoh-xapi';
// import pkg from 'xoh-xapi';
// const Xapi = pkg.default;

console.log("Xapi:", Xapi)
// const x = new Xapi({
//     accountId: "14867939",
//     password: "xoh55828",
//     type: "demo",
//     broker: "xtb",
// });

// await x.init();



let lastCandleTime = 0
/*
or to solve this issue, when you send second request
set From={any old time, from time doesn't matter}
set TO={first candle time from 1st request}
*/

const MATRIX = 90
const dayTime = 24 * 60 * 60 * 1000

export const intervals = {
    '1': '1m',
    '5': '5m',
    '15': '15m',
    '30': '30m',
    '60': '1h',
    '240': '4h',
    '1440': '1d',
    '10080': '7d',
    '43200': '1M'
}

// top_symbol: 1 - only popular pairs
export const getSymbols = async () => {
    const x = new Xapi({
        accountId: "14867939",
        password: "xoh55828",
        type: "demo",
        broker: "xtb",
    });

    const init = await x.init();
    await x.streamer.init();
    const datas = await x.getAllSymbols();
    const symbols = datas.map(i => {
        return { 
            symbol: i.symbol,
            description: i.description,
            categoryName: i.categoryName,
            groupName: i.groupName,
        }
    })

    return symbols || [];
}



// [{ "id": 1, "name": "Euro US Dollar", "symbol": "EUR/USD", "decimal": 4 }]
export const getSymbol = async (symbol) => {
    const x = new Xapi({
        accountId: "14867939",
        password: "xoh55828",
        type: "demo",
        broker: "xtb",
    });

    const init = await x.init();
    await x.streamer.init();
    const data = await x.getSymbol({symbol: symbol})
    console.log("request end:", data.symbol)

    return({
        name: data.symbol,
        symbol: data.symbol,
        description: data.description,
        categoryName: data.categoryName,
        baseAssetName: data.currency,
        quoteAssetName: data.currencyProfit,
        data
        // pricescale: parseFloat('1' + Array(parseFloat(responseSymbol.decimal)).fill(0).join(''))
    })
}


// (symbol, interval, from, to)
export const getKlines = async ({ symbol, interval, periodParams }) => {
    const x = new Xapi({
        accountId: "14867939",
        password: "xoh55828",
        type: "demo",
        broker: "xtb",
    });
    const init = await x.init();
    await x.streamer.init();
    const { precision } = await x.getSymbol({symbol: symbol});
    let cur_timestamp = new Date().getTime();
    let start_timestamp = cur_timestamp- 1440*60*1000;

    // const periodAvailable = (periodParams.to > periodParams.from) && (periodParams.to > 0) && (periodParams.from > 0);

    // console.log("klines param:", periodParams.firstDataRequest? parseInt(cur_timestamp)  :  parseInt(1000 * periodParams.to))

    const datas = await x.getChartRangeRequest ({
        // "end": !periodAvailable? parseInt(cur_timestamp)  :  parseInt(1000 * periodParams.to),
        "end": parseInt(1000 * periodParams.to),
        "period": checkInterval(interval)? parseInt(interval) : 5,
        // "start": !periodAvailable? parseInt(start_timestamp)  : parseInt(1000 * periodParams.from),
        "start": parseInt(1000 * periodParams.from),
        "symbol": symbol,
        "ticks": 0
    });
    const klines = datas.map(data => formatingKline(data, precision))

    console.log("klines:", klines, symbol, periodParams, interval)

    return klines || [];
}

// (symbol, interval)
export const getLastKline = async (symbol, interval) => {
    const x = new Xapi({
        accountId: "14867939",
        password: "xoh55828",
        type: "demo",
        broker: "xtb",
    });

    let cur_timestamp = new Date().getTime();
    let start_timestamp = cur_timestamp- 5*interval*60*1000;

    const init = await x.init();
    await x.streamer.init();

    const { precision } = await x.getSymbol({symbol: symbol});
    console.log("param:", start_timestamp, interval, precision)
    const datas = await x.getChartLastRequest ({
        "period": checkInterval(interval)? parseInt(interval) : 5,
        "start": parseInt(start_timestamp),
        "symbol": symbol,
    });
    console.log("datas:", datas)
    const kline = formatingKline(datas.pop(), precision)

    return kline;
}

export const checkInterval = (interval) => !!intervals[interval]




const formatingKline = (data, precision) => {
    return {
        time: data.ctm,
        open: parseFloat(data.open/Math.pow(10, precision)),
        high: parseFloat((data.open+data.high)/Math.pow(10, precision)),
        low: parseFloat((data.open+data.low)/Math.pow(10, precision)),
        close: parseFloat((data.open+data.close)/Math.pow(10, precision)),
        volume: parseFloat(data.vol)
    }
}