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
