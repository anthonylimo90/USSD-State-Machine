const InMemoryStorage = require('../lib/InMemoryStorage');

describe('InMemoryStorage', () => {
  let storage;

  beforeEach(() => {
    storage = new InMemoryStorage();
  });

  test('should store and retrieve state', async () => {
    await storage.setState('session1', 'TEST_STATE', 300);
    const state = await storage.getState('session1');
    expect(state).toBe('TEST_STATE');
  });

  test('should store and retrieve data', async () => {
    await storage.setData('session1', { name: 'John' }, 300);
    const data = await storage.getData('session1');
    expect(data).toEqual({ name: 'John' });
  });

  test('should handle non-existent sessions', async () => {
    const state = await storage.getState('nonexistent');
    expect(state).toBeNull();

    const data = await storage.getData('nonexistent');
    expect(data).toBeNull();
  });

  test('should cleanup expired sessions', async () => {
    jest.useFakeTimers();
    
    await storage.setState('session1', 'STATE1', 100);  // 100 seconds timeout
    await storage.setState('session2', 'STATE2', 600);  // 600 seconds timeout

    jest.advanceTimersByTime(300 * 1000);  // Advance time by 300 seconds

    storage.cleanup();

    const state1 = await storage.getState('session1');
    const state2 = await storage.getState('session2');

    expect(state1).toBeNull();
    expect(state2).toBe('STATE2');

    jest.useRealTimers();
  });
});
