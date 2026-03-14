const sessions = new Map();

const addSession = (token, id, expiresAt) => {
  sessions.set(token, { id, expiresAt });
};

const getSession = (token) => {
  return sessions.get(token);
};

const clearExpired = () => {
  const now = new Date();
  for (const [token, data] of sessions.entries()) {
    if (new Date(data.expiresAt) < now) {
      sessions.delete(token);
    }
  }
};

// Clear expired sessions every minute
setInterval(clearExpired, 60 * 1000);

module.exports = { addSession, getSession };
