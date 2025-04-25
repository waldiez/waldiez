[**@waldiez/react v0.4.4**](../../README.md)

***

Defined in: src/waldiez/models/Stores/IModelStore.ts:7

## Properties

### addModel()

> **addModel**: () => [`WaldiezNodeModel`](../type-aliases/WaldiezNodeModel.md)

Defined in: src/waldiez/models/Stores/IModelStore.ts:10

#### Returns

[`WaldiezNodeModel`](../type-aliases/WaldiezNodeModel.md)

***

### cloneModel()

> **cloneModel**: (`id`) => `null` \| [`WaldiezNodeModel`](../type-aliases/WaldiezNodeModel.md)

Defined in: src/waldiez/models/Stores/IModelStore.ts:11

#### Parameters

##### id

`string`

#### Returns

`null` \| [`WaldiezNodeModel`](../type-aliases/WaldiezNodeModel.md)

***

### deleteModel()

> **deleteModel**: (`id`) => `void`

Defined in: src/waldiez/models/Stores/IModelStore.ts:13

#### Parameters

##### id

`string`

#### Returns

`void`

***

### exportModel()

> **exportModel**: (`modelId`, `hideSecrets`) => `object`

Defined in: src/waldiez/models/Stores/IModelStore.ts:20

#### Parameters

##### modelId

`string`

##### hideSecrets

`boolean`

#### Returns

`object`

***

### getModelById()

> **getModelById**: (`id`) => `null` \| [`WaldiezNodeModel`](../type-aliases/WaldiezNodeModel.md)

Defined in: src/waldiez/models/Stores/IModelStore.ts:9

#### Parameters

##### id

`string`

#### Returns

`null` \| [`WaldiezNodeModel`](../type-aliases/WaldiezNodeModel.md)

***

### getModels()

> **getModels**: () => [`WaldiezNodeModel`](../type-aliases/WaldiezNodeModel.md)[]

Defined in: src/waldiez/models/Stores/IModelStore.ts:8

#### Returns

[`WaldiezNodeModel`](../type-aliases/WaldiezNodeModel.md)[]

***

### importModel()

> **importModel**: (`model`, `modelId`, `position`, `save`) => [`WaldiezNodeModel`](../type-aliases/WaldiezNodeModel.md)

Defined in: src/waldiez/models/Stores/IModelStore.ts:14

#### Parameters

##### model

##### modelId

`string`

##### position

`undefined` | \{ `x`: `number`; `y`: `number`; \}

##### save

`boolean`

#### Returns

[`WaldiezNodeModel`](../type-aliases/WaldiezNodeModel.md)

***

### updateModelData()

> **updateModelData**: (`id`, `data`) => `void`

Defined in: src/waldiez/models/Stores/IModelStore.ts:12

#### Parameters

##### id

`string`

##### data

`Partial`\<[`WaldiezNodeModelData`](../type-aliases/WaldiezNodeModelData.md)\>

#### Returns

`void`
