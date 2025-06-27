# TSness - NodeJS Project

Projet Node.js + Vue 3 pour la gestion de salles de sport.  
Cette appli est divisée en deux parties : **backend (API Express)** et **frontend (Vue 3)**.

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

### 2️⃣ Installer les dépendances

#### 📌 Backend

```bash
cd backend
npm install
```

#### 📌 Frontend

```bash
cd ../frontend
npm install
```

---

## 🖥️ Démarrer le projet

### ✅ Lancer le backend (API)

```bash
cd backend
npm run dev
```

➡️ L'API Express démarre sur [http://localhost:3001](http://localhost:3001)

---

### ✅ Lancer le frontend (Vue 3)

```bash
cd ../frontend
npm run dev
```

➡️ Le frontend démarre sur [http://localhost:5173](http://localhost:5173)

---

## 🔗 Résumé des ports

| Partie   | Adresse                                        |
| -------- | ---------------------------------------------- |
| Backend  | [http://localhost:5000](http://localhost:5000) |
| Frontend | [http://localhost:5173](http://localhost:5173) |


---

## ✅ Notes

* L'API Express doit être lancée **avant** pour que le frontend puisse consommer ses routes.
* Vous pouvez tester les endpoints de l'API avec **Postman**.
* Le projet est prévu pour être **testé en local** sur deux serveurs différents (API + Front).

---

## 🤝 Auteurs de la classe 4IW2 - ou autrement - Les best de la classe

* DANILA Catalina
* GIRARD Camille
* DELENTE Philippe