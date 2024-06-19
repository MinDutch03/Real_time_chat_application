import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "./lib/firebase"; // Ensure your Firebase configuration is correctly imported

/**
 * Subscribe to messages from the Firestore collection.
 * @param {Function} callback - Function to call with new messages.
 * @returns {Function} - Unsubscribe function to call when cleaning up the subscription.
 */
export const subscribeToMessages = (callback) => {
  const messagesRef = collection(db, "messages");
  const messagesQuery = query(messagesRef, orderBy("timestamp", "asc"));

  const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
    const newMessages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(newMessages);
  });

  return unsubscribe;
};
