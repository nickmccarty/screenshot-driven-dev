const apiKey = "sk-...";
const chatBox = document.getElementById("chat-box");
const imageInput = document.getElementById("imageInput");
const userInput = document.getElementById("userInput");
const chatForm = document.getElementById("chat-form");

// Load previous messages from localStorage
document.addEventListener("DOMContentLoaded", () => {
    const savedMessages = JSON.parse(localStorage.getItem("chatMessages")) || [];
    savedMessages.forEach(msg => appendMessage(msg.text, msg.sender));
});

async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    appendMessage("You: " + message);

    // Handle image upload
    const file = imageInput.files[0];
    let imageBase64 = null;

    if (file) {
        imageBase64 = await convertImageToBase64(file);
        imageInput.value = "";  // Clear file input
    }

    userInput.value = "";

    // Send request to OpenAI API
    const response = await queryGPT4o(message, imageBase64);
    appendMessage(response, 'ai');

    // Save messages to localStorage
    saveMessages();
}

function appendMessage(text, sender = 'user') {
    const msgDiv = document.createElement("div");
    msgDiv.classList.add(sender);

    if (sender === 'ai') {
        // Render the AI response as HTML
        msgDiv.innerHTML = text; // Using innerHTML for HTML content
    } else {
        msgDiv.textContent = text; // Plain text for user message
    }

    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight; // Scroll to the bottom

    saveMessages(); // Save messages after appending
}

function saveMessages() {
    const messages = Array.from(chatBox.children).map(msg => ({
        text: msg.innerHTML || msg.textContent,
        sender: msg.className
    }));
    localStorage.setItem("chatMessages", JSON.stringify(messages));
}

async function convertImageToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.onerror = error => reject(error);
    });
}

async function queryGPT4o(userMessage, imageBase64) {
    const requestBody = {
        model: "gpt-4o-mini-2024-07-18",
        messages: [
            {
                role: "system",
                content: "You are an expert web dev working to help increase our engineering velocity."
            },
            { role: "user", content: userMessage },
            ...(imageBase64 ? [{
                role: "user",
                content: [{
                    type: "image_url",
                    image_url: { url: `data:image/png;base64,${imageBase64}` }
                }]
            }] : []),
        ],
        temperature: 0.7,
    };

    console.log("Request Body:", JSON.stringify(requestBody, null, 2)); // Debugging

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify(requestBody),
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(`API Error: ${data.error?.message || "Unknown error"}`);
        }

        const markdownResponse = data.choices?.[0]?.message?.content || "Error: No response from AI.";

        // Initialize the Showdown Converter
        const converter = new showdown.Converter();

        // Convert Markdown response to HTML
        const htmlResponse = converter.makeHtml(markdownResponse);

        // Return the HTML response
        return htmlResponse;

    } catch (error) {
        console.error("Request Failed:", error);
        return `Error: ${error.message}`;
    }
}