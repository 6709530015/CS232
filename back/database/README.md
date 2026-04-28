# 🗄️ Database Setup (MySQL)

## 📦 Overview

This project uses MySQL for storing user data, tasks, notifications, and settings.

---

## ⚙️ Requirements

* MySQL Server
* MySQL Workbench (or any SQL client)

---

## 🚀 Setup Instructions

### 1. Clone repository

```bash
git clone https://github.com/6709530015/CS232.git
cd CS232
```

---

### 2. Create database structure

1. Open MySQL Workbench
2. Open file: `database/schema.sql`
3. Click ⚡ Execute

---

### 3. Insert sample data

1. Open file: `database/test.sql`
2. Click ⚡ Execute

---

## ✅ Verify

Run:

```sql
SELECT * FROM tasks;
```

You should see sample tasks.

---

## 🧩 Tables

* `users` → store user accounts
* `tasks` → store tasks
* `notifications` → store reminders
* `settings` → store user preferences

---

## 🔗 Relationships

* 1 user → many tasks
* 1 task → many notifications
* 1 user → 1 setting

---

## 📌 Notes

* Default database name: `myproject`
* Default user: `root`
* Update password in backend if needed

---

## 💡 Quick Start

```text
Run schema.sql → create tables  
Run test.sql → insert data  
Ready to use
```
