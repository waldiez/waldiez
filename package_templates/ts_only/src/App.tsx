import { useEffect } from "react";

import { Main } from "@my/package/components/Main";

export const App = () => {
    useEffect(() => {
        checkInitialBodyClass();
    }, []);
    return <Main />;
};

const checkInitialBodyClass = () => {
    // if the initial body class is not set,
    // set it based on the user's preference
    if (!document.body.classList.contains("dark-theme") && !document.body.classList.contains("light-theme")) {
        const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
        if (darkQuery.matches) {
            document.body.classList.add("dark-theme");
        } else {
            document.body.classList.add("light-theme");
        }
    }
};
