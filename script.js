document.getElementById('send-button').addEventListener('click', sendMessage);
document.getElementById('user-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

const webhookUrl = "VOTRE_URL_WEBHOOK_N8N"; // <-- REMPLACER ICI

function displayMessage(text, sender) {
    const messagesDisplay = document.getElementById('messages-display');
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender);
    messageDiv.textContent = text;
    messagesDisplay.appendChild(messageDiv);
    // Scroll automatique vers le bas
    messagesDisplay.scrollTop = messagesDisplay.scrollHeight;
}

async function sendMessage() {
    const userInput = document.getElementById('user-input');
    const userText = userInput.value.trim();

    if (userText === "") return;

    // 1. Afficher le message de l'utilisateur
    displayMessage(userText, 'user');
    userInput.value = ""; // Vider le champ

    // 2. Envoyer le message au Webhook N8N
    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            // Le Webhook N8N attend généralement un JSON avec les données
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_message: userText
            })
        });

        // 3. Récupérer et afficher la réponse de l'agent Gemini
        if (response.ok) {
            const data = await response.json();
            // Assurez-vous que le noeud "Response" de N8N renvoie bien un JSON avec "gemini_response"
            const botResponse = data.gemini_response || "Désolé, je n'ai pas compris la réponse."; 
            displayMessage(botResponse, 'bot');
        } else {
            displayMessage("Erreur : Impossible de contacter l'agent.", 'error');
        }
    } catch (error) {
        console.error('Erreur Fetch:', error);
        displayMessage("Une erreur de communication est survenue.", 'error');
    }
}
