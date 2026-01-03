/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import markdown from "highlight.js/lib/languages/markdown";
import python from "highlight.js/lib/languages/python";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";

if (!hljs.getLanguage("python")) {
    hljs.registerLanguage("python", python);
}
if (!hljs.getLanguage("markdown")) {
    hljs.registerLanguage("markdown", markdown);
}
if (!hljs.getLanguage("json")) {
    hljs.registerLanguage("json", json);
}
if (!hljs.getLanguage("bash")) {
    hljs.registerLanguage("bash", bash);
}
if (!hljs.getLanguage("javascript")) {
    hljs.registerLanguage("javascript", javascript);
}
if (!hljs.getLanguage("typescript")) {
    hljs.registerLanguage("typescript", typescript);
}
if (!hljs.getLanguage("xml")) {
    hljs.registerLanguage("xml", xml);
}
export default hljs;
