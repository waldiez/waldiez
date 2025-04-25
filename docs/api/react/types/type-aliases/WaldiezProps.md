[**@waldiez/react v0.4.4**](../../README.md)

***

> **WaldiezProps** = [`WaldiezFlowProps`](WaldiezFlowProps.md) & `object`

Defined in: src/waldiez/types.ts:23

## Type declaration

### edges

> **edges**: `Edge`[]

### inputPrompt?

> `optional` **inputPrompt**: \{ `previousMessages`: `string`[]; `prompt`: `string`; \} \| `null`

### monacoVsPath?

> `optional` **monacoVsPath**: `string` \| `null`

### nodes

> **nodes**: `Node`[]

### onChange?

> `optional` **onChange**: (`flow`) => `void` \| `null`

### onConvert?

> `optional` **onConvert**: (`flow`, `to`) => `void` \| `null`

### onRun?

> `optional` **onRun**: (`flow`) => `void` \| `null`

### onSave?

> `optional` **onSave**: (`flow`) => `void` \| `null`

### onUpload?

> `optional` **onUpload**: (`files`) => `Promise`\<`string`[]\> \| `null`

### onUserInput?

> `optional` **onUserInput**: (`input`) => `void` \| `null`

### readOnly?

> `optional` **readOnly**: `boolean` \| `null`

### skipExport?

> `optional` **skipExport**: `boolean` \| `null`

### skipHub?

> `optional` **skipHub**: `boolean` \| `null`

### skipImport?

> `optional` **skipImport**: `boolean` \| `null`

### viewport?

> `optional` **viewport**: `Viewport`
