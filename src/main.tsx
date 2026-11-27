import { render } from 'preact';
import { App } from './ui/App';
import { installTips } from './ui/tips';
import './styles.css';

installTips();
render(<App />, document.getElementById('app')!);
