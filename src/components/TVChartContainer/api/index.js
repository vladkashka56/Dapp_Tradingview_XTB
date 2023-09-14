import { getSymbols, getSymbol, getKlines, getLastKline, checkInterval, intervals } from './rest'

const configurationData = {
	supports_marks: false,
	supports_timescale_marks: false,
	supports_time: true,
	supported_resolutions: Object.keys(intervals)
}

// onReady => resolveSymbol => getBars => subscribeBars
export default {
	// get a configuration of your datafeed (e.g. supported resolutions, exchanges and so on)
	onReady: (callback) => {
		console.log('[onReady]: Method call')
		setTimeout(() => callback(configurationData)) // callback must be called asynchronously
	},
	// no need if not using search
	searchSymbols: async (userInput, exchange, symbolType, onResultReadyCallback) => {
		console.log('[searchSymbols]: Method call')
		const symbols = await getSymbols() // get sync data

		if (symbols.length > 0) {
			const filteredSymbols = symbols.filter(i => i.symbol.includes(userInput) || i.description.includes(userInput) || i.categoryName.includes(userInput) || i.groupName.includes(userInput))  // filter symbols
			const updSymbols = filteredSymbols.map(i => {
				return {
					symbol: i.symbol,
					ticker: i.symbol,
					full_name: i.symbol,
					description: i.description,
					exchange: i.categoryName,
				}
			})

			return onResultReadyCallback(updSymbols)
		}

		console.log('[searchSymbols] Not found')
		onResultReadyCallback([])

	},
	// retrieve information about a specific symbol (exchange, price scale, full symbol etc.)
	resolveSymbol: async (symbolName, onSymbolResolvedCallback, onResolveErrorCallback) => {
		console.log('[resolveSymbol]: Method call', symbolName)
		const symbolInfo = ({ symbol, name, description, categoryName, pricescale, quoteAssetName }) => ({
			name: name,
			description: description,
			ticker: symbol,
			exchange: categoryName,
			session: '24x7',
			minmov: 1,
			pricescale: pricescale || 10000, // https://github.com/tradingview/charting_library/wiki/Symbology#common-prices
			has_intraday: true,
			has_daily: true,
			has_weekly_and_monthly: true,
			// has_no_volume: false, // if no volume in response kline data, disable indicator
			currency_code: quoteAssetName,
			timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
		})

		const symbol = await getSymbol(symbolName)

		if (symbol) {
			console.log(symbol)
			return onSymbolResolvedCallback(symbolInfo(symbol))
		}

		onResolveErrorCallback('[resolveSymbol]: symbol not found')

	},
	// get historical data for the symbol
	getBars: async (symbolInfo, resolution, periodParams, onHistoryCallback, onErrorCallback) => {
		console.log('[getBars] Method call', symbolInfo, periodParams, resolution)
		if (!checkInterval(resolution)) {
			console.log("resolution error:", resolution)
			resolution = 5; // set default resolution
			// return onErrorCallback('[getBars] Invalid interval')
		}
		const klines = await getKlines({symbol: symbolInfo.ticker, interval: resolution, periodParams, params: {contract: '0xED5AF388653567Af2F388E6224dC7C4b3241C544', marketplaces: 'all'}});
		console.log("getBars => klines", klines);
		(klines.length > 0) ?
			onHistoryCallback(klines.map(kline => {
				return {
					time: kline.time,
					close: parseFloat(kline.close),
					open: parseFloat(kline.open),
					high: parseFloat(kline.high),
					low: parseFloat(kline.low),
					volume: parseFloat(kline.volume)
				}
			}), {
				noData: false
		}) : onErrorCallback('Klines data error')
	},

	// subscription to real-time updates
	subscribeBars: (symbolInfo, resolution, onRealtimeCallback, subscribeUID, onResetCacheNeededCallback) => {
		console.log('[subscribeBars]: Method call with subscribeUID:', subscribeUID)
		clearInterval(window.interval)

		// Global variable
		window.interval = setInterval(function () {
			getLastKline(symbolInfo.ticker, resolution).then(kline => {
				console.log("subscribe data:", kline, window.interval, subscribeUID)
				onRealtimeCallback(kline)
			})
		}, 1000 * 60) // 60s update interval

		console.log("subscribe interval:", subscribeUID, window.interval)

	},
	unsubscribeBars: (subscriberUID) => {
		console.log('[unsubscribeBars]: Method call with subscriberUID:', subscriberUID, window.interval)
		console.log('[unsubscribeBars]: cleared')
	},
};