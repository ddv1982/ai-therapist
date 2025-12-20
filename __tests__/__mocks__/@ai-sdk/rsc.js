module.exports = {
  readStreamableValue: async function* (stream) {
    if (Array.isArray(stream)) {
      yield* stream;
    } else {
      yield stream;
    }
  },
  useActions: () => ({}),
  useSyncUIState: () => () => {},
  useUIState: () => [{}, () => {}],
  createStreamableValue: (value) => value,
};