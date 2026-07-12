import api from "./client";

export const login = async (email: string, password: string) => {
  const response = await api.post("/login", {
    email,
    password,
  });
  return response.data;
};

export const me = async () => {
  const response = await api.get("/me");
  return response.data;
};

export const logout = async () => {
  const response = await api.post("/logout");
  return response.data;
};
