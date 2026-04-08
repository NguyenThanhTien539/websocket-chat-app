const onlineSocketsByUserId = new Map();

function normalizeId(value) {
  return String(value || "").trim();
}

function addConnection(userId, socketId) {
  const normalizedUserId = normalizeId(userId);
  const normalizedSocketId = normalizeId(socketId);

  if (!normalizedUserId || !normalizedSocketId) {
    return false;
  }

  const socketSet = onlineSocketsByUserId.get(normalizedUserId) || new Set();

  const wasOnline = socketSet.size > 0;
  socketSet.add(normalizedSocketId);
  onlineSocketsByUserId.set(normalizedUserId, socketSet);

  return !wasOnline;
}

function removeConnection(userId, socketId) {
  const normalizedUserId = normalizeId(userId);
  const normalizedSocketId = normalizeId(socketId);

  if (!normalizedUserId || !normalizedSocketId) {
    return false;
  }

  const socketSet = onlineSocketsByUserId.get(normalizedUserId);
  if (!socketSet) {
    return false;
  }

  socketSet.delete(normalizedSocketId);

  if (socketSet.size === 0) {
    onlineSocketsByUserId.delete(normalizedUserId);
    return true;
  }

  return false;
}

function isOnline(userId) {
  const normalizedUserId = normalizeId(userId);
  if (!normalizedUserId) {
    return false;
  }

  return Boolean(onlineSocketsByUserId.get(normalizedUserId)?.size);
}

function getOnlineIds(userIds = []) {
  return userIds
    .map((id) => normalizeId(id))
    .filter((id) => id && isOnline(id));
}

module.exports = {
  addConnection,
  removeConnection,
  isOnline,
  getOnlineIds,
};
