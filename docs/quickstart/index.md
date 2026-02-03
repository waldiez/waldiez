# ⚡ Quick Start — Run Your First Waldiez Flow

This guide gets you from **zero → running your first multi-agent flow** using **Waldiez Studio** — our **recommended environment** for workshops, demos, and real usage.

You will create, run, and save a working flow in **under 5 minutes**.

---

## Why Waldiez Studio?

Waldiez Studio is the **fastest way to build and run flows locally**:

- 🧩 Visual drag-and-drop flow editor  
- ▶️ Run flows instantly  
- 📤 Export to Python or Jupyter  
- 🖥️ Ideal for workshops, classrooms, and live demos  

> Note: The Playground is great for previewing flows, but **it cannot run them**.

---

## Step 1 — Install Waldiez Studio

Make sure you have **Python 3.10+**, then install:

```bash
pip install waldiez[studio]
```

Or:

```bash
pip install waldiez-studio
```

Verify installation:

```bash
waldiez --help
```

---

## Step 2 — Launch Waldiez Studio

Start the Studio server:

```bash
waldiez studio
```

You should see something like:

```
Running on http://localhost:8000
```

Open it in your browser:

```
http://localhost:8000
```

---

## Step 3 — Create Your First Flow

In Waldiez Studio:

### 1. Drag these agents onto the Canvas
- **User Agent**
- **Assistant Agent**

### 2. Connect them

```
User → Assistant
```

This defines how messages flow.

---

## Step 4 — Configure the Assistant Agent

Click the **Assistant Agent** and set the **System Message**:

```text
You are a helpful assistant that answers clearly and concisely.
```

(Optional) Select a model in the **Models** tab.

---

## Step 5 — Save the Flow

Save your workflow as:

```text
my_first_flow.waldiez
```

---

## Step 6 — Run the Flow

Click **Run** inside Waldiez Studio.

You should now see the assistant respond to user input in real time.

🎉 Your first multi-agent flow is running.

---

## Optional Upgrade — Add Reasoning

Add a **Reasoning Agent** and connect:

```
User → Reasoning → Assistant
```

This enables **multi-step reasoning** and more thoughtful responses.

---

## What You’ve Learned

You can now:

- Build agent workflows visually  
- Connect agents into pipelines  
- Run flows locally  
- Save and reuse `.waldiez` files  

---

## Continue Learning

- Agent Overview → ../agents/index.md  
- Flow Guide → ../usage/flow.md  
- Examples → ../examples/index.md  

---

## Workshop Tip (Optional)

For workshops or classes:

- Ask participants to **install Waldiez Studio before the session**
- Provide a **starter `.waldiez` file**
- Give a **5-minute “build your first flow” challenge**
