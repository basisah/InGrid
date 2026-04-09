import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import Navbar from "../home/navbar";
import "./chat.css";

const socket = io("/", {
  transports: ["websocket", "polling"]
});

export default function ChatPage() {
  const { propertyId, receiverId } = useParams();
  const navigate = useNavigate();
  const bottomRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);
  const [listingInfo, setListingInfo] = useState(null);
  const [otherUserInfo, setOtherUserInfo] = useState(null);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);

  const getCurrentUserId = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.id;
    } catch {
      return null;
    }
  };

  const currentUserId = useMemo(() => getCurrentUserId(), []);
  const isOtherOnline = onlineUsers.includes(String(receiverId)) || onlineUsers.includes(Number(receiverId));

  const fetchConversationMeta = async () => {
    try {
      const propertyRes = await axios.get(`/api/properties/${propertyId}`);
      setListingInfo(propertyRes.data);
    } catch (error) {
      console.error("Failed to load property info:", error);
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const inboxRes = await axios.get("/api/messages/inbox", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const match = Array.isArray(inboxRes.data)
        ? inboxRes.data.find(
          (item) =>
            Number(item.property_id) === Number(propertyId) &&
            Number(item.other_user_id) === Number(receiverId)
        )
        : null;

      if (match) {
        setOtherUserInfo({
          name: match.other_user_name || "User",
          role: match.other_user_role || "user",
          picture: match.other_user_picture || "",
        });
      }
    } catch (error) {
      console.error("Failed to load conversation meta:", error);
    }
  };

  const fetchMessages = async () => {
    const token = localStorage.getItem("token");

    if (!token || !currentUserId) {
      setStatus("Please log in first.");
      navigate("/login");
      return;
    }

    try {
      const response = await axios.get(`/api/messages/${propertyId}/${receiverId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const rows = Array.isArray(response.data) ? response.data : [];
      setMessages(rows);
      setStatus("");

      if (rows.length > 0) {
        const first = rows[0];
        const otherName =
          Number(first.sender_id) === Number(currentUserId)
            ? `${first.receiver_first_name || ""} ${first.receiver_last_name || ""}`.trim()
            : `${first.sender_first_name || ""} ${first.sender_last_name || ""}`.trim();

        setOtherUserInfo((prev) => ({
          name: otherName || prev?.name || "User",
          role: prev?.role || "user",
          picture: prev?.picture || "",
        }));

        setListingInfo((prev) => ({
          ...prev,
          title: first.property_title || prev?.title,
          address: first.property_address || prev?.address,
          main_image: first.property_image || prev?.main_image,
        }));
      }

      await axios.post(
        "/api/messages/read",
        {
          property_id: Number(propertyId),
          other_user_id: Number(receiverId)
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } catch (err) {
      console.error(err.response?.data || err);
      setStatus(err.response?.data?.message || "Failed to load messages.");
    }
  };

  const sendMessage = async () => {
    const token = localStorage.getItem("token");

    if (!token || !currentUserId) {
      setStatus("Please log in first.");
      navigate("/login");
      return;
    }

    if (!messageText.trim()) {
      setStatus("Please enter a message.");
      return;
    }

    setSending(true);

    try {
      const response = await axios.post(
        "/api/messages",
        {
          receiver_id: Number(receiverId),
          property_id: Number(propertyId),
          message: messageText.trim(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const newMessage = response.data?.data;

      if (newMessage) {
        setMessages((prev) => {
          const exists = prev.some((msg) => msg.id === newMessage.id);
          if (exists) return prev;
          return [...prev, newMessage];
        });
      }

      socket.emit("typing", {
        propertyId: Number(propertyId),
        senderId: Number(currentUserId),
        receiverId: Number(receiverId),
        isTyping: false
      });

      setMessageText("");
      setStatus("");
    } catch (err) {
      console.error(err);
      setStatus(err.response?.data?.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    fetchConversationMeta();
    fetchMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId, receiverId]);

  useEffect(() => {
    if (!currentUserId) return;

    socket.emit("join_user_room", currentUserId);
    socket.emit("join_conversation", {
      propertyId: Number(propertyId),
      userA: Number(currentUserId),
      userB: Number(receiverId)
    });

    const handleNewMessage = async (incomingMessage) => {
      if (
        Number(incomingMessage.property_id) === Number(propertyId) &&
        (
          (Number(incomingMessage.sender_id) === Number(currentUserId) &&
            Number(incomingMessage.receiver_id) === Number(receiverId)) ||
          (Number(incomingMessage.sender_id) === Number(receiverId) &&
            Number(incomingMessage.receiver_id) === Number(currentUserId))
        )
      ) {
        setMessages((prev) => {
          const exists = prev.some((msg) => msg.id === incomingMessage.id);
          if (exists) return prev;
          return [...prev, incomingMessage];
        });

        const token = localStorage.getItem("token");
        if (token && Number(incomingMessage.sender_id) === Number(receiverId)) {
          try {
            await axios.post(
              "/api/messages/read",
              {
                property_id: Number(propertyId),
                other_user_id: Number(receiverId)
              },
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
          } catch (err) {
            console.error("Read update failed:", err);
          }
        }
      }
    };

    const handleTyping = ({ propertyId: typingPropertyId, senderId, receiverId: typingReceiverId, isTyping }) => {
      if (
        Number(typingPropertyId) === Number(propertyId) &&
        Number(senderId) === Number(receiverId) &&
        Number(typingReceiverId) === Number(currentUserId)
      ) {
        setIsOtherTyping(Boolean(isTyping));
      }
    };

    const handleUsersOnline = (users) => {
      setOnlineUsers(users || []);
    };

    socket.on("new_message", handleNewMessage);
    socket.on("typing", handleTyping);
    socket.on("users_online", handleUsersOnline);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("typing", handleTyping);
      socket.off("users_online", handleUsersOnline);
    };
  }, [propertyId, receiverId, currentUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOtherTyping]);

  const handleTypingChange = (value) => {
    setMessageText(value);

    if (!currentUserId) return;

    socket.emit("typing", {
      propertyId: Number(propertyId),
      senderId: Number(currentUserId),
      receiverId: Number(receiverId),
      isTyping: true
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing", {
        propertyId: Number(propertyId),
        senderId: Number(currentUserId),
        receiverId: Number(receiverId),
        isTyping: false
      });
    }, 1200);
  };

  const otherPersonName = otherUserInfo?.name || "Conversation";
  const otherPersonRole = otherUserInfo?.role || "";
  const propertyTitle = listingInfo?.title || `Listing #${propertyId}`;
  const propertyImage = listingInfo?.main_image || "";
  const propertyAddress = listingInfo?.address || "";

  return (
    <>
      <Navbar />

      <div className="chat-page">
        <div className="chat-layout">
          <aside className="chat-sidebar">
            <button className="chat-back-btn" onClick={() => navigate("/profile")}>
              ← Back to Profile
            </button>

            <div className="chat-listing-card">
              <div className="chat-listing-image">
                {propertyImage ? (
                  <img src={propertyImage} alt={propertyTitle} />
                ) : (
                  <div className="chat-listing-fallback">🏠</div>
                )}
              </div>

              <div className="chat-listing-body">
                <h3>{propertyTitle}</h3>
                <p>{propertyAddress || "Property conversation"}</p>

                <button onClick={() => navigate(`/property/${propertyId}`)}>
                  View Listing
                </button>
              </div>
            </div>
          </aside>

          <section className="chat-main">
            <div className="chat-header">
              <div>
                <h2>{otherPersonName}</h2>
                <p>
                  {otherPersonRole ? `${otherPersonRole} • ` : ""}
                  {isOtherOnline ? "Online now • " : "Offline • "}
                  About {propertyTitle}
                </p>
              </div>
            </div>

            <div className="chat-messages">
              {messages.length === 0 ? (
                <div className="chat-empty">
                  No messages yet. Start the conversation about this listing.
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = Number(msg.sender_id) === Number(currentUserId);

                  return (
                    <div
                      key={msg.id}
                      className={`chat-bubble-row ${isMine ? "mine" : "theirs"}`}
                    >
                      <div className={`chat-bubble ${isMine ? "mine" : "theirs"}`}>
                        <span className="chat-sender">
                          {isMine
                            ? "You"
                            : `${msg.sender_first_name || ""} ${msg.sender_last_name || ""}`.trim() || "User"}
                        </span>

                        <p>{msg.message}</p>
                        <small>{new Date(msg.created_at).toLocaleString()}</small>
                      </div>
                    </div>
                  );
                })
              )}

              {isOtherTyping && (
                <div className="chat-bubble-row theirs">
                  <div className="chat-bubble theirs">
                    <span className="chat-sender">{otherPersonName}</span>
                    <p>Typing...</p>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            <div className="chat-composer">
              <textarea
                value={messageText}
                onChange={(e) => handleTypingChange(e.target.value)}
                placeholder="Write a message..."
                rows={3}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />

              <div className="chat-composer-actions">
                {status && <p className="chat-status">{status}</p>}

                <button onClick={sendMessage} disabled={sending}>
                  {sending ? "Sending..." : "Send"}
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}