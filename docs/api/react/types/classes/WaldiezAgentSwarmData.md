[**@waldiez/react v0.4.4**](../../README.md)

***

Defined in: src/waldiez/models/Agent/Swarm/SwarmData.ts:42

Waldiez Swarm Agent Data.

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

The flag to check if the agent is initial

## Param

The functions of the agent

## Param

The update agent state before reply of the agent

## Param

The hand offs of the agent

## See

 - [WaldiezAgentData](WaldiezAgentData.md)
 - [WaldiezAgentLinkedSkill](../type-aliases/WaldiezAgentLinkedSkill.md)
 - [WaldiezAgentNestedChat](../type-aliases/WaldiezAgentNestedChat.md)
 - [WaldiezAgentTerminationMessageCheck](../type-aliases/WaldiezAgentTerminationMessageCheck.md)
 - [WaldiezSwarmUpdateSystemMessage](WaldiezSwarmUpdateSystemMessage.md)
 - [WaldiezSwarmHandoff](../type-aliases/WaldiezSwarmHandoff.md)
 - [WaldiezAgentHumanInputMode](../type-aliases/WaldiezAgentHumanInputMode.md)
 - [WaldiezAgentCodeExecutionConfig](../type-aliases/WaldiezAgentCodeExecutionConfig.md)
 - [WaldiezAgentTerminationMessageCheck](../type-aliases/WaldiezAgentTerminationMessageCheck.md)

## Extends

- [`WaldiezAgentData`](WaldiezAgentData.md)

## Constructors

### Constructor

> **new WaldiezAgentSwarmData**(`props`): `WaldiezAgentSwarmData`

Defined in: src/waldiez/models/Agent/Swarm/SwarmData.ts:47

#### Parameters

##### props

###### agentDefaultAutoReply

`null` \| `string`

###### codeExecutionConfig

[`WaldiezAgentCodeExecutionConfig`](../type-aliases/WaldiezAgentCodeExecutionConfig.md)

###### functions

`string`[]

###### handoffs

[`WaldiezSwarmHandoff`](../type-aliases/WaldiezSwarmHandoff.md)[]

###### humanInputMode

[`WaldiezAgentHumanInputMode`](../type-aliases/WaldiezAgentHumanInputMode.md)

###### isInitial

`boolean`

###### maxConsecutiveAutoReply

`null` \| `number`

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

###### updateAgentStateBeforeReply

[`WaldiezSwarmUpdateSystemMessage`](WaldiezSwarmUpdateSystemMessage.md)[]

#### Returns

`WaldiezAgentSwarmData`

#### Overrides

[`WaldiezAgentData`](WaldiezAgentData.md).[`constructor`](WaldiezAgentData.md#constructor)

## Properties

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

### functions

> **functions**: `string`[]

Defined in: src/waldiez/models/Agent/Swarm/SwarmData.ts:44

***

### handoffs

> **handoffs**: [`WaldiezSwarmHandoff`](../type-aliases/WaldiezSwarmHandoff.md)[]

Defined in: src/waldiez/models/Agent/Swarm/SwarmData.ts:46

***

### humanInputMode

> **humanInputMode**: [`WaldiezAgentHumanInputMode`](../type-aliases/WaldiezAgentHumanInputMode.md)

Defined in: src/waldiez/models/Agent/Common/AgentData.ts:33

#### Inherited from

[`WaldiezAgentData`](WaldiezAgentData.md).[`humanInputMode`](WaldiezAgentData.md#humaninputmode)

***

### isInitial

> **isInitial**: `boolean`

Defined in: src/waldiez/models/Agent/Swarm/SwarmData.ts:43

***

### maxConsecutiveAutoReply

> **maxConsecutiveAutoReply**: `null` \| `number`

Defined in: src/waldiez/models/Agent/Common/AgentData.ts:36

#### Inherited from

[`WaldiezAgentData`](WaldiezAgentData.md).[`maxConsecutiveAutoReply`](WaldiezAgentData.md#maxconsecutiveautoreply)

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

***

### updateAgentStateBeforeReply

> **updateAgentStateBeforeReply**: [`WaldiezSwarmUpdateSystemMessage`](WaldiezSwarmUpdateSystemMessage.md)[]

Defined in: src/waldiez/models/Agent/Swarm/SwarmData.ts:45
