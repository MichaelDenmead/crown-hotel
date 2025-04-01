Welcome to the Disciples Team GitHub Repository! 🚀  
This is the GitHub repository for the Disciples Team as we build out the Crown Hotel Project — a fully functional hotel booking system.
---
📌 Our Goals:
✅ Create a responsive and user-friendly hotel booking platform  
✅ Implement a robust backend using Node.js & PostgreSQL  
✅ Ensure clean, maintainable, and well-documented code
---
🧰 Recommended Setup for VS Code  
To contribute effectively, install the following VS Code extensions:
- **Live Server** – Real-time preview  
- **ESLint** – JavaScript linting  
- **Prettier** – Code formatter  
- **GitLens** – Enhanced Git tracking  
- **GitHub Pull Requests** – Manage PRs inside VS Code  
- **PostgreSQL** – Database management (optional)
---

🚀 Quick Start for Local Development (with Render Cloud DB)
1. Make sure you have **Node.js** and **npm** installed.
2. Place the `.env` file in the **root** of the project folder. It contains the connection string to our **shared Render PostgreSQL database**.
3. Run:
   ```bash
   npm install
   ```
   to install required dependencies.
4. Test your database connection with:
   ```bash
   node test-db.js
   ```
   You should see confirmation that you're connected to the Render-hosted database.
5. Launch the server:
   ```bash
   node server.js
   ```
6. Open your browser and go to:
   ```
   http://localhost:3000
   ```

---

🔐 Environment File (.env)

The `.env` file contains database credentials and **should never be uploaded to GitHub**.  
✅ If `.env` is missing or commented out, the system will attempt to connect to a local PostgreSQL instance (if available).
---

👥 Meet the Team:
Michael Denmead – Chaos Engineer  
Allen Abraham – CFO  
Kristopher Kilsby – Full Stack Developer  
Yao Xiao – International Affairs