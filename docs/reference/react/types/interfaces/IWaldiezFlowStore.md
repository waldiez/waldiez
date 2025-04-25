[**@waldiez/react v0.4.4**](../../README.md)

***

Defined in: src/waldiez/models/Stores/IFlowStore.ts:16

## Properties

### exportFlow()

> **exportFlow**: (`hideSecrets`, `skipLinks`) => [`WaldiezFlow`](../classes/WaldiezFlow.md)

Defined in: src/waldiez/models/Stores/IFlowStore.ts:26

#### Parameters

##### hideSecrets

`boolean`

##### skipLinks

`boolean`

#### Returns

[`WaldiezFlow`](../classes/WaldiezFlow.md)

***

### getFlowEdges()

> **getFlowEdges**: (`skipSwarm`) => `object`

Defined in: src/waldiez/models/Stores/IFlowStore.ts:24

#### Parameters

##### skipSwarm

`boolean`

#### Returns

`object`

##### remaining

> **remaining**: [`WaldiezEdge`](../type-aliases/WaldiezEdge.md)[]

##### used

> **used**: [`WaldiezEdge`](../type-aliases/WaldiezEdge.md)[]

***

### getFlowInfo()

> **getFlowInfo**: () => [`WaldiezFlowInfo`](../type-aliases/WaldiezFlowInfo.md)

Defined in: src/waldiez/models/Stores/IFlowStore.ts:20

#### Returns

[`WaldiezFlowInfo`](../type-aliases/WaldiezFlowInfo.md)

***

### getRfInstance()

> **getRfInstance**: () => `undefined` \| `ReactFlowInstance`

Defined in: src/waldiez/models/Stores/IFlowStore.ts:18

#### Returns

`undefined` \| `ReactFlowInstance`

***

### getViewport()

> **getViewport**: () => `undefined` \| `Viewport`

Defined in: src/waldiez/models/Stores/IFlowStore.ts:17

#### Returns

`undefined` \| `Viewport`

***

### importFlow()

> **importFlow**: (`items`, `flowData`, `typeShown`) => `void`

Defined in: src/waldiez/models/Stores/IFlowStore.ts:25

#### Parameters

##### items

[`ThingsToImport`](../type-aliases/ThingsToImport.md)

##### flowData

[`ImportedFlow`](../type-aliases/ImportedFlow.md)

##### typeShown

[`WaldiezNodeType`](../type-aliases/WaldiezNodeType.md)

#### Returns

`void`

***

### onFlowChanged()

> **onFlowChanged**: () => [`WaldiezFlow`](../classes/WaldiezFlow.md)

Defined in: src/waldiez/models/Stores/IFlowStore.ts:21

#### Returns

[`WaldiezFlow`](../classes/WaldiezFlow.md)

***

### onViewportChange()

> **onViewportChange**: (`viewport`, `nodeType`) => `void`

Defined in: src/waldiez/models/Stores/IFlowStore.ts:22

#### Parameters

##### viewport

###### x

`number`

###### y

`number`

###### zoom

`number`

##### nodeType

[`WaldiezNodeType`](../type-aliases/WaldiezNodeType.md)

#### Returns

`void`

***

### saveFlow()

> **saveFlow**: () => `void`

Defined in: src/waldiez/models/Stores/IFlowStore.ts:23

#### Returns

`void`

***

### setRfInstance()

> **setRfInstance**: (`rfInstance`) => `void`

Defined in: src/waldiez/models/Stores/IFlowStore.ts:19

#### Parameters

##### rfInstance

`ReactFlowInstance`

#### Returns

`void`

***

### updateFlowInfo()

> **updateFlowInfo**: (`data`) => `void`

Defined in: src/waldiez/models/Stores/IFlowStore.ts:29

#### Parameters

##### data

###### cacheSeed

`null` \| `number`

###### description

`string`

###### isAsync

`boolean`

###### name

`string`

###### requirements

`string`[]

###### tags

`string`[]

#### Returns

`void`

***

### updateFlowOrder()

> **updateFlowOrder**: (`data`) => `void`

Defined in: src/waldiez/models/Stores/IFlowStore.ts:27

#### Parameters

##### data

`object`[]

#### Returns

`void`

***

### updateFlowPrerequisites()

> **updateFlowPrerequisites**: (`edges`) => `void`

Defined in: src/waldiez/models/Stores/IFlowStore.ts:28

#### Parameters

##### edges

[`WaldiezEdge`](../type-aliases/WaldiezEdge.md)[]

#### Returns

`void`
