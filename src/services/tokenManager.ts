import { UID_TOKEN_KEY } from '../constants';

export const getToken = (): string | null => {
  const token = localStorage.getItem(UID_TOKEN_KEY);

  return token; 
};

export const setToken = (token: string) => {
  localStorage.setItem(UID_TOKEN_KEY, token);
};

export const deleteToken = () => {
  localStorage.removeItem(UID_TOKEN_KEY);
};