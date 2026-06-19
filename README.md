# Gemini Aurora Chat

Une application web de chat premium et moderne (Single Page App) conçue en HTML/CSS/JS natifs, permettant d'interagir directement avec l'API Gemini depuis votre navigateur.

## ✨ Fonctionnalités

- 🌌 **Design Premium** : Interface sombre moderne avec effets de glassmorphisme, animations fluides et transitions harmonieuses.
- ⚙️ **Sélection des modèles** : Choix des modèles Gemini (`gemini-2.5-flash`, `gemini-3.5-flash`, etc.).
- 📝 **Markdown complet** : Rendu robuste pour les paragraphes, les titres, les listes, les tableaux et les citations grâce à [Marked.js](https://marked.js.org/).
- 💻 **Coloration syntaxique** : Vos blocs de code (Python, JS, HTML...) sont automatiquement colorés avec le thème sombre de [Highlight.js](https://highlightjs.org/).
- 🗄️ **Historique local** : Sauvegarde locale de vos conversations et de votre clé API directement dans le stockage de votre navigateur (`localStorage`).

## 🚀 Lancement rapide

L'application s'exécute entièrement côté client dans votre navigateur web, aucun serveur n'est requis pour la démarrer !

1. Téléchargez ou clonez ce dépôt.
2. Double-cliquez sur `index.html` pour l'ouvrir dans votre navigateur favori.
3. Renseignez votre clé API Gemini (gratuite sur [Google AI Studio](https://aistudio.google.com/)) dans la barre latérale.
4. Sélectionnez le modèle de votre choix et commencez à chatter !

## 📂 Structure du projet

- `index.html` : Structure de la page web.
- `style.css` : Thème visuel, animations et styles responsive.
- `app.js` : Logique de l'application, appels API Gemini et formatage.
