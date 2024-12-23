import { FaEye, FaEyeSlash } from "react-icons/fa";

import "@my/package/components/Main/Main.css";
import { useMain } from "@my/package/components/Main/useMain";
import logo from "@my/package/logo.svg";

// just a dummy one
export const Main = () => {
    const {
        theme,
        userInput,
        userName,
        toggleTheme,
        onUserInputChange,
        toggleUserInputVisibility,
        onKeyDown,
        onSubmit,
    } = useMain();
    return (
        <div className="main">
            <h1>App</h1>
            <img src={logo} alt="logo" title="Logo" className="logo" />
            <button
                type="button"
                title="Toggle theme"
                onClick={toggleTheme}
                data-testid="toggle-theme-button"
                className="theme-button"
            >
                Theme: {theme}
            </button>
            <div className="user-input">
                <label htmlFor="user-input">Enter your name:</label>
                <div className="input-container">
                    <input
                        type={userInput.isHidden ? "password" : "text"}
                        id="user-input"
                        value={userInput.value}
                        onChange={onUserInputChange}
                        data-testid="user-input"
                        onKeyDown={onKeyDown}
                    />
                    <button
                        type="button"
                        className="clickable toggle-visibility"
                        title="Toggle input visibility"
                        onClick={toggleUserInputVisibility}
                        data-testid="toggle-user-input-visibility-button"
                    >
                        {userInput.isHidden ? <FaEyeSlash /> : <FaEye />}
                    </button>
                </div>
            </div>
            <div className="greet" data-testid="greet" id="greet">
                <button type="button" title="Greet" onClick={onSubmit} data-testid="greet-button">
                    Submit
                </button>
            </div>
            <div className="result" data-testid="result" id="result">
                {userName && `Hello, ${userName}!`}
            </div>
        </div>
    );
};
