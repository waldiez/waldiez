/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */

function e(e){return new Worker("/assets/editor.worker-2m3kjqME.js",{name:e?.name})}function n(e){return new Worker("/assets/css.worker-W1xlKw-Z.js",{name:e?.name})}function r(e){return new Worker("/assets/html.worker-Bx73yQqq.js",{name:e?.name})}function s(e){return new Worker("/assets/json.worker-IH_xQTZG.js",{name:e?.name})}function o(e){return new Worker("/assets/ts.worker-CEXTj_sI.js",{name:e?.name})}globalThis.MonacoEnvironment={getWorker:(t,a)=>"json"===a?new s:"css"===a||"scss"===a||"less"===a?new n:"html"===a||"handlebars"===a||"razor"===a?new r:"typescript"===a||"javascript"===a?new o:new e};
