document.getElementById('send-button').addEventListener('click', sendMessage);
document.getElementById('user-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// 🔑 URL de Production du Webhook N8N (confirmée)
const webhookUrl = "https://n8n.srv1108141.hstgr.cloud/webhook/12bab38b-ee2d-4dd0-bce9-154cfb5b92ec"; 

/**
 * Affiche un message dans la zone de chat.
 * @param {string} text - Le contenu du message.
 * @param {string} sender - 'user', 'bot', ou 'error'.
 */
function displayMessage(text, sender) {
    const messagesDisplay = document.getElementById('messages-display');
    const messageDiv = document.createElement('div');
    
    // 🎨 CORRECTION : Ajout des classes Bootstrap (my-2, p-2) pour l'espacement et les marges
    messageDiv.classList.add('message', sender, 'my-2', 'p-2'); 
    
    messageDiv.textContent = text;
    messagesDisplay.appendChild(messageDiv);
    
    // Scroll automatique vers le bas
    messagesDisplay.scrollTop = messagesDisplay.scrollHeight;
}

/**
 * Gère l'envoi du message de l'utilisateur au Webhook N8N et l'affichage de la réponse.
 */
async function sendMessage() {
    const userInput = document.getElementById('user-input');
    const userText = userInput.value.trim();

    if (userText === "") return;

    // 1. Afficher le message de l'utilisateur
    displayMessage(userText, 'user');
    userInput.value = ""; // Vider le champ
    
    // Désactiver la saisie pendant la requête pour éviter les doubles envois
    userInput.disabled = true;
    document.getElementById('send-button').disabled = true;

    // 2. Envoyer le message au Webhook N8N
    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            // Le Webhook N8N attend un JSON avec 'user_message'
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
            const botResponse = data.gemini_response || "Désolé, je n'ai pas compris la réponse de l'agent."; 
            displayMessage(botResponse, 'bot');
        } else {
            // Afficher une erreur HTTP (ex: 404, 500)
            const errorText = `Erreur HTTP : ${response.status} - Vérifiez l'activation du workflow N8N.`;
            displayMessage(errorText, 'error');
        }
    } catch (error) {
        console.error('Erreur Fetch (Réseau/CORS):', error);
        displayMessage("Une erreur de communication est survenue (Réseau ou Timeout).", 'error');
    } finally {
        // Réactiver la saisie
        userInput.disabled = false;
        document.getElementById('send-button').disabled = false;
        userInput.focus();
    }
}
