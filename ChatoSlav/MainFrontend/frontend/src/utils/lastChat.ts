const LAST_CHAT_KEY = 'lastChatId';

export const saveLastChatId = (chatId: string) => {
  localStorage.setItem(LAST_CHAT_KEY, chatId);
};

export const getLastChatId = (): string | null => {
  return localStorage.getItem(LAST_CHAT_KEY);
};

export const clearLastChatId = () => {
  localStorage.removeItem(LAST_CHAT_KEY);
};