import './App.css';
import { TVChartContainer } from './components/TVChartContainer/index';
import { version } from './charting_library';

const App = () => {
	return (
		<div className={'App'}>
			<header className={'App-header'}>
				<h1 className={'App-title'}>
					TradingView Charting Library
				</h1>
			</header>
			<TVChartContainer />
		</div>
	);
}

export default App;
