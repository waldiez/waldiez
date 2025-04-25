[**@waldiez/react v0.4.4**](../../README.md)

***

Defined in: src/waldiez/models/Stores/IAgentStore.ts:13

## Properties

### addAgent()

> **addAgent**: (`agentType`, `position`, `parentId`) => [`WaldiezNodeAgent`](../type-aliases/WaldiezNodeAgent.md)

Defined in: src/waldiez/models/Stores/IAgentStore.ts:16

#### Parameters

##### agentType

[`WaldiezNodeAgentType`](../type-aliases/WaldiezNodeAgentType.md)

##### position

###### x

`number`

###### y

`number`

##### parentId

`undefined` | `string`

#### Returns

[`WaldiezNodeAgent`](../type-aliases/WaldiezNodeAgent.md)

***

### addGroupMember()

> **addGroupMember**: (`groupId`, `memberId`) => `void`

Defined in: src/waldiez/models/Stores/IAgentStore.ts:34

#### Parameters

##### groupId

`string`

##### memberId

`string`

#### Returns

`void`

***

### cloneAgent()

> **cloneAgent**: (`id`) => `null` \| [`WaldiezNodeAgent`](../type-aliases/WaldiezNodeAgent.md)

Defined in: src/waldiez/models/Stores/IAgentStore.ts:21

#### Parameters

##### id

`string`

#### Returns

`null` \| [`WaldiezNodeAgent`](../type-aliases/WaldiezNodeAgent.md)

***

### deleteAgent()

> **deleteAgent**: (`id`) => `void`

Defined in: src/waldiez/models/Stores/IAgentStore.ts:23

#### Parameters

##### id

`string`

#### Returns

`void`

***

### ensureSwarmContainer()

> **ensureSwarmContainer**: (`flowId`, `position`) => [`WaldiezNodeAgent`](../type-aliases/WaldiezNodeAgent.md)

Defined in: src/waldiez/models/Stores/IAgentStore.ts:44

#### Parameters

##### flowId

`string`

##### position

###### x

`number`

###### y

`number`

#### Returns

[`WaldiezNodeAgent`](../type-aliases/WaldiezNodeAgent.md)

***

### exportAgent()

> **exportAgent**: (`agentId`, `hideSecrets`) => `object`

Defined in: src/waldiez/models/Stores/IAgentStore.ts:31

#### Parameters

##### agentId

`string`

##### hideSecrets

`boolean`

#### Returns

`object`

***

### getAgentById()

> **getAgentById**: (`id`) => `null` \| [`WaldiezNodeAgent`](../type-aliases/WaldiezNodeAgent.md)

Defined in: src/waldiez/models/Stores/IAgentStore.ts:15

#### Parameters

##### id

`string`

#### Returns

`null` \| [`WaldiezNodeAgent`](../type-aliases/WaldiezNodeAgent.md)

***

### getAgentConnections()

> **getAgentConnections**: (`nodeId`, `options?`) => `object`

Defined in: src/waldiez/models/Stores/IAgentStore.ts:45

#### Parameters

##### nodeId

`string`

##### options?

###### skipManagers?

`boolean`

###### sourcesOnly?

`boolean`

###### targetsOnly?

`boolean`

#### Returns

`object`

##### source

> **source**: `object`

###### source.edges

> **edges**: [`WaldiezEdge`](../type-aliases/WaldiezEdge.md)[]

###### source.nodes

> **nodes**: [`WaldiezNodeAgent`](../type-aliases/WaldiezNodeAgent.md)[]

##### target

> **target**: `object`

###### target.edges

> **edges**: [`WaldiezEdge`](../type-aliases/WaldiezEdge.md)[]

###### target.nodes

> **nodes**: [`WaldiezNodeAgent`](../type-aliases/WaldiezNodeAgent.md)[]

***

### getAgents()

> **getAgents**: () => [`WaldiezNodeAgent`](../type-aliases/WaldiezNodeAgent.md)[]

Defined in: src/waldiez/models/Stores/IAgentStore.ts:14

#### Returns

[`WaldiezNodeAgent`](../type-aliases/WaldiezNodeAgent.md)[]

***

### getGroupMembers()

> **getGroupMembers**: (`groupId`) => [`WaldiezNodeAgent`](../type-aliases/WaldiezNodeAgent.md)[]

Defined in: src/waldiez/models/Stores/IAgentStore.ts:33

#### Parameters

##### groupId

`string`

#### Returns

[`WaldiezNodeAgent`](../type-aliases/WaldiezNodeAgent.md)[]

***

### getNonSwarmAgents()

> **getNonSwarmAgents**: (`swarmContainerId`, `swarmAgents`, `edges`) => `object`

Defined in: src/waldiez/models/Stores/IAgentStore.ts:39

#### Parameters

##### swarmContainerId

`string`

##### swarmAgents

[`WaldiezNodeAgent`](../type-aliases/WaldiezNodeAgent.md)[]

##### edges

`object`[]

#### Returns

`object`

##### swarmSources

> **swarmSources**: [`WaldiezNodeAgent`](../type-aliases/WaldiezNodeAgent.md)[]

##### swarmTargets

> **swarmTargets**: [`WaldiezNodeAgent`](../type-aliases/WaldiezNodeAgent.md)[]

***

### getSwarmAgents()

> **getSwarmAgents**: () => [`WaldiezNodeAgentSwarm`](../type-aliases/WaldiezNodeAgentSwarm.md)[]

Defined in: src/waldiez/models/Stores/IAgentStore.ts:36

#### Returns

[`WaldiezNodeAgentSwarm`](../type-aliases/WaldiezNodeAgentSwarm.md)[]

***

### importAgent()

> **importAgent**: (`agent`, `agentId`, `skipLinks`, `position`, `save`) => [`WaldiezNodeAgent`](../type-aliases/WaldiezNodeAgent.md)

Defined in: src/waldiez/models/Stores/IAgentStore.ts:24

#### Parameters

##### agent

##### agentId

`string`

##### skipLinks

`boolean`

##### position

`undefined` | \{ `x`: `number`; `y`: `number`; \}

##### save

`boolean`

#### Returns

[`WaldiezNodeAgent`](../type-aliases/WaldiezNodeAgent.md)

***

### removeGroupMember()

> **removeGroupMember**: (`groupId`, `memberId`) => `void`

Defined in: src/waldiez/models/Stores/IAgentStore.ts:35

#### Parameters

##### groupId

`string`

##### memberId

`string`

#### Returns

`void`

***

### setAgentGroup()

> **setAgentGroup**: (`agentId`, `groupId`) => `void`

Defined in: src/waldiez/models/Stores/IAgentStore.ts:32

#### Parameters

##### agentId

`string`

##### groupId

`string`

#### Returns

`void`

***

### setSwarmInitialAgent()

> **setSwarmInitialAgent**: (`agentId`) => `void`

Defined in: src/waldiez/models/Stores/IAgentStore.ts:37

#### Parameters

##### agentId

`string`

#### Returns

`void`

***

### updateAgentData()

> **updateAgentData**: (`id`, `data`) => `void`

Defined in: src/waldiez/models/Stores/IAgentStore.ts:22

#### Parameters

##### id

`string`

##### data

`Partial`\<[`WaldiezNodeAgentData`](../type-aliases/WaldiezNodeAgentData.md)\>

#### Returns

`void`

***

### updateSwarmInitialAgent()

> **updateSwarmInitialAgent**: (`agentId`) => `void`

Defined in: src/waldiez/models/Stores/IAgentStore.ts:38

#### Parameters

##### agentId

`string`

#### Returns

`void`
