class InMemoryStorage {
    constructor() {
      this.store = new Map();
    }
  
    async getState(sessionId) {
      const session = this.store.get(sessionId);
      return session ? session.state : null;
    }
  
    async setState(sessionId, state, timeout) {
      let session = this.store.get(sessionId) || {};
      session.state = state;
      session.expiresAt = Date.now() + timeout * 1000;
      this.store.set(sessionId, session);
    }
  
    async getData(sessionId) {
      const session = this.store.get(sessionId);
      return session ? session.data : null;
    }
  
    async setData(sessionId, data, timeout) {
      let session = this.store.get(sessionId) || {};
      session.data = { ...session.data, ...data };
      session.expiresAt = Date.now() + timeout * 1000;
      this.store.set(sessionId, session);
    }
  
    cleanup() {
      const now = Date.now();
      for (let [sessionId, session] of this.store) {
        if (session.expiresAt <= now) {
          this.store.delete(sessionId);
        }
      }
    }
  }
  
  module.exports = InMemoryStorage;
  