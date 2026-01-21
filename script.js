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

/* ---------------- STAGE 1 ---------------- */

function renderPage1() {
  app.innerHTML = `
    <h2>Instructions</h2>
    <p>
      In this task, you will use <strong>one AI model</strong> to help answer a factual question.
      <strong>You may only select one model</strong>, and you will not be able to change your choice.
    </p>
    <p>
      You may ask the model a single question. After reviewing its response, you will enter a final answer.
      Your bonus depends on accuracy.
    </p>

    <h3><strong>Please select which model you would like to use:</strong></h3>

    <div class="model-choice" data-model="A">Arya AI</div>
    <div class="model-choice" data-model="B">Grok</div>
    <div class="model-choice" data-model="C">GPT</div>
    <div class="model-choice" data-model="D">Claude</div>
  `;

  document.querySelectorAll(".model-choice").forEach(box => {
    box.addEventListener("click", () => {
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
  app.innerHTML = `
    <h2>Loading ${MODEL_NAMES[selectedModel]}…</h2>
    <p>Please wait while the model initializes.</p>
    <div class="chat-message chat-model">Loading model…</div>
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
        timestamp: timestamp()
      },
      "*"
    );

    // Disable after first turn
    input.disabled = true;
    document.getElementById("sendBtn").remove();

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
          timestamp: timestamp()
        },
        "*"
      );

      app.innerHTML += `<button id="continueBtn">Continue</button>`;
      document
        .getElementById("continueBtn")
        .addEventListener("click", renderPage3);

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

    <div class="chat-message chat-model">
      ${generatedAnswer}
    </div>

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

// Start
renderPage1();
