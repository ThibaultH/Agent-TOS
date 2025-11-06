// --- 1. GESTION DE LA SESSION UNIQUE (Remonté pour éviter l'erreur de portée) ---

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
console.log("Session ID généré:", sessionId);

// 🔑 URL de Production du Webhook N8N (assurez-vous que c'est bien HTTPS)
const webhookUrl = "https://n8n.srv1108141.hstgr.cloud/webhook/12bab38b-ee2d-4dd0-bce9-154cfb5b92ec"; 

// --- 2. GESTION DES ÉVÉNEMENTS & AFFICHAGE ---

// Écouteurs d'événements pour l'envoi
document.getElementById('send-button').addEventListener('click', () => sendMessage());

document.getElementById('user-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

/**
 * Déclenche le premier message de l'agent au chargement de la page.
 * (Décommentez cette partie si vous voulez que l'agent parle en premier)
 */
window.addEventListener('load', () => {
    // Si la zone de messages est vide, on lance la conversation
    if (document.getElementById('messages-display').children.length === 0) {
        // Optionnel : affiche le premier message statique si pas de lancement auto N8N
        // displayMessage("Hey ! Attends, comment es-tu arrivé(e) là, au juste ? Raconte-moi un peu.", 'bot');
        
        // Ou déclenche le flux N8N pour le premier message (nécessite le flag INIT dans N8N)
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
    
    // Ajout des classes Bootstrap (my-2, p-2)
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

    // Détermine le message à envoyer 
    const messageToSend = isInitial ? "INIT_CONVERSATION" : userText;

    // 1. Afficher le message de l'utilisateur (sauf si c'est l'initialisation)
    if (!isInitial) {
        displayMessage(userText, 'user');
        userInput.value = ""; // Vider le champ
    }
    
    // Désactiver la saisie et afficher le loader
    userInput.disabled = true;
    document.getElementById('send-button').disabled = true;

    // Afficher le message de chargement (loader)
    let loaderMessageDiv = displayMessage("⏳ L'agent est en cours de simulation...", 'bot'); 
    
    // 2. Envoyer le message au Webhook N8N
    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_message: messageToSend,
                // 🔑 Envoi de l'ID de session unique
                session_id: sessionId 
            })
        });

        // 3. Récupérer et afficher la réponse de l'agent Gemini
        if (response.ok) {
            const data = await response.json();
            
            const botResponse = data.gemini_response || "Désolé, je n'ai pas compris la réponse de l'agent."; 
            
            // Supprimer le loader
            loaderMessageDiv.remove();
            
            displayMessage(botResponse, 'bot');
        } else {
            // Afficher une erreur HTTP 
            const errorText = `Erreur HTTP : ${response.status} - Vérifiez l'activation du workflow N8N.`;
            loaderMessageDiv.remove();
            displayMessage(errorText, 'error');
        }
    } catch (error) {
        console.error('Erreur Fetch (Réseau/CORS/Syntaxe):', error);
        loaderMessageDiv.remove();
        displayMessage("Une erreur de communication est survenue (Réseau ou Timeout).", 'error');
    } finally {
        // Réactiver la saisie
        userInput.disabled = false;
        document.getElementById('send-button').disabled = false;
        userInput.focus();
    }
}
}
