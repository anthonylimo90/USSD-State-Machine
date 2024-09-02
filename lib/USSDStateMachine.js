const ValidationError = require('./ValidationError');

class USSDStateMachine {
  constructor(config) {
    this.states = config.states;
    this.initialState = config.initialState;
    this.timeout = config.timeout || 300; // Default timeout of 5 minutes
    this.storage = config.storage || new (require('./InMemoryStorage'))();
  }

  async processInput(sessionId, input) {
    let currentState = await this.storage.getState(sessionId) || this.initialState;
    const stateConfig = this.states[currentState];

    if (!stateConfig) {
      throw new Error(`Invalid state: ${currentState}`);
    }

    try {
      // Validate input if a validator is provided
      if (stateConfig.validator) {
        await stateConfig.validator(input);
      }

      // Process the input
      const result = await stateConfig.handler(input, sessionId);

      // Update state if a new state is returned
      if (result.nextState) {
        await this.storage.setState(sessionId, result.nextState, this.timeout);
      }

      // Store any data if provided
      if (result.data) {
        await this.storage.setData(sessionId, result.data, this.timeout);
      }

      return result.response;
    } catch (error) {
      if (error instanceof ValidationError) {
        return `CON ${error.message}\nPlease try again.`;
      }
      throw error;
    }
  }

  async getSessionData(sessionId) {
    return this.storage.getData(sessionId);
  }
}

module.exports = USSDStateMachine;