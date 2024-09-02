const USSDStateMachine = require('../lib/USSDStateMachine');
const ValidationError = require('../lib/ValidationError');
const InMemoryStorage = require('../lib/InMemoryStorage');

describe('USSDStateMachine', () => {
  let ussdConfig;
  let ussdStateMachine;

  beforeEach(() => {
    ussdConfig = {
      initialState: 'WELCOME',
      timeout: 300,
      states: {
        WELCOME: {
          handler: async (input) => {
            if (input === '') {
              return {
                response: 'CON Welcome\n1. Continue\n2. Exit',
                nextState: 'MENU'
              };
            }
          }
        },
        MENU: {
          handler: async (input) => {
            if (input === '1') {
              return {
                response: 'CON Enter your name',
                nextState: 'COLLECT_NAME'
              };
            } else if (input === '2') {
              return {
                response: 'END Goodbye',
                nextState: 'END'
              };
            } else {
              return {
                response: 'CON Invalid input\n1. Continue\n2. Exit'
              };
            }
          }
        },
        COLLECT_NAME: {
          validator: async (input) => {
            if (input.length < 2) {
              throw new ValidationError('Name too short');
            }
          },
          handler: async (input, sessionId) => {
            return {
              response: `CON Hello, ${input}! Enter your age`,
              nextState: 'COLLECT_AGE',
              data: { name: input }
            };
          }
        },
        COLLECT_AGE: {
          validator: async (input) => {
            if (isNaN(input) || input < 18 || input > 100) {
              throw new ValidationError('Invalid age');
            }
          },
          handler: async (input, sessionId) => {
            const data = await ussdStateMachine.getSessionData(sessionId);
            return {
              response: `END Thanks, ${data.name}! Your age is ${input}.`,
              nextState: 'END',
              data: { age: input }
            };
          }
        }
      }
    };
    ussdStateMachine = new USSDStateMachine(ussdConfig);
  });

  test('should start with welcome message', async () => {
    const response = await ussdStateMachine.processInput('session1', '');
    expect(response).toBe('CON Welcome\n1. Continue\n2. Exit');
  });

  test('should handle menu selection', async () => {
    await ussdStateMachine.processInput('session1', '');
    const response = await ussdStateMachine.processInput('session1', '1');
    expect(response).toBe('CON Enter your name');
  });

  test('should handle name input', async () => {
    await ussdStateMachine.processInput('session1', '');
    await ussdStateMachine.processInput('session1', '1');
    const response = await ussdStateMachine.processInput('session1', 'John');
    expect(response).toBe('CON Hello, John! Enter your age');
  });

  test('should handle age input and complete flow', async () => {
    await ussdStateMachine.processInput('session1', '');
    await ussdStateMachine.processInput('session1', '1');
    await ussdStateMachine.processInput('session1', 'John');
    const response = await ussdStateMachine.processInput('session1', '25');
    expect(response).toBe('END Thanks, John! Your age is 25.');
  });

  test('should handle validation errors', async () => {
    await ussdStateMachine.processInput('session1', '');
    await ussdStateMachine.processInput('session1', '1');
    const response = await ussdStateMachine.processInput('session1', 'J');
    expect(response).toBe('CON Name too short\nPlease try again.');
  });

  test('should handle invalid menu selection', async () => {
    await ussdStateMachine.processInput('session1', '');
    const response = await ussdStateMachine.processInput('session1', '3');
    expect(response).toBe('CON Invalid input\n1. Continue\n2. Exit');
  });
});
