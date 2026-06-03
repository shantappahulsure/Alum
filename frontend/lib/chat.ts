import axios from "axios";

const API =
  `${process.env.NEXT_PUBLIC_API_URL}/api/chat`;

/*
========================================
SEND MESSAGE
========================================
*/

export const sendMessage = async (
    formData: FormData
  ) => {
    const response = await fetch(
      `${API}/send`,
      {
        method: "POST",
        body: formData,
      }
    );
  
    return response.json();
  };

/*
========================================
GET CONVERSATION
========================================
*/

export const getConversation =
  async (
    senderUsername: string,
    receiverUsername: string
  ) => {
    const response =
      await fetch(
        `${API}/conversation?senderUsername=${senderUsername}&receiverUsername=${receiverUsername}`
      );

    return response.json();
  };

/*
========================================
GET CONVERSATIONS
========================================
*/

export const getConversations =
  async (
    username: string
  ) => {
    const response =
      await fetch(
        `${API}/conversations/${username}`
      );

    return response.json();
  };

/*
========================================
MARK MESSAGE AS SEEN
========================================
*/

export const markMessageSeen =
  async (
    messageId: string
  ) => {
    const response =
      await axios.put(
        `${API}/seen/${messageId}`
      );

    return response.data;
  };

  /*
========================================
SEARCH USERS
========================================
*/

export const searchUsers =
async (query: string) => {
  const response =
    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/users/search?q=${query}`
    );

  return response.json();
};