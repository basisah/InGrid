import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

export default function ChatPage() {
  const { propertyId, receiverId } = useParams();
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [status, setStatus] = useState("");

  const fetchMessages = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setStatus("Please log in first.");
      return;
    }

    try {
      const response = await axios.get(
        `/api/messages/${propertyId}/${receiverId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setMessages(response.data);
    } catch (err) {
      setStatus("Failed to load messages.");
    }
  };

  const sendMessage = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setStatus("Please log in first.");
      return;
    }

    if (!messageText.trim()) {
      setStatus("Please enter a message.");
      return;
    }

    try {
      await axios.post(
        "/api/messages",
        {
          receiver_id: Number(receiverId),
          property_id: Number(propertyId),
          message: messageText.trim()
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setMessageText("");
      setStatus("");
      fetchMessages();
    } catch (err) {
      setStatus(err.response?.data?.message || "Failed to send message.");
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [propertyId, receiverId]);

  return (
    <div style={{ maxWidth: "800px", margin: "40px auto", padding: "20px" }}>
      <h2>Chat</h2>

      <div
        style={{
          border: "1px solid #ccc",
          borderRadius: "10px",
          padding: "15px",
          minHeight: "300px",
          marginBottom: "20px",
          background: "#f9f9f9"
        }}
      >
        {messages.length === 0 ? (
          <p>No messages yet.</p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                marginBottom: "12px",
                padding: "10px",
                borderRadius: "8px",
                background: "#fff"
              }}
            >
              <p style={{ margin: 0, fontWeight: "bold" }}>
                {msg.sender_first_name} {msg.sender_last_name}
              </p>
              <p style={{ margin: "5px 0" }}>{msg.message}</p>
            </div>
          ))
        )}
      </div>

      <textarea
        value={messageText}
        onChange={(e) => setMessageText(e.target.value)}
        placeholder="Type your message..."
        rows={4}
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: "8px",
          marginBottom: "10px"
        }}
      />

      <button onClick={sendMessage}>Send</button>

      {status && <p style={{ marginTop: "10px" }}>{status}</p>}
    </div>
  );
}