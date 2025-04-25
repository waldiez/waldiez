[**@waldiez/react v0.4.4**](../../README.md)

***

Defined in: src/waldiez/models/Agent/Common/AgentData.ts:31

Waldiez Agent data

## Param

System message

## Param

Human input mode

## Param

Code execution configuration

## Param

Default auto reply

## Param

Maximum consecutive auto reply

## Param

Termination message check

## Param

Model ids

## Param

Linked skills

## Param

Parent id

## Param

Nested chats

## See

 - [WaldiezAgentHumanInputMode](../type-aliases/WaldiezAgentHumanInputMode.md)
 - [WaldiezAgentCodeExecutionConfig](../type-aliases/WaldiezAgentCodeExecutionConfig.md)
 - [WaldiezAgentTerminationMessageCheck](../type-aliases/WaldiezAgentTerminationMessageCheck.md)
 - [WaldiezAgentLinkedSkill](../type-aliases/WaldiezAgentLinkedSkill.md)
 - [WaldiezAgentNestedChat](../type-aliases/WaldiezAgentNestedChat.md)

## Extended by

- [`WaldiezAgentAssistantData`](WaldiezAgentAssistantData.md)
- [`WaldiezAgentCaptainData`](WaldiezAgentCaptainData.md)
- [`WaldiezAgentGroupManagerData`](WaldiezAgentGroupManagerData.md)
- [`WaldiezAgentRagUserData`](WaldiezAgentRagUserData.md)
- [`WaldiezAgentReasoningData`](WaldiezAgentReasoningData.md)
- [`WaldiezAgentSwarmData`](WaldiezAgentSwarmData.md)
- [`WaldiezAgentSwarmContainerData`](WaldiezAgentSwarmContainerData.md)
- [`WaldiezAgentUserProxyData`](WaldiezAgentUserProxyData.md)

## Constructors

### Constructor

> **new WaldiezAgentData**(`props`): `WaldiezAgentData`

Defined in: src/waldiez/models/Agent/Common/AgentData.ts:43

#### Parameters

##### props

###### agentDefaultAutoReply

`null` \| `string`

###### codeExecutionConfig

[`WaldiezAgentCodeExecutionConfig`](../type-aliases/WaldiezAgentCodeExecutionConfig.md)

###### humanInputMode

[`WaldiezAgentHumanInputMode`](../type-aliases/WaldiezAgentHumanInputMode.md)

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

#### Returns

`WaldiezAgentData`

## Properties

### agentDefaultAutoReply

> **agentDefaultAutoReply**: `null` \| `string`

Defined in: src/waldiez/models/Agent/Common/AgentData.ts:35

***

### codeExecutionConfig

> **codeExecutionConfig**: [`WaldiezAgentCodeExecutionConfig`](../type-aliases/WaldiezAgentCodeExecutionConfig.md)

Defined in: src/waldiez/models/Agent/Common/AgentData.ts:34

***

### humanInputMode

> **humanInputMode**: [`WaldiezAgentHumanInputMode`](../type-aliases/WaldiezAgentHumanInputMode.md)

Defined in: src/waldiez/models/Agent/Common/AgentData.ts:33

***

### maxConsecutiveAutoReply

> **maxConsecutiveAutoReply**: `null` \| `number`

Defined in: src/waldiez/models/Agent/Common/AgentData.ts:36

***

### modelIds

> **modelIds**: `string`[]

Defined in: src/waldiez/models/Agent/Common/AgentData.ts:39

***

### nestedChats

> **nestedChats**: [`WaldiezAgentNestedChat`](../type-aliases/WaldiezAgentNestedChat.md)[]

Defined in: src/waldiez/models/Agent/Common/AgentData.ts:42

***

### parentId

> **parentId**: `null` \| `string`

Defined in: src/waldiez/models/Agent/Common/AgentData.ts:41

***

### skills

> **skills**: [`WaldiezAgentLinkedSkill`](../type-aliases/WaldiezAgentLinkedSkill.md)[]

Defined in: src/waldiez/models/Agent/Common/AgentData.ts:40

***

### systemMessage

> **systemMessage**: `null` \| `string`

Defined in: src/waldiez/models/Agent/Common/AgentData.ts:32

***

### termination

> **termination**: [`WaldiezAgentTerminationMessageCheck`](../type-aliases/WaldiezAgentTerminationMessageCheck.md)

Defined in: src/waldiez/models/Agent/Common/AgentData.ts:37
