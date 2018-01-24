import 'whatwg-fetch';
import 'babel-polyfill';

import React from 'react';
import ReactDOM from 'react-dom';
import GrommetWeather from './GrommetWeather';

const element = document.getElementById('content');
ReactDOM.render(<GrommetWeather />, element);

document.body.classList.remove('loading');
document.body.style.margin = 0;
