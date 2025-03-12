document.addEventListener("DOMContentLoaded", function () {
  const codeInput = document.getElementById("code-input");
  const codeOutput = document.getElementById("code-output");
  const languageSelector = document.getElementById("language");
  const errorMsg = document.getElementById("errorMsg");
  const themeToggle = document.getElementById("themeToggle");
  const viewToggle = document.getElementById("viewToggle");
  const previewPanel = document.querySelector(".preview-panel");
  const visualizerPanel = document.querySelector(".visualizer-panel");
  const viewModeSelect = document.getElementById("viewMode");
  
  let isDarkMode = false;
  let isVisualMode = false;
  let currentViewMode = "split";
  let errorTimeout = null;

  // Initialize Split Grid
  Split({
    columnGutters: [{
      track: 1,
      element: document.querySelector('.gutter-col'),
    }],
    minSize: 300
  });

  // Event Listeners
  codeInput.addEventListener("input", handleCodeInput);
  languageSelector.addEventListener("change", handleLanguageChange);
  themeToggle.addEventListener("change", toggleTheme);
  viewToggle.addEventListener("change", toggleView);
  viewModeSelect.addEventListener("change", handleViewModeChange);

  function handleCodeInput() {
    processCode(codeInput.value);
    updatePreview(codeInput.value);
  }

  function handleLanguageChange() {
    processCode(codeInput.value);
  }

  function processCode(rawCode) {
    const selectedLang = languageSelector.value;
    const detectedLang = detectLanguage(rawCode);
    validateLanguageMatch(selectedLang, detectedLang, rawCode);
    const formattedCode = formatCode(rawCode, selectedLang);
    codeOutput.innerHTML = highlightSyntax(formattedCode, selectedLang);
  }

  function detectLanguage(code) {
    const trimmedCode = code.trim();
    
    // HTML detection (requires at least one HTML tag)
    const htmlPattern = /<([a-zA-Z][a-zA-Z0-9-]*)(\s|>)/;
    if (htmlPattern.test(trimmedCode)) return "html";
  
    // CSS detection (looks for CSS selectors and properties)
    const cssPattern = /([.#][\w-]+\s*{[^}]*}|@media\s[^{]*{)/;
    if (cssPattern.test(trimmedCode)) return "css";
  
    // JavaScript detection (function declarations, ES6 syntax, etc.)
    const jsPattern = /(function\s*\(|const\s|let\s|var\s|=>|\(\)\s*{|import\s|export\s)/;
    if (jsPattern.test(trimmedCode)) return "js";
  
    // Fallback detection for combined languages
    if (trimmedCode.includes('</') || trimmedCode.includes('/>')) return "html";
    if (trimmedCode.includes('{') && trimmedCode.includes('}') && trimmedCode.includes(':')) return "css";
    if (trimmedCode.includes('function') || trimmedCode.includes('=>')) return "js";
  
    return "unknown";
  }

  function validateLanguageMatch(selected, detected, code) {
    if (selected !== "auto" && selected !== "combined" && selected !== detected && code.trim() !== "") {
      showError();
    } else {
      clearError();
    }
  }

  function formatCode(code, language) {
    try {
      const options = { indent_size: 2, indent_with_tabs: false };
      if (language === "auto") {
        // Auto-detect formatting
        const detected = detectLanguage(code);
        return detected === "html" ? html_beautify(code, options) :
               detected === "css" ? css_beautify(code, options) :
               detected === "js" ? js_beautify(code, options) : code;
      }
      if (language === "combined") return code; // Combined mode remains unformatted
      switch (language) {
        case "html": return html_beautify(code, options);
        case "css": return css_beautify(code, options);
        case "js": return js_beautify(code, options);
        default: return code;
      }
    } catch (e) {
      return code;
    }
  }

  function highlightSyntax(code, language) {
    const escaped = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    let highlighted = highlightHTML(escaped);
    
    if (language === "auto" || language === "combined") {
      highlighted = highlightCSS(highlighted);
      highlighted = highlightJS(highlighted);
    } else if (language === "css") {
      highlighted = highlightCSS(highlighted);
    } else if (language === "js") {
      highlighted = highlightJS(highlighted);
    }
    return highlighted;
  }

  function highlightHTML(code) {
    return code.replace(/&lt;(\/?\w+)(.*?)&gt;/g, '&lt;<span class="html-tag">$1</span>$2&gt;');
  }

  function highlightCSS(code) {
    return code
      .replace(/\.([\w-]+)/g, '<span class="css-selector">.$1</span>')
      .replace(/#([\w-]+)/g, '<span class="css-id">#$1</span>')
      .replace(/(\w+):\s*([^;]+);/g, '<span class="css-property">$1</span>: $2;');
  }

  function highlightJS(code) {
    return code.replace(/\b(function|const|let|var)\s+(\w+)\b/g, '<span class="js-function">$1</span> $2');
  }

  function showError() {
    document.querySelector(".editor-panel").classList.add("error");
    errorMsg.style.display = "block";
    clearTimeout(errorTimeout);
    errorTimeout = setTimeout(clearError, 3000);
  }

  function clearError() {
    document.querySelector(".editor-panel").classList.remove("error");
    errorMsg.style.display = "none";
  }

  // Clear the preview frame
  window.clearEditor = function() {
    codeInput.value = "";
    codeOutput.innerHTML = "";
    clearError();
    updatePreview(""); 
  };

  // Copy Function

  window.copyCode = function() {
    const textToCopy = codeOutput.textContent;
    
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        const originalText = document.querySelector('.visualizer-panel button').textContent;
        document.querySelector('.visualizer-panel button').textContent = "Copied!";
        
        setTimeout(() => {
          document.querySelector('.visualizer-panel button').textContent = originalText;
        }, 2000);
      })
      .catch(err => {
        console.error("Copy failed:", err);
        alert("Copy failed. Please try again.");
      });
  };

  function updatePreview(code) {
    const previewFrame = document.getElementById("previewFrame");
    const previewDoc = previewFrame.contentDocument || previewFrame.contentWindow.document;
    previewDoc.open();
    previewDoc.write(code);
    previewDoc.close();
  }

  function refreshPreview() {
    updatePreview(codeInput.value);
  }

  function handleViewModeChange() {
    currentViewMode = viewModeSelect.value;
    const splitScreen = document.querySelector(".split-screen");
    splitScreen.classList.remove("editor-only", "visualizer-only", "preview-only");
    
    switch (currentViewMode) {
      case "editor":
        splitScreen.style.gridTemplateColumns = "1fr 0 0";
        visualizerPanel.classList.remove("active");
        previewPanel.classList.remove("active");
        break;
      case "visualizer":
        splitScreen.style.gridTemplateColumns = "0 0 1fr";
        visualizerPanel.classList.add("active");
        previewPanel.classList.remove("active");
        break;
      case "preview":
        splitScreen.style.gridTemplateColumns = "0 0 1fr";
        previewPanel.classList.add("active");
        visualizerPanel.classList.remove("active");
        break;
      default:
        splitScreen.style.gridTemplateColumns = "1fr 10px 1fr";
        visualizerPanel.classList.add("active");
    }
    
    if (window.innerWidth <= 768) {
      splitScreen.style.gridTemplateColumns = "1fr";
      splitScreen.style.gridTemplateRows = currentViewMode === "split" 
        ? "1fr 10px 1fr" 
        : "1fr";
    }
  }

  function toggleView() {
    isVisualMode = viewToggle.checked;
    visualizerPanel.classList.toggle("active", !isVisualMode);
    previewPanel.classList.toggle("active", isVisualMode);
    document.getElementById("viewToggleLabel").textContent = isVisualMode ? "Format" : "Visual";
    
    if (currentViewMode !== "split") {
      viewModeSelect.value = "split";
      handleViewModeChange();
    }
  }

  function toggleTheme() {
    isDarkMode = themeToggle.checked;
    document.body.classList.toggle("dark-mode", isDarkMode);
    document.getElementById("themeToggleLabel").textContent = isDarkMode ? "Light Mode" : "Dark Mode";
  }

  // Clear the preview frame

  window.clearEditor = function() {
    codeInput.value = "";
    codeOutput.innerHTML = "";
    clearError();
    updatePreview("");
  };



  // Initial setup
  handleViewModeChange();
  updatePreview(codeInput.value);
});