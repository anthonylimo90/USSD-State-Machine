# USSD State Machine

A flexible state machine for building USSD applications in Node.js.

## Installation

```bash
npm install ussd-state-machine
```

## Usage

```javascript
const { USSDStateMachine, ValidationError, InMemoryStorage } = require('ussd-state-machine');

const ussdConfig = {
  initialState: 'WELCOME',
  timeout: 300, // 5 minutes
  states: {
    WELCOME: {
      handler: async (input) => {
        if (input === '') {
          return {
            response: 'CON Welcome to Event Registration\n1. Register for event\n2. Exit',
            nextState: 'MENU'
          };
        }
      }
    },
    // Define other states here
  }
};

const ussdStateMachine = new USSDStateMachine(ussdConfig);

// Example usage in an Express.js app
app.post('/ussd', async (req, res) => {
  const { sessionId, text } = req.body;
  try {
    const response = await ussdStateMachine.processInput(sessionId, text);
    res.send(response);
  } catch (error) {
    console.error('Error processing USSD request:', error);
    res.send('END An error occurred. Please try again later.');
  }
});

// Run cleanup periodically (e.g., every 15 minutes)
setInterval(() => {
  if (ussdStateMachine.storage instanceof InMemoryStorage) {
    ussdStateMachine.storage.cleanup();
  }
}, 15 * 60 * 1000);
```

## API Documentation

### USSDStateMachine

The main class for creating a USSD state machine.

#### Constructor

```javascript
new USSDStateMachine(config)
```

- `config`: An object containing the state machine configuration.
  - `initialState`: The starting state of the USSD flow.
  - `timeout`: Session timeout in seconds (default: 300).
  - `states`: An object defining all states and their handlers.
  - `storage`: (Optional) A custom storage class. Defaults to InMemoryStorage.

#### Methods

- `processInput(sessionId, input)`: Process user input and return the appropriate response.
- `getSessionData(sessionId)`: Retrieve session data for a given session ID.

### ValidationError

A custom error class for handling input validation errors.

### InMemoryStorage

A simple in-memory storage class for managing session data.

## License

MIT
