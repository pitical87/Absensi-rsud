import api from "./client";

export const getNotifications = async () => {
  const res = api.get("/notifikasi");
  return (await res).data;
};

export const getTotalNotifications = async () => {
  const res = api.get("/notifikasi/total");
  return (await res).data;
};

export const readNotification = async (id: number) => {
  const res = api.post(`notifikasi/${id}/baca`);
  return (await res).data;
};

export const readdAllNotifications = async () => {
  const res = api.post(`notifikasi/baca-semua`);
  return (await res).data;
};
