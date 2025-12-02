let mcqs = [];

// ---------- PAGE NAVIGATION ----------
function goToOutputPage() {
  document.getElementById("inputPage").style.display = "none";
  document.getElementById("outputPage").style.display = "block";
}

function goToInputPage(clearQuestions = false) {
  document.getElementById("inputPage").style.display = "block";
  document.getElementById("outputPage").style.display = "none";

  if (clearQuestions) {
    mcqs = [];
    const container = document.getElementById("mcq-container");
    if (container) container.innerHTML = "";
  }
}

// ---------- GENERATE MCQS ----------
async function generateMCQs() {
  const subject = document.getElementById("subjectInput").value.trim();
  const topic = document.getElementById("topicInput").value.trim();
  const numQuestions = document.getElementById("numQuestions").value;
  const difficulty = document.getElementById("difficulty").value;
  const genBtn = document.getElementById("genBtn");

  if (!subject || !topic) {
    alert("Please enter both subject and topic.");
    return;
  }

  try {
    genBtn.disabled = true;
    genBtn.innerText = "Generating...";

    const res = await fetch("http://localhost:5000/generate-mcqs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, topic, numQuestions, difficulty })
    });

    if (!res.ok) {
      throw new Error("Server error");
    }

    const data = await res.json();
    mcqs = data.mcqs || [];

    renderMCQs();
    goToOutputPage(); // switch to results screen

  } catch (err) {
    console.error(err);
    alert("Failed to generate MCQs. Please try again.");
  } finally {
    genBtn.disabled = false;
    genBtn.innerText = "GENERATE MCQs";
  }
}

// ---------- RENDER MCQS ----------
function renderMCQs() {
  const container = document.getElementById("mcq-container");
  container.innerHTML = "";

  mcqs.forEach((q, index) => {
    const card = document.createElement("div");
    card.className = "mcq-card";

    const question = document.createElement("div");
    question.className = "mcq-question";
    question.textContent = `Q${index + 1}. ${q.question}`;

    const ul = document.createElement("ul");
    ul.className = "mcq-options";

    q.options.forEach((opt, optIndex) => {
      const li = document.createElement("li");
      const label = document.createElement("label");

      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = `q${index}`;
      radio.value = optIndex;

      const span = document.createElement("span");
      span.textContent = opt;

      label.appendChild(radio);
      label.appendChild(span);
      li.appendChild(label);
      ul.appendChild(li);
    });

    const explanation = document.createElement("div");
    explanation.className = "mcq-explanation";
    explanation.id = `exp-${index}`;
    explanation.textContent = q.explanation;

    card.appendChild(question);
    card.appendChild(ul);
    card.appendChild(explanation);
    container.appendChild(card);
  });
}

// ---------- CHECK ANSWERS ----------
function checkAnswers() {
  if (!mcqs.length) return;

  mcqs.forEach((q, index) => {
    const radios = document.getElementsByName(`q${index}`);
    let selected = -1;

    for (let r of radios) {
      if (r.checked) {
        selected = Number(r.value);
        break;
      }
    }

    const exp = document.getElementById(`exp-${index}`);
    exp.style.display = "block";

    if (selected === q.correctIndex) {
      exp.innerHTML = `<span class="correct">✅ Correct!</span> ${q.explanation}`;
    } else if (selected === -1) {
      exp.innerHTML = `<span class="incorrect">⚠️ Not attempted.</span> ${q.explanation}`;
    } else {
      exp.innerHTML = `<span class="incorrect">❌ Incorrect.</span> ${q.explanation}`;
    }
  });
}
