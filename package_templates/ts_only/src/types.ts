export type UserInput = {
    isHidden: boolean;
    value: string;
};

export type UseMain = {
    theme: "light" | "dark";
    userInput: UserInput;
    userName: string;
    toggleTheme: () => void;
    onUserInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    toggleUserInputVisibility: () => void;
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    onSubmit: () => void;
};
