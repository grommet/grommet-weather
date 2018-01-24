import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Anchor, Box, Button, Heading, Paragraph, TextInput, Text } from 'grommet';
import Form from 'react-formify';

const Field = ({
  children, error, label, help, ...rest
}) => {
  let header;
  if (label || help || error) {
    header = (
      <Box
        direction='row'
        justify='between'
        pad={{ horizontal: 'small', top: 'xsmall' }}
        {...rest}
      >
        <Text>{label}</Text>
        <Text color={error ? 'status-critical' : 'dark-5'}>{error || help}</Text>
      </Box>
    );
  }
  return (
    <Box
      direction='column'
      border={{ color: 'light-2', side: 'bottom', size: 'small' }}
      margin={{ vertical: 'xsmall' }}
    >
      {header}
      {children}
    </Box>
  );
};

export default class Settings extends Component {
  // onInputCity = (event) => {
  //   const url = `http://autocomplete.wunderground.com/aq?query=${encodeURIComponent(event.target.value)}`;
  //   fetch(url, { method: 'GET', mode: 'cors' })
  //     .then(response => response.json())
  //     .then((response) => {
  //       console.log('!!!', response);
  //       // this.setState({ data, loading: false });
  //     })
  //     .catch(error => console.log('!!!', error)); // this.setState({ error }));
  // }

  render() {
    const { settings } = this.props;
    return (
      <Form
        defaultValue={settings}
        rules={{ location: 'required', apiKey: 'required' }}
        onSubmit={nextSettings => this.props.onChange(nextSettings)}
      >
        {(state, errors) => (
          <Box pad='large'>
            <Heading level={2} margin={{ top: 'none' }}>Settings</Heading>
            <Paragraph margin={{ bottom: 'small' }}>
              grommet-weather uses the <Anchor
                href='http://api.wunderground.com/weather/api'
                label='Wunderground API'
              />, which requires an appropriate location and API key.
            </Paragraph>
            <Field label='Location' help='e.g. "CA/Mountain_View"' error={errors.location}>
              <TextInput plain={true} {...state.location} />
            </Field>
            <Field label='API Key' error={errors.apiKey}>
              <TextInput plain={true} {...state.apiKey} />
            </Field>
            <Box tag='footer' margin={{ top: 'medium' }} align='start'>
              <Button type='submit' primary={true} label='OK' />
            </Box>
          </Box>
        )}
      </Form>
    );
  }
}

Settings.propTypes = {
  onChange: PropTypes.func.isRequired,
};
