/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

// The app's screens talk to native modules (GrabixYtdl/GrabixDownloader) that
// don't exist in the Jest environment, so mock the native bridge layer.
jest.mock('../src/native', () => {
  const noopSub = {remove: jest.fn()};
  return {
    Ytdl: {
      getInfo: jest.fn().mockResolvedValue({formats: []}),
      getPlaylist: jest
        .fn()
        .mockResolvedValue({isPlaylist: false, title: '', count: 0, entries: []}),
      update: jest.fn().mockResolvedValue({status: 'DONE', version: '1'}),
      getVersion: jest.fn().mockResolvedValue(null),
      getSharedUrl: jest.fn().mockResolvedValue(null),
      isFirstRun: jest.fn().mockResolvedValue(false),
      completeFirstRun: jest.fn().mockResolvedValue(true),
      getSettings: jest
        .fn()
        .mockResolvedValue({playlist: false, subtitles: false, defaultQuality: 'ask'}),
      setSettings: jest.fn().mockResolvedValue(true),
    },
    Downloader: {
      download: jest.fn(),
      cancel: jest.fn().mockResolvedValue(true),
      listDownloads: jest.fn().mockResolvedValue([]),
      open: jest.fn().mockResolvedValue(true),
      share: jest.fn().mockResolvedValue(true),
      remove: jest.fn().mockResolvedValue(true),
      getThumbnail: jest.fn().mockResolvedValue(null),
    },
    onShareReceived: jest.fn(() => noopSub),
    onDownloadProgress: jest.fn(() => noopSub),
    onDownloadComplete: jest.fn(() => noopSub),
    onDownloadError: jest.fn(() => noopSub),
    GrabixEvent: {},
  };
});

import App from '../App';

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
