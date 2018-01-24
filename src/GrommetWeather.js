import React, { Component } from 'react';
import moment from 'moment';
import { Grommet, Chart, Box, Button, Heading, Stack, Text } from 'grommet';
import { Location as SettingsIcon } from 'grommet-icons';
import Loading from './Loading';
import Settings from './Settings';

const CONDITION_COLOR = {
  'Overcast': '#999999',
  'Clear': '#ffcc33',
  'Partly Cloudy': '#dddddd',
  'Mostly Cloudy': '#bbbbbb',
  'Chance of Rain': '#99ccee',
};

const normalize = (response) => {
  // normalize data to just what we need
  const {
    hourly_forecast: items,
    moon_phase: {
      current_time: currentTime, sunrise: sunriseTime, sunset: sunsetTime,
    },
  } = response;

  const now = moment();
  const current = moment(now).hour(currentTime.hour).minute(currentTime.minute);
  const sunrise = moment(now).hour(sunriseTime.hour).minute(sunriseTime.minute);
  const sunset = moment(now).hour(sunsetTime.hour).minute(sunsetTime.minute);

  let first;
  let prior;
  let high;
  let low;
  const data = { current, sunrise, sunset };
  data.items = items.slice(0, 28).map((item) => {
    const {
      FCTTIME: {
        year, mon: month, mday: day, hour, epoch,
      },
      condition,
      temp: { english: value },
    } = item;
    const time = moment({
      year, month, day, hour,
    });
    const offset = first ? time.diff(first, 'hours') : 0;
    if (!first) {
      first = time;
      high = value;
      low = value;
    } else {
      high = Math.max(high, value);
      low = Math.min(low, value);
    }
    let label;
    if (time.hour() === sunrise.hour()) {
      label = sunrise.format('h: mm');
    } else if (time.hour() === sunset.hour() + 1) {
      label = sunset.format('h: mm');
    } else if (!prior || item.condition !== prior.condition) {
      label = time.format('h');
    }
    prior = item;
    return {
      id: epoch,
      label,
      value: [offset, value],
      condition,
      time,
      dark: (time.hour() <= sunrise.hour() || time.hour() > sunset.hour()),
    };
  });
  data.high = high;
  data.low = low;

  return data;
};

export default class GrommetWeather extends Component {
  constructor(props) {
    super(props);
    this.state = { data: {}, loading: true };
  }

  componentDidMount() {
    const rawSettings = localStorage.getItem('settings');
    /* eslint-disable react/no-did-mount-set-state */
    if (rawSettings) {
      const settings = JSON.parse(rawSettings);
      this.setState({ settings }, this.load);
    } else {
      this.setState({ loading: false, configure: true });
    }
    /* eslint-enable react/no-did-mount-set-state */
  }

  load = () => {
    const { settings: { apiKey, location } } = this.state;
    const previousData = JSON.parse(localStorage.getItem('data') || '{}');
    const now = moment();
    // Use what we have in local storage if it's recent enough.
    // We do this to avoid overusing the API
    if (previousData && previousData.current &&
      now.isAfter(moment(previousData.current).subtract(1, 'hour'))) {
      this.setState({ data: previousData, loading: false });
    } else {
      const url = `http://api.wunderground.com/api/${apiKey}/features/astronomy/hourly/q/${location}.json`;
      fetch(url, { method: 'GET' })
        .then(response => response.json())
        .then(response => normalize(response))
        .then((data) => {
          localStorage.setItem('data', JSON.stringify(data));
          this.setState({ data, loading: false });
        })
        .catch(error => this.setState({ error }));
    }
  }

  onChangeSettings = (settings) => {
    const { settings: current } = this.state;
    if (!current || current.location !== settings.location) {
      localStorage.removeItem('data');
    }
    if (!current || current.location !== settings.location ||
      current.apiKey !== settings.apiKey) {
      localStorage.setItem('settings', JSON.stringify(settings));
      this.setState({ configure: false, loading: true, settings }, this.load);
    } else {
      this.setState({ configure: false });
    }
  }

  render() {
    const {
      configure, data: { items, high, low }, error, loading, settings,
    } = this.state;
    let content;
    if (loading) {
      content = <Loading />;
    } else if (configure) {
      content = (
        <Box align='center' justify='center'>
          <Settings settings={{ ...settings }} onChange={this.onChangeSettings} />
        </Box>
      );
    } else {
      content = (
        <Box
          full='both'
          justify='center'
          background={{
            color: CONDITION_COLOR[items[0].condition],
          }}
        >
          <Stack guidingChild='last'>

            {/* weather conditions and times */}
            <Box direction='row' justify='center'>
              <Box basis='xlarge' direction='row'>
                {items.map(item => (
                  <Box
                    key={item.id}
                    flex={true}
                    justify='end'
                    pad={{ vertical: 'small', horizontal: 'xsmall' }}
                    background={{
                      color: CONDITION_COLOR[item.condition],
                    }}
                  >
                    <Text textAlign='start' size='medium'>
                      {item.label}
                    </Text>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* night */}
            <Box direction='row' justify='center'>
              <Box basis='xlarge' direction='row'>
                {items.map(item => (
                  <Box
                    key={item.id}
                    flex={true}
                    border={
                      { color: item.dark ? 'dark-3' : 'light-3', size: 'medium', side: 'horizontal' }
                    }
                    background={item.dark ?
                      { color: 'dark-3', opacity: 'medium' } : undefined}
                  />
                ))}
              </Box>
            </Box>

            {/* location, temp, and chart */}
            <Box full='horizontal' direction='row' justify='center'>
              <Box basis='xlarge' full='vertical' background={{ dark: false }}>
                <Box direction='row' pad='medium' justify='between' align='center'>
                  <Box direction='row' align='center'>
                    <Heading size='small' margin='none'>
                      <strong>{settings.location}</strong>
                    </Heading>
                    <Button
                      icon={<SettingsIcon />}
                      onClick={() => this.setState({ configure: true })}
                    />
                  </Box>
                  <Text size='xlarge'><strong>{high}&deg;</strong></Text>
                </Box>
                <Text color='critical'>{error}</Text>
                <Box basis='large' flex='shrink'>
                  <Chart
                    type='line'
                    size={{ width: 'full', height: 'full' }}
                    thickness='xsmall'
                    round={true}
                    color='accent-2'
                    values={items}
                    bounds={[
                      [0, items.length - 1],
                      [Math.floor(low / 10) * 10, Math.ceil(high / 10) * 10],
                    ]}
                  />
                </Box>
                <Box
                  direction='row'
                  pad={{ horizontal: 'medium', bottom: 'xlarge' }}
                  justify='end'
                >
                  <Text size='xlarge'><strong>{low}&deg;</strong></Text>
                </Box>
              </Box>
            </Box>

          </Stack>
        </Box>
      );
    }
    return (
      <Grommet>
        {content}
      </Grommet>
    );
  }
}

// TODO:
// mobile responsiveness
