[**@waldiez/react v0.4.4**](../../README.md)

***

Defined in: src/waldiez/models/Agent/Common/Agent.ts:22

Waldiez Agent.

## Param

The id of the agent

## Param

The type of the node in a graph (agent)

## Param

The type of the agent ("user" | "assistant" | "manager" | "rag_user" | "swarm" | "reasoning" | "captain")

## Param

The name of the agent

## Param

The description of the agent

## Param

The tags of the agent

## Param

The requirements of the agent

## Param

The creation date of the agent

## Param

The update date of the agent

## Param

The data of the agent. See [WaldiezAgentData](WaldiezAgentData.md)

## Extended by

- [`WaldiezAgentAssistant`](WaldiezAgentAssistant.md)
- [`WaldiezAgentCaptain`](WaldiezAgentCaptain.md)
- [`WaldiezAgentGroupManager`](WaldiezAgentGroupManager.md)
- [`WaldiezAgentRagUser`](WaldiezAgentRagUser.md)
- [`WaldiezAgentReasoning`](WaldiezAgentReasoning.md)
- [`WaldiezAgentSwarm`](WaldiezAgentSwarm.md)
- [`WaldiezAgentSwarmContainer`](WaldiezAgentSwarmContainer.md)
- [`WaldiezAgentUserProxy`](WaldiezAgentUserProxy.md)

## Constructors

### Constructor

> **new WaldiezAgent**(`props`): `WaldiezAgent`

Defined in: src/waldiez/models/Agent/Common/Agent.ts:35

#### Parameters

##### props

###### agentType

[`WaldiezNodeAgentType`](../type-aliases/WaldiezNodeAgentType.md)

###### createdAt

`string`

###### data

[`WaldiezAgentData`](WaldiezAgentData.md)

###### description

`string`

###### id

`string`

###### name

`string`

###### requirements

`string`[]

###### rest?

\{[`key`: `string`]: `unknown`; \}

###### tags

`string`[]

###### updatedAt

`string`

#### Returns

`WaldiezAgent`

## Properties

### agentType

> **agentType**: [`WaldiezNodeAgentType`](../type-aliases/WaldiezNodeAgentType.md)

Defined in: src/waldiez/models/Agent/Common/Agent.ts:25

***

### createdAt

> **createdAt**: `string`

Defined in: src/waldiez/models/Agent/Common/Agent.ts:30

***

### data

> **data**: [`WaldiezAgentData`](WaldiezAgentData.md)

Defined in: src/waldiez/models/Agent/Common/Agent.ts:32

***

### description

> **description**: `string`

Defined in: src/waldiez/models/Agent/Common/Agent.ts:27

***

### id

> **id**: `string`

Defined in: src/waldiez/models/Agent/Common/Agent.ts:23

***

### name

> **name**: `string`

Defined in: src/waldiez/models/Agent/Common/Agent.ts:26

***

### requirements

> **requirements**: `string`[]

Defined in: src/waldiez/models/Agent/Common/Agent.ts:29

***

### rest?

> `optional` **rest**: `object`

Defined in: src/waldiez/models/Agent/Common/Agent.ts:33

#### Index Signature

\[`key`: `string`\]: `unknown`

***

### tags

> **tags**: `string`[]

Defined in: src/waldiez/models/Agent/Common/Agent.ts:28

***

### type

> **type**: `string` = `"agent"`

Defined in: src/waldiez/models/Agent/Common/Agent.ts:24

***

### updatedAt

> **updatedAt**: `string`

Defined in: src/waldiez/models/Agent/Common/Agent.ts:31

## Methods

### create()

> `static` **create**(`agentType`): `WaldiezAgent`

Defined in: src/waldiez/models/Agent/Common/Agent.ts:59

#### Parameters

##### agentType

[`WaldiezAgentType`](../type-aliases/WaldiezAgentType.md) | `"swarm_container"`

#### Returns

`WaldiezAgent`
