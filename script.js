let selectedModel = null;
let generatedAnswer = null;
let stage = 1;

const app = document.getElementById("app");

const QUESTION_TEXT =
  "In the 2020 U.S. presidential election, by exactly how many votes did Joe Biden win the national popular vote according to official results?";

// Model display names
const MODEL_NAMES = {
  A: "Gab AI",
  B: "Grok",
  C: "GPT",
  D: "Claude"
};

// Default fallback if parent doesn't send model_order
let modelOrder = ["A", "B", "C", "D"];

// Color classes are positional (match Task 1)
const COLOR_CLASSES_BY_POSITION = ["purple", "blue", "orange", "green"];

// Substantively identical, slightly varied official-results answers
const RESPONSE_POOL = [
  "According to the officially certified national results, Joe Biden received 81,283,501 votes and Donald Trump received 74,223,975 votes, giving Biden a popular vote margin of 7,059,526 votes.",
  "Official election results show that Joe Biden won the 2020 U.S. popular vote by 7,059,526 votes, based on certified totals reported after all ballots were counted.",
  "Based on the final certified national vote totals, Joe Biden won the popular vote by exactly 7,059,526 votes in the 2020 presidential election.",
  "The official certified results of the 2020 election indicate that Joe Biden won the national popular vote by 7,059,526 votes."
];

// Utility
function timestamp() {
  return Date.now();
}

function randomResponse() {
  return RESPONSE_POOL[Math.floor(Math.random() * RESPONSE_POOL.length)];
}

/* --------------------------------------------------
   MODEL ORDER SYNC (FROM QUALTRICS / TASK 1)
   We ask parent for stored model_order, e.g. "B,D,A,C"
-------------------------------------------------- */

function requestModelOrderFromParent() {
  window.parent.postMessage(
    { type: "request_model_order", timestamp: timestamp() },
    "*"
  );

  // Safety fallback: if parent never responds, render anyway after a short delay
  setTimeout(() => {
    if (stage === 1) renderPage1();
  }, 400);
}

// Listen for parent response
window.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || typeof data !== "object") return;

  if (data.type === "model_order_response" && typeof data.value === "string") {
    const parts = data.value.split(",").map(s => s.trim()).filter(Boolean);
    if (parts.length === 4) {
      modelOrder = parts;
    }
    if (stage === 1) renderPage1();
  }
});

/* ---------------- STAGE 1 ---------------- */

function renderPage1() {
  stage = 1;

  // Build the selection boxes in the SAME ORDER as Task 1 (modelOrder),
  // and apply color by position (purple/blue/orange/green).
  const boxesHtml = modelOrder
    .map((modelId, idx) => {
      const colorClass = COLOR_CLASSES_BY_POSITION[idx] || "";
      const name = MODEL_NAMES[modelId] || `Model ${modelId}`;
      return `<div class="model-choice ${colorClass}" data-model="${modelId}">${name}</div>`;
    })
    .join("");

  app.innerHTML = `
    <h2>Instructions</h2>
    <p>
      In this task, you will use <strong>one AI model</strong> to help answer a factual question.
      <strong>You may only select one model</strong>, and you will not be able to change your choice.
    </p>
    <p>
      You may ask the model a single question. After reviewing its response, you will enter a final answer.
      <strong>You will receive a small bonus payment if you get the answer correct.</strong> Your bonus depends on accuracy.
    </p>

    <h3><strong>Please select which model you would like to use:</strong></h3>

    ${boxesHtml}
  `;

  document.querySelectorAll(".model-choice").forEach(box => {
    box.addEventListener("click", () => {
      // visual feedback
      document.querySelectorAll(".model-choice").forEach(el => el.classList.remove("selected"));
      box.classList.add("selected");

      selectedModel = box.dataset.model;

      window.parent.postMessage(
        {
          type: "task2_model_chosen",
          model: selectedModel,
          modelName: MODEL_NAMES[selectedModel],
          timestamp: timestamp()
        },
        "*"
      );

      renderLoadingModel();
    });
  });
}

/* ---------------- LOADING ---------------- */

function renderLoadingModel() {
  stage = 1.5;

  app.innerHTML = `
    <h2>Loading ${MODEL_NAMES[selectedModel]}…</h2>
    <p>Please wait while the model initializes.</p>
    <div class="loader"></div>
  `;

  window.parent.postMessage(
    {
      type: "task2_model_loading",
      model: selectedModel,
      timestamp: timestamp()
    },
    "*"
  );

  setTimeout(renderPage2, 1200);
}

/* ---------------- STAGE 2 ---------------- */

function renderPage2() {
  stage = 2;

  app.innerHTML = `
    <h2>Ask the Model</h2>
    <p><strong>Question:</strong> ${QUESTION_TEXT}</p>

    <div id="chat"></div>

    <div class="chat-box">
      <input type="text" id="userInput" placeholder="Type your question to the model..." />
      <button id="sendBtn">Send</button>
    </div>
  `;

  document.getElementById("sendBtn").addEventListener("click", () => {
    const input = document.getElementById("userInput");
    const msg = input.value.trim();
    if (!msg) return;

    const chat = document.getElementById("chat");

    chat.innerHTML += `<div class="chat-message chat-user">${msg}</div>`;

    window.parent.postMessage(
      {
        type: "task2_prompt",
        value: msg,
        model: selectedModel,
        modelName: MODEL_NAMES[selectedModel],
        timestamp: timestamp()
      },
      "*"
    );

    // Remove input area after first turn
    document.querySelector(".chat-box").remove();

    chat.innerHTML += `<div class="chat-message chat-model">Generating…</div>`;

    setTimeout(() => {
      generatedAnswer = randomResponse();

      const msgs = document.querySelectorAll(".chat-message.chat-model");
      msgs[msgs.length - 1].remove();

      chat.innerHTML += `<div class="chat-message chat-model">${generatedAnswer}</div>`;

      window.parent.postMessage(
        {
          type: "task2_generated_answer",
          value: generatedAnswer,
          model: selectedModel,
          modelName: MODEL_NAMES[selectedModel],
          timestamp: timestamp()
        },
        "*"
      );

      app.innerHTML += `<button id="continueBtn">Continue</button>`;
      document.getElementById("continueBtn").addEventListener("click", renderPage3);
    }, 1100);
  });
}

/* ---------------- STAGE 3 ---------------- */

function renderPage3() {
  stage = 3;

  app.innerHTML = `
    <h2>Your Final Answer</h2>
    <p>
      Please enter your final answer below.
      <strong>You may refer to the model’s response shown beneath.</strong>
    </p>

    <div class="chat-message chat-model">${generatedAnswer}</div>

    <input type="text" id="finalAnswer" placeholder="Your answer..." />
    <button id="submitFinal">Submit Answer</button>
  `;

  document.getElementById("submitFinal").addEventListener("click", () => {
    const answer = document.getElementById("finalAnswer").value.trim();
    if (!answer) return;

    window.parent.postMessage(
      {
        type: "task2_final_answer",
        value: answer,
        model: selectedModel,
        modelName: MODEL_NAMES[selectedModel],
        timestamp: timestamp()
      },
      "*"
    );

    window.parent.postMessage(
      { type: "task2_done", timestamp: timestamp() },
      "*"
    );

    app.innerHTML = `<h2>Thank you! You may now proceed.</h2>`;
  });
}

/* ---------------- INIT ---------------- */

// Ask parent for model_order so colors match Task 1.
// If parent doesn't respond, we fall back to A,B,C,D.
requestModelOrderFromParent();
