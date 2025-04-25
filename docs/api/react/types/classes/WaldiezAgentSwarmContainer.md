[**@waldiez/react v0.4.4**](../../README.md)

***

Defined in: src/waldiez/models/Agent/Swarm/SwarmContainer.ts:22

Swarm agent

## Param

The id of the swarm agent

## Param

The type of the node in a graph (agent)

## Param

The type of the node in a graph (swarm)

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

The data of the agent. See [WaldiezAgentSwarmContainerData](WaldiezAgentSwarmContainerData.md)

## Param

Any other data

## Extends

- [`WaldiezAgent`](WaldiezAgent.md)

## Constructors

### Constructor

> **new WaldiezAgentSwarmContainer**(`props`): `WaldiezAgentSwarmContainer`

Defined in: src/waldiez/models/Agent/Swarm/SwarmContainer.ts:26

#### Parameters

##### props

###### agentType

[`WaldiezNodeAgentType`](../type-aliases/WaldiezNodeAgentType.md)

###### createdAt

`string`

###### data

[`WaldiezAgentSwarmContainerData`](WaldiezAgentSwarmContainerData.md)

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

`WaldiezAgentSwarmContainer`

#### Overrides

[`WaldiezAgent`](WaldiezAgent.md).[`constructor`](WaldiezAgent.md#constructor)

## Properties

### agentType

> **agentType**: [`WaldiezNodeAgentType`](../type-aliases/WaldiezNodeAgentType.md) = `"swarm_container"`

Defined in: src/waldiez/models/Agent/Swarm/SwarmContainer.ts:24

#### Overrides

[`WaldiezAgent`](WaldiezAgent.md).[`agentType`](WaldiezAgent.md#agenttype)

***

### createdAt

> **createdAt**: `string`

Defined in: src/waldiez/models/Agent/Common/Agent.ts:30

#### Inherited from

[`WaldiezAgent`](WaldiezAgent.md).[`createdAt`](WaldiezAgent.md#createdat)

***

### data

> **data**: [`WaldiezAgentSwarmContainerData`](WaldiezAgentSwarmContainerData.md)

Defined in: src/waldiez/models/Agent/Swarm/SwarmContainer.ts:23

#### Overrides

[`WaldiezAgent`](WaldiezAgent.md).[`data`](WaldiezAgent.md#data)

***

### description

> **description**: `string`

Defined in: src/waldiez/models/Agent/Common/Agent.ts:27

#### Inherited from

[`WaldiezAgent`](WaldiezAgent.md).[`description`](WaldiezAgent.md#description)

***

### id

> **id**: `string`

Defined in: src/waldiez/models/Agent/Common/Agent.ts:23

#### Inherited from

[`WaldiezAgent`](WaldiezAgent.md).[`id`](WaldiezAgent.md#id)

***

### name

> **name**: `string`

Defined in: src/waldiez/models/Agent/Common/Agent.ts:26

#### Inherited from

[`WaldiezAgent`](WaldiezAgent.md).[`name`](WaldiezAgent.md#name)

***

### requirements

> **requirements**: `string`[]

Defined in: src/waldiez/models/Agent/Common/Agent.ts:29

#### Inherited from

[`WaldiezAgent`](WaldiezAgent.md).[`requirements`](WaldiezAgent.md#requirements)

***

### rest?

> `optional` **rest**: `object`

Defined in: src/waldiez/models/Agent/Common/Agent.ts:33

#### Index Signature

\[`key`: `string`\]: `unknown`

#### Inherited from

[`WaldiezAgent`](WaldiezAgent.md).[`rest`](WaldiezAgent.md#rest)

***

### tags

> **tags**: `string`[]

Defined in: src/waldiez/models/Agent/Common/Agent.ts:28

#### Inherited from

[`WaldiezAgent`](WaldiezAgent.md).[`tags`](WaldiezAgent.md#tags)

***

### type

> **type**: `string` = `"agent"`

Defined in: src/waldiez/models/Agent/Common/Agent.ts:24

#### Inherited from

[`WaldiezAgent`](WaldiezAgent.md).[`type`](WaldiezAgent.md#type)

***

### updatedAt

> **updatedAt**: `string`

Defined in: src/waldiez/models/Agent/Common/Agent.ts:31

#### Inherited from

[`WaldiezAgent`](WaldiezAgent.md).[`updatedAt`](WaldiezAgent.md#updatedat)

## Methods

### create()

> `static` **create**(`agentType`): [`WaldiezAgent`](WaldiezAgent.md)

Defined in: src/waldiez/models/Agent/Common/Agent.ts:59

#### Parameters

##### agentType

[`WaldiezAgentType`](../type-aliases/WaldiezAgentType.md) | `"swarm_container"`

#### Returns

[`WaldiezAgent`](WaldiezAgent.md)

#### Inherited from

[`WaldiezAgent`](WaldiezAgent.md).[`create`](WaldiezAgent.md#create)
