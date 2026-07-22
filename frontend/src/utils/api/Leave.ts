import api from "./client";

export const createLeave = async (data: FormData) => {
  const res = await api.post("/izin", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const deleteLeave = async (id: number) => {
  const res = await api.delete(`/izin/${id}`);
  return res.data;
};

export const getLeaves = async () => {
  const res = await api.get("/izin");
  return res.data;
};

export const getTodayLeave = async () => {
  const res = await api.get("/izin/today");
  return res.data;
};

export const getPendingLeavesCount = async () => {
  const res = await api.get("/izin/total");
  return res.data;
};

export const getPendingLeaveDetails = async () => {
  const res = await api.get("/izin/detail");
  return res.data;
};
