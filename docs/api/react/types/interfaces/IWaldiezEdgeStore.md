[**@waldiez/react v0.4.4**](../../README.md)

***

Defined in: src/waldiez/models/Stores/IEdgeStore.ts:15

## Properties

### addEdge()

> **addEdge**: (`connection`, `hidden`) => `null` \| [`WaldiezEdge`](../type-aliases/WaldiezEdge.md)

Defined in: src/waldiez/models/Stores/IEdgeStore.ts:25

#### Parameters

##### connection

`Connection`

##### hidden

`boolean`

#### Returns

`null` \| [`WaldiezEdge`](../type-aliases/WaldiezEdge.md)

***

### deleteEdge()

> **deleteEdge**: (`id`) => `void`

Defined in: src/waldiez/models/Stores/IEdgeStore.ts:18

#### Parameters

##### id

`string`

#### Returns

`void`

***

### getEdgeById()

> **getEdgeById**: (`id`) => `undefined` \| [`WaldiezEdge`](../type-aliases/WaldiezEdge.md)

Defined in: src/waldiez/models/Stores/IEdgeStore.ts:17

#### Parameters

##### id

`string`

#### Returns

`undefined` \| [`WaldiezEdge`](../type-aliases/WaldiezEdge.md)

***

### getEdges()

> **getEdges**: () => [`WaldiezEdge`](../type-aliases/WaldiezEdge.md)[]

Defined in: src/waldiez/models/Stores/IEdgeStore.ts:16

#### Returns

[`WaldiezEdge`](../type-aliases/WaldiezEdge.md)[]

***

### getEdgeSourceAgent()

> **getEdgeSourceAgent**: (`edge`) => `undefined` \| [`WaldiezNodeAgent`](../type-aliases/WaldiezNodeAgent.md)

Defined in: src/waldiez/models/Stores/IEdgeStore.ts:22

#### Parameters

##### edge

[`WaldiezEdge`](../type-aliases/WaldiezEdge.md)

#### Returns

`undefined` \| [`WaldiezNodeAgent`](../type-aliases/WaldiezNodeAgent.md)

***

### getEdgeTargetAgent()

> **getEdgeTargetAgent**: (`edge`) => `undefined` \| [`WaldiezNodeAgent`](../type-aliases/WaldiezNodeAgent.md)

Defined in: src/waldiez/models/Stores/IEdgeStore.ts:23

#### Parameters

##### edge

[`WaldiezEdge`](../type-aliases/WaldiezEdge.md)

#### Returns

`undefined` \| [`WaldiezNodeAgent`](../type-aliases/WaldiezNodeAgent.md)

***

### getSwarmEdges()

> **getSwarmEdges**: () => [`WaldiezEdge`](../type-aliases/WaldiezEdge.md)[]

Defined in: src/waldiez/models/Stores/IEdgeStore.ts:28

#### Returns

[`WaldiezEdge`](../type-aliases/WaldiezEdge.md)[]

***

### onEdgeDoubleClick()

> **onEdgeDoubleClick**: (`event`, `edge`) => `void`

Defined in: src/waldiez/models/Stores/IEdgeStore.ts:26

#### Parameters

##### event

`MouseEvent`

##### edge

[`WaldiezEdge`](../type-aliases/WaldiezEdge.md)

#### Returns

`void`

***

### onEdgesChange()

> **onEdgesChange**: (`changes`) => `void`

Defined in: src/waldiez/models/Stores/IEdgeStore.ts:19

#### Parameters

##### changes

`EdgeChange`[]

#### Returns

`void`

***

### onReconnect()

> **onReconnect**: (`oldEdge`, `newConnection`) => `void`

Defined in: src/waldiez/models/Stores/IEdgeStore.ts:27

#### Parameters

##### oldEdge

`Edge`

##### newConnection

`Connection`

#### Returns

`void`

***

### updateEdgeData()

> **updateEdgeData**: (`id`, `data`) => `void`

Defined in: src/waldiez/models/Stores/IEdgeStore.ts:20

#### Parameters

##### id

`string`

##### data

`Partial`\<[`WaldiezEdgeData`](../type-aliases/WaldiezEdgeData.md)\>

#### Returns

`void`

***

### updateEdgePath()

> **updateEdgePath**: (`id`, `agentType`) => `void`

Defined in: src/waldiez/models/Stores/IEdgeStore.ts:21

#### Parameters

##### id

`string`

##### agentType

[`WaldiezNodeAgentType`](../type-aliases/WaldiezNodeAgentType.md)

#### Returns

`void`

***

### updateEdgeType()

> **updateEdgeType**: (`id`, `type`) => `void`

Defined in: src/waldiez/models/Stores/IEdgeStore.ts:24

#### Parameters

##### id

`string`

##### type

[`WaldiezEdgeType`](../type-aliases/WaldiezEdgeType.md)

#### Returns

`void`
