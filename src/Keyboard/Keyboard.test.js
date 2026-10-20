import React from 'react';
import { mount } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { MemoryRouter } from 'react-router-dom';
import ConnectedHome from '../components/Home/Home.component';
import { getSuggestions, completeWord } from './suggestions';
import { speak } from '../providers/SpeechProvider/SpeechProvider.actions';

jest.mock('../providers/SpeechProvider/SpeechProvider.actions', () => ({
  speak: jest.fn(text => ({ type: 'TEST_SPEAK', text })),
  cancelSpeech: jest.fn(() => ({ type: 'TEST_CANCEL' }))
}));

const Home = ConnectedHome.WrappedComponent;
let wrapper;
const key = value => {
  act(() => {
    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: value, bubbles: true })
    );
  });
  wrapper.update();
};
const press = label => {
  wrapper
    .find('.keyboard-key')
    .filterWhere(button =>
      label === 'CAPS'
        ? button.prop('aria-pressed') !== undefined
        : button.prop('aria-label') === label
    )
    .simulate('click');
};

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
  act(() => {
    wrapper = mount(
      <MemoryRouter>
        <Home dispatch={jest.fn()} output={[]} />
      </MemoryRouter>
    );
  });
  key('Enter');
});
afterEach(() => wrapper.unmount());

test('accented letters stay silent until the complete phrase is explicitly spoken', () => {
  const accents =
    '\u00e1\u00e0\u00e2\u00e3\u00e9\u00ea\u00ed\u00f3\u00f4\u00f5\u00fa\u00fc\u00e7';
  [...accents].forEach(letter => {
    press(letter);
    expect(speak).not.toHaveBeenCalled();
  });
  expect(wrapper.find('.keyboard-screen').text()).toContain(accents);
  expect(localStorage.getItem('historicoFrases')).toBeNull();
  press('ESPA\u00c7O');
  press('CAPS');
  press('\u00c1');
  expect(wrapper.find('.keyboard-screen').text()).toContain(
    accents + ' \u00c1'
  );
  key('f');
  expect(speak).toHaveBeenLastCalledWith(accents + ' \u00c1');
  expect(JSON.parse(localStorage.getItem('historicoFrases'))).toEqual([
    accents + ' \u00c1'
  ]);
  key('Backspace');
  press('APAGAR');
  key('f');
  expect(speak).toHaveBeenLastCalledWith(accents);
});

test('arrows and Enter reach accent and symbol rows, space, delete, and back', () => {
  key('ArrowDown');
  key('ArrowDown');
  key('ArrowDown');
  key('ArrowDown');
  key('Enter');
  expect(speak).not.toHaveBeenCalled();
  key('ArrowRight');
  key('Enter');
  expect(speak).not.toHaveBeenCalled();
  key('ArrowLeft');
  key('ArrowDown');
  key('Enter');
  expect(speak).not.toHaveBeenCalled();
  key('ArrowDown');
  key('ArrowRight');
  key('Enter');
  key('ArrowUp');
  key('ArrowUp');
  key('Enter');
  expect(wrapper.find('.keyboard-screen').text()).toContain(
    '\u00e1\u00e0! \u00e0'
  );
  key('v');
  expect(wrapper.find('.keyboard-screen').exists()).toBe(false);
});

const suggestions = () => wrapper.find('.keyboard-suggestion');
const type = text => [...text].forEach(letter => press(letter));

test('suggestions update as typing continues and can be ignored', () => {
  type('c');
  expect(suggestions()).toHaveLength(0);
  type('o');
  expect(suggestions().length).toBeGreaterThan(10);
  type('m');
  expect(suggestions().length).toBeGreaterThan(2);
  suggestions().forEach(button =>
    expect(
      button
        .text()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .startsWith('com')
    ).toBe(true)
  );
  type('put');
  expect(suggestions().map(button => button.text())).toContain('computador');
  expect(wrapper.find('.keyboard-phrase').text()).toBe('comput');
  expect(speak).not.toHaveBeenCalled();
  press('APAGAR');
  expect(suggestions().map(button => button.text())).toContain('computador');
});

test('arrows reach every suggestion, Enter completes the current word, and only Falar speaks', () => {
  type('eu');
  press('ESPA\u00c7O');
  type('co');
  // Return to the first key row, then move up to suggestions.
  press('1');
  key('Backspace');
  key('ArrowUp');
  const options = suggestions().map(button => button.text());
  expect(options.length).toBeGreaterThan(10);
  for (let i = 0; i < options.length; i++) {
    expect(
      suggestions()
        .at(i)
        .prop('data-selected')
    ).toBe(true);
    key('ArrowRight');
  }
  key('ArrowLeft');
  const chosen = options[options.length - 1];
  key('Enter');
  expect(wrapper.find('.keyboard-phrase').text()).toBe('eu ' + chosen + ' ');
  expect(suggestions()).toHaveLength(0);
  expect(speak).not.toHaveBeenCalled();
  key('ArrowUp');
  key('Enter');
  expect(speak).toHaveBeenCalledTimes(1);
  expect(speak).toHaveBeenLastCalledWith('eu ' + chosen + ' ');
});

test('clicking a suggestion inserts it silently and typing can continue', () => {
  type('ca');
  suggestions()
    .filterWhere(button => button.text() === 'casa')
    .simulate('click');
  type('b');
  expect(wrapper.find('.keyboard-phrase').text()).toBe('casa b');
  expect(speak).not.toHaveBeenCalled();
  wrapper.find('.keyboard-speak').simulate('click');
  expect(speak).toHaveBeenLastCalledWith('casa b');
});

test('offline completion preserves the phrase and handles accents, case and saved vocabulary', () => {
  expect(getSuggestions('quero ag')).toContain('\u00e1gua');
  expect(getSuggestions('quero \u00e1g')).toContain('\u00e1gua');
  expect(getSuggestions('quero ag', [], true)).toContain('\u00c1GUA');
  expect(getSuggestions('Quero Ag')).toContain('\u00c1gua');
  expect(
    getSuggestions('quero ju', ['Jujuba jujuba']).filter(
      word => word === 'jujuba'
    )
  ).toHaveLength(1);
  expect(completeWord('quero, ag', '\u00e1gua')).toBe('quero, \u00e1gua ');
  expect(getSuggestions('quero ')).toEqual([]);
});

test('suggestions follow every additional letter even when earlier options are ignored', () => {
  type('el');
  const initial = suggestions().map(button => button.text());
  expect(initial).toContain('elefante');
  expect(initial).toContain('elevador');
  expect(initial.length).toBeGreaterThan(2);

  for (const letter of 'efa') {
    type(letter);
    const prefix = wrapper.find('.keyboard-phrase').text();
    const options = suggestions().map(button => button.text());
    expect(options).toContain('elefante');
    options.forEach(word =>
      expect(
        word
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .startsWith(prefix)
      ).toBe(true)
    );
  }
  expect(suggestions().map(button => button.text())).not.toContain('elevador');
  expect(speak).not.toHaveBeenCalled();
  suggestions()
    .filterWhere(button => button.text() === 'elefante')
    .simulate('click');
  expect(wrapper.find('.keyboard-phrase').text()).toBe('elefante ');
  expect(speak).not.toHaveBeenCalled();
  wrapper.find('.keyboard-speak').simulate('click');
  expect(speak).toHaveBeenLastCalledWith('elefante ');
});
