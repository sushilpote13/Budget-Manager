# 💸 Budget Manager

**Budget Manager** is a responsive and feature-rich personal finance tracker built using HTML, CSS, and JavaScript. This project allows users to manage their income and expenses, visualize their spending patterns through charts, and gain insights into their monthly financial behavior — all from a simple, user-friendly interface.

This app runs entirely on the frontend (client-side) and requires no database or backend to operate.

---

## 📌 Table of Contents

- [Features](#features)
- [Screens Included](#screens-included)
- [Technologies Used](#technologies-used)
- [Getting Started](#getting-started)
- [Folder Structure](#folder-structure)
- [Future Enhancements](#future-enhancements)
- [Author](#author)
- [License](#license)

---

## ✅ Features

### 🔧 Dashboard Settings
- Toggle individual sections (Balance, Add Expense Form, Expense List, Summary & Chart).
- Gives the user control over their dashboard view with easy checkboxes.

### 🌙 Theme Toggle
- Toggle between **Light Mode** and **Dark Mode** using a simple "Toggle Theme" button.
- Makes the application visually adaptable to user preferences and reduces eye strain.

### 💰 Income Management
- Users can add income entries by entering:
  - Date
  - Description (e.g., Salary, Freelance, Gift)
  - Amount
- The added income is automatically calculated and reflected in the **Total Balance**.

### 💸 Expense Tracking
- Add expense records with:
  - Date
  - Description (e.g., Groceries, Rent)
  - Category (e.g., Food, Transport, Housing)
  - Amount
- Supports categorization with suggestions via datalist.
- Automatically updates total expenses and balance in real-time.

### 📊 Monthly Summary & Charts
- Dynamic **Pie Chart** powered by **Chart.js** to visualize:
  - Expense distribution across different categories.
  - Total expenses by category for the selected month.

### 📋 Transaction History
- Full history of income and expenses displayed as a list.
- Includes:
  - Filter by type (All, Income, Expense)
  - Filter by date/month
  - Filter by category
  - Search bar for keywords
- Each transaction can be individually deleted.

### 📎 Export & Management Tools
- **Export to CSV**: Download your entire transaction history in `.csv` format.
- **Clear History**: Erase all saved transactions with one click (ideal for resets).

---

## 🖼️ Screens Included!

> The application UI consists of the following screens and components:
> ![Screenshot (81)](https://github.com/user-attachments/assets/a6ca3914-c83e-4747-82e1-40e5acb772e0)


- **Dashboard with Theme Toggle and Section Controls**
- **Total Balance Display (Income, Expense, Net Balance)**
- **Add Income Form**
- **Add Expense Form**
- **Expense List**
- **Transaction History Filters & Search**
- **Monthly Summary with Pie Chart**

> *Note: You can capture your own screenshots and save them in a `screenshots/` folder to include in this section.*

---

## 🛠 Technologies Used

| Technology   | Purpose                                  |
|--------------|-------------------------------------------|
| **HTML5**     | Structuring the app interface             |
| **CSS3**      | Styling and theming (Dark/Light mode)     |
| **JavaScript**| Logic, form handling, state updates       |
| **Chart.js**  | Rendering category-based expense chart    |

## 🚀 Getting Started

### 📁 Prerequisites
- A modern web browser (Chrome, Firefox, Edge, etc.)

### 🔧 Steps to Run Locally

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/budget-manager.git
   cd budget-manager```

2. Open `index.html` in any browser:

   ```bash
   start index.html
   ```

   Or manually double-click the file to open.

> No server or external setup required — runs completely in-browser.

---

## 📂 Folder Structure

```
budget-manager/
│
├── index.html            # Main HTML structure
├── style.css             # Styling (theme, layout, UI)
├── search-styles.css     # Filters and search bar styles
├── app-new.js            # JavaScript logic (income, expense, chart)
├── README.md             # Project documentation
└── (Optional) screenshots/
```

---

## 🌟 Future Enhancements

Here are some ideas to improve the project further:

* ✅ **Persistent Data**: Save income/expenses using `localStorage` or Firebase.
* ✅ **Authentication**: Allow users to log in and manage personal accounts.
* ✅ **PDF Report Generation**: Export monthly summaries to PDF.
* ✅ **Voice Input**: Add voice-based transaction entry using Web Speech API.
* ✅ **Multi-Currency Support**: Convert and view amounts in different currencies.
* ✅ **Mobile Optimization**: Enhance mobile responsiveness and PWA features.

---

## 👨‍💻 Author

**Sushil Ashok Pote**
Frontend Web Developer | Student | UI Enthusiast
📧 Email: [sushilpote13@gmail.com](mailto:sushilpote13@gmail.com)
📞 Phone: +91 7898238002

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

> Thank you for checking out the Budget Manager! Contributions, suggestions, and improvements are welcome. Feel free to fork and enhance this project.

```
