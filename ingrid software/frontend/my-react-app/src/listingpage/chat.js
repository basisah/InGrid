import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../home/navbar";
import Footer from "../home/footer";
import { toast } from "react-hot-toast";

export default function ChatPage() {
  const { propertyId, receiverId } = useParams();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);

  const getCurrentUserId = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.id;
    } catch (err) {
      return null;
    }
  };

  const currentUserId = getCurrentUserId();

  const fetchMessages = async () => {
    const token = localStorage.getItem("token");

    if (!token || !currentUserId) {
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`/api/messages/${propertyId}/${receiverId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setMessages(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error(err.response?.data || err);
      toast.error(err.response?.data?.message || "Failed to load messages.");
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    const token = localStorage.getItem("token");

    if (!token || !currentUserId) {
      navigate("/login");
      return;
    }

    if (!messageText.trim()) {
      toast.error("Please enter a message.");
      return;
    }

    try {
      await axios.post(
        "/api/messages",
        {
          receiver_id: Number(receiverId),
          property_id: Number(propertyId),
          message: messageText.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessageText("");
      fetchMessages();
    } catch (err) {
      console.error("Chat send error:", err);
      toast.error(err.response?.data?.message || "Failed to send message.");
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [propertyId, receiverId]);

  return (
    <>
      <Navbar />

      <div
        style={{
          maxWidth: "900px",
          margin: "40px auto",
          padding: "0 20px",
        }}
      >
        <h2 style={{ marginBottom: "20px" }}>Chat with Agent</h2>

        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: "16px",
            padding: "20px",
            minHeight: "380px",
            marginBottom: "20px",
            background: "#f9fafb",
          }}
        >
          {loading ? (
            <p>Loading messages...</p>
          ) : messages.length === 0 ? (
            <p>No messages yet.</p>
          ) : (
            messages.map((msg) => {
              const isMine = Number(msg.sender_id) === Number(currentUserId);

              return (
                <div
                  key={msg.id}
                  style={{
                    display: "flex",
                    justifyContent: isMine ? "flex-end" : "flex-start",
                    marginBottom: "12px",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "70%",
                      padding: "12px 14px",
                      borderRadius: "14px",
                      background: isMine ? "#1b5e20" : "#ffffff",
                      color: isMine ? "#ffffff" : "#111827",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    }}
                  >
                    <p style={{ margin: 0, fontWeight: "bold", fontSize: "13px" }}>
                      {msg.sender_first_name || "User"} {msg.sender_last_name || ""}
                    </p>
                    <p style={{ margin: "6px 0 0" }}>{msg.message}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "16px",
            padding: "16px",
          }}
        >
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type your message..."
            rows={4}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "12px",
              border: "1px solid #d1d5db",
              marginBottom: "12px",
              resize: "vertical",
            }}
          />

          <button
            onClick={sendMessage}
            style={{
              padding: "12px 20px",
              background: "#fbc02d",
              color: "#111827",
              border: "none",
              borderRadius: "10px",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            Send
          </button>
        </div>
      </div>

      <Footer />
    </>
  );
}