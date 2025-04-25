[**@waldiez/react v0.4.4**](../../README.md)

***

Defined in: src/waldiez/models/Agent/Swarm/SwarmContainerData.ts:39

Waldiez Swarm Container Agent Data (extends [WaldiezAgentData](WaldiezAgentData.md)).

## Param

The human input mode of the agent ("NEVER" | "ALWAYS" | "SOMETIMES")

## Param

The system message of the agent

## Param

The code execution configuration of the agent

## Param

The default auto reply of the agent

## Param

The maximum consecutive auto reply of the agent

## Param

The termination message check of the agent

## Param

The model ids of the agent

## Param

The linked skills of the agent

## Param

The parent id of the agent

## Param

The nested chats of the agent

## Param

The maximum rounds  (for the edge)

## Param

The initial agent (if any, for the edge)

## Param

The after work (if any, for the edge)

## See

 - [WaldiezAgentData](WaldiezAgentData.md)
 - [WaldiezAgentLinkedSkill](../type-aliases/WaldiezAgentLinkedSkill.md)
 - [WaldiezAgentNestedChat](../type-aliases/WaldiezAgentNestedChat.md)
 - [WaldiezAgentTerminationMessageCheck](../type-aliases/WaldiezAgentTerminationMessageCheck.md)
 - [WaldiezAgentHumanInputMode](../type-aliases/WaldiezAgentHumanInputMode.md)
 - [WaldiezAgentCodeExecutionConfig](../type-aliases/WaldiezAgentCodeExecutionConfig.md)
 - [WaldiezAgentTerminationMessageCheck](../type-aliases/WaldiezAgentTerminationMessageCheck.md)
 - [WaldiezSwarmAfterWork](WaldiezSwarmAfterWork.md)

## Extends

- [`WaldiezAgentData`](WaldiezAgentData.md)

## Constructors

### Constructor

> **new WaldiezAgentSwarmContainerData**(`props`): `WaldiezAgentSwarmContainerData`

Defined in: src/waldiez/models/Agent/Swarm/SwarmContainerData.ts:44

#### Parameters

##### props

###### afterWork

`null` \| [`WaldiezSwarmAfterWork`](WaldiezSwarmAfterWork.md)

###### agentDefaultAutoReply

`null` \| `string`

###### codeExecutionConfig

[`WaldiezAgentCodeExecutionConfig`](../type-aliases/WaldiezAgentCodeExecutionConfig.md)

###### contextVariables

\{[`key`: `string`]: `string`; \}

###### humanInputMode

[`WaldiezAgentHumanInputMode`](../type-aliases/WaldiezAgentHumanInputMode.md)

###### initialAgent

`null` \| `string`

###### maxConsecutiveAutoReply

`null` \| `number`

###### maxRounds

`number`

###### modelIds

`string`[]

###### nestedChats

[`WaldiezAgentNestedChat`](../type-aliases/WaldiezAgentNestedChat.md)[]

###### parentId

`null` \| `string`

###### skills

[`WaldiezAgentLinkedSkill`](../type-aliases/WaldiezAgentLinkedSkill.md)[]

###### systemMessage

`null` \| `string`

###### termination

[`WaldiezAgentTerminationMessageCheck`](../type-aliases/WaldiezAgentTerminationMessageCheck.md)

#### Returns

`WaldiezAgentSwarmContainerData`

#### Overrides

[`WaldiezAgentData`](WaldiezAgentData.md).[`constructor`](WaldiezAgentData.md#constructor)

## Properties

### afterWork

> **afterWork**: `null` \| [`WaldiezSwarmAfterWork`](WaldiezSwarmAfterWork.md)

Defined in: src/waldiez/models/Agent/Swarm/SwarmContainerData.ts:42

***

### agentDefaultAutoReply

> **agentDefaultAutoReply**: `null` \| `string`

Defined in: src/waldiez/models/Agent/Common/AgentData.ts:35

#### Inherited from

[`WaldiezAgentData`](WaldiezAgentData.md).[`agentDefaultAutoReply`](WaldiezAgentData.md#agentdefaultautoreply)

***

### codeExecutionConfig

> **codeExecutionConfig**: [`WaldiezAgentCodeExecutionConfig`](../type-aliases/WaldiezAgentCodeExecutionConfig.md)

Defined in: src/waldiez/models/Agent/Common/AgentData.ts:34

#### Inherited from

[`WaldiezAgentData`](WaldiezAgentData.md).[`codeExecutionConfig`](WaldiezAgentData.md#codeexecutionconfig)

***

### contextVariables

> **contextVariables**: `object` = `{}`

Defined in: src/waldiez/models/Agent/Swarm/SwarmContainerData.ts:43

#### Index Signature

\[`key`: `string`\]: `string`

***

### humanInputMode

> **humanInputMode**: [`WaldiezAgentHumanInputMode`](../type-aliases/WaldiezAgentHumanInputMode.md)

Defined in: src/waldiez/models/Agent/Common/AgentData.ts:33

#### Inherited from

[`WaldiezAgentData`](WaldiezAgentData.md).[`humanInputMode`](WaldiezAgentData.md#humaninputmode)

***

### initialAgent

> **initialAgent**: `null` \| `string`

Defined in: src/waldiez/models/Agent/Swarm/SwarmContainerData.ts:41

***

### maxConsecutiveAutoReply

> **maxConsecutiveAutoReply**: `null` \| `number`

Defined in: src/waldiez/models/Agent/Common/AgentData.ts:36

#### Inherited from

[`WaldiezAgentData`](WaldiezAgentData.md).[`maxConsecutiveAutoReply`](WaldiezAgentData.md#maxconsecutiveautoreply)

***

### maxRounds

> **maxRounds**: `number`

Defined in: src/waldiez/models/Agent/Swarm/SwarmContainerData.ts:40

***

### modelIds

> **modelIds**: `string`[]

Defined in: src/waldiez/models/Agent/Common/AgentData.ts:39

#### Inherited from

[`WaldiezAgentData`](WaldiezAgentData.md).[`modelIds`](WaldiezAgentData.md#modelids)

***

### nestedChats

> **nestedChats**: [`WaldiezAgentNestedChat`](../type-aliases/WaldiezAgentNestedChat.md)[]

Defined in: src/waldiez/models/Agent/Common/AgentData.ts:42

#### Inherited from

[`WaldiezAgentData`](WaldiezAgentData.md).[`nestedChats`](WaldiezAgentData.md#nestedchats)

***

### parentId

> **parentId**: `null` \| `string`

Defined in: src/waldiez/models/Agent/Common/AgentData.ts:41

#### Inherited from

[`WaldiezAgentData`](WaldiezAgentData.md).[`parentId`](WaldiezAgentData.md#parentid)

***

### skills

> **skills**: [`WaldiezAgentLinkedSkill`](../type-aliases/WaldiezAgentLinkedSkill.md)[]

Defined in: src/waldiez/models/Agent/Common/AgentData.ts:40

#### Inherited from

[`WaldiezAgentData`](WaldiezAgentData.md).[`skills`](WaldiezAgentData.md#skills)

***

### systemMessage

> **systemMessage**: `null` \| `string`

Defined in: src/waldiez/models/Agent/Common/AgentData.ts:32

#### Inherited from

[`WaldiezAgentData`](WaldiezAgentData.md).[`systemMessage`](WaldiezAgentData.md#systemmessage)

***

### termination

> **termination**: [`WaldiezAgentTerminationMessageCheck`](../type-aliases/WaldiezAgentTerminationMessageCheck.md)

Defined in: src/waldiez/models/Agent/Common/AgentData.ts:37

#### Inherited from

[`WaldiezAgentData`](WaldiezAgentData.md).[`termination`](WaldiezAgentData.md#termination)
