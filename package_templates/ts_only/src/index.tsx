import React from "react";
import ReactDOM from "react-dom/client";

import { App } from "@my/package/App";
import "@my/package/index.css";

export const startApp = () => {
    ReactDOM.createRoot(document.getElementById("root")!).render(
        <React.StrictMode>
            <App />
        </React.StrictMode>,
    );
};

startApp();
