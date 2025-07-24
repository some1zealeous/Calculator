let currentInput = "0";
let expression = "";
let waitingForOperand = false;
let justCalculated = false;
let bracketCount = 0;

const display = document.getElementById("display");
const expressionDisplay = document.getElementById("expression");

function updateDisplay() {
    display.textContent = currentInput;
    expressionDisplay.textContent = expression;
}

function toggleSign() {
    if (currentInput !== "0" && currentInput !== "Error") {
        if (currentInput.charAt(0) === "-") {
            currentInput = currentInput.substring(1);
        } else {
            currentInput = "-" + currentInput;
        }
        updateDisplay();
    }
}

function isOperator(value) {
    return ["+", "-", "*", "/"].includes(value);
}

//  using unicode Characters for converting logical operator symbols ( + - x /)
function getOperatorSymbol(op) {
    switch (op) {
        case "*":
            return "\u00D7"; // x
        case "/":
            return "\u00F7"; // ÷
        case "-":
            return "\u2212"; // -
        case "+":
            return "+";
        default:
            return op;
    }
}

// to handle input
function handleInput(value) {
    if (justCalculated && !isOperator(value) && value !== "(" && value !== ")") {
        clearAll();
        justCalculated = false;
    }

    // to handle opening bracket
    if (value === "(") {
        if (currentInput === "0" || waitingForOperand) {
            expression += value;
            bracketCount++;
            currentInput = "0";
            waitingForOperand = true;
        } else {
            // if there's a number before '(', add multiplication [ here I used unicode for "x" ]
            expression += currentInput + " \u00D7 " + value;
            bracketCount++;
            currentInput = "0";
            waitingForOperand = true;
        }
        updateDisplay();
        return;
    }

    // handle closing bracket
    if (value === ")") {
        if (bracketCount > 0 && currentInput !== "0") {
            expression += currentInput + value;
            bracketCount--;

            // evaluating the expression up to this point for preview
            try {
                // replacing user-visible operators with actual logical operators for calculation
                const tempExpression = expression
                    .replace(/\u00D7/g, "*")
                    .replace(/\u00F7/g, "/")
                    .replace(/\u2212/g, "-");
                const result = eval(tempExpression);
                if (isFinite(result)) {
                    currentInput = result.toString();
                }
            } catch (e) {
                // If evaluation fails keep current input and
                // this helps user continue without any error.
            }

            waitingForOperand = true;
            updateDisplay();
            return;
        }
        return;
    }

    // handling number and decimal input
    if (waitingForOperand) {
        currentInput = value;
        waitingForOperand = false;
    } else {
        if (currentInput === "0" && value !== ".") {
            currentInput = value;
        } else {
            if (value === "." && currentInput.includes(".")) return;
            currentInput += value;
        }
    }
    updateDisplay();
}

// to handle entered operators and operands
function handleOperator(nextOperator) {
    if (justCalculated) {
        expression = currentInput + " " + getOperatorSymbol(nextOperator) + " ";
        waitingForOperand = true;
        justCalculated = false;
        updateDisplay();
        return;
    }

    if (currentInput !== "0" && !waitingForOperand) {
        expression += currentInput + " " + getOperatorSymbol(nextOperator) + " ";
        waitingForOperand = true;
        updateDisplay();
    } else if (expression.length > 0 && waitingForOperand) {
        // Replace the last operator
        expression = expression.replace(
            /[+\-×÷]\s*$/,
            getOperatorSymbol(nextOperator) + " "
        );
        updateDisplay();
    }
}

// this separate funtion is for singal operand funtions x² 1/x %
function handleFunction(func) {
  if (currentInput === "0" || currentInput === "") return

  let result
  const current = Number.parseFloat(currentInput)

  try {
    switch (func) {
      case "x²":
        result = current * current
        expressionDisplay.textContent = `sqr(${current})`
        break
      case "1/x":
        if (current === 0) {
          showAlert("Cannot divide by zero")
          return
        }
        result = 1 / current
        expressionDisplay.textContent = `1/(${current})`
        break
      case "%":
        if (expression === "" || waitingForOperand) {
          showAlert("Enter another number before using modulo")
          return
        }

        // Extract last number from expression for leftOperand
        const match = expression.match(/(-?\d+(\.\d+)?)(?!.*\d)/);
        const leftOperand = match ? parseFloat(match[1]) : NaN;
        if (isNaN(leftOperand)) {
          showAlert("Invalid left operand for modulo");
          return;
        }
        result = leftOperand % current;
        expressionDisplay.textContent = `${leftOperand} % ${current}`;
        break;

      default:
        return
    }

    currentInput = result.toString()
    display.textContent = currentInput
    expression = ""
    waitingForOperand = true
    justCalculated = true
    bracketCount = 0
  } catch (error) {
    showAlert("Calculation error")
    currentInput = "Error"
    display.textContent = currentInput
    expression = ""
    bracketCount = 0
  }
}



// this evaluate the expression when '=' is clicked
function performCalculation(expr) {
    try {
        // replacing user-visible operators with actual logical operators for calculation
        const calcExpression = expr
            .replace(/\u00D7/g, "*")
            .replace(/\u00F7/g, "/")
            .replace(/\u2212/g, "-");

        // to ensure the expression has equal number of ( and ).
        const openCount = (calcExpression.match(/\(/g) || []).length;
        const closeCount = (calcExpression.match(/\)/g) || []).length;

        if (openCount !== closeCount) {
            throw new Error("Unbalanced brackets");
        }

        const result = eval(calcExpression);

        if (!isFinite(result)) {
            throw new Error("Invalid calculation");
        }

        return result;
    } catch (error) {
        throw error;
    }
}

// extends the performCalculation() funtion for essential feature handeling
function calculate() {
    if (!expression && currentInput === "0") return;

    let fullExpression = expression;

    // adding current input if not waiting for operand
    if (!waitingForOperand && currentInput !== "0") {
        fullExpression += currentInput;
    }

    // auto-close remaining open brackets
    while (bracketCount > 0) {
        fullExpression += ")";
        bracketCount--;
    }

    if (!fullExpression.trim()) return;

    try {
        const result = performCalculation(fullExpression);

        expressionDisplay.textContent = fullExpression + " =";
        currentInput = result.toString();
        display.textContent = currentInput;
        // reset...
        expression = "";
        waitingForOperand = true;
        justCalculated = true;
        bracketCount = 0;
    } catch (error) {
        showAlert("Invalid expression");
        currentInput = "Error";
        display.textContent = currentInput;
        expression = "";
        bracketCount = 0;
        waitingForOperand = false;
    }
}

function clearAll() {
    currentInput = "0";
    expression = "";
    waitingForOperand = false;
    justCalculated = false;
    bracketCount = 0;
    updateDisplay();
}

function backspace() {
    if (justCalculated) {
        clearAll();
        return;
    }

    if (currentInput.length > 1 && currentInput !== "Error") {
        currentInput = currentInput.slice(0, -1);
    } else {
        currentInput = "0";
    }
    updateDisplay();
}

// -----------------------------------------------------------------------------------------------------------------------------
// keyboard support with Bootstrap key handling
document.addEventListener("keydown", (event) => {
    const key = event.key;

    // prevent default for calculator keys to avoid conflicts
    if (
        ["+", "-", "*", "/", "Enter", "=", "Escape", "Backspace", "%"].includes(
            key
        ) ||
        (key >= "0" && key <= "9") ||
        key === "." ||
        key === "(" ||
        key === ")"
    ) {
        event.preventDefault();
    }

    if ((key >= "0" && key <= "9") || key === ".") {
        handleInput(key);
    } else if (key === "+" || key === "-" || key === "*" || key === "/") {
        handleOperator(key);
    } else if (key === "Enter" || key === "=") {
        calculate();
    } else if (key === "Escape" || key === "c" || key === "C") {
        clearAll();
    } else if (key === "Backspace") {
        backspace();
    } else if (key === "(" || key === ")") {
        handleInput(key);
    } else if (key === "%") {
        handleFunction("%");
    }
});

// Initialize calculator
document.addEventListener("DOMContentLoaded", updateDisplay);

