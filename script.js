const apiKey = "sk-...";
const chatBox = document.getElementById("chat-box");
const imageInput = document.getElementById("imageInput");
const userInput = document.getElementById("userInput");

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
    appendMessage("AI: " + response);
}

function appendMessage(text) {
    const msgDiv = document.createElement("div");
    msgDiv.textContent = text;
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
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
            { role: "user", content: userMessage },
            ...(imageBase64 ? [{ 
                role: "user", 
                content: [{ 
                    type: "image_url", 
                    image_url: { url: `data:image/png;base64,${imageBase64}` } // ✅ Fix: image_url should be an object
                }] 
            }] : [])
        ],
        temperature: 0.7
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

        return data.choices?.[0]?.message?.content || "Error: No response from AI.";
    } catch (error) {
        console.error("Request Failed:", error);
        return `Error: ${error.message}`;
    }
}
