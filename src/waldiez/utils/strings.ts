/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
/**
 * Convert a string to a capitalized format.
 * The first character is capitalized, and the rest are converted to lowercase.
 * @param str - The string to capitalize.
 * @returns The capitalized string.
 */
export const capitalize = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Format a date string into a human-readable format.
 * The date is formatted as "MM/DD/YYYY HH:MM:SS".
 * @param date - The date string to format.
 * @returns A formatted date string.
 */
export const getDateString = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString() + " " + d.toLocaleTimeString();
};

/**
 * Convert a string to a friendly format.
 * The string is transformed by adding spaces before uppercase letters and digits,
 * replacing underscores and hyphens with spaces, and capitalizing each word.
 * @param str - The string to convert.
 * @returns A friendly formatted string.
 */
export const getFriendlyString = (str: string) => {
    return str
        .replace(/([A-Z])/g, " $1")
        .replace(/([0-9])/g, " $1")
        .replace(/_/g, " ")
        .replace(/-/g, " ")
        .trim()
        .toLowerCase()
        .split(" ")
        .map(word => capitalize(word))
        .join(" ");
};

/**
 * Convert a string to camelCase format.
 * The string is transformed by adding spaces before uppercase letters and digits,
 * replacing underscores and hyphens with spaces, and capitalizing each word,
 * with the first character converted to lowercase.
 * @param str - The string to convert.
 * @returns A camelCase formatted string.
 */
export const toCamelCase = (str: string) => {
    return (
        str
            .replace(/([a-z])([A-Z])/g, "$1 $2")
            .replace(/([0-9])([A-Z])/g, "$1 $2")
            .replace(/_/g, " ")
            .replace(/-/g, " ")
            .trim()
            .toLowerCase()
            .split(" ")
            .map(word => capitalize(word))
            .join("")
            // first character to lowercase
            .replace(/^[A-Z]/, match => match.toLowerCase())
    );
};

export const toKebabCase = (str: string) => {
    return str
        .replace(/([a-z])([A-Z])/g, "$1-$2")
        .replace(/([0-9])([A-Z])/g, "$1-$2")
        .replace(/_/g, "-")
        .replace(/ /g, "-")
        .toLowerCase();
};

export const toSnakeCase = (str: string) => {
    return str
        .replace(/([a-z])([A-Z])/g, "$1_$2")
        .replace(/([0-9])([A-Z])/g, "$1_$2")
        .replace(/-/g, "_")
        .replace(/ /g, "_")
        .toLowerCase();
};

export const toPascalCase = (str: string) => {
    return str
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/([0-9])([A-Z])/g, "$1 $2")
        .replace(/_/g, " ")
        .replace(/-/g, " ")
        .trim()
        .toLowerCase()
        .split(" ")
        .map(word => capitalize(word))
        .join("");
};
