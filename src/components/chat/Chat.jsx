import { useEffect, useRef, useState, useCallback } from "react";
import "./chat.css";
import EmojiPicker from "emoji-picker-react";
import {
  arrayUnion,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db, secondaryDb } from "../../lib/firebase";
import { useChatStore } from "../../lib/chatStore";
import { useUserStore } from "../../lib/userStore";
import upload from "../../lib/upload";

const Chat = () => {
  const [chat, setChat] = useState();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [img, setImg] = useState({ file: null, url: "" });

  const { currentUser } = useUserStore();
  const { chatId, user, isCurrentUserBlocked, isReceiverBlocked } =
    useChatStore();

  const endRef = useRef(null);

  // Scroll to bottom when messages are added
  const scrollToBottom = useCallback(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(scrollToBottom, [chat]);

  // Subscribe to Firestore chat updates
  useEffect(() => {
    if (!chatId) return;

    const chatRef = doc(db, "chats", chatId);
    const unsubscribe = onSnapshot(chatRef, (snapshot) => {
      if (snapshot.exists()) {
        setChat(snapshot.data());
      }
    });

    return () => unsubscribe();
  }, [chatId]);

  const handleEmoji = (emojiObject) => {
    setText((prev) => prev + emojiObject.emoji);
    setOpen(false);
  };

  const handleImg = (e) => {
    if (e.target.files[0]) {
      setImg({
        file: e.target.files[0],
        url: URL.createObjectURL(e.target.files[0]),
      });
    }
  };

  const handleSend = async () => {
    if (!text.trim() && !img.file) return;
    if (!currentUser || !user) return; // Ensure currentUser and user are defined

    let imgUrl = null;

    try {
      if (img.file) {
        imgUrl = await upload(img.file);
      }

      const newMessage = {
        senderId: currentUser.id,
        text,
        createdAt: new Date(),
        ...(imgUrl && { img: imgUrl }),
      };

      const chatRef = doc(db, "chats", chatId);
      const secondaryChatRef = doc(secondaryDb, "chats", chatId);

      const chatSnapshot = await getDoc(chatRef);
      const secondaryChatSnapshot = await getDoc(secondaryChatRef);

      const batch = writeBatch(db);
      const secondaryBatch = writeBatch(secondaryDb);

      if (chatSnapshot.exists()) {
        batch.update(chatRef, {
          messages: arrayUnion(newMessage),
        });
      } else {
        batch.set(chatRef, {
          messages: [newMessage],
        });
      }

      if (secondaryChatSnapshot.exists()) {
        secondaryBatch.update(secondaryChatRef, {
          messages: arrayUnion(newMessage),
        });
      } else {
        secondaryBatch.set(secondaryChatRef, {
          messages: [newMessage],
        });
      }

      const userChatRefs = [
        doc(db, "userchats", currentUser.id),
        doc(db, "userchats", user.id),
      ];

      const secondaryUserChatRefs = [
        doc(secondaryDb, "userchats", currentUser.id),
        doc(secondaryDb, "userchats", user.id),
      ];

      const userChatUpdates = userChatRefs.map(async (ref, index) => {
        const userChatSnapshot = await getDoc(ref);
        const secondaryRef = secondaryUserChatRefs[index];
        const secondaryUserChatSnapshot = await getDoc(secondaryRef);

        if (userChatSnapshot.exists()) {
          const userChatData = userChatSnapshot.data();
          const chatIndex = userChatData.chats.findIndex(
            (c) => c.chatId === chatId
          );

          if (chatIndex > -1) {
            userChatData.chats[chatIndex].lastMessage = text;
            userChatData.chats[chatIndex].isSeen = ref.id === currentUser.id;
            userChatData.chats[chatIndex].updatedAt = Date.now();

            batch.update(ref, { chats: userChatData.chats });
          }
        }

        if (secondaryUserChatSnapshot.exists()) {
          const secondaryUserChatData = secondaryUserChatSnapshot.data();
          const secondaryChatIndex = secondaryUserChatData.chats.findIndex(
            (c) => c.chatId === chatId
          );

          if (secondaryChatIndex > -1) {
            secondaryUserChatData.chats[secondaryChatIndex].lastMessage = text;
            secondaryUserChatData.chats[secondaryChatIndex].isSeen =
              secondaryRef.id === currentUser.id;
            secondaryUserChatData.chats[secondaryChatIndex].updatedAt =
              Date.now();

            secondaryBatch.update(secondaryRef, {
              chats: secondaryUserChatData.chats,
            });
          }
        }
      });

      await Promise.all(userChatUpdates);
      await batch.commit();
      await secondaryBatch.commit();

      setImg({ file: null, url: "" });
      setText("");
      scrollToBottom();
    } catch (err) {
      console.error("Error sending message: ", err);
    }
  };

  return (
    <div className="chat">
      <div className="top">
        <div className="user">
          <img src={user?.avatar || "./avatar.png"} alt="avatar" />
          <div className="texts">
            <span>{user?.username}</span>
          </div>
        </div>
        <div className="icons">
          <img src="./phone.png" alt="phone" />
          <img src="./video.png" alt="video" />
          <img src="./info.png" alt="info" />
        </div>
      </div>
      <div className="center">
        {chat?.messages?.map((message, index) => (
          <div
            key={index}
            className={`message ${
              message.senderId === currentUser?.id ? "own" : ""
            }`}
          >
            <div className="texts">
              {message.img && <img src={message.img} alt="attachment" />}
              <p>{message.text}</p>
            </div>
          </div>
        ))}
        {img.url && (
          <div className="message own">
            <div className="texts">
              <img src={img.url} alt="preview" />
            </div>
          </div>
        )}
        <div ref={endRef}></div>
      </div>
      <div className="bottom">
        <div className="icons">
          <label htmlFor="file">
            <img src="./img.png" alt="upload" />
          </label>
          <input
            type="file"
            id="file"
            style={{ display: "none" }}
            onChange={handleImg}
          />
          <img src="./camera.png" alt="camera" />
          <img src="./mic.png" alt="mic" />
        </div>
        <input
          type="text"
          placeholder={
            isCurrentUserBlocked || isReceiverBlocked
              ? "You cannot send a message"
              : "Type a message..."
          }
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isCurrentUserBlocked || isReceiverBlocked}
        />
        <div className="emoji">
          <img
            src="./emoji.png"
            alt="emoji"
            onClick={() => setOpen((prev) => !prev)}
          />
          {open && (
            <div className="picker">
              <EmojiPicker onEmojiClick={handleEmoji} />
            </div>
          )}
        </div>
        <button
          className="sendButton"
          onClick={handleSend}
          disabled={isCurrentUserBlocked || isReceiverBlocked}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
