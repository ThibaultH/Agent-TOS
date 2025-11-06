// --- 1. GESTION DE LA SESSION UNIQUE ---

function generateUUID() {
    // Une méthode simple pour générer un ID unique
    return 'session-' + Date.now() + '-' + Math.random().toString(16).slice(2);
}

// Récupérer ou générer l'ID de session au chargement de la page
// L'ID est stocké dans sessionStorage (il est perdu quand l'onglet est fermé)
let sessionId = sessionStorage.getItem('chatSessionId');
if (!sessionId) {
    sessionId = generateUUID();
    sessionStorage.setItem('chatSessionId', sessionId);
}
// Le log de l'ID est utile pour le débogage
console.log("Session ID généré:", sessionId);

// 🔑 URL de Production du Webhook N8N (confirmée)
const webhookUrl = "https://n8n.srv1108141.hstgr.cloud/webhook/12bab38b-ee2d-4dd0-bce9-154cfb5b92ec"; 

// --- 2. GESTION DES ÉVÉNEMENTS & AFFICHAGE ---

document.getElementById('send-button').addEventListener('click', () => sendMessage());

document.getElementById('user-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

/**
 * Déclenche le premier message de l'agent au chargement de la page.
 * Utilisé UNIQUEMENT pour la règle 'Hey ! Attends...'
 */
window.addEventListener('load', () => {
    // Si la zone de messages est vide, on lance la conversation
    if (document.getElementById('messages-display').children.length === 0) {
        sendMessage(true);
    }
});


/**
 * Affiche un message dans la zone de chat.
 * @param {string} text - Le contenu du message.
 * @param {string} sender - 'user', 'bot', ou 'error'.
 * @returns {HTMLElement} - Retourne l'élément div du message.
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

    return messageDiv;
}


// --- 3. LOGIQUE D'ENVOI AU WEBHOOK ---

/**
 * Gère l'envoi du message de l'utilisateur ou du drapeau initial au Webhook N8N.
 * @param {boolean} isInitial - Vrai si c'est le lancement automatique du premier message.
 */
async function sendMessage(isInitial = false) {
    const userInput = document.getElementById('user-input');
    const userText = userInput.value.trim();

    // Si pas initial et vide, on ne fait rien
    if (userText === "" && !isInitial) return;

    // Détermine le message à envoyer (le flag INIT_CONVERSATION doit être géré dans N8N)
    const messageToSend = isInitial ? "INIT_CONVERSATION" : userText;

    //
