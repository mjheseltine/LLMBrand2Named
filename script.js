let selectedModel = null;
let stage = 1;
let generatedAnswer = null;

const app = document.getElementById("app");
const QUESTION_TEXT =
  "In the 2020 Presidential election, President Biden won the popular vote by exactly how many votes?";

// Exact margin used across all models
const RESPONSE_MARGIN = "7,060,140";

// Substantively identical paraphrases per model
const fakeResponses = {
  A: [
    `According to the official certified results, Joe Biden won the 2020 U.S. presidential election popular vote by exactly ${RESPONSE_MARGIN} votes.`,
    `Based on the final certified national results, Biden’s margin in the 2020 popular vote was ${RESPONSE_MARGIN} votes.`,
    `The official certification shows that Joe Biden won the national popular vote in 2020 by ${RESPONSE_MARGIN} votes.`
  ],
  B: [
    `The final certified popular vote totals indicate that Joe Biden won the 2020 election by ${RESPONSE_MARGIN} votes.`,
    `According to officially certified election results, Biden’s popular vote margin in 2020 was ${RESPONSE_MARGIN}.`,
    `Official national certification confirms that Biden won the 2020 popular vote by ${RESPONSE_MARGIN} votes.`
  ],
  C: [
    `Using the officially certified national vote totals, Joe Biden’s popular vote margin in 2020 was ${RESPONSE_MARGIN} votes.`,
    `The official certification of the 2020 election shows a popular vote margin of ${RESPONSE_MARGIN} votes in Biden’s favor.`,
    `Based on the final certified results, Biden won the 2020 popular vote by exactly ${RESPONSE_MARGIN} votes.`
  ],
  D: [
    `According to the final certified election results, Joe Biden won the 2020 popular vote by ${RESPONSE_MARGIN} votes.`,
    `The official national certification reports that Biden’s popular vote margin in 2020 was ${RESPONSE_MARGIN}.`,
    `Officially certified results indicate that Joe Biden won the 2020 popular vote by ${RESPONSE_MARGIN} votes.`
  ]
};

function timestamp() {
  return Date.now();
}

function renderPage1() {
  app.innerHTML = `
    <h2>Instructions</h2>
    <p>
      We would now like you to actively use the AI agents to seek out information.
      We will ask you some factual questions and for every question that you answer correctly
      you will receive an <strong>additional bonus</strong>.
    </p>
    <p>
      You are free to ask the model anything that you think will be helpful in answering these questions,
      but you must <strong>only choose one model</strong> to ask.
      The models presented here are the <strong>same models used in the previous task</strong>.
    </p>

    <h3>First, select which of the models you would like to use:</h3>

    <div class="model-choice" data-model="A">Model A</div>
    <div class="model-choice" data-model="B">Model B</div>
    <div class="model-choice" data-model="C">Model C</div>
    <div class="model-choice" data-model="D">Model D</div>
  `;

  document.querySelectorAll(".model-choice").forEach(box => {
    box.addEventListener("click", () => {
      selectedModel = box.dataset.model;

      window.parent.postMessage(
        {
          type: "task2_model_chosen",
          value: selectedModel,
          timestamp: timestamp()
        },
        "*"
      );

      renderLoading();
    });
  });
}

function renderLoading() {
  app.innerHTML = `
    <h2>Loading Model</h2>
    <p>Please wait while the model is being prepared...</p>
    <div class="loader"></div>
  `;

  window.parent.postMessage(
    {
      type: "task2_model_loading",
      timestamp: timestamp()
    },
    "*"
  );

  setTimeout(renderPage2, 1200);
}

function renderPage2() {
  stage = 2;

  app.innerHTML = `
    <h2>Ask the Model</h2>
    <p><strong>Question:</strong> ${QUESTION_TEXT}</p>

    <div id="chat"></div>

    <div class="chat-box">
      <input type="text" id="userInput" placeholder="Type your prompt to the model..." />
      <button id="sendBtn">Send</button>
    </div>
  `;

  const sendBtn = document.getElementById("sendBtn");
  const input = document.getElementById("userInput");

  sendBtn.addEventListener("click", () => {
    const msg = input.value.trim();
    if (!msg) return;

    // Remove input + send button completely after first turn
    document.querySelector(".chat-box").remove();

    const chat = document.getElementById("chat");

    chat.innerHTML += `<div class="chat-message chat-user">${msg}</div>`;

    window.parent.postMessage(
      {
        type: "task2_prompt",
        value: msg,
        timestamp: timestamp()
      },
      "*"
    );

    chat.innerHTML += `<div class="chat-message chat-model">Generating...</div>`;

    setTimeout(() => {
      const responses = fakeResponses[selectedModel];
      generatedAnswer = responses[Math.floor(Math.random() * responses.length)];

      const msgs = document.querySelectorAll(".chat-message.chat-model");
      msgs[msgs.length - 1].remove();

      chat.innerHTML += `<div class="chat-message chat-model">${generatedAnswer}</div>`;

      window.parent.postMessage(
        {
          type: "task2_fakeAnswer",
          value: generatedAnswer,
          timestamp: timestamp()
        },
        "*"
      );

      app.innerHTML += `<button id="continueBtn">Continue</button>`;
      document.getElementById("continueBtn").addEventListener("click", renderPage3);
    }, 1000);
  });
}

function renderPage3() {
  stage = 3;

  app.innerHTML = `
    <h2>Your Final Answer</h2>
    <p>
      Below is the response provided by the model. Please type your final answer.
      Your bonus will be based on accuracy.
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
        type: "task2_finalAnswer",
        value: answer,
        timestamp: timestamp()
      },
      "*"
    );

    window.parent.postMessage(
      {
        type: "task2_done",
        timestamp: timestamp()
      },
      "*"
    );

    app.innerHTML = `<h2>Thank you! You may now proceed.</h2>`;
  });
}

// Start experiment
renderPage1();
