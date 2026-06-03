import axios from "axios";

const API =
  "http://localhost:3001/api/notifications";

export const getNotifications =
  async (email: string) => {
    const response =
      await axios.get(
        `${API}/${email}`
      );

    return response.data;
  };

export const markAsRead =
  async (id: string) => {
    const response =
      await axios.put(
        `${API}/read/${id}`
      );

    return response.data;
  };