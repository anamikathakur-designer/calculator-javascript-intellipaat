const display = document.getElementById("display");
const keys = document.querySelectorAll(".key[data-value]");
const clearBtn = document.getElementById("clear");
const equalsBtn = document.getElementById("equals");

const OPERATORS = ["+", "-", "*", "/"];
const SYMBOLS = { "+": "+", "-": "−", "*": "×", "/": "÷" };

let tokens = [];          // e.g. ["12", "+", "7"]
let justEvaluated = false;

function isOperator(value) {
  return OPERATORS.includes(value);
}

function lastToken() {
  return tokens[tokens.length - 1];
}

function updateDisplay(text) {
  const output = text !== undefined
    ? text
    : tokens.map(t => (isOperator(t) ? ` ${SYMBOLS[t]} ` : t)).join("") || "0";

  display.textContent = output;

  // Shrink the text when the expression gets long
  display.classList.toggle("small", output.length > 10 && output.length <= 14);
  display.classList.toggle("smaller", output.length > 14);
  display.scrollLeft = display.scrollWidth;
}

function inputDigit(digit) {
  if (justEvaluated) {
    tokens = [];
    justEvaluated = false;
  }

  const last = lastToken();

  if (last === undefined || isOperator(last)) {
    tokens.push(digit);
  } else if (last === "0") {
    tokens[tokens.length - 1] = digit;
  } else if (last.length < 12) {
    tokens[tokens.length - 1] = last + digit;
  }

  updateDisplay();
}

function inputOperator(operator) {
  justEvaluated = false;

  const last = lastToken();

  if (last === undefined) {
    // Pressing an operator first uses 0 as the first number, e.g. "0 + 5"
    tokens.push("0", operator);
  } else if (isOperator(last)) {
    // Replace the previous operator
    tokens[tokens.length - 1] = operator;
  } else {
    tokens.push(operator);
  }

  updateDisplay();
}

function calculate(list) {
  // First pass: multiplication and division
  const stack = [parseFloat(list[0])];

  for (let i = 1; i < list.length; i += 2) {
    const op = list[i];
    const num = parseFloat(list[i + 1]);

    if (op === "*") {
      stack.push(stack.pop() * num);
    } else if (op === "/") {
      if (num === 0) return null;
      stack.push(stack.pop() / num);
    } else {
      stack.push(op, num);
    }
  }

  // Second pass: addition and subtraction
  let result = stack[0];
  for (let i = 1; i < stack.length; i += 2) {
    result = stack[i] === "+" ? result + stack[i + 1] : result - stack[i + 1];
  }

  return result;
}

function formatNumber(value) {
  // Fix floating point issues like 0.1 + 0.2
  const rounded = parseFloat(value.toPrecision(12));

  if (Math.abs(rounded) >= 1e12) {
    return rounded.toExponential(6);
  }
  return String(rounded);
}

function evaluate() {
  if (tokens.length === 0) return;

  if (isOperator(lastToken())) {
    tokens.pop();
  }

  const result = calculate(tokens);

  if (result === null || !isFinite(result)) {
    tokens = [];
    justEvaluated = true;
    updateDisplay("Error");
    return;
  }

  tokens = [formatNumber(result)];
  justEvaluated = true;
  updateDisplay();
}

function clearAll() {
  tokens = [];
  justEvaluated = false;
  updateDisplay();
}

function backspace() {
  if (justEvaluated) {
    clearAll();
    return;
  }

  const last = lastToken();
  if (last === undefined) return;

  if (isOperator(last) || last.length === 1) {
    tokens.pop();
  } else {
    tokens[tokens.length - 1] = last.slice(0, -1);
  }

  updateDisplay();
}

function handleInput(value) {
  if (isOperator(value)) {
    inputOperator(value);
  } else {
    inputDigit(value);
  }
}

// Button clicks
keys.forEach(key => {
  key.addEventListener("click", () => handleInput(key.dataset.value));
});

clearBtn.addEventListener("click", clearAll);
equalsBtn.addEventListener("click", evaluate);

// Keyboard support
function flash(button) {
  if (!button) return;
  button.classList.add("pressed");
  setTimeout(() => button.classList.remove("pressed"), 120);
}

document.addEventListener("keydown", event => {
  let key = event.key;

  if (key === "x" || key === "X") key = "*";

  if (/^[0-9]$/.test(key) || isOperator(key)) {
    event.preventDefault();
    handleInput(key);
    flash(document.querySelector(`.key[data-value="${key}"]`));
  } else if (key === "Enter" || key === "=") {
    event.preventDefault();
    evaluate();
    flash(equalsBtn);
  } else if (key === "Escape" || key === "Delete") {
    clearAll();
    flash(clearBtn);
  } else if (key === "Backspace") {
    backspace();
  }
});

updateDisplay();
