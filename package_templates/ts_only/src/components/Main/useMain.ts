import { useState } from "react";

import { UseMain, UserInput } from "@my/package/types";

export const useMain: () => UseMain = () => {
    const [theme, setTheme] = useState<"light" | "dark">("light");
    const [userInput, setUserInput] = useState<UserInput>({
        isHidden: false,
        value: "",
    });
    const [userName, setUserName] = useState<string>("");
    const toggleTheme = () => {
        if (document.body.classList.contains("dark-theme")) {
            document.body.classList.remove("dark-theme");
            document.body.classList.add("light-theme");
            setTheme("light");
        } else {
            document.body.classList.remove("light-theme");
            document.body.classList.add("dark-theme");
            setTheme("dark");
        }
    };
    const onUserInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUserName("");
        setUserInput({ isHidden: userInput.isHidden, value: e.target.value });
    };
    const toggleUserInputVisibility = () => {
        setUserInput({ isHidden: !userInput.isHidden, value: userInput.value });
    };
    const onSubmit = () => {
        setUserName(userInput.value);
    };
    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            onSubmit();
        } else if (e.key === "Escape") {
            setUserInput({ ...userInput, value: "" });
            setUserName("");
        }
    };
    return {
        theme,
        userInput,
        userName,
        toggleTheme,
        onUserInputChange,
        toggleUserInputVisibility,
        onKeyDown,
        onSubmit,
    };
};
