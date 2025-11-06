// --- CONFIGURATION ---
const WEBHOOK_URL = 'https://n8n.srv1108141.hstgr.cloud/webhook/12bab38b-ee2d-4dd0-bce9-154cfb5b92ec';
const messagesDisplay = document.getElementById('messages-display');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const resetButton = document.getElementById('reset-button'); // Le nouveau bouton

// --- GESTION DE SESSION ET D'AFFICHAGE ---

/**
 * Récupère l'ID de session stocké, ou en crée un nouveau si inexistant.
 * @returns {string} L'ID de session actuel.
 */
function getSessionId() {
    let sessionId = sessionStorage.getItem('chatSessionId');
    if (!sessionId) {
        // Crée un ID unique (basé sur le temps pour plus de simplicité)
        sessionId = 'session_' + Date.now();
        sessionStorage.setItem('chatSessionId', sessionId);
        // Marque la session comme "non saluée" pour que l'agent démarre la conversation.
        sessionStorage.setItem('hasGreeted', 'false'); 
    }
    return sessionId;
}

/**
 * Ajoute un message au conteneur d'affichage.
 * @param {string} message Le texte du message.
 * @param {string} sender 'user' ou 'bot'.
 */
function displayMessage(message, sender) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', `${sender}-message`, 'p-2', 'my-2', 'rounded');
    messageElement.innerHTML = sender === 'user' ? `<span class="bg-primary text-white p-2 rounded">${message}</span>` : `<span class="bg-light p-2 rounded">${message}</span>`;
    
    // Ajoutez un délai d'apparition pour les messages du bot (pour le côté "humain")
    if (sender === 'bot') {
        messageElement.style.opacity = 0;
        messageElement.style.transform = 'translateY(10px)';
        setTimeout(() => {
            messageElement.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            messageElement.style.opacity = 1;
            messageElement.style.transform = 'translateY(0)';
        }, 100); 
    }

    messagesDisplay.appendChild(messageElement);
    // Faire défiler l'affichage vers le bas
    messagesDisplay.scrollTop = messagesDisplay.scrollHeight;
}

/**
 * Affiche l'indicateur de frappe du bot.
 * @returns {HTMLElement} L'élément de l'indicateur.
 */
function showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'typing-indicator';
    indicator.classList.add('message', 'bot-message', 'p-2', 'my-2', 'rounded', 'bg-light');
    indicator.innerHTML = '<span>L\'Oracle réfléchit...</span>';
    messagesDisplay.appendChild(indicator);
    messagesDisplay.scrollTop = messagesDisplay.scrollHeight;
    return indicator;
}

function removeTypingIndicator(indicator) {
    if (indicator) {
        indicator.remove();
    }
}

// --- LOGIQUE D'ENVOI À N8N ---

/**
 * Envoie le message à l'Agent N8N et affiche la réponse.
 * @param {string} message Le message utilisateur ou 'INIT_CONVERSATION'.
 */
async function sendMessage(message) {
    // Ne rien envoyer si le message est vide et que ce n'est pas le message d'initialisation
    if (!message && message !== 'INIT_CONVERSATION') {
        return;
    }
    
    // Si c'est un message utilisateur, l'afficher immédiatement
    if (message !== 'INIT_CONVERSATION') {
        displayMessage(message, 'user');
        userInput.value = ''; // Vider le champ
    }

    // Afficher l'indicateur de frappe de l'Oracle
    const indicator = showTypingIndicator();

    try {
        const sessionId = getSessionId();

        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_message: message,
                session_id: sessionId 
            }),
        });

        removeTypingIndicator(indicator);

        if (!response.ok) {
            // Gérer les erreurs HTTP (4xx, 5xx) ici
            const errorText = `Erreur HTTP ${response.status}. L'Oracle est momentanément déconnecté.`;
            displayMessage(errorText, 'bot');
            console.error('Erreur HTTP:', response.status, response.statusText);
            return;
        }

        // Tenter de lire le JSON de la réponse
        const data = await response.json(); 
        
        const botResponse = data.gemini_response || "Désolé, l'Oracle n'a pas compris la question. Veuillez reformuler.";
        displayMessage(botResponse, 'bot');

    } catch (error) {
        removeTypingIndicator(indicator);
        displayMessage("Erreur Fetch (Réseau/CORS/Syntaxe): La connexion au royaume secret a échoué.", 'bot');
        console.error("Erreur Fetch (Réseau/CORS/Syntaxe):", error);
    }
}

// --- LOGIQUE D'INITIALISATION ET ÉVÉNEMENTS ---

/**
 * Logique pour forcer l'Agent à commencer la conversation au chargement.
 */
function initChat() {
    // Récupérer l'ID de session au démarrage
    getSessionId(); 

    // Vérifier si l'agent a déjà envoyé le message d'accueil dans cette session
    if (sessionStorage.getItem('hasGreeted') !== 'true') {
        // Le message initial de l'Agent
        sendMessage('INIT_CONVERSATION');
        
        // Marquer comme salué après l'envoi pour éviter la double frappe
        sessionStorage.setItem('hasGreeted', 'true');
    }
}


/**
 * Force la réinitialisation complète de la session de chat.
 */
function resetChatSession() {
    // 1. Supprime les marqueurs de session
    sessionStorage.removeItem('chatSessionId'); 
    sessionStorage.removeItem('hasGreeted'); 
    
    // 2. Recharge la page pour tout redémarrer
    window.location.reload(); 
}


// --- ÉCOUTEURS D'ÉVÉNEMENTS ---

// 1. Envoi par le bouton
sendButton.addEventListener('click', () => {
    const message = userInput.value.trim();
    if (message) {
        sendMessage(message);
    }
});

// 2. Envoi par la touche Entrée
userInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        const message = userInput.value.trim();
        if (message) {
            sendMessage(message);
        }
    }
});

// 3. Réinitialisation par le bouton
if (resetButton) {
    resetButton.addEventListener('click', resetChatSession);
}

// 4. Lancement de la conversation au chargement de la fenêtre
window.onload = initChat;
