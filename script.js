const defaultApiKey = ""; // Use this as the default value for the apiKey
let apiKey = defaultApiKey; // Make apiKey a variable to allow reassignment
const chatBox = document.getElementById("chat-box");
const imageInput = document.getElementById("imageInput");
const userInput = document.getElementById("userInput");
const chatForm = document.getElementById("chat-form");

// Load previous messages from localStorage
document.addEventListener("DOMContentLoaded", () => {
    const savedMessages = JSON.parse(localStorage.getItem("chatMessages")) || [];
    savedMessages.forEach(msg => appendMessage(msg.text, msg.sender));

    // Check if apiKey is empty and prompt for it
    if (apiKey === "") {
        apiKey = prompt("Please enter your OpenAI API Key:");

        // Ensure the user entered a value
        if (apiKey) {
            alert("API Key entered successfully.");
        } else {
            alert("No API Key entered. You cannot proceed without an OpenAI API Key.");
            // Optionally, you can disable the chat form or take other actions here.
        }
    }
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
        appendImageThumbnail(imageBase64); // Append the image thumbnail
    }

    userInput.value = "";

    // Change button to dots and start animation
    const sendButton = document.querySelector(".button-container button");
    sendButton.innerHTML = "&#x2022;"; // Change to a single dot
    let dotCount = 1; // Start with one dot
    const dotAnimation = setInterval(() => {
        sendButton.innerHTML += "&#x2022;"; // Add another dot
        dotCount++;
        if (dotCount > 3) {
            sendButton.innerHTML = "&#x2022;"; // Reset to one dot for animation
            dotCount = 1;
        }
    }, 500); // Change every 500ms

    // Send request to OpenAI API
    const response = await queryGPT4o(message, imageBase64);

    // Clear the interval and reset the button text
    clearInterval(dotAnimation);
    sendButton.innerHTML = "Send"; // Reset to original text
    appendMessage(response, 'ai');

    // Save messages to localStorage
    saveMessages();
}

function appendImageThumbnail(imageBase64) {
    const imgDiv = document.createElement("div");
    imgDiv.classList.add('image-thumbnail');
    imgDiv.innerHTML = `<img src="data:image/png;base64,${imageBase64}" alt="Uploaded Image" style="max-width: 250px; border-radius: 10px;"/>`;

    chatBox.appendChild(imgDiv);
    chatBox.scrollTop = chatBox.scrollHeight; // Scroll to the bottom

    saveMessages(); // Save messages after appending
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

function updateIcon() {
    const fileInput = document.getElementById("imageInput");
    const fileIcon = document.getElementById("fileIcon");

    if (fileInput.files.length > 0) {
        fileIcon.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="green" class="bi bi-check-lg" viewBox="0 0 16 16">
                <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425z"/>
            </svg>
        `;
    } else {
        fileIcon.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-upload" viewBox="0 0 16 16">
                <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5"/>
                <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708z"/>
            </svg>
        `;
    }
}

function clearLocalStorage() {
    localStorage.removeItem("chatMessages");
    chatBox.innerHTML = ""; // Clear the chat box
    alert("Local storage cleared!");
}
