[**@waldiez/react v0.4.4**](../../README.md)

***

> `const` **flowMapper**: `object`

Defined in: src/waldiez/models/mappers/flow/flowMapper.ts:42

## Type declaration

### exportFlow()

> **exportFlow**: (`flow`, `hideSecrets`, `skipLinks`) => [`WaldiezFlow`](../classes/WaldiezFlow.md)

#### Parameters

##### flow

[`WaldiezFlowProps`](../type-aliases/WaldiezFlowProps.md)

##### hideSecrets

`boolean`

##### skipLinks

`boolean` = `false`

#### Returns

[`WaldiezFlow`](../classes/WaldiezFlow.md)

### importFlow()

> **importFlow**: (`item`, `newId?`) => [`WaldiezFlow`](../classes/WaldiezFlow.md)

#### Parameters

##### item

`any`

##### newId?

`string`

#### Returns

[`WaldiezFlow`](../classes/WaldiezFlow.md)

### toReactFlow()

> **toReactFlow**(`flow`): [`WaldiezFlowProps`](../type-aliases/WaldiezFlowProps.md)

#### Parameters

##### flow

[`WaldiezFlow`](../classes/WaldiezFlow.md)

#### Returns

[`WaldiezFlowProps`](../type-aliases/WaldiezFlowProps.md)
