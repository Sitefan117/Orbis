import { json, type RequestHandler } from '@sveltejs/kit';

const MAX_MESSAGE_LENGTH = 2000;
const MAX_HISTORY_ITEMS = 20;

export const POST: RequestHandler = async ({ request }) => {
  try {
    const payload = await request.json();
    const message = typeof payload?.message === 'string' ? payload.message.trim() : '';
    const history = Array.isArray(payload?.history) ? payload.history : [];

    if (!message || message.length > MAX_MESSAGE_LENGTH || history.length > MAX_HISTORY_ITEMS) {
      return new Response('Message invalide ou trop volumineux.', { status: 400 });
    }

    const safeHistory = history
      .filter(
        (item: unknown): item is { role: 'user' | 'assistant'; content: string } =>
          typeof item === 'object' &&
          item !== null &&
          ((item as { role?: unknown }).role === 'user' || (item as { role?: unknown }).role === 'assistant') &&
          typeof (item as { content?: unknown }).content === 'string'
      )
      .map((item: { role: 'user' | 'assistant'; content: string }) => ({
        role: item.role,
        content: item.content.slice(0, MAX_MESSAGE_LENGTH)
      }));

    // 💡 CONSIGNE CACHÉE (SYSTEM PROMPT)
    // Plus tard, on pourra lier ça à ton espace enseignant (ex: db.select().from(teacherSettings))
    const systemPrompt = `Tu es un conseiller en orientation et enseignant spécialisé bienveillant. 
Tu aides un élève de l'école obligatoire à rédiger sa lettre de motivation pour un apprentissage ou un stage.
CONSIGNES STRICTES :
1. NE RÉDIGE JAMAIS LA LETTRE À LA PLACE DE L'ÉLÈVE.
2. Pose-lui des questions courtes et simples pour le faire réfléchir (sur ses goûts, ses stages, ses forces).
3. S'il fait de grosses fautes d'orthographe, suggère-lui gentiment une correction pour une phrase.
4. Fais des réponses courtes (3 phrases maximum) et utilise un vocabulaire simple et encourageant.`;

    // Préparation des messages pour Ollama (avec l'historique pour qu'il ait de la mémoire)
    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...safeHistory,
      { role: 'user', content: message }
    ];

    // Appel à Ollama installé en local sur ta machine (modèle llama3)
    const ollamaResponse = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3', // Modèle cible identifié via "ollama list"
        messages: formattedMessages,
        stream: false // On attend la réponse complète pour faire simple
      })
    });

    if (!ollamaResponse.ok) {
      return new Response('Impossible de joindre Ollama en local.', { status: 500 });
    }

    const data = await ollamaResponse.json();
    const response = typeof data?.message?.content === 'string' ? data.message.content : '';
    if (!response) return new Response('Réponse invalide du modèle local.', { status: 502 });

    return json({ response }, { headers: { 'cache-control': 'no-store' } });

  } catch (error) {
    console.error(error);
    return new Response('Erreur interne du serveur de chat.', { status: 500 });
  }
};
