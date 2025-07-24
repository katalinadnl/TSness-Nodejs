# TSness - NodeJS Project

Projet Node.js + Vue 3 pour la gestion de salles de sport.  
Cette appli est divisée en deux parties : **backend (API NodeJS Express)** et **frontend (Vue 3)**.

---

## 📁 Structure du projet

```
/TSness-Nodejs
/backend   ➜ API Node/Express/TypeScript/MongoDB
/frontend  ➜ Interface utilisateur Vue 3
```

---

## 🚀 Prérequis

- Node.js
- npm
- mongodb

---

## ⚙️ Installation

### 1️⃣ Cloner le dépôt

```bash
git clone <url-du-repo>
cd TSness-Nodejs
````

---

### 2️⃣ Docker

#### 📌 .env

```bash
cd backend 
cp .env.example .env
npm install 
npm run build
```

```bash
cd frontend 
cp .env.example .env
npm install
npm run build
```

#### 📌 Lancer Docker

```bash
docker compose up -d --build
```

#### 📌 Lancer les seeds pour remplir la base de données

```bash
docker compose exec backend sh

node dist/scripts/seedAll.js

```

```bash
cd frontend 
cp .env.example .env
```

---

## Voir le projet en action

L'API Express démarre sur [http://localhost:3001](http://localhost:3001)

---

Le frontend démarre sur [http://localhost:5173](http://localhost:5173)

---

## 🔗 Résumé des ports

| Partie   | Adresse                                        |
| -------- |------------------------------------------------|
| Backend  | [http://localhost:5001](http://localhost:5001) |
| Frontend | [http://localhost:5173](http://localhost:5173) |


---

## Comptes de test
| Type de compte | Username   | Mot de passe  |
|----------------|------------|---------------|
| Super Admin    | superadmin | superadmin123 |
| Gym Owner      | gymowner   | gymowner123   |
| Client 1       | client1    | client123     |
| Client 2       | client2    | client123     |


## 🤝 Auteurs de la classe 4IW2 - ou autrement - Les best de la classe

* DANILA Catalina
* GIRARD Camille
* DELENTE Philippe