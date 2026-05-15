# 🥗 EcoEats - Plateforme de Livraison Éco-responsable

EcoEats est une application de livraison de repas construite sur une **Clean Architecture** stricte, utilisant Node.js (Backend) et Next.js (Frontend).

## 🚀 Guide de Lancement Rapide (Pour le Professeur)

Le moyen le plus simple de tester l'application est d'utiliser **Docker Compose**. Cela lancera le Backend, le Frontend et la base de données PostgreSQL simultanément.

### 1. Prérequis
- Docker et Docker Desktop installés.
- Node.js 20+ (si vous souhaitez lancer hors Docker).

### 2. Lancement avec Docker
À la racine du projet, exécutez :
```bash
docker-compose up --build
```

### 3. Initialisation des Données (Important)
Si les données ne sont pas présentes au premier lancement, exécutez ces commandes pour peupler la base :
```bash
# Dans un nouveau terminal, allez dans le dossier backend
cd backend
npm install
npx prisma migrate dev
npx prisma db seed
```

---

## 🔑 Comptes de Test (Mot de passe : `Password123!`)

Utilisez ces comptes pour explorer toutes les facettes de la plateforme :

- **ADMIN** : `admin@ecoeats.fr` (Vue globale, monitoring)
- **CLIENT** : `client@ecoeats.fr` (Passage de commandes, historique)
- **LIVREUR** : `driver@fast.fr` (Gestion des courses en temps réel)
- **RESTAURATEUR** : `jp.martin@ecoeats.fr` (Gestion du menu "Le Bistrot Parisien")

---

### 4. Accès aux Interfaces
- **Frontend (Client/Dashboard)** : [http://localhost:3000](http://localhost:3000)
- **Backend API** : [http://localhost:3001](http://localhost:3001)

---

## 🏗️ Architecture Technique

Le projet suit les principes de la **Clean Architecture** :
- **Domain** : Entités et règles métier pures (indépendant du framework).
- **Application** : Use Cases (logique applicative orchestrant le domaine).
- **Infrastructure** : Implémentation technique (Prisma, Socket.io, OSRM).
- **Interfaces** : Routes API, Controllers et Frontend React.

## 🛠️ Fonctionnalités Clés
- **Calcul de Frais Intelligent** : Frais de livraison basés sur la distance réelle (OSRM) et frais de service plateforme (10%).
- **Carte Interactive** : Visualisation en temps réel via MapLibre.
- **Workflow Temps Réel** : Notifications via Socket.io pour le suivi des commandes.
- **Dashboard Restaurateur** : Gestion complète du menu avec Toggle modernisé.

## 🛠️ Fonctionnalités & Cas d'Utilisation (Use Cases)

Le projet implémente les fonctionnalités suivantes, structurées selon les principes de la Clean Architecture :

### 🔐 Authentification & Utilisateurs
- **Inscription multi-rôles** : Création de comptes Client, Restaurateur ou Livreur.
- **Connexion sécurisée** : Authentification par email/mot de passe avec jetons JWT.
- **Gestion de session** : Système de Refresh Token pour maintenir la connexion en toute sécurité.
- **Profil Utilisateur** : Consultation et mise à jour des informations personnelles.

### 🛒 Expérience Client
- **Navigation & Menus** : Consultation des menus interactifs des restaurants.
- **Passage de Commande** : Tunnel d'achat complet avec calcul des frais en temps réel.
- **Paiement Sécurisé** : Gestion des méthodes de paiement (Stripe).
- **Suivi en temps réel** : Historique et statut des commandes en cours.
- **Facturation** : Génération et téléchargement de factures au format JSON/PDF.
- **Double Notation** : Système de feedback interactif pour noter séparément le restaurant et le livreur.

### 🍳 Gestion Restaurateur
- **Administration du Restaurant** : Création et édition du profil, gestion des horaires d'ouverture.
- **Gestion du Menu** : 
    - CRUD complet des catégories et articles.
    - Gestion dynamique des stocks et de la disponibilité.
    - **Import/Export CSV** : Outils pour gérer massivement les cartes de menu.
- **Pilotage des Commandes** : Réception, confirmation et mise à jour du statut de préparation.
- **Statistiques** : Visibilité sur les commandes traitées.

### 🛵 Espace Livreur
- **Gestion de Profil** : Création de profil spécifique avec type de transport.
- **Statut Online/Offline** : Gestion de la disponibilité pour les courses.
- **Dispatching** : Visualisation et acceptation des livraisons disponibles à proximité.
- **Cycle de Livraison** : Prise en charge au restaurant et validation de la remise au client.
- **Portefeuille (Wallet)** : Suivi détaillé des gains accumulés par livraison.

### 📂 Système Documentaire & Modération
- **Vérification d'Identité** : Upload de documents officiels (KBIS, CNI, Permis) pour les restaurateurs et livreurs.
- **Interface d'Approbation** : Système permettant de valider ou rejeter les pièces justificatives.
- **Contrôle d'Accès** : Restriction des fonctionnalités tant que les documents ne sont pas validés.

### 🛡️ Administration & Monitoring
- **Dashboard Admin** : Statistiques globales de la plateforme.
- **Audit Logs** : Suivi des événements du domaine.
