/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

const workerUrl = 'https://lorealbot.tamiszuchet.workers.dev/';

/* System prompt: keeps the assistant scoped to L'Oréal products, routines,
   and beauty recommendations, and tells it how to handle off-topic asks. */
const systemPrompt = `You are the Smart Product Advisor, a helpful assistant for L'Oréal.
You ONLY answer questions about L'Oréal products, beauty/skincare/haircare routines,
and personalized recommendations from L'Oréal's brand portfolio.

Rules:
- Stay strictly within L'Oréal products, ingredients, routines, and beauty-related
  recommendations (skincare, haircare, makeup, fragrance).
- If a question is unrelated to these topics (e.g. general knowledge, coding,
  politics, other brands' products, unrelated small talk), politely decline and
  redirect the user back to what you can help with. Keep the refusal short and
  friendly, e.g. "I'm here to help with L'Oréal products and beauty routines —
  is there something in that space I can help you with?"
- Keep answers concise, friendly, and easy to scan in a chat window.
- Remember details the user shares earlier in the conversation (like their name,
  skin/hair type, or previous questions) and use them naturally in later answers.
- Do not make up specific product claims you are not confident about; speak in
  general, helpful terms about routines and product categories when unsure.`;

/* Full conversation history sent to the API on every request. This is what
   lets the assistant track context — the user's name, earlier answers, etc. —
   across multiple turns instead of treating each message in isolation. */
const messages = [{ role: "system", content: systemPrompt }];

/* Render a chat bubble in the conversation. Each call appends a new bubble
   below the previous one, so the latest user question always lands directly
   above its response — and stays there as the next question/response pair
   is added below it. */
function appendMessage(role, text) {
  const bubble = document.createElement("div");
  bubble.classList.add("msg", role === "user" ? "user" : "ai");

  const label = document.createElement("span");
  label.classList.add("msg-label");
  label.textContent = role === "user" ? "You" : "Advisor";

  const content = document.createElement("span");
  content.classList.add("msg-content");
  content.textContent = text;

  bubble.appendChild(label);
  bubble.appendChild(content);
  chatWindow.appendChild(bubble);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return content; // return the text container so we can update it later
}

// Set initial greeting
chatWindow.innerHTML = "";
appendMessage("ai", "👋 Hello! How can I help you today?");

/* Handle form submit */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const text = userInput.value.trim();
  if (!text) return;

  // Show the user's question as its own bubble
  appendMessage("user", text);
  messages.push({ role: "user", content: text });

  userInput.value = "";
  userInput.disabled = true;

  // Show a temporary "thinking" bubble directly below the question
  const loadingContent = appendMessage("ai", "Thinking…");

  try {
    const response = await fetch(workerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      throw new Error("No response content received");
    }

    loadingContent.textContent = reply;
    messages.push({ role: "assistant", content: reply });
  } catch (error) {
    console.error("Chat request failed:", error);
    loadingContent.textContent =
      "Sorry, something went wrong reaching the assistant. Please try again.";
  } finally {
    userInput.disabled = false;
    userInput.focus();
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }
});